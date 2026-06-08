"use client";

import { useEffect, useReducer } from "react";
import {
  ForecastType,
  Mood,
  Duration,
  WeatherData,
  LyricsResult,
  SongCandidate,
  VideoJob,
} from "@/lib/types";
import { api } from "@/lib/api";
import { getPersona, autoCast } from "@/lib/personas";
import { Status } from "@/components/ui";
import { VideoStatus } from "@/components/VideoPreview";
import { TopBar } from "@/components/TopBar";
import { PanelA } from "@/components/PanelA";
import { PanelB } from "@/components/PanelB";
import { PanelC } from "@/components/PanelC";

interface State {
  date: string;
  region: string;
  forecastType: ForecastType;
  mood: Mood;
  duration: Duration;
  personaId: string;

  weather: WeatherData | null;
  weatherStatus: Status;

  lyrics: LyricsResult | null;
  lyricsStatus: Status;

  songs: SongCandidate[];
  songsStatus: Status;
  selectedSongId: string | null;

  video: VideoJob | null;
  videoStatus: VideoStatus;

  error: string | null;
}

type Inputs = Pick<State, "date" | "region" | "forecastType" | "mood" | "duration" | "personaId">;

type Action =
  | { type: "SET"; patch: Partial<Inputs> }
  | { type: "WEATHER_START" }
  | { type: "WEATHER_OK"; weather: WeatherData }
  | { type: "LYRICS_START" }
  | { type: "LYRICS_OK"; lyrics: LyricsResult }
  | { type: "EDIT_LYRICS"; patch: Partial<LyricsResult> }
  | { type: "SONGS_START" }
  | { type: "SONGS_OK"; songs: SongCandidate[] }
  | { type: "SELECT_SONG"; id: string }
  | { type: "VIDEO_PLANNING" }
  | { type: "VIDEO_PLANNED"; video: VideoJob }
  | { type: "VIDEO_TICK" }
  | { type: "ERROR"; scope: "weather" | "lyrics" | "songs" | "video"; error: string };

const initialState: State = {
  date: "",
  region: "서울",
  forecastType: "today",
  mood: "upbeat",
  duration: 30,
  personaId: "sunny",
  weather: null,
  weatherStatus: "idle",
  lyrics: null,
  lyricsStatus: "idle",
  songs: [],
  songsStatus: "idle",
  selectedSongId: null,
  video: null,
  videoStatus: "idle",
  error: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET":
      return { ...state, ...action.patch };

    case "WEATHER_START":
      return { ...state, weatherStatus: "loading", error: null };
    case "WEATHER_OK": {
      // 새 날씨 → 페르소나/장르 자동 캐스팅 + 하위 단계 무효화
      const cast = autoCast(action.weather);
      return {
        ...state,
        weather: action.weather,
        weatherStatus: "done",
        personaId: cast.personaId,
        mood: cast.mood,
        lyrics: null,
        lyricsStatus: "idle",
        songs: [],
        songsStatus: "idle",
        selectedSongId: null,
        video: null,
        videoStatus: "idle",
      };
    }

    case "LYRICS_START":
      return { ...state, lyricsStatus: "loading", error: null };
    case "LYRICS_OK":
      return {
        ...state,
        lyrics: action.lyrics,
        lyricsStatus: "done",
        songs: [],
        songsStatus: "idle",
        selectedSongId: null,
        video: null,
        videoStatus: "idle",
      };
    case "EDIT_LYRICS":
      return state.lyrics
        ? { ...state, lyrics: { ...state.lyrics, ...action.patch } }
        : state;

    case "SONGS_START":
      return { ...state, songsStatus: "loading", error: null };
    case "SONGS_OK":
      return {
        ...state,
        songs: action.songs,
        songsStatus: "done",
        selectedSongId: action.songs[0]?.id ?? null,
        video: null,
        videoStatus: "idle",
      };
    case "SELECT_SONG":
      if (action.id === state.selectedSongId) return state;
      return { ...state, selectedSongId: action.id, video: null, videoStatus: "idle" };

    case "VIDEO_PLANNING":
      return { ...state, videoStatus: "planning", error: null };
    case "VIDEO_PLANNED":
      return { ...state, video: action.video, videoStatus: "rendering" };
    case "VIDEO_TICK": {
      if (!state.video) return state;
      const segs = state.video.segments;
      const idx = segs.findIndex((s) => s.status !== "done");
      if (idx === -1) return { ...state, videoStatus: "done" };
      const seg = segs[idx];
      const progress = Math.min(100, seg.progress + 9);
      const segments = segs.map((s, i) =>
        i === idx
          ? { ...s, progress, status: progress >= 100 ? ("done" as const) : ("rendering" as const) }
          : s
      );
      const allDone = segments.every((s) => s.status === "done");
      return {
        ...state,
        video: { ...state.video, segments },
        videoStatus: allDone ? "done" : "rendering",
      };
    }

    case "ERROR":
      return {
        ...state,
        error: action.error,
        weatherStatus: action.scope === "weather" ? "error" : state.weatherStatus,
        lyricsStatus: action.scope === "lyrics" ? "error" : state.lyricsStatus,
        songsStatus: action.scope === "songs" ? "error" : state.songsStatus,
        videoStatus: action.scope === "video" ? "idle" : state.videoStatus,
      };

    default:
      return state;
  }
}

export default function Dashboard() {
  const [state, dispatch] = useReducer(reducer, initialState);

  // 클라이언트에서만 오늘 날짜 주입 (SSR 하이드레이션 안전)
  useEffect(() => {
    if (!state.date) {
      const d = new Date();
      const s = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;
      dispatch({ type: "SET", patch: { date: s } });
    }
  }, [state.date]);

  // 영상 렌더링 진행률 시뮬레이션
  useEffect(() => {
    if (state.videoStatus !== "rendering") return;
    const id = setInterval(() => dispatch({ type: "VIDEO_TICK" }), 110);
    return () => clearInterval(id);
  }, [state.videoStatus]);

  async function onFetchWeather() {
    dispatch({ type: "WEATHER_START" });
    try {
      const weather = await api.weather(state.date, state.forecastType, state.region);
      dispatch({ type: "WEATHER_OK", weather });
    } catch (e) {
      dispatch({ type: "ERROR", scope: "weather", error: `케이웨더 호출 실패: ${String(e)}` });
    }
  }

  async function onGenerateLyrics() {
    if (!state.weather) return;
    dispatch({ type: "LYRICS_START" });
    try {
      const lyrics = await api.lyrics(state.weather, state.mood, state.duration, getPersona(state.personaId));
      dispatch({ type: "LYRICS_OK", lyrics });
    } catch (e) {
      dispatch({ type: "ERROR", scope: "lyrics", error: `가사 생성 실패: ${String(e)}` });
    }
  }

  async function onGenerateSongs() {
    if (!state.lyrics) return;
    dispatch({ type: "SONGS_START" });
    try {
      const { songs } = await api.songs(state.lyrics, state.mood, state.duration);
      dispatch({ type: "SONGS_OK", songs });
    } catch (e) {
      dispatch({ type: "ERROR", scope: "songs", error: `음원 생성 실패: ${String(e)}` });
    }
  }

  async function onRenderVideo() {
    const song = state.songs.find((s) => s.id === state.selectedSongId);
    if (!song || !state.lyrics) return;
    dispatch({ type: "VIDEO_PLANNING" });
    try {
      const persona = getPersona(state.personaId);
      const video = await api.video(song, persona.name, "Seedance 2.0", state.lyrics);
      dispatch({ type: "VIDEO_PLANNED", video });
    } catch (e) {
      dispatch({ type: "ERROR", scope: "video", error: `영상 생성 실패: ${String(e)}` });
    }
  }

  const persona = getPersona(state.personaId);

  return (
    <div className="min-h-screen">
      <TopBar
        weather={state.weather}
        hasWeather={!!state.weather}
        hasLyrics={!!state.lyrics}
        hasVideoDone={state.videoStatus === "done"}
      />

      <main className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6">
        {state.error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-200">
            <span>⚠️</span>
            {state.error}
          </div>
        )}

        <div className="grid gap-4 lg:h-[calc(100vh-150px)] lg:grid-cols-[minmax(300px,1fr)_minmax(340px,1.1fr)_minmax(360px,1.18fr)] xl:gap-5">
          <PanelA
            date={state.date}
            region={state.region}
            mood={state.mood}
            duration={state.duration}
            personaId={state.personaId}
            weather={state.weather}
            weatherStatus={state.weatherStatus}
            onSet={(patch) => dispatch({ type: "SET", patch })}
            onFetchWeather={onFetchWeather}
          />
          <PanelB
            weather={state.weather}
            lyrics={state.lyrics}
            lyricsStatus={state.lyricsStatus}
            persona={persona}
            onGenerate={onGenerateLyrics}
            onEdit={(patch) => dispatch({ type: "EDIT_LYRICS", patch })}
          />
          <PanelC
            lyrics={state.lyrics}
            weather={state.weather}
            persona={persona}
            songs={state.songs}
            songsStatus={state.songsStatus}
            selectedSongId={state.selectedSongId}
            onGenerateSongs={onGenerateSongs}
            onSelectSong={(id) => dispatch({ type: "SELECT_SONG", id })}
            video={state.video}
            videoStatus={state.videoStatus}
            onRenderVideo={onRenderVideo}
          />
        </div>

        <p className="mt-4 text-center text-[11px] text-slate-600">
          WeatherCast Studio · 프로토타입 (모든 외부 API는 목업) · 케이웨더 · Gemini · Suno ·
          OmniHuman/Seedance
        </p>
      </main>
    </div>
  );
}
