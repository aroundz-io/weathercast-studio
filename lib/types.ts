// ── WeatherCast Studio · 파이프라인 공용 타입 ──────────────────────────────

export type ForecastType = "today" | "tomorrow" | "weekend" | "commute" | "weekly";

export type Mood = "upbeat" | "calm" | "hiphop" | "ballad" | "kids";

export type Duration = 15 | 30 | 60;

export type ConditionCode =
  | "sunny"
  | "partly"
  | "cloudy"
  | "rain"
  | "shower"
  | "snow"
  | "thunder";

export type FineDust = "좋음" | "보통" | "나쁨" | "매우나쁨";

export type TagTone = "good" | "info" | "warn" | "danger";

export interface WeatherTag {
  label: string;
  tone: TagTone;
  icon: string;
}

export interface WeatherData {
  region: string;
  date: string;
  forecastType: ForecastType;
  forecastLabel: string;
  tempHigh: number;
  tempLow: number;
  condition: string;
  conditionCode: ConditionCode;
  conditionEmoji: string;
  precipitation: number; // 강수확률 %
  humidity: number; // %
  windSpeed: number; // m/s
  fineDust: FineDust;
  uvIndex: string;
  summary: string;
  tags: WeatherTag[];
}

export interface LyricsResult {
  title: string;
  lyrics: string; // [Verse]/[Chorus] 메타태그 포함
  narration: string; // 나레이션 스크립트
  sunoStyleTags: string[]; // ["Upbeat Pop", "K-pop", ...]
  videoPrompt: string; // 영문 영상 프롬프트
  thumbnailText: string; // 썸네일 메인 텍스트
  thumbnailPrompt: string; // 영문 썸네일 프롬프트
}

export interface SongCandidate {
  id: string;
  title: string;
  durationSec: number;
  styleTags: string[];
  waveform: number[]; // 0..1 막대 배열
  bpm: number;
  musicKey: string;
}

export type SegmentStatus = "pending" | "rendering" | "done";

export interface VideoSegment {
  index: number;
  startSec: number;
  endSec: number;
  label: string;
  progress: number; // 0..100
  status: SegmentStatus;
}

export interface VideoJob {
  jobId: string;
  persona: string;
  model: string;
  aspect: "9:16" | "16:9";
  segments: VideoSegment[];
}

export interface Persona {
  id: string;
  name: string;
  role: string;
  emoji: string;
  accent: string; // hex
  blurb: string;
}
