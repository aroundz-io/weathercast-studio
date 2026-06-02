"use client";

import { WeatherData } from "@/lib/types";
import { TagPill, cn } from "@/components/ui";

type StepState = "done" | "active" | "todo";

const STEPS = ["데이터", "텍스트", "미디어", "패키징"];

export function TopBar({
  weather,
  hasWeather,
  hasLyrics,
  hasVideoDone,
}: {
  weather: WeatherData | null;
  hasWeather: boolean;
  hasLyrics: boolean;
  hasVideoDone: boolean;
}) {
  const states: StepState[] = [
    hasWeather ? "done" : "active",
    hasLyrics ? "done" : hasWeather ? "active" : "todo",
    hasVideoDone ? "done" : hasLyrics ? "active" : "todo",
    hasVideoDone ? "active" : "todo",
  ];

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-ink-900/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* 브랜드 */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 text-xl shadow-glow">
            ⛅
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-white">
              WeatherCast Studio
            </h1>
            <p className="text-[11px] text-slate-400">AI 날씨송·영상 반자동 생성 대시보드</p>
          </div>
        </div>

        {/* 스텝 레일 */}
        <nav className="hidden items-center gap-1 lg:flex">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-1">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ring-1 transition",
                    states[i] === "done" && "bg-emerald-500/20 text-emerald-300 ring-emerald-400/40",
                    states[i] === "active" && "bg-sky-500/20 text-sky-300 ring-sky-400/50",
                    states[i] === "todo" && "bg-white/5 text-slate-500 ring-white/10"
                  )}
                >
                  {states[i] === "done" ? "✓" : i + 1}
                </span>
                <span
                  className={cn(
                    "text-xs font-medium",
                    states[i] === "todo" ? "text-slate-500" : "text-slate-200"
                  )}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && <span className="mx-1 h-px w-6 bg-white/15" />}
            </div>
          ))}
        </nav>

        {/* 상태 */}
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-rose-500/15 px-2.5 py-1 text-[11px] font-semibold text-rose-300 ring-1 ring-rose-400/30">
            MOCK MODE
          </span>
        </div>
      </div>

      {/* 기상 키워드 태그 자동 추출 */}
      {weather && (
        <div className="border-t border-white/5 bg-white/[0.02]">
          <div className="mx-auto flex max-w-[1600px] items-center gap-2 overflow-x-auto px-4 py-2 sm:px-6">
            <span className="shrink-0 text-[11px] font-semibold text-slate-500">키워드</span>
            {weather.tags.map((t) => (
              <span key={t.label} className="shrink-0">
                <TagPill tone={t.tone} icon={t.icon}>
                  {t.label}
                </TagPill>
              </span>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
