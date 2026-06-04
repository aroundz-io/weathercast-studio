import { WeatherData, ForecastType, ConditionCode, FineDust, HourlyPoint } from "@/lib/types";
import { REGIONS, FORECAST_LABELS } from "@/lib/weather/constants";
import { CONDITION_META, buildTags, buildSummary } from "@/lib/weather/derive";
import { analyzeHourly } from "@/lib/weather/analyze";
import { forecastLabelFromDate } from "@/lib/weather/dates";

// PanelA 등에서 쓰던 import 경로 호환을 위해 재노출
export { REGIONS, FORECAST_LABELS };

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

const CODES: ConditionCode[] = ["sunny", "partly", "cloudy", "rain", "shower", "snow", "thunder"];

// 월별 (최저, 최고) 평년 기온 베이스
const SEASONAL: Record<number, [number, number]> = {
  1: [-6, 3], 2: [-3, 7], 3: [3, 14], 4: [8, 20], 5: [14, 25], 6: [19, 28],
  7: [23, 31], 8: [24, 32], 9: [18, 27], 10: [10, 21], 11: [3, 13], 12: [-3, 6],
};

function buildMockHourly(
  rng: () => number,
  date: string,
  hi: number,
  lo: number,
  dayCode: ConditionCode,
  dayPrecip: number
): HourlyPoint[] {
  const out: HourlyPoint[] = [];
  const wetDay = dayCode === "rain" || dayCode === "shower" || dayCode === "thunder" || dayCode === "snow";
  for (let h = 0; h < 24; h++) {
    const phase = Math.cos(((h - 14) / 24) * 2 * Math.PI); // 14시 최고, 새벽 최저
    const temp = Math.round(lo + (hi - lo) * ((phase + 1) / 2));
    const pp = Math.max(0, Math.min(100, Math.round(dayPrecip + (rng() - 0.5) * 30)));
    const code: ConditionCode = wetDay ? (pp >= 50 ? dayCode : "cloudy") : dayCode;
    const meta = CONDITION_META[code];
    out.push({
      time: `${date}T${String(h).padStart(2, "0")}:00`,
      hourLabel: `${h}시`,
      temp,
      condition: meta.label,
      conditionCode: code,
      emoji: meta.emoji,
      precipProb: pp,
      humidity: Math.round(45 + rng() * 40),
      windSpeed: Math.round(1 + rng() * 7),
      isNow: h === 12,
    });
  }
  return out;
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

  const cond = pick(CODES);
  const tempLow = lowBase + between(-3, 3);
  const tempHigh = Math.max(tempLow + between(4, 12), highBase + between(-3, 3));

  let precipitation: number;
  switch (cond) {
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
  const fineDust = dustLevels[Math.min(3, Math.floor(rng() * rng() * 4))];
  const uvIndex =
    month >= 5 && month <= 8 ? pick(["높음", "매우높음", "보통"]) : pick(["낮음", "보통", "높음"]);

  const meta = CONDITION_META[cond];
  const hourly = buildMockHourly(rng, date, tempHigh, tempLow, cond, precipitation);
  const tags = buildTags({ cond, tempHigh, tempLow, precipitation, windSpeed, fineDust });
  const analysis = analyzeHourly(hourly, tempHigh, tempLow, forecastLabelFromDate(date));

  return {
    region,
    date,
    forecastType,
    forecastLabel: forecastLabelFromDate(date),
    tempHigh,
    tempLow,
    condition: meta.label,
    conditionCode: cond,
    conditionEmoji: meta.emoji,
    precipitation,
    humidity,
    windSpeed,
    fineDust,
    uvIndex,
    summary: buildSummary(forecastLabelFromDate(date), tempHigh, tempLow, precipitation, fineDust),
    tags,
    hourly,
    analysis,
    source: "mock",
    observedAt: `${date}T12:00`,
  };
}
