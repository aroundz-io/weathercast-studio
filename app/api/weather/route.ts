import { NextResponse } from "next/server";
import { fetchRealWeather } from "@/lib/weather/openMeteo";
import { generateWeather } from "@/lib/mock/weather";
import { ForecastType } from "@/lib/types";

// ✅ REAL: Open-Meteo (무료·키 불필요) 실시간 시간별 예보.
//    케이웨더 키가 준비되면 fetchRealWeather 만 케이웨더 호출로 교체하면 됩니다.
//    실데이터 호출 실패 시에는 목업으로 폴백하며, 응답의 source 필드로 구분됩니다.
export async function POST(req: Request) {
  const { date, forecastType, region } = (await req.json()) as {
    date: string;
    forecastType: ForecastType;
    region: string;
  };
  const r = region ?? "서울";
  try {
    const data = await fetchRealWeather(date, forecastType, r);
    return NextResponse.json(data);
  } catch (e) {
    console.error("[weather] open-meteo 실패 → 목업 폴백:", e);
    const fallback = generateWeather(date, forecastType, r);
    return NextResponse.json(fallback);
  }
}
