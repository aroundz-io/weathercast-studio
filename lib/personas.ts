import { Persona, WeatherData, Mood } from "@/lib/types";

// PRD의 날씨 기반 버추얼 아이돌 / AI 기상캐스터 페르소나 (사전 등록 모델)
export const PERSONAS: Persona[] = [
  {
    id: "sunny",
    name: "써니",
    nameEn: "Sunny",
    role: "AI 기상캐스터 · 메인",
    emoji: "🌞",
    accent: "#fbbf24",
    blurb: "밝고 경쾌한 진행. 화창한 날·주말 예보에 강함.",
  },
  {
    id: "rain",
    name: "레인",
    nameEn: "Rain",
    role: "버추얼 아이돌",
    emoji: "🌧️",
    accent: "#38bdf8",
    blurb: "잔잔하고 감성적인 톤. 비·새벽 예보에 어울림.",
  },
  {
    id: "cloudy",
    name: "클라우디",
    nameEn: "Cloudy",
    role: "버추얼 아이돌",
    emoji: "☁️",
    accent: "#a5b4fc",
    blurb: "차분하고 안정적인 전달. 미세먼지·흐림 예보.",
  },
  {
    id: "thunder",
    name: "썬더",
    nameEn: "Thunder",
    role: "버추얼 아이돌",
    emoji: "⚡",
    accent: "#f472b6",
    blurb: "힙합·강렬한 비트. 특보·폭우·폭염 경보용.",
  },
];

export function getPersona(id: string): Persona {
  return PERSONAS.find((p) => p.id === id) ?? PERSONAS[0];
}

// 페르소나 → 장르(무드) 매핑
export const PERSONA_MOOD: Record<string, Mood> = {
  sunny: "upbeat", // 발랄·신나는
  rain: "ballad", // 감성 발라드
  cloudy: "calm", // 차분·잔잔
  thunder: "hiphop", // 힙합·강렬
};

// 날씨 → 페르소나 자동 분류 (우선순위: 썬더 > 레인 > 클라우디 > 써니)
export function autoPersonaId(w: WeatherData): string {
  const c = w.conditionCode;
  const severe = w.tempHigh >= 33 || w.tempLow <= -12 || w.windSpeed >= 9 || w.precipitation >= 80;
  if (c === "thunder" || severe) return "thunder";
  if (c === "rain" || c === "shower" || c === "snow") return "rain";
  if (c === "cloudy" || w.fineDust === "나쁨" || w.fineDust === "매우나쁨") return "cloudy";
  return "sunny"; // 맑음 / 구름조금
}

function castReason(w: WeatherData, personaId: string): string {
  if (personaId === "thunder") {
    if (w.conditionCode === "thunder") return "천둥번개";
    if (w.tempHigh >= 33) return `폭염 ${w.tempHigh}°`;
    if (w.precipitation >= 80) return `강수확률 ${w.precipitation}%`;
    if (w.windSpeed >= 9) return `강풍 ${w.windSpeed}m/s`;
    if (w.tempLow <= -12) return `한파 ${w.tempLow}°`;
    return "특보급";
  }
  if (personaId === "cloudy" && (w.fineDust === "나쁨" || w.fineDust === "매우나쁨"))
    return `미세먼지 ${w.fineDust}`;
  return w.condition;
}

// 날씨 → {페르소나, 무드, 분류근거} 자동 캐스팅
export function autoCast(w: WeatherData): { personaId: string; mood: Mood; reason: string } {
  const personaId = autoPersonaId(w);
  return { personaId, mood: PERSONA_MOOD[personaId], reason: castReason(w, personaId) };
}
