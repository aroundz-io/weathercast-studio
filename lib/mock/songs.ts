import { SongCandidate, LyricsResult, Mood, Duration } from "@/lib/types";

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 시각화용 의사 파형 (엔벨로프 + 비트 강조)
function seededWaveform(seed: number, bars = 56): number[] {
  const rng = mulberry32(seed);
  const out: number[] = [];
  for (let i = 0; i < bars; i++) {
    const env = Math.sin((i / bars) * Math.PI); // 가운데가 높은 엔벨로프
    const beat = i % 4 === 0 ? 0.25 : 0; // 4박자 강세
    const noise = rng() * 0.55;
    out.push(Math.min(1, 0.2 + env * 0.5 + beat + noise * 0.5));
  }
  return out;
}

const KEYS = ["C Major", "A Minor", "G Major", "E Minor", "D Major", "F Major", "B Minor"];
const VARIANTS = ["Take A", "Take B", "Take C", "Take D"];
const BPM_BY_MOOD: Record<Mood, number> = {
  upbeat: 128, calm: 84, hiphop: 92, ballad: 72, kids: 110,
};

export function generateSongs(
  lyrics: LyricsResult,
  mood: Mood,
  duration: Duration,
  count = 3
): SongCandidate[] {
  const base = hashStr(lyrics.title + mood + duration + Math.floor(Math.random() * 1e6));
  const baseBpm = BPM_BY_MOOD[mood];
  const offsets = [0, 4, -3, 7];

  return Array.from({ length: count }).map((_, i) => {
    const seed = base + i * 9973;
    const rng = mulberry32(seed);
    const durationSec = Math.max(12, duration + offsets[i % offsets.length]);
    return {
      id: `song_${base.toString(36)}_${i}`,
      title: `${lyrics.title} · ${VARIANTS[i % VARIANTS.length]}`,
      durationSec,
      styleTags: lyrics.sunoStyleTags,
      waveform: seededWaveform(seed, 56),
      bpm: baseBpm + Math.round((rng() - 0.5) * 8),
      musicKey: KEYS[Math.floor(rng() * KEYS.length)],
    };
  });
}
