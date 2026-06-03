import { NextResponse } from "next/server";
import { isKWeatherConfigured, fetchKWeather } from "@/lib/weather/kweather";
import { fetchRealWeather } from "@/lib/weather/openMeteo";
import { generateWeather } from "@/lib/mock/weather";
import { ForecastType } from "@/lib/types";

// 데이터 우선순위: ① 케이웨더(키 설정 시) → ② Open-Meteo 실데이터 → ③ 목업
// 케이웨더 키가 준비되면 lib/weather/kweather.ts 의 매핑만 확정하면 됩니다.
export async function POST(req: Request) {
  const { date, forecastType, region } = (await req.json()) as {
    date: string;
    forecastType: ForecastType;
    region: string;
  };
  const r = region ?? "서울";

  // ① 케이웨더 (KWEATHER_API_KEY + KWEATHER_FORECAST_PATH 설정 시)
  if (isKWeatherConfigured()) {
    try {
      return NextResponse.json(await fetchKWeather(date, forecastType, r));
    } catch (e) {
      console.error("[weather] 케이웨더 실패 → Open-Meteo 폴백:", e);
    }
  }

  // ② Open-Meteo 실데이터
  try {
    return NextResponse.json(await fetchRealWeather(date, forecastType, r));
  } catch (e) {
    // ③ 목업 폴백
    console.error("[weather] open-meteo 실패 → 목업 폴백:", e);
    return NextResponse.json(generateWeather(date, forecastType, r));
  }
}
