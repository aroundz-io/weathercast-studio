import { Persona } from "@/lib/types";

// PRD의 날씨 기반 버추얼 아이돌 / AI 기상캐스터 페르소나 (사전 등록 모델)
export const PERSONAS: Persona[] = [
  {
    id: "sunny",
    name: "써니",
    role: "AI 기상캐스터 · 메인",
    emoji: "🌞",
    accent: "#fbbf24",
    blurb: "밝고 경쾌한 진행. 화창한 날·주말 예보에 강함.",
  },
  {
    id: "rain",
    name: "레인",
    role: "버추얼 아이돌",
    emoji: "🌧️",
    accent: "#38bdf8",
    blurb: "잔잔하고 감성적인 톤. 비·새벽 예보에 어울림.",
  },
  {
    id: "cloudy",
    name: "클라우디",
    role: "버추얼 아이돌",
    emoji: "☁️",
    accent: "#a5b4fc",
    blurb: "차분하고 안정적인 전달. 미세먼지·흐림 예보.",
  },
  {
    id: "thunder",
    name: "썬더",
    role: "버추얼 아이돌",
    emoji: "⚡",
    accent: "#f472b6",
    blurb: "힙합·강렬한 비트. 특보·폭우·폭염 경보용.",
  },
];

export function getPersona(id: string): Persona {
  return PERSONAS.find((p) => p.id === id) ?? PERSONAS[0];
}
