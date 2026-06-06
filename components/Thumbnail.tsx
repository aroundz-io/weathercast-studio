"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
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

// 업로드 이미지를 캔버스에 'cover'(채우고 넘침 크롭)로 그림
function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number) {
  const ir = img.width / img.height;
  const cr = w / h;
  let dw: number, dh: number, dx: number, dy: number;
  if (ir > cr) {
    dh = h;
    dw = h * ir;
    dx = (w - dw) / 2;
    dy = 0;
  } else {
    dw = w;
    dh = w / ir;
    dx = 0;
    dy = (h - dh) / 2;
  }
  ctx.drawImage(img, dx, dy, dw, dh);
}

// 썸네일: (업로드 이미지 또는 그라데이션) 배경 위에 ① 날짜·요일 ② 오늘 상태 ③ 주인공명 + 하단 K WEATHER 워터마크
export function Thumbnail({
  weather,
  persona,
}: {
  weather: WeatherData | null;
  persona: Persona;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [tone, setTone] = useState<ToneKey>(weather ? DEFAULT_TONE[weather.conditionCode] : "sky");
  const [aspect, setAspect] = useState<"16:9" | "9:16">("16:9");
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const [w, h] = aspect === "16:9" ? [1280, 720] : [720, 1280];
    canvas.width = w;
    canvas.height = h;

    // ── 배경 ──
    if (bgImage) {
      drawCover(ctx, bgImage, w, h);
      // 텍스트 가독성용 스크림 (좌측 + 하단을 어둡게)
      const left = ctx.createLinearGradient(0, 0, w, 0);
      left.addColorStop(0, "rgba(0,0,0,0.6)");
      left.addColorStop(0.55, "rgba(0,0,0,0.18)");
      left.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = left;
      ctx.fillRect(0, 0, w, h);
      const bottom = ctx.createLinearGradient(0, h, 0, h * 0.65);
      bottom.addColorStop(0, "rgba(0,0,0,0.55)");
      bottom.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = bottom;
      ctx.fillRect(0, 0, w, h);
    } else {
      const t = TONES[tone];
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, t.from);
      g.addColorStop(1, t.to);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      const rg = ctx.createRadialGradient(w / 2, h * 0.45, h * 0.15, w / 2, h / 2, h * 0.85);
      rg.addColorStop(0, "rgba(0,0,0,0)");
      rg.addColorStop(1, "rgba(0,0,0,0.4)");
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, w, h);
    }

    // 날씨 이모지 (우상단, 이미지 없을 때만 — 사진 위에선 피사체 가림 방지)
    ctx.textBaseline = "alphabetic";
    if (!bgImage) {
      const statusEmoji = weather?.current?.emoji ?? weather?.conditionEmoji ?? "⛅";
      ctx.font = `${Math.round(h * 0.3)}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
      ctx.globalAlpha = 0.95;
      ctx.fillText(statusEmoji, w - h * 0.34, h * 0.34);
      ctx.globalAlpha = 1;
    }

    const fs = Math.round(aspect === "16:9" ? w * 0.075 : w * 0.1);
    const x = w * 0.07;
    ctx.shadowColor = "rgba(0,0,0,0.55)";
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

    // ② 오늘 상태 (예: 오늘은 맑음!)
    if (weather) {
      const rel = relativeDay(weather.date);
      const cond = weather.current ? weather.current.condition : weather.condition;
      let statusLine: string;
      if (rel) {
        const josa = (rel.charCodeAt(rel.length - 1) - 0xac00) % 28 !== 0 ? "은" : "는";
        statusLine = `${rel}${josa} ${cond}!`;
      } else {
        statusLine = `${cond}!`;
      }
      y += fs * 1.05;
      ctx.font = `800 ${fs}px "Malgun Gothic","Apple SD Gothic Neo",sans-serif`;
      ctx.fillStyle = "#ffffff";
      ctx.fillText(statusLine, x, y);
    }

    // ③ 날씨송 주인공 (페르소나) — 한글 + 영문
    y += fs * 1.25;
    ctx.font = `800 ${Math.round(fs * 1.0)}px "Malgun Gothic","Apple SD Gothic Neo",sans-serif`;
    ctx.fillStyle = persona.accent;
    ctx.fillText(`${persona.emoji} ${persona.name}`, x, y);
    y += fs * 0.56;
    ctx.font = `italic 700 ${Math.round(fs * 0.5)}px "Segoe UI","Malgun Gothic",sans-serif`;
    ctx.fillText(persona.nameEn, x, y);
    ctx.shadowColor = "transparent";

    // 브랜드 워터마크 (하단 우측) — 케이웨더
    const bw = aspect === "16:9" ? w * 0.3 : w * 0.55;
    const bh = h * (aspect === "16:9" ? 0.1 : 0.07);
    const bx = w - bw - w * 0.05;
    const by = h - bh - h * 0.05;
    ctx.fillStyle = "rgba(8,35,68,0.9)"; // 케이웨더 남색
    if (typeof ctx.roundRect === "function") {
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, bh * 0.22);
      ctx.fill();
    } else {
      ctx.fillRect(bx, by, bw, bh);
    }
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.font = `800 ${Math.round(bh * 0.42)}px "Segoe UI","Malgun Gothic",sans-serif`;
    ctx.fillText("K WEATHER", bx + bw / 2, by + bh * 0.52);
    ctx.font = `500 ${Math.round(bh * 0.26)}px "Malgun Gothic",sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillText("날씨와 함께하는 행복", bx + bw / 2, by + bh * 0.83);
    ctx.textAlign = "left";
  }, [weather, persona, tone, aspect, bgImage]);

  function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setBgImage(img);
      URL.revokeObjectURL(url);
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
    e.target.value = ""; // 같은 파일 재업로드 허용
  }

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

      {/* 배경 이미지 업로드 */}
      <div className="mt-3 flex items-center gap-2">
        <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
        <Button size="sm" variant="subtle" onClick={() => fileRef.current?.click()}>
          🖼 배경 이미지 업로드
        </Button>
        {bgImage && (
          <button
            onClick={() => setBgImage(null)}
            className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-white/5"
          >
            ✕ 이미지 제거
          </button>
        )}
        <span className="text-[10px] text-slate-500">
          {bgImage ? "업로드 이미지 위에 합성됨" : "업로드하면 그 위에 텍스트가 합성됩니다"}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {(Object.keys(TONES) as ToneKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setTone(k)}
              title={bgImage ? "이미지 제거 후 적용" : TONES[k].label}
              disabled={!!bgImage}
              className={cn(
                "h-6 w-6 rounded-full ring-2 transition disabled:opacity-30",
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
