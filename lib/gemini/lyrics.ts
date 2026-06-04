import { LyricsResult, WeatherData, Mood, Duration } from "@/lib/types";
import { moodLabel } from "@/lib/mock/lyrics";

// ── Google Gemini 가사·프롬프트 실연동 ──────────────────────────────────────
// 키발급: https://aistudio.google.com/apikey (무료 티어 있음)
// .env: GEMINI_API_KEY (필수), GEMINI_MODEL (선택, 기본 gemini-2.5-flash)
// 키 미설정/실패 시 라우트가 목업 가사로 폴백합니다.

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";
const MODEL = () => process.env.GEMINI_MODEL || "gemini-2.5-flash";

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

// 구조화 출력 강제 (JSON 모드 + 스키마)
const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    lyrics: { type: "STRING" },
    narration: { type: "STRING" },
    sunoStyleTags: { type: "ARRAY", items: { type: "STRING" } },
    videoPrompt: { type: "STRING" },
    thumbnailText: { type: "STRING" },
    thumbnailPrompt: { type: "STRING" },
  },
  required: ["title", "lyrics", "narration", "sunoStyleTags", "videoPrompt", "thumbnailText", "thumbnailPrompt"],
};

function durationGuide(d: Duration): string {
  if (d === 15) return "15초 숏폼 — 후렴(Hook) 1개 위주로 매우 짧고 강렬하게";
  if (d === 30) return "30초 — [Verse] 1개 + [Chorus] 1개";
  return "60초 — [Intro] + [Verse] + [Chorus] + [Outro]";
}

function buildPrompt(weather: WeatherData, mood: Mood, duration: Duration): string {
  const tags = weather.tags.map((t) => t.label).join(", ");
  const bullets = weather.analysis.bullets.map((b) => `  · ${b}`).join("\n");
  return `당신은 K-pop 날씨송 작사가이자 방송 콘텐츠 기획자입니다. 아래 "실제 기상 데이터"를 바탕으로 한국어 날씨송과 부가 콘텐츠를 만들어 주세요.

[기상 데이터]
- 지역: ${weather.region}
- 날짜: ${weather.date} (${weather.forecastLabel})
- 대표 날씨: ${weather.condition}, 낮 최고 ${weather.tempHigh}° / 아침 최저 ${weather.tempLow}°
- 최대 강수확률 ${weather.precipitation}%, 습도 ${weather.humidity}%, 바람 ${weather.windSpeed}m/s, 미세먼지 ${weather.fineDust}, 자외선 ${weather.uvIndex}
- 키워드: ${tags || "없음"}
- 시간대 분석: ${weather.analysis.headline}
${bullets}

[요청]
- 무드/장르: ${moodLabel(mood)}
- 길이: ${durationGuide(duration)}
- 가사에는 위 '시간대 분석'의 실제 내용(기온, 비 오는 시간대 등)을 자연스럽게 녹여주세요.
- 가사에 Suno 메타태그([Intro], [Verse], [Chorus], [Outro] 등)를 줄머리에 표기하세요.
- 후렴 등에 브랜드명 'WeatherCast'를 자연스럽게 넣어도 좋습니다.
- narration은 방송 기상캐스터가 읽는 멘트(한국어, 2~3문장).
- sunoStyleTags는 영어 3~5개(장르·무드·템포), videoPrompt/thumbnailPrompt는 영어로.
- thumbnailText는 짧게 2줄(한국어).`;
}

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
}

export async function generateLyricsGemini(
  weather: WeatherData,
  mood: Mood,
  duration: Duration
): Promise<LyricsResult> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY 미설정");

  const url = `${GEMINI_BASE}/models/${MODEL()}:generateContent?key=${encodeURIComponent(key)}`;
  const body = {
    contents: [{ role: "user", parts: [{ text: buildPrompt(weather, mood, duration) }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
      temperature: 1.1,
      maxOutputTokens: 2048,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Gemini HTTP ${res.status} ${t.slice(0, 200)}`);
  }
  const data = (await res.json()) as GeminiResponse;
  if (data.promptFeedback?.blockReason) throw new Error(`Gemini blocked: ${data.promptFeedback.blockReason}`);
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini 응답이 비어 있음");

  let parsed: Partial<LyricsResult>;
  try {
    parsed = JSON.parse(text) as Partial<LyricsResult>;
  } catch {
    throw new Error("Gemini JSON 파싱 실패");
  }
  if (!parsed.title || !parsed.lyrics) throw new Error("Gemini 응답 형식 불완전");

  return {
    title: parsed.title,
    lyrics: parsed.lyrics,
    narration: parsed.narration ?? "",
    sunoStyleTags: Array.isArray(parsed.sunoStyleTags) ? parsed.sunoStyleTags : [],
    videoPrompt: parsed.videoPrompt ?? "",
    thumbnailText: parsed.thumbnailText ?? "",
    thumbnailPrompt: parsed.thumbnailPrompt ?? "",
    source: "gemini",
  };
}
