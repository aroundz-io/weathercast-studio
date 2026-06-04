"use client";

import { WeatherData } from "@/lib/types";
import { cn } from "@/components/ui";

export function HourlyForecast({ weather }: { weather: WeatherData }) {
  const { hourly, analysis, source } = weather;
  if (!hourly?.length) return null;

  const temps = hourly.map((h) => h.temp);
  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);
  const range = Math.max(1, maxTemp - minTemp);

  return (
    <div className="animate-fade-in rounded-xl border border-white/10 bg-ink-900/50 p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-white">⏱ 시간별 예보 · 분석</h3>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1",
            source !== "mock"
              ? "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30"
              : "bg-rose-500/15 text-rose-300 ring-rose-400/30"
          )}
        >
          {source === "kweather"
            ? "실데이터 · 케이웨더"
            : source === "open-meteo"
              ? "실데이터 · Open-Meteo"
              : "목업 데이터"}
        </span>
      </div>

      {/* 예보 분석 */}
      <p className="text-xs font-semibold leading-relaxed text-sky-200">{analysis.headline}</p>
      <ul className="mt-1.5 space-y-1">
        {analysis.bullets.map((b, i) => (
          <li key={i} className="flex gap-1.5 text-[11px] leading-relaxed text-slate-300">
            <span className="mt-0.5 text-slate-500">•</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>

      {/* 시간별 스트립 */}
      <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
        {hourly.map((h) => {
          const barH = 28 + ((h.temp - minTemp) / range) * 60; // 막대 높이 시각화
          return (
            <div
              key={h.time}
              className={cn(
                "flex w-12 shrink-0 flex-col items-center rounded-lg px-1 py-1.5",
                h.isNow ? "bg-sky-500/20 ring-1 ring-sky-400/40" : "bg-white/[0.03]"
              )}
            >
              <span
                className={cn(
                  "text-[10px]",
                  h.isNow ? "font-bold text-sky-200" : "text-slate-400"
                )}
              >
                {h.isNow ? "지금" : h.hourLabel}
              </span>
              <span className="my-0.5 text-base leading-none">{h.emoji}</span>
              <span className="text-[11px] font-semibold text-white">{h.temp}°</span>
              {/* 기온 막대 */}
              <span className="mt-1 w-1 rounded-full bg-gradient-to-t from-sky-500/40 to-amber-400/70" style={{ height: `${barH}%` }} />
              <span
                className={cn(
                  "mt-1 text-[9px] tabular-nums",
                  h.precipProb >= 50 ? "text-sky-300" : h.precipProb > 0 ? "text-slate-400" : "text-transparent"
                )}
              >
                💧{h.precipProb}%
              </span>
            </div>
          );
        })}
      </div>
      {weather.observedAt && (
        <p className="mt-2 text-[10px] text-slate-500">
          기준 {weather.observedAt.replace("T", " ")} · 지역 {weather.region}
          {source === "kweather"
            ? " · 케이웨더 실시간"
            : source === "open-meteo"
              ? " · Open-Meteo 실시간"
              : " · 목업"}
        </p>
      )}
    </div>
  );
}
