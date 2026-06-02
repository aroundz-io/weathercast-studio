import { NextResponse } from "next/server";
import { planVideo, snippetsFromLyrics } from "@/lib/mock/video";
import { SongCandidate, LyricsResult } from "@/lib/types";

// ⚠️ MOCK: 실제 연동 시 OmniHuman / Seedance API 호출로 교체 (env: VIDEO_API_KEY)
// 여기서는 30초 분절 "계획"만 반환하고, 진행률은 클라이언트가 시뮬레이션합니다.
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(req: Request) {
  const { song, persona, model, lyrics } = (await req.json()) as {
    song: SongCandidate;
    persona: string;
    model: string;
    lyrics: LyricsResult;
  };
  await delay(800);
  const snippets = snippetsFromLyrics(lyrics.lyrics);
  const job = planVideo(song, persona, model ?? "Seedance 2.0", snippets);
  return NextResponse.json(job);
}
