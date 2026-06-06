import { WeatherData, ForecastType, HourlyPoint, ConditionCode, CurrentObservation } from "@/lib/types";
import { forecastLabelFromDate } from "@/lib/weather/dates";
import {
  CONDITION_META,
  buildTags,
  buildSummary,
  pickHeadlineCondition,
  pmToFineDust,
  uvToLabel,
} from "@/lib/weather/derive";
import { analyzeHourly } from "@/lib/weather/analyze";

// ── 케이웨더(KWeather) 연동 — gateway.kweather.co.kr:8443 (Wellbian 레이어 기준) ──
// 인증: ?api_key=...  envelope: {error:"0", data:{ "<코드>": { data:{...arrays} } }}
// 시간별: kw-3d1h2(시군구, 3일·1시간)  미세먼지: kw-dust-r2(시군구)
// 가입/키발급: api.kweather.co.kr  ·  키 미설정/실패 시 라우트가 Open-Meteo로 폴백.

const KW_BASE = () =>
  process.env.KWEATHER_BASE_URL || "https://gateway.kweather.co.kr:8443/weather/w3/v2/kw-sensors";

// 9개 지역 → 대표 시군구 행정구역코드(앞5자리+00000). kw-*2(시군구) 센서용.
const KW_REGION_CODE: Record<string, string> = {
  서울: "1111000000", // 종로구
  경기: "4111500000", // 수원시 팔달구 (수원시청 소재; 시 단위 코드는 무효라 자치구 사용)
  인천: "2811000000", // 중구
  부산: "2611000000", // 중구
  대구: "2711000000", // 중구
  광주: "2911000000", // 동구
  대전: "3011000000", // 동구
  강원: "5111000000", // 춘천시 (강원특별자치도)
  제주: "5011000000", // 제주시
};

export function isKWeatherConfigured(): boolean {
  return Boolean(process.env.KWEATHER_API_KEY);
}

async function kwFetch(sensor: string, code: string): Promise<unknown> {
  const key = process.env.KWEATHER_API_KEY;
  if (!key) throw new Error("KWEATHER_API_KEY 미설정");
  const url = `${KW_BASE()}/${sensor}/${code}?api_key=${encodeURIComponent(key)}`;
  const r = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error(`KWeather ${sensor} HTTP ${r.status}`);
  const j = (await r.json()) as { error?: unknown; message?: string; data?: unknown };
  if (j.error != null && String(j.error) !== "0") throw new Error(j.message || `KWeather ${sensor} error`);
  return j.data;
}

// {"<code>": {data:{...}}} → 내부 data 객체
function innerData(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object") return null;
  const first = Object.values(raw as Record<string, unknown>)[0] as { data?: unknown } | undefined;
  return (first?.data as Record<string, unknown>) ?? null;
}

// 중첩 시간배열 [[24],[24],[24]] 또는 {0:..,1:..} → 평탄 배열
function flat(arr: unknown): unknown[] | null {
  if (!arr) return null;
  if (Array.isArray(arr)) return Array.isArray(arr[0]) ? (arr as unknown[]).flat() : (arr as unknown[]);
  if (typeof arr === "object") {
    const obj = arr as Record<string, unknown>;
    const nums = Object.keys(obj).map(Number).filter((n) => !Number.isNaN(n));
    const max = nums.length ? Math.max(...nums) : -1;
    return Array.from({ length: max + 1 }, (_, i) => obj[String(i)] ?? null);
  }
  return null;
}

const num = (v: unknown, d = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

// 한글 날씨텍스트 → ConditionCode (KWeather wText 다양한 표기 대응)
function wTextToCode(t: unknown): ConditionCode {
  const s = typeof t === "string" ? t : "";
  if (/뇌|번개|뇌전/.test(s)) return "thunder";
  if (/눈|진눈깨비/.test(s)) return "snow";
  if (/소나기/.test(s)) return "shower";
  if (/비|우/.test(s)) return "rain";
  if (/흐림|안개|박무|연무|황사|구름많/.test(s)) return "cloudy";
  if (/구름|대체로/.test(s)) return "partly";
  if (/맑/.test(s)) return "sunny";
  return "cloudy";
}

export async function fetchKWeather(
  date: string,
  forecastType: ForecastType,
  region: string
): Promise<WeatherData> {
  const code = KW_REGION_CODE[region] || KW_REGION_CODE["서울"];

  // ── KST(UTC+9) 기준 — Vercel 서버는 UTC라 반드시 보정 ──
  // 평탄 배열은 'KST 오늘 00시'부터의 시간 인덱스. kw-3d1h2는 오늘~+2일(3일) 제공.
  const nowKst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  const todayStr = `${nowKst.getUTCFullYear()}-${pad(nowKst.getUTCMonth() + 1)}-${pad(nowKst.getUTCDate())}`;
  const curHour = nowKst.getUTCHours();

  // 요청 날짜의 KST 오늘 대비 오프셋. 범위(0~2일) 밖이면 throw → Open-Meteo(최대 7일) 폴백.
  let offset = 0;
  let targetDate = todayStr;
  if (date) {
    const reqMs = Date.parse(`${date}T00:00:00Z`);
    const todayMs = Date.parse(`${todayStr}T00:00:00Z`);
    if (Number.isFinite(reqMs)) {
      const off = Math.round((reqMs - todayMs) / 86400000);
      if (off < 0 || off > 2) {
        throw new Error(`케이웨더 시간별 예보 범위(오늘~+2일) 밖: ${date} (offset ${off}일)`);
      }
      offset = off;
      targetDate = date;
    }
  }

  // 시간별(시군구) + 미세먼지 + (오늘이면) 실황 kw-odam2 병렬 호출
  const [hourlyRaw, dustRaw, odamRaw] = await Promise.all([
    kwFetch("kw-3d1h2", code),
    kwFetch("kw-dust-r2", code).catch(() => null),
    offset === 0 ? kwFetch("kw-odam2", code).catch(() => null) : Promise.resolve(null),
  ]);

  const hd = innerData(hourlyRaw);
  if (!hd) throw new Error("KWeather 시간별 데이터 없음");
  const temp = flat(hd.temp);
  const rainP = flat(hd.rainP);
  const humi = flat(hd.humi ?? hd.reh);
  const wind = flat(hd.ws ?? hd.wsd);
  const wText = flat(hd.wText);
  if (!temp || !temp.length) throw new Error("KWeather temp 배열 없음");

  const hourly: HourlyPoint[] = [];
  for (let h = 0; h < 24; h++) {
    const i = offset * 24 + h;
    if (temp[i] == null) continue;
    const cc = wTextToCode(wText?.[i]);
    const meta = CONDITION_META[cc];
    hourly.push({
      time: `${targetDate}T${String(h).padStart(2, "0")}:00`,
      hourLabel: `${h}시`,
      temp: Math.round(num(temp[i])),
      condition: meta.label,
      conditionCode: cc,
      emoji: meta.emoji,
      precipProb: Math.round(num(rainP?.[i])),
      humidity: Math.round(num(humi?.[i])),
      windSpeed: Math.round(num(wind?.[i])),
      isNow: offset === 0 && h === curHour,
    });
  }
  if (!hourly.length) throw new Error("KWeather 시간별 변환 결과 없음");

  const hi = Math.max(...hourly.map((x) => x.temp));
  const lo = Math.min(...hourly.map((x) => x.temp));
  const headline = pickHeadlineCondition(hourly.map((x) => x.conditionCode));
  const precipitation = Math.max(...hourly.map((x) => x.precipProb));
  const humidity = Math.round(hourly.reduce((s, x) => s + x.humidity, 0) / hourly.length);
  const windSpeed = Math.max(...hourly.map((x) => x.windSpeed));

  const dd = innerData(dustRaw);
  const pm25 = dd && dd.pm25 != null ? num(dd.pm25) : null;
  const fineDust = pmToFineDust(pm25);
  const uvIndex = uvToLabel(null); // UV는 별도 센서(kw-fct-idx-uv1) — 후속 확장

  // 실황(관측) — 오늘일 때만 (kw-odam2: t1h 현재기온, senseTemp 체감, reh 습도, wsd 풍속, wText 날씨)
  const od = innerData(odamRaw);
  let current: CurrentObservation | null = null;
  if (od && od.t1h != null) {
    const cc = wTextToCode(od.wText);
    const meta = CONDITION_META[cc];
    current = {
      temp: Math.round(num(od.t1h)),
      feelsLike: od.senseTemp != null ? Math.round(num(od.senseTemp)) : null,
      condition: meta.label,
      conditionCode: cc,
      emoji: meta.emoji,
      humidity: Math.round(num(od.reh)),
      windSpeed: Math.round(num(od.wsd)),
      observedAt: `${todayStr}T${pad(curHour)}:00`,
    };
  }

  const tags = buildTags({ cond: headline.code, tempHigh: hi, tempLow: lo, precipitation, windSpeed, fineDust });
  const analysis = analyzeHourly(hourly, hi, lo, forecastLabelFromDate(targetDate));

  return {
    region,
    date: targetDate,
    forecastType,
    forecastLabel: forecastLabelFromDate(targetDate),
    tempHigh: hi,
    tempLow: lo,
    condition: headline.label,
    conditionCode: headline.code,
    conditionEmoji: headline.emoji,
    precipitation,
    humidity,
    windSpeed,
    fineDust,
    uvIndex,
    summary: buildSummary(forecastLabelFromDate(targetDate), hi, lo, precipitation, fineDust),
    tags,
    hourly,
    analysis,
    source: "kweather",
    observedAt: `${todayStr}T${String(curHour).padStart(2, "0")}:00`,
    current,
  };
}
