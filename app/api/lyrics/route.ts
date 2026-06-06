import { NextResponse } from "next/server";
import { generateLyrics } from "@/lib/mock/lyrics";
import { isGeminiConfigured, generateLyricsGemini } from "@/lib/gemini/lyrics";
import { resolveWeather } from "@/lib/weather/resolve";
import { getPersona, autoCast } from "@/lib/personas";
import { WeatherData, Mood, Duration, ForecastType, Persona } from "@/lib/types";

// Gemini Pro는 응답이 느릴 수 있어 함수 실행시간 상향 (플랜이 허용하는 한도까지)
export const maxDuration = 60;

const MOODS: Mood[] = ["upbeat", "calm", "hiphop", "ballad", "kids"];
const DURS: Duration[] = [15, 30, 60];

// 가사 생성: ① Gemini(키 설정 시) → ② 목업 폴백. 페르소나·무드는 날씨 자동 캐스팅 또는 클라이언트 지정.
async function makeLyrics(weather: WeatherData, mood: Mood, duration: Duration, persona: Persona) {
  if (isGeminiConfigured()) {
    try {
      return await generateLyricsGemini(weather, mood, duration, persona);
    } catch (e) {
      console.error("[lyrics] Gemini 실패 → 목업 폴백:", e);
    }
  }
  return generateLyrics(weather, mood, duration, persona);
}

export async function POST(req: Request) {
  const { weather, mood, duration, persona } = (await req.json()) as {
    weather: WeatherData;
    mood?: Mood;
    duration?: Duration;
    persona?: Persona;
  };
  const cast = autoCast(weather);
  const p = persona ?? getPersona(cast.personaId);
  return NextResponse.json(await makeLyrics(weather, mood ?? cast.mood, duration ?? 30, p));
}

// GET /api/lyrics?region=서울&date=YYYY-MM-DD&duration=30
//   → 날씨 조회 후 자동 캐스팅(페르소나·장르)으로 가사 생성 (테스트·간편 호출)
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const region = sp.get("region") || "서울";
  const forecastType = (sp.get("forecastType") as ForecastType) || "today";
  const date = sp.get("date") || "";
  const durNum = Number(sp.get("duration"));
  const duration: Duration = (DURS as number[]).includes(durNum) ? (durNum as Duration) : 30;

  const weather = await resolveWeather(date, forecastType, region);
  const cast = autoCast(weather);
  const moodParam = sp.get("mood") || "";
  const mood: Mood = (MOODS as string[]).includes(moodParam) ? (moodParam as Mood) : cast.mood;
  return NextResponse.json(await makeLyrics(weather, mood, duration, getPersona(cast.personaId)));
}
