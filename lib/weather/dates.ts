// 날짜 표시·상대일 라벨 (KST 기준). Date.now()는 epoch라 서버(UTC)·클라이언트 어디서든 동일.
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const KST_MS = 9 * 60 * 60 * 1000;
const pad = (n: number) => String(n).padStart(2, "0");

function ymdOf(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

// KST 기준 오늘 (YYYY-MM-DD)
export function kstTodayStr(): string {
  return ymdOf(new Date(Date.now() + KST_MS));
}

// KST 기준 오늘 +n일 (YYYY-MM-DD)
export function kstDatePlusDays(n: number): string {
  return ymdOf(new Date(Date.now() + KST_MS + n * 86400000));
}

export function weekdayKo(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? "" : WEEKDAYS[d.getUTCDay()];
}

// "6월 5일 (목)"
export function dateDisplay(dateStr: string): string {
  const p = dateStr.split("-");
  if (p.length !== 3) return dateStr;
  return `${Number(p[1])}월 ${Number(p[2])}일 (${weekdayKo(dateStr)})`;
}

// 오늘 대비 상대일 라벨 (오늘/내일/모레/어제, 그 외 "")
export function relativeDay(dateStr: string): string {
  const off = Math.round(
    (Date.parse(`${dateStr}T00:00:00Z`) - Date.parse(`${kstTodayStr()}T00:00:00Z`)) / 86400000
  );
  if (off === 0) return "오늘";
  if (off === 1) return "내일";
  if (off === 2) return "모레";
  if (off === -1) return "어제";
  return "";
}

// 예보 라벨: 가까운 날은 "오늘 날씨"/"내일 날씨", 그 외 "6월 7일 (토) 날씨"
export function forecastLabelFromDate(dateStr: string): string {
  const rel = relativeDay(dateStr);
  return rel ? `${rel} 날씨` : `${dateDisplay(dateStr)} 날씨`;
}
