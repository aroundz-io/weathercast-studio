import { NextResponse } from "next/server";
import { generateWeather } from "@/lib/mock/weather";
import { ForecastType } from "@/lib/types";

// ⚠️ MOCK: 실제 연동 시 케이웨더 API 호출로 교체 (env: KWEATHER_API_KEY)
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(req: Request) {
  const { date, forecastType, region } = (await req.json()) as {
    date: string;
    forecastType: ForecastType;
    region: string;
  };
  await delay(650);
  const data = generateWeather(date, forecastType, region ?? "서울");
  return NextResponse.json(data);
}
