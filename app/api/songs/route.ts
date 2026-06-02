import { NextResponse } from "next/server";
import { generateSongs } from "@/lib/mock/songs";
import { LyricsResult, Mood, Duration } from "@/lib/types";

// ⚠️ MOCK: 실제 연동 시 Suno API 호출로 교체 (env: SUNO_API_KEY)
// 실제로는 비동기 작업이라 job 생성 → 폴링 구조가 됩니다.
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(req: Request) {
  const { lyrics, mood, duration } = (await req.json()) as {
    lyrics: LyricsResult;
    mood: Mood;
    duration: Duration;
  };
  await delay(1400);
  const songs = generateSongs(lyrics, mood, duration, 3);
  return NextResponse.json({ songs });
}
