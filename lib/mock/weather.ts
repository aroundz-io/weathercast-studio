import { WeatherData, WeatherTag, ForecastType, ConditionCode, FineDust } from "@/lib/types";

// ── 결정론적 RNG (같은 날짜+예보타입+지역 → 같은 날씨) ───────────────────────
function hashStr(s: string): number {
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return (h ^ (h >>> 16)) >>> 0;
}

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CONDITIONS: { code: ConditionCode; label: string; emoji: string }[] = [
  { code: "sunny", label: "맑음", emoji: "☀️" },
  { code: "partly", label: "구름조금", emoji: "⛅" },
  { code: "cloudy", label: "흐림", emoji: "☁️" },
  { code: "rain", label: "비", emoji: "🌧️" },
  { code: "shower", label: "소나기", emoji: "🌦️" },
  { code: "snow", label: "눈", emoji: "❄️" },
  { code: "thunder", label: "천둥번개", emoji: "⛈️" },
];

export const FORECAST_LABELS: Record<ForecastType, string> = {
  today: "오늘의 날씨",
  tomorrow: "내일의 날씨",
  weekend: "주말 날씨",
  commute: "출근길 날씨",
  weekly: "주간 날씨",
};

export const REGIONS = ["서울", "경기", "인천", "부산", "대구", "광주", "대전", "강원", "제주"];

// 월별 (최저, 최고) 평년 기온 베이스
const SEASONAL: Record<number, [number, number]> = {
  1: [-6, 3], 2: [-3, 7], 3: [3, 14], 4: [8, 20], 5: [14, 25], 6: [19, 28],
  7: [23, 31], 8: [24, 32], 9: [18, 27], 10: [10, 21], 11: [3, 13], 12: [-3, 6],
};

function buildTags(o: {
  cond: ConditionCode;
  tempHigh: number;
  tempLow: number;
  precipitation: number;
  windSpeed: number;
  fineDust: FineDust;
}): WeatherTag[] {
  const tags: WeatherTag[] = [];
  if (o.precipitation >= 60) tags.push({ label: "우산 필수", tone: "warn", icon: "☔" });
  else if (o.precipitation >= 30) tags.push({ label: "우산 챙기세요", tone: "info", icon: "🌂" });
  if (o.cond === "thunder") tags.push({ label: "천둥번개 주의", tone: "danger", icon: "⚡" });
  if (o.cond === "snow") tags.push({ label: "빙판길 주의", tone: "warn", icon: "🧊" });
  if (o.tempHigh - o.tempLow >= 10) tags.push({ label: "일교차 큼", tone: "warn", icon: "🌡️" });
  if (o.tempHigh >= 30) tags.push({ label: "폭염 주의", tone: "danger", icon: "🥵" });
  if (o.tempLow <= 0) tags.push({ label: "한파 주의", tone: "danger", icon: "🥶" });
  if (o.windSpeed >= 8) tags.push({ label: "강풍 주의", tone: "warn", icon: "💨" });
  if (o.fineDust === "나쁨" || o.fineDust === "매우나쁨")
    tags.push({ label: `미세먼지 ${o.fineDust}`, tone: "danger", icon: "😷" });
  if (o.cond === "sunny" && o.precipitation < 20)
    tags.push({ label: "화창함", tone: "good", icon: "🌟" });
  if (tags.length === 0) tags.push({ label: "무난한 날씨", tone: "good", icon: "🙂" });
  return tags;
}

function buildSummary(label: string, hi: number, lo: number, precip: number, dust: FineDust): string {
  const rain = precip >= 50 ? ` 강수확률 ${precip}%로 우산이 필요하겠습니다.` : "";
  const dustNote = dust === "나쁨" || dust === "매우나쁨" ? ` 미세먼지 ${dust}, 마스크 권장.` : "";
  return `${label}, 낮 최고 ${hi}도·아침 최저 ${lo}도로 예상됩니다.${rain}${dustNote}`;
}

export function generateWeather(
  date: string,
  forecastType: ForecastType,
  region = "서울"
): WeatherData {
  const rng = mulberry32(hashStr(`${date}|${forecastType}|${region}`));
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)];
  const between = (min: number, max: number) => Math.round(min + rng() * (max - min));

  const month = Number(date.slice(5, 7)) || 6;
  const [lowBase, highBase] = SEASONAL[month] ?? [14, 25];

  const cond = pick(CONDITIONS);
  const tempLow = lowBase + between(-3, 3);
  const tempHigh = Math.max(tempLow + between(4, 12), highBase + between(-3, 3));

  let precipitation: number;
  switch (cond.code) {
    case "rain": precipitation = between(60, 95); break;
    case "shower": precipitation = between(40, 80); break;
    case "thunder": precipitation = between(70, 100); break;
    case "snow": precipitation = between(50, 90); break;
    case "cloudy": precipitation = between(10, 40); break;
    default: precipitation = between(0, 15);
  }

  const humidity = between(35, 90);
  const windSpeed = between(1, 11);
  const dustLevels: FineDust[] = ["좋음", "보통", "나쁨", "매우나쁨"];
  // rng()*rng() → 좋음/보통 쪽으로 분포 치우침
  const fineDust = dustLevels[Math.min(3, Math.floor(rng() * rng() * 4))];
  const uvIndex =
    month >= 5 && month <= 8 ? pick(["높음", "매우높음", "보통"]) : pick(["낮음", "보통", "높음"]);

  const tags = buildTags({ cond: cond.code, tempHigh, tempLow, precipitation, windSpeed, fineDust });

  return {
    region,
    date,
    forecastType,
    forecastLabel: FORECAST_LABELS[forecastType],
    tempHigh,
    tempLow,
    condition: cond.label,
    conditionCode: cond.code,
    conditionEmoji: cond.emoji,
    precipitation,
    humidity,
    windSpeed,
    fineDust,
    uvIndex,
    summary: buildSummary(FORECAST_LABELS[forecastType], tempHigh, tempLow, precipitation, fineDust),
    tags,
  };
}
