import { HourlyPoint, ForecastAnalysis } from "@/lib/types";

const WET: string[] = ["rain", "shower", "thunder", "snow"];

// 시간별 상태를 분석해 예보 요약 생성
export function analyzeHourly(
  hourly: HourlyPoint[],
  hi: number,
  lo: number,
  label: string
): ForecastAnalysis {
  if (!hourly.length) return { headline: `${label} · 시간별 데이터 없음`, bullets: [] };

  const bullets: string[] = [];

  // 1) 기온 정점/저점 + 일교차
  const peak = hourly.reduce((a, b) => (b.temp > a.temp ? b : a));
  const trough = hourly.reduce((a, b) => (b.temp < a.temp ? b : a));
  const diff = Math.round(peak.temp - trough.temp);
  bullets.push(
    `기온은 ${peak.hourLabel} ${peak.temp}°로 최고, ${trough.hourLabel} ${trough.temp}°로 최저` +
      (diff >= 10 ? ` (일교차 ${diff}° — 큼, 겉옷 권장)` : ` (일교차 ${diff}°)`)
  );

  // 2) 강수 구간
  const wet = hourly.filter((h) => h.precipProb >= 50 || WET.includes(h.conditionCode));
  if (wet.length) {
    const maxPop = Math.max(...wet.map((h) => h.precipProb));
    bullets.push(
      `${wet[0].hourLabel}~${wet[wet.length - 1].hourLabel} 강수 가능 (최대 강수확률 ${maxPop}%) — ☔ 우산 챙기세요`
    );
  } else {
    bullets.push("종일 강수 가능성 낮음 — 우산 없이 OK");
  }

  // 3) 강풍 구간
  const windy = hourly.filter((h) => h.windSpeed >= 8);
  if (windy.length) {
    bullets.push(
      `${windy[0].hourLabel}경 바람 강함 (최대 ${Math.max(...windy.map((h) => h.windSpeed))}m/s) — 💨 체감온도·안전 주의`
    );
  }

  // 4) 하늘상태 전환
  const trans: string[] = [];
  for (let i = 1; i < hourly.length; i++) {
    if (hourly[i].conditionCode !== hourly[i - 1].conditionCode) {
      trans.push(`${hourly[i].hourLabel} ${hourly[i].condition}`);
    }
  }
  if (trans.length && trans.length <= 4) bullets.push(`날씨 변화: ${trans.join(" → ")}`);
  else if (trans.length > 4)
    bullets.push(`하늘 상태 변화가 잦습니다(${trans.length}회) — 외출 전 시간대 확인 권장`);

  const mid = hourly[Math.floor(hourly.length / 2)];
  const headline = wet.length
    ? `${label}: ${wet[0].hourLabel}부터 비 소식, 낮 최고 ${hi}° / 아침 ${lo}°`
    : `${label}: 대체로 ${mid.condition}, 낮 최고 ${hi}° / 아침 ${lo}°`;

  return { headline, bullets };
}
