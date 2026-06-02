"use client";

import { Persona, VideoJob, WeatherData, ConditionCode } from "@/lib/types";
import { ProgressBar, Spinner, cn } from "@/components/ui";

export type VideoStatus = "idle" | "planning" | "rendering" | "done";

const FRAME_GRADIENT: Record<ConditionCode, string> = {
  sunny: "from-amber-400/50 to-sky-500/40",
  partly: "from-sky-400/50 to-indigo-500/40",
  cloudy: "from-slate-400/50 to-slate-600/40",
  rain: "from-sky-600/50 to-indigo-700/50",
  shower: "from-cyan-500/50 to-blue-600/50",
  snow: "from-sky-200/50 to-indigo-300/40",
  thunder: "from-indigo-600/50 to-fuchsia-600/50",
};

function fmt(sec: number): string {
  const s = Math.floor(sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function VideoPreview({
  status,
  job,
  persona,
  weather,
  songTitle,
}: {
  status: VideoStatus;
  job: VideoJob | null;
  persona: Persona;
  weather: WeatherData | null;
  songTitle?: string;
}) {
  const overall =
    job && job.segments.length
      ? Math.round(job.segments.reduce((a, s) => a + s.progress, 0) / job.segments.length)
      : 0;
  const grad = weather ? FRAME_GRADIENT[weather.conditionCode] : "from-slate-500/40 to-slate-700/40";

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      {/* 9:16 프레임 */}
      <div className="mx-auto w-[150px] shrink-0 sm:mx-0">
        <div
          className={cn(
            "relative aspect-[9/16] overflow-hidden rounded-xl bg-gradient-to-br ring-1 ring-white/15",
            grad
          )}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <span className="text-5xl drop-shadow-lg">{persona.emoji}</span>
            <span className="rounded-full bg-black/30 px-2 py-0.5 text-[10px] font-semibold text-white/90">
              {persona.name}
            </span>
          </div>

          {/* 상단 라벨 */}
          <div className="absolute left-1.5 top-1.5 rounded bg-black/40 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-white/80">
            9:16 · {job?.model ?? "Seedance"}
          </div>
          <div className="absolute right-1.5 top-1.5 rounded bg-rose-500/80 px-1.5 py-0.5 text-[9px] font-bold text-white">
            MOCK
          </div>

          {/* 오버레이 */}
          {(status === "planning" || status === "rendering") && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/45 backdrop-blur-[1px]">
              <Spinner className="text-sky-300" />
              <span className="text-[11px] font-medium text-white/90">
                {status === "planning" ? "분절 계획 생성…" : `렌더링 ${overall}%`}
              </span>
            </div>
          )}
          {status === "done" && (
            <button className="absolute inset-0 flex items-center justify-center bg-black/20 transition hover:bg-black/30">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-lg">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </button>
          )}
          {songTitle && (
            <div className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/60 to-transparent px-2 pb-1.5 pt-4 text-[10px] text-white/90">
              ♪ {songTitle}
            </div>
          )}
        </div>
      </div>

      {/* 분절 진행 상태 */}
      <div className="min-w-0 flex-1 space-y-2">
        {!job && (
          <p className="text-xs text-slate-500">
            곡을 선택하고 <span className="text-slate-300">영상 생성</span>을 누르면 30초 단위 분절
            렌더링이 시작됩니다.
          </p>
        )}
        {job?.segments.map((seg) => (
          <div key={seg.index} className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
            <div className="mb-1 flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-200">
                구간 {seg.index + 1} · {fmt(seg.startSec)}–{fmt(seg.endSec)}
              </span>
              <span
                className={cn(
                  "tabular-nums",
                  seg.status === "done" ? "text-emerald-300" : "text-slate-400"
                )}
              >
                {seg.status === "done" ? "✓ 완료" : `${Math.round(seg.progress)}%`}
              </span>
            </div>
            <ProgressBar value={seg.progress} />
            <p className="mt-1 truncate text-[10px] text-slate-500">🎬 {seg.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
