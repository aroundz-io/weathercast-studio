import { NextResponse } from "next/server";
import { generateLyrics } from "@/lib/mock/lyrics";
import { WeatherData, Mood, Duration } from "@/lib/types";

// ⚠️ MOCK: 실제 연동 시 Gemini API 호출로 교체 (env: GEMINI_API_KEY)
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(req: Request) {
  const { weather, mood, duration } = (await req.json()) as {
    weather: WeatherData;
    mood: Mood;
    duration: Duration;
  };
  await delay(1100);
  const data = generateLyrics(weather, mood, duration);
  return NextResponse.json(data);
}
