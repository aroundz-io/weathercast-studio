import { NextResponse } from "next/server";
import { generateLyrics } from "@/lib/mock/lyrics";
import { isGeminiConfigured, generateLyricsGemini } from "@/lib/gemini/lyrics";
import { resolveWeather } from "@/lib/weather/resolve";
import { WeatherData, Mood, Duration, ForecastType } from "@/lib/types";

const MOODS: Mood[] = ["upbeat", "calm", "hiphop", "ballad", "kids"];
const DURS: Duration[] = [15, 30, 60];

// 가사 생성: ① Gemini(키 설정 시) → ② 목업 폴백
async function makeLyrics(weather: WeatherData, mood: Mood, duration: Duration) {
  if (isGeminiConfigured()) {
    try {
      return await generateLyricsGemini(weather, mood, duration);
    } catch (e) {
      console.error("[lyrics] Gemini 실패 → 목업 폴백:", e);
    }
  }
  return generateLyrics(weather, mood, duration);
}

export async function POST(req: Request) {
  const { weather, mood, duration } = (await req.json()) as {
    weather: WeatherData;
    mood: Mood;
    duration: Duration;
  };
  return NextResponse.json(await makeLyrics(weather, mood ?? "upbeat", duration ?? 30));
}

// GET /api/lyrics?region=서울&mood=upbeat&duration=30  (날씨 자동 조회 후 가사 생성 — 테스트·간편 호출용)
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const region = sp.get("region") || "서울";
  const forecastType = (sp.get("forecastType") as ForecastType) || "today";
  const date = sp.get("date") || "";
  const moodParam = sp.get("mood") || "";
  const mood: Mood = (MOODS as string[]).includes(moodParam) ? (moodParam as Mood) : "upbeat";
  const durNum = Number(sp.get("duration"));
  const duration: Duration = (DURS as number[]).includes(durNum) ? (durNum as Duration) : 30;

  const weather = await resolveWeather(date, forecastType, region);
  return NextResponse.json(await makeLyrics(weather, mood, duration));
}
