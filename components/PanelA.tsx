"use client";

import { ForecastType, Mood, Duration, WeatherData } from "@/lib/types";
import { FORECAST_LABELS, REGIONS } from "@/lib/mock/weather";
import { moodLabel } from "@/lib/mock/lyrics";
import { PERSONAS } from "@/lib/personas";
import { Button, Card, PanelHeader, StatusBadge, Field, inputClass, cn, Status } from "@/components/ui";

interface ConceptInputs {
  date: string;
  region: string;
  forecastType: ForecastType;
  mood: Mood;
  duration: Duration;
  personaId: string;
}

const MOODS: Mood[] = ["upbeat", "calm", "hiphop", "ballad", "kids"];
const DURATIONS: Duration[] = [15, 30, 60];

export function PanelA({
  date,
  region,
  forecastType,
  mood,
  duration,
  personaId,
  weather,
  weatherStatus,
  onSet,
  onFetchWeather,
}: ConceptInputs & {
  weather: WeatherData | null;
  weatherStatus: Status;
  onSet: (patch: Partial<ConceptInputs>) => void;
  onFetchWeather: () => void;
}) {
  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <PanelHeader
        step={1}
        title="데이터 세팅"
        subtitle="케이웨더 데이터 호출 · 메인 컨셉"
        right={<StatusBadge status={weatherStatus} idleLabel="미호출" />}
      />
      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        {/* 입력 */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="날짜">
            <input
              type="date"
              value={date}
              onChange={(e) => onSet({ date: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="지역">
            <select
              value={region}
              onChange={(e) => onSet({ region: e.target.value })}
              className={inputClass}
            >
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="예보 타입">
          <select
            value={forecastType}
            onChange={(e) => onSet({ forecastType: e.target.value as ForecastType })}
            className={inputClass}
          >
            {(Object.keys(FORECAST_LABELS) as ForecastType[]).map((f) => (
              <option key={f} value={f}>
                {FORECAST_LABELS[f]}
              </option>
            ))}
          </select>
        </Field>

        <Button onClick={onFetchWeather} loading={weatherStatus === "loading"} className="w-full">
          {weatherStatus === "loading" ? "케이웨더 호출 중…" : "🛰 케이웨더 데이터 호출"}
        </Button>

        {/* 결과 */}
        {weather && (
          <div className="animate-fade-in rounded-xl border border-white/10 bg-ink-900/50 p-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{weather.conditionEmoji}</span>
              <div>
                <p className="text-sm font-bold text-white">
                  {weather.region} · {weather.condition}
                </p>
                <p className="text-xs text-slate-400">{weather.forecastLabel}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-lg font-bold text-white">
                  {weather.tempHigh}°
                  <span className="text-sm font-normal text-slate-400"> / {weather.tempLow}°</span>
                </p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2 text-center text-[11px]">
              {[
                { k: "강수", v: `${weather.precipitation}%` },
                { k: "습도", v: `${weather.humidity}%` },
                { k: "바람", v: `${weather.windSpeed}m/s` },
                { k: "미세먼지", v: weather.fineDust },
              ].map((m) => (
                <div key={m.k} className="rounded-lg bg-white/5 py-2">
                  <p className="text-slate-500">{m.k}</p>
                  <p className="font-semibold text-slate-200">{m.v}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-400">{weather.summary}</p>
          </div>
        )}

        <div className="h-px bg-white/10" />

        {/* 메인 컨셉 */}
        <div>
          <p className="mb-2 text-xs font-semibold text-slate-300">무드 / 장르</p>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((m) => (
              <button
                key={m}
                onClick={() => onSet({ mood: m })}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition",
                  mood === m
                    ? "bg-sky-500/20 text-sky-200 ring-sky-400/50"
                    : "bg-white/5 text-slate-300 ring-white/10 hover:bg-white/10"
                )}
              >
                {moodLabel(m)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold text-slate-300">숏폼 길이</p>
          <div className="flex overflow-hidden rounded-xl border border-white/10">
            {DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => onSet({ duration: d })}
                className={cn(
                  "flex-1 py-2 text-sm font-semibold transition",
                  duration === d
                    ? "bg-sky-500/25 text-sky-100"
                    : "text-slate-400 hover:bg-white/5"
                )}
              >
                {d}초
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold text-slate-300">페르소나 (가상 모델)</p>
          <div className="grid grid-cols-2 gap-2">
            {PERSONAS.map((p) => (
              <button
                key={p.id}
                onClick={() => onSet({ personaId: p.id })}
                className={cn(
                  "flex items-center gap-2 rounded-xl border p-2.5 text-left transition",
                  personaId === p.id
                    ? "border-sky-400/60 bg-sky-500/10"
                    : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                )}
              >
                <span className="text-2xl">{p.emoji}</span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-white">{p.name}</p>
                  <p className="truncate text-[10px] text-slate-400">{p.role}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
