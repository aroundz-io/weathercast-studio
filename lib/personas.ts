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

// 멤버별 고정 프로필 — SUNO 장르/BPM + 비주얼(외형). '날씨의 아이돌' GEMS 지침 고정값.
export const IDOL_PROFILE: Record<
  string,
  { genre: string; bpm: number; hair: string; look: string }
> = {
  sunny: {
    genre: "Bright K-pop dance, Funk",
    bpm: 128,
    hair: "long wavy blonde hair",
    look: "bright sporty-chic, energetic, warm sunny tones",
  },
  rain: {
    genre: "R&B City Pop, Lo-fi",
    bpm: 95,
    hair: "sleek blue-black hair",
    look: "soft elegant, emotional, cool blue and lavender tones",
  },
  cloudy: {
    genre: "Dreamy Synth-pop, Indie",
    bpm: 105,
    hair: "soft ash-grey wavy hair",
    look: "dreamy ethereal, cozy pastel tones, misty mood",
  },
  thunder: {
    genre: "Powerful Trap, EDM",
    bpm: 145,
    hair: "voluminous dark hair with an electric-blue streak",
    look: "charismatic powerful, bold edgy tones, dramatic",
  },
};

export function getIdolProfile(id: string) {
  return IDOL_PROFILE[id] ?? IDOL_PROFILE.sunny;
}

// 날씨 → 멤버(페르소나) 자동 분류 — '날씨의 아이돌' GEMS 매칭 로직
//  썬더: 천둥번개·대설·강풍/태풍·급격한(극한) 기온변화
//  레인: 비·소나기  ·  클라우디: 흐림·미세먼지/황사  ·  써니: 맑음·폭염·자외선·건조(기본)
export function autoPersonaId(w: WeatherData): string {
  const c = w.conditionCode;
  if (c === "thunder" || c === "snow" || w.windSpeed >= 9 || w.tempLow <= -12) return "thunder";
  if (c === "rain" || c === "shower") return "rain";
  if (c === "cloudy" || w.fineDust === "나쁨" || w.fineDust === "매우나쁨") return "cloudy";
  return "sunny"; // 맑음 / 구름조금 / 폭염 / 자외선 / 건조
}

function castReason(w: WeatherData, personaId: string): string {
  if (personaId === "thunder") {
    if (w.conditionCode === "thunder") return "천둥번개";
    if (w.conditionCode === "snow") return "대설";
    if (w.windSpeed >= 9) return `강풍 ${w.windSpeed}m/s`;
    if (w.tempLow <= -12) return `한파 ${w.tempLow}°`;
    return "기상특보";
  }
  if (personaId === "rain") {
    if (w.conditionCode === "shower") return "소나기";
    return w.precipitation >= 60 ? `비 (강수 ${w.precipitation}%)` : "비 소식";
  }
  if (personaId === "cloudy") {
    if (w.fineDust === "나쁨" || w.fineDust === "매우나쁨") return `미세먼지 ${w.fineDust}`;
    return "흐림";
  }
  if (w.tempHigh >= 33) return `폭염 ${w.tempHigh}°`; // 써니
  return w.condition;
}

// 날씨 → {페르소나, 무드, 분류근거} 자동 캐스팅
export function autoCast(w: WeatherData): { personaId: string; mood: Mood; reason: string } {
  const personaId = autoPersonaId(w);
  return { personaId, mood: PERSONA_MOOD[personaId], reason: castReason(w, personaId) };
}
