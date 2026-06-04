"use client";

import { Mood, Duration, WeatherData } from "@/lib/types";
import { REGIONS } from "@/lib/mock/weather";
import { dateDisplay, kstTodayStr, kstDatePlusDays } from "@/lib/weather/dates";
import { moodLabel } from "@/lib/mock/lyrics";
import { PERSONAS, getPersona, autoCast } from "@/lib/personas";
import { HourlyForecast } from "@/components/HourlyForecast";
import { Button, Card, PanelHeader, StatusBadge, Field, inputClass, cn, Status } from "@/components/ui";

interface ConceptInputs {
  date: string;
  region: string;
  mood: Mood;
  duration: Duration;
  personaId: string;
}

const MOODS: Mood[] = ["upbeat", "calm", "hiphop", "ballad", "kids"];
const DURATIONS: Duration[] = [15, 30, 60];

export function PanelA({
  date,
  region,
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
  const cast = weather ? autoCast(weather) : null;
  const castPersona = cast ? getPersona(cast.personaId) : null;
  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <PanelHeader
        step={1}
        title="데이터 세팅"
        subtitle="케이웨더 데이터 호출 · 메인 컨셉"
        right={<StatusBadge status={weatherStatus} idleLabel="미호출" />}
      />
      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        {/* 입력 — 날짜 하나로 예보일 선택 */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="날짜">
            <input
              type="date"
              value={date}
              min={kstTodayStr()}
              max={kstDatePlusDays(6)}
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
        <p className="-mt-2 text-[11px] text-slate-500">
          오늘~+6일 중 선택 · 고른 날짜의 예보를 불러옵니다
        </p>

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
                <p className="text-xs text-slate-400">
                  📅 {dateDisplay(weather.date)} · {weather.forecastLabel}
                </p>
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

        {weather && <HourlyForecast weather={weather} />}

        <div className="h-px bg-white/10" />

        {cast && castPersona && (
          <div className="rounded-lg border border-sky-400/30 bg-sky-500/10 px-3 py-2 text-[11px] leading-relaxed text-sky-200">
            🤖 자동 캐스팅: <b>{cast.reason}</b> → {castPersona.emoji} {castPersona.name} ·{" "}
            {moodLabel(cast.mood)} <span className="text-slate-400">(아래에서 수정 가능)</span>
          </div>
        )}

        {/* 메인 컨셉 — 날씨 기반 자동 선택(수정 가능) */}
        <div>
          <p className="mb-2 text-xs font-semibold text-slate-300">무드 / 장르 (자동)</p>
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
          <p className="mb-2 text-xs font-semibold text-slate-300">페르소나 (날씨 자동)</p>
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
