import { isKWeatherConfigured, fetchKWeather } from "@/lib/weather/kweather";
import { fetchRealWeather } from "@/lib/weather/openMeteo";
import { generateWeather } from "@/lib/mock/weather";
import { ForecastType, WeatherData } from "@/lib/types";

// 날씨 데이터 우선순위: ① 케이웨더(키 설정 시) → ② Open-Meteo 실데이터 → ③ 목업
export async function resolveWeather(
  date: string,
  forecastType: ForecastType,
  region: string
): Promise<WeatherData> {
  const r = region || "서울";

  if (isKWeatherConfigured()) {
    try {
      return await fetchKWeather(date, forecastType, r);
    } catch (e) {
      console.error("[weather] 케이웨더 실패 → Open-Meteo 폴백:", e);
    }
  }
  try {
    return await fetchRealWeather(date, forecastType, r);
  } catch (e) {
    console.error("[weather] open-meteo 실패 → 목업 폴백:", e);
    return generateWeather(date, forecastType, r);
  }
}
