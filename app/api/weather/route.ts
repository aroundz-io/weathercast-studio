import { NextResponse } from "next/server";
import { resolveWeather } from "@/lib/weather/resolve";
import { ForecastType } from "@/lib/types";

// 데이터 우선순위는 resolveWeather 내부: ① 케이웨더 → ② Open-Meteo → ③ 목업
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
