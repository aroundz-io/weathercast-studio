import { LyricsResult, WeatherData, Mood, Duration, Persona } from "@/lib/types";
import { moodLabel } from "@/lib/mock/lyrics";
import { getIdolProfile } from "@/lib/personas";

// ── Google Gemini 가사·프롬프트 실연동 — '날씨의 아이돌' GEMS 이식 ──────────────
// 키발급: https://aistudio.google.com/apikey
// .env: GEMINI_API_KEY (필수), GEMINI_MODEL (선택, 기본 gemini-3.1-pro-preview)
// 키 미설정/실패/타임아웃 시 라우트가 목업(동일 구조)으로 폴백합니다.
// ⚠️ Gemini 3.x Pro는 'thinking' 모델이라 thinkingLevel=low로 지연을 줄임. 모델 접근권한/빌링 필요할 수 있음.
//    구버전 쓰려면 GEMINI_MODEL=gemini-2.5-pro (또는 -flash).

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";
const MODEL = () => process.env.GEMINI_MODEL || "gemini-3.1-pro-preview";

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

// ── GEMS 시스템 인스트럭션: K-Pop 걸그룹 '날씨의 아이돌' 총괄 프로듀서 ──
const SYSTEM_INSTRUCTION = `당신은 K-Pop 걸그룹 '날씨의 아이돌(Weather Idols)'의 총괄 프로듀서이자 콘텐츠 크리에이터입니다.
매일의 날씨에 가장 어울리는 멤버를 '오늘의 주인공'으로, 릴스/쇼츠/틱톡용 콘텐츠(음악 스크립트 + 이미지 프롬프트 + 소셜 게시물)를 제작합니다.

[멤버 — 날씨 매칭 / 고정 장르 / 외형]
- 써니(Sunny): 맑음·폭염·자외선·건조 → 에너지·활동성. 금발. Bright K-pop dance, Funk, 128 BPM.
- 레인(Rain): 비·소나기·높은 습도 → 감성·위로·차분. 청흑발. R&B City Pop, Lo-fi, 95 BPM.
- 클라우디(Cloudy): 흐림·안개·미세먼지/황사·구름많음 → 몽환·신비·휴식. 애쉬그레이. Dreamy Synth-pop, Indie, 105 BPM.
- 썬더(Thunder): 천둥번개·강풍·태풍·대설·급격한 기온변화 → 카리스마·파워·주의환기. 일렉트릭블루 포인트 흑발. Powerful Trap, EDM, 145 BPM.

[가사 원칙]
1. 실시간성: 입력된 실제 기온("오늘 서울은 OO도")·하늘상태·강수확률·지역을 가사에 구체적으로 언급.
2. 페르소나 유지: 써니=밝게, 레인=다정하게, 클라우디=몽환적으로, 썬더=강렬하게 말투 유지.
3. 생활팁 포함: 코디(반팔·가디건 등)·준비물(우산·마스크 등)을 자연스럽게 녹여 정보성↑.

[이미지 원칙]
- 선정 멤버의 외형 + 오늘 날씨 배경을 조합. 의상은 단정하게(배꼽 노출 금지, K-pop idol fashion).
- 이미지/영상 프롬프트에 반드시 포함: K-pop idol fashion, 8k, hyper-realistic, photorealistic, cinematic lighting, 9:16 aspect ratio.

출력은 항상 지정된 JSON 스키마로만 작성합니다. 한국어 필드는 한국어로, 영어 프롬프트 필드는 영어로 작성합니다.`;

// 구조화 출력 강제 (JSON 모드 + 스키마) — GEMS 4단계 산출물
const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    castReason: { type: "STRING" }, // Step1: 선정 이유 (멤버 말투)
    title: { type: "STRING" },
    sunoStyleTags: { type: "ARRAY", items: { type: "STRING" } }, // Step2: Style of Music
    lyrics: { type: "STRING" }, // Step2: 가사
    narration: { type: "STRING" },
    imagePrompt: { type: "STRING" }, // Step3: 비주얼(이미지) 프롬프트
    videoPrompt: { type: "STRING" }, // 영상(MV) 프롬프트
    thumbnailText: { type: "STRING" },
    socialCaption: { type: "STRING" }, // Step4: 자막/캡션
    hashtags: { type: "ARRAY", items: { type: "STRING" } }, // Step4: 해시태그
  },
  required: [
    "castReason",
    "title",
    "sunoStyleTags",
    "lyrics",
    "narration",
    "imagePrompt",
    "videoPrompt",
    "thumbnailText",
    "socialCaption",
    "hashtags",
  ],
};

function durationGuide(d: Duration): string {
  if (d === 15) return "15초 숏폼 — 후렴(Hook) 1개 위주로 매우 짧고 강렬하게";
  if (d === 30) return "30초 — [Verse] 1개 + [Chorus] 1개";
  return "60초 내외(쇼츠용) — [Intro] + [Verse] + [Chorus] + [Outro]";
}

function buildPrompt(weather: WeatherData, mood: Mood, duration: Duration, persona?: Persona): string {
  const p = persona;
  const profile = getIdolProfile(p?.id ?? "sunny");
  const memberKo = p?.name ?? "써니";
  const memberEn = p?.nameEn ?? "Sunny";
  const tags = weather.tags.map((t) => t.label).join(", ");
  const bullets = weather.analysis.bullets.map((b) => `  · ${b}`).join("\n");
  return `아래 "실제 기상 데이터"를 바탕으로 '날씨의 아이돌' 오늘 콘텐츠를 제작하세요.

[기상 데이터]
- 지역: ${weather.region}
- 날짜: ${weather.date} (${weather.forecastLabel})
- 대표 날씨: ${weather.condition}, 낮 최고 ${weather.tempHigh}° / 아침 최저 ${weather.tempLow}°
- 최대 강수확률 ${weather.precipitation}%, 습도 ${weather.humidity}%, 바람 ${weather.windSpeed}m/s, 미세먼지 ${weather.fineDust}, 자외선 ${weather.uvIndex}
- 키워드: ${tags || "없음"}
- 시간대 분석: ${weather.analysis.headline}
${bullets}

[오늘의 주인공] ${memberKo} (${memberEn})
- 고정 장르: ${profile.genre} · ${profile.bpm} BPM (반드시 이 장르/템포 사용)
- 외형: ${profile.hair}, ${profile.look}
- 무드: ${moodLabel(mood)} / 길이: ${durationGuide(duration)}

[작성 지침 — 아래 JSON 필드를 모두 채우세요]
- castReason: 왜 오늘 ${memberKo}가 주인공인지 ${memberKo}의 말투로 1~2문장(한국어, 위 실제 날씨 근거 언급).
- title: 곡 제목(한국어).
- sunoStyleTags: SUNO 'Style of Music'용 영어 키워드 배열. 반드시 "${profile.genre}"의 키워드와 "${profile.bpm} BPM"을 포함하고, 오늘 날씨 무드 키워드를 1~2개 더해 총 4~6개.
- lyrics: [Intro]/[Verse]/[Chorus]/[Outro] 구조의 한국어 가사. 위 실제 기온·하늘상태·강수확률을 구체적으로 언급하고, 코디/준비물 생활팁을 자연스럽게 포함. 후렴에 'Weather Idols' 또는 멤버명을 넣어도 좋음. ${memberKo}의 말투 유지. 각 줄은 줄바꿈(\\n)으로 구분.
- narration: 방송 기상캐스터 멘트(한국어 2~3문장).
- imagePrompt: 영어. ${memberEn}의 외형(${profile.hair})과 오늘 날씨(${weather.condition}) 배경을 묘사. 의상은 단정(노출 금지). 반드시 포함: K-pop idol fashion, 8k, hyper-realistic, photorealistic, cinematic lighting, 9:16 aspect ratio.
- videoPrompt: 영어. 위 이미지의 9:16 숏폼 뮤직비디오 버전(립싱크, 모션, 다이내믹 카메라). 위 필수 키워드 포함.
- thumbnailText: 한국어 2줄, 짧게.
- socialCaption: 한국어. 클릭을 유도하는 릴스/쇼츠 자막 1~2문장 + 이모지.
- hashtags: 해시태그 문자열 배열. 반드시 #날씨의아이돌 #오늘의날씨 #WeatherIdols #KPOP 포함 + 날씨/멤버/지역 관련 3~5개 추가.`;
}

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
}

export async function generateLyricsGemini(
  weather: WeatherData,
  mood: Mood,
  duration: Duration,
  persona?: Persona
): Promise<LyricsResult> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY 미설정");

  const modelName = MODEL();
  const isGemini3 = /gemini-3/.test(modelName);
  // Gemini 3.x: thinkingBudget 미지원 → thinkingLevel 사용(둘 동시 사용 불가). 2.5: thinkingBudget.
  const thinkingConfig = isGemini3 ? { thinkingLevel: "low" } : { thinkingBudget: 128 };

  const url = `${GEMINI_BASE}/models/${modelName}:generateContent?key=${encodeURIComponent(key)}`;
  const body = {
    systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
    contents: [{ role: "user", parts: [{ text: buildPrompt(weather, mood, duration, persona) }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
      temperature: 1.0, // Gemini 3 권장 기본값(낮추면 성능 저하)
      maxOutputTokens: 4096,
      thinkingConfig,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(45000), // 느릴 수 있어 여유. maxDuration 내에서 폴백.
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Gemini HTTP ${res.status} ${t.slice(0, 300)}`);
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

  const imagePrompt = parsed.imagePrompt ?? "";
  return {
    castReason: parsed.castReason ?? "",
    title: parsed.title,
    lyrics: parsed.lyrics,
    narration: parsed.narration ?? "",
    sunoStyleTags: Array.isArray(parsed.sunoStyleTags) ? parsed.sunoStyleTags : [],
    imagePrompt,
    videoPrompt: parsed.videoPrompt ?? "",
    thumbnailText: parsed.thumbnailText ?? "",
    thumbnailPrompt: imagePrompt || (parsed.thumbnailPrompt ?? ""),
    socialCaption: parsed.socialCaption ?? "",
    hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : [],
    source: "gemini",
  };
}
