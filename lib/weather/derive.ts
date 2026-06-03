import { WeatherTag, FineDust, ConditionCode } from "@/lib/types";

export const CONDITION_META: Record<ConditionCode, { label: string; emoji: string }> = {
  sunny: { label: "맑음", emoji: "☀️" },
  partly: { label: "구름조금", emoji: "⛅" },
  cloudy: { label: "흐림", emoji: "☁️" },
  rain: { label: "비", emoji: "🌧️" },
  shower: { label: "소나기", emoji: "🌦️" },
  snow: { label: "눈", emoji: "❄️" },
  thunder: { label: "천둥번개", emoji: "⛈️" },
};

// 하루 중 가장 "특징적인" 날씨를 대표값으로 선택
const PRIORITY: ConditionCode[] = ["thunder", "snow", "rain", "shower", "cloudy", "partly", "sunny"];

export function pickHeadlineCondition(codes: ConditionCode[]): {
  code: ConditionCode;
  label: string;
  emoji: string;
} {
  for (const p of PRIORITY) {
    if (codes.includes(p)) return { code: p, ...CONDITION_META[p] };
  }
  return { code: "sunny", ...CONDITION_META.sunny };
}

export function buildTags(o: {
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

export function buildSummary(
  label: string,
  hi: number,
  lo: number,
  precip: number,
  dust: FineDust
): string {
  const rain = precip >= 50 ? ` 강수확률 ${precip}%로 우산이 필요하겠습니다.` : "";
  const dustNote = dust === "나쁨" || dust === "매우나쁨" ? ` 미세먼지 ${dust}, 마스크 권장.` : "";
  return `${label}, 낮 최고 ${hi}도·아침 최저 ${lo}도로 예상됩니다.${rain}${dustNote}`;
}

// PM2.5(µg/m³) → 한국 통합대기 등급
export function pmToFineDust(pm25: number | null | undefined): FineDust {
  if (pm25 == null) return "보통";
  if (pm25 <= 15) return "좋음";
  if (pm25 <= 35) return "보통";
  if (pm25 <= 75) return "나쁨";
  return "매우나쁨";
}

export function uvToLabel(uv: number | null | undefined): string {
  if (uv == null) return "보통";
  if (uv < 3) return "낮음";
  if (uv < 6) return "보통";
  if (uv < 8) return "높음";
  if (uv < 11) return "매우높음";
  return "위험";
}
