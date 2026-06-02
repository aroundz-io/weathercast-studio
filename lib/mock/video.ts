import { VideoJob, VideoSegment, SongCandidate } from "@/lib/types";

// 곡을 30초 단위로 분절 (숏폼 컷 단위)
export function planVideo(
  song: SongCandidate,
  personaName: string,
  model: string,
  lyricSnippets: string[]
): VideoJob {
  const total = song.durationSec;
  const segments: VideoSegment[] = [];
  let start = 0;
  let idx = 0;
  while (start < total) {
    const end = Math.min(start + 30, total);
    segments.push({
      index: idx,
      startSec: start,
      endSec: end,
      label: lyricSnippets[idx % Math.max(1, lyricSnippets.length)] ?? `장면 ${idx + 1}`,
      progress: 0,
      status: "pending",
    });
    start = end;
    idx += 1;
  }
  return {
    jobId: `vid_${song.id}_${segments.length}`,
    persona: personaName,
    model,
    aspect: "9:16",
    segments,
  };
}

// 가사 문자열에서 메타태그/빈 줄을 걷어내고 장면 라벨용 스니펫 추출
export function snippetsFromLyrics(lyrics: string): string[] {
  return lyrics
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !/^\[.*\]$/.test(l));
}
