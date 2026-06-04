import { NextResponse } from "next/server";
import { isKWeatherConfigured, fetchKWeather } from "@/lib/weather/kweather";
import { fetchRealWeather } from "@/lib/weather/openMeteo";
import { generateWeather } from "@/lib/mock/weather";
import { ForecastType, WeatherData } from "@/lib/types";

// 데이터 우선순위: ① 케이웨더(키 설정 시) → ② Open-Meteo 실데이터 → ③ 목업
async function resolveWeather(
  date: string,
  forecastType: ForecastType,
  region: string
): Promise<WeatherData> {
  const r = region || "서울";

  // ① 케이웨더 (KWEATHER_API_KEY 설정 시)
  if (isKWeatherConfigured()) {
    try {
      return await fetchKWeather(date, forecastType, r);
    } catch (e) {
      console.error("[weather] 케이웨더 실패 → Open-Meteo 폴백:", e);
    }
  }

  // ② Open-Meteo 실데이터
  try {
    return await fetchRealWeather(date, forecastType, r);
  } catch (e) {
    // ③ 목업 폴백
    console.error("[weather] open-meteo 실패 → 목업 폴백:", e);
    return generateWeather(date, forecastType, r);
  }
}

export async function POST(req: Request) {
  const { date, forecastType, region } = (await req.json()) as {
    date: string;
    forecastType: ForecastType;
    region: string;
  };
  return NextResponse.json(await resolveWeather(date ?? "", forecastType ?? "today", region ?? "서울"));
}

// GET /api/weather?region=서울&forecastType=today&date=2026-06-03  (테스트·간편 호출용)
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const date = sp.get("date") || "";
  const forecastType = (sp.get("forecastType") as ForecastType) || "today";
  const region = sp.get("region") || "서울";
  return NextResponse.json(await resolveWeather(date, forecastType, region));
}
