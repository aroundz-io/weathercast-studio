import { ConditionCode } from "@/lib/types";
import { CONDITION_META } from "@/lib/weather/derive";

// WMO weather interpretation code → 내부 ConditionCode
// https://open-meteo.com/en/docs (WMO Weather interpretation codes)
export function wmoToCondition(code: number): { code: ConditionCode; label: string; emoji: string } {
  let c: ConditionCode;
  if (code === 0) c = "sunny";
  else if (code === 1 || code === 2) c = "partly";
  else if (code === 3 || code === 45 || code === 48) c = "cloudy"; // 흐림/안개
  else if ([51, 53, 55, 56, 57, 80, 81, 82].includes(code)) c = "shower"; // 이슬비/소나기
  else if ([61, 63, 65, 66, 67].includes(code)) c = "rain";
  else if ([71, 73, 75, 77, 85, 86].includes(code)) c = "snow";
  else if ([95, 96, 99].includes(code)) c = "thunder";
  else c = "cloudy";
  return { code: c, ...CONDITION_META[c] };
}
