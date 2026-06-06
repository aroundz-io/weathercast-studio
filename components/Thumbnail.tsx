"use client";

import { useEffect, useRef, useState } from "react";
import { WeatherData, Persona, ConditionCode } from "@/lib/types";
import { weekdayKo, relativeDay } from "@/lib/weather/dates";
import { Button, cn } from "@/components/ui";

type ToneKey = "sky" | "sunset" | "night" | "mint";

const TONES: Record<ToneKey, { from: string; to: string; label: string }> = {
  sky: { from: "#38bdf8", to: "#6366f1", label: "스카이" },
  sunset: { from: "#fb7185", to: "#f59e0b", label: "선셋" },
  night: { from: "#1e293b", to: "#0b1220", label: "나이트" },
  mint: { from: "#34d399", to: "#06b6d4", label: "민트" },
};

const DEFAULT_TONE: Record<ConditionCode, ToneKey> = {
  sunny: "sky",
  partly: "sky",
  cloudy: "night",
  rain: "night",
  shower: "mint",
  snow: "mint",
  thunder: "night",
};

// 썸네일 메인 텍스트 = ① 년/월/일·요일 ② 오늘 상태 ③ 날씨송 주인공(페르소나) 이름
export function Thumbnail({
  weather,
  persona,
}: {
  weather: WeatherData | null;
  persona: Persona;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [tone, setTone] = useState<ToneKey>(weather ? DEFAULT_TONE[weather.conditionCode] : "sky");
  const [aspect, setAspect] = useState<"16:9" | "9:16">("16:9");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const [w, h] = aspect === "16:9" ? [1280, 720] : [720, 1280];
    canvas.width = w;
    canvas.height = h;

    // 배경 그라데이션
    const t = TONES[tone];
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, t.from);
    g.addColorStop(1, t.to);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // 비네팅
    const rg = ctx.createRadialGradient(w / 2, h * 0.45, h * 0.15, w / 2, h / 2, h * 0.85);
    rg.addColorStop(0, "rgba(0,0,0,0)");
    rg.addColorStop(1, "rgba(0,0,0,0.4)");
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, w, h);

    // 날씨 이모지 (우상단, 시각적 상태)
    ctx.textBaseline = "alphabetic";
    const statusEmoji = weather?.current?.emoji ?? weather?.conditionEmoji ?? "⛅";
    ctx.font = `${Math.round(h * 0.3)}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
    ctx.globalAlpha = 0.95;
    ctx.fillText(statusEmoji, w - h * 0.34, h * 0.34);
    ctx.globalAlpha = 1;

    const fs = Math.round(aspect === "16:9" ? w * 0.075 : w * 0.1);
    const x = w * 0.07;
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = h * 0.02;
    ctx.shadowOffsetY = h * 0.008;
    let y = h * 0.42;

    // ① 년도 · 날짜 · 요일
    ctx.font = `700 ${Math.round(fs * 0.62)}px "Malgun Gothic","Apple SD Gothic Neo",sans-serif`;
    if (weather) {
      const [yy, mm, dd2] = weather.date.split("-");
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.fillText(`${yy}년 ${Number(mm)}월 ${Number(dd2)}일 (${weekdayKo(weather.date)})`, x, y);
    } else {
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fillText("날씨를 먼저 불러오세요", x, y);
    }

    // ② 오늘 상태 (오늘/내일 + 날씨)
    if (weather) {
      const rel = relativeDay(weather.date);
      const cond = weather.current ? weather.current.condition : weather.condition;
      y += fs * 1.05;
      ctx.font = `800 ${fs}px "Malgun Gothic","Apple SD Gothic Neo",sans-serif`;
      ctx.fillStyle = "#ffffff";
      ctx.fillText(`${rel ? rel + " " : ""}${cond}`, x, y);
    }

    // ③ 날씨송 주인공 (페르소나 이름)
    y += fs * 1.2;
    ctx.font = `800 ${Math.round(fs * 1.05)}px "Malgun Gothic","Apple SD Gothic Neo",sans-serif`;
    ctx.fillStyle = persona.accent;
    ctx.fillText(`${persona.emoji} ${persona.name}`, x, y);
    ctx.shadowColor = "transparent";

    // 브랜드 워터마크
    ctx.font = `700 ${Math.round(fs * 0.3)}px "Malgun Gothic",sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillText("⛅ WeatherCast", x, h * 0.93);
  }, [weather, persona, tone, aspect]);

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.download = `thumbnail_${weather?.region ?? "weather"}_${aspect.replace(":", "x")}.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();
  }

  return (
    <div>
      <div className={cn("mx-auto", aspect === "9:16" ? "max-w-[200px]" : "max-w-full")}>
        <canvas ref={canvasRef} className="h-auto w-full rounded-xl border border-white/10" />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {(Object.keys(TONES) as ToneKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setTone(k)}
              title={TONES[k].label}
              className={cn(
                "h-6 w-6 rounded-full ring-2 transition",
                tone === k ? "ring-white" : "ring-transparent hover:ring-white/40"
              )}
              style={{ background: `linear-gradient(135deg, ${TONES[k].from}, ${TONES[k].to})` }}
            />
          ))}
          <div className="ml-1 flex overflow-hidden rounded-lg border border-white/10 text-[11px]">
            {(["16:9", "9:16"] as const).map((a) => (
              <button
                key={a}
                onClick={() => setAspect(a)}
                className={cn(
                  "px-2 py-1 font-medium transition",
                  aspect === a ? "bg-sky-500/30 text-sky-200" : "text-slate-400 hover:bg-white/5"
                )}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
        <Button size="sm" variant="subtle" onClick={download}>
          ⬇ PNG 저장
        </Button>
      </div>
    </div>
  );
}
