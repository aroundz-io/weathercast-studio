import {
  WeatherData,
  LyricsResult,
  SongCandidate,
  VideoJob,
  ForecastType,
  Mood,
  Duration,
} from "@/lib/types";

async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${url} 요청 실패 (${res.status}) ${text}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  weather: (date: string, forecastType: ForecastType, region: string) =>
    postJSON<WeatherData>("/api/weather", { date, forecastType, region }),

  lyrics: (weather: WeatherData, mood: Mood, duration: Duration) =>
    postJSON<LyricsResult>("/api/lyrics", { weather, mood, duration }),

  songs: (lyrics: LyricsResult, mood: Mood, duration: Duration) =>
    postJSON<{ songs: SongCandidate[] }>("/api/songs", { lyrics, mood, duration }),

  video: (song: SongCandidate, persona: string, model: string, lyrics: LyricsResult) =>
    postJSON<VideoJob>("/api/video", { song, persona, model, lyrics }),
};
