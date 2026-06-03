import { ForecastType } from "@/lib/types";

export const REGIONS = ["서울", "경기", "인천", "부산", "대구", "광주", "대전", "강원", "제주"];

// 지역 → 대표 좌표 (Open-Meteo 호출용)
export const REGION_COORDS: Record<string, { lat: number; lon: number }> = {
  서울: { lat: 37.5665, lon: 126.978 },
  경기: { lat: 37.2752, lon: 127.0095 }, // 수원
  인천: { lat: 37.4563, lon: 126.7052 },
  부산: { lat: 35.1796, lon: 129.0756 },
  대구: { lat: 35.8714, lon: 128.6014 },
  광주: { lat: 35.1595, lon: 126.8526 },
  대전: { lat: 36.3504, lon: 127.3845 },
  강원: { lat: 37.8813, lon: 127.7298 }, // 춘천
  제주: { lat: 33.4996, lon: 126.5312 },
};

export const FORECAST_LABELS: Record<ForecastType, string> = {
  today: "오늘의 날씨",
  tomorrow: "내일의 날씨",
  weekend: "주말 날씨",
  commute: "출근길 날씨",
  weekly: "주간 날씨",
};
