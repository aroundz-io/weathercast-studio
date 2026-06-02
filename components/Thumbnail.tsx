"use client";

import { useEffect, useRef, useState } from "react";
import { WeatherData, Persona, ConditionCode } from "@/lib/types";
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

export function Thumbnail({
  text,
  weather,
  persona,
}: {
  text: string;
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

    // 날씨 이모지 (우상단)
    ctx.textBaseline = "alphabetic";
    ctx.font = `${Math.round(h * 0.26)}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
    ctx.globalAlpha = 0.95;
    ctx.fillText(weather?.conditionEmoji ?? "⛅", w - h * 0.3, h * 0.36);
    ctx.globalAlpha = 1;

    // 페르소나 (좌상단)
    ctx.font = `700 ${Math.round(h * 0.04)}px "Malgun Gothic","Apple SD Gothic Neo",sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillText(`${persona.emoji} ${persona.name}`, w * 0.06, h * 0.12);

    // 메인 텍스트
    const fs = Math.round(aspect === "16:9" ? w * 0.085 : w * 0.12);
    ctx.font = `800 ${fs}px "Malgun Gothic","Apple SD Gothic Neo",sans-serif`;
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = h * 0.02;
    ctx.shadowOffsetY = h * 0.008;
    const lines = (text || "오늘의 날씨").split("\n");
    let y = h * (aspect === "16:9" ? 0.5 : 0.58);
    for (const ln of lines) {
      ctx.fillText(ln, w * 0.06, y);
      y += fs * 1.12;
    }
    ctx.shadowColor = "transparent";

    // 서브 정보
    if (weather) {
      ctx.font = `600 ${Math.round(fs * 0.32)}px "Malgun Gothic",sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.88)";
      ctx.fillText(
        `${weather.date} · ${weather.region} · 강수 ${weather.precipitation}%`,
        w * 0.06,
        y + fs * 0.1
      );
    }

    // 브랜드 칩
    ctx.font = `700 ${Math.round(fs * 0.3)}px "Malgun Gothic",sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.fillText("⛅ WeatherCast", w * 0.06, h * 0.93);
  }, [text, weather, persona, tone, aspect]);

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
              style={{
                background: `linear-gradient(135deg, ${TONES[k].from}, ${TONES[k].to})`,
              }}
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
