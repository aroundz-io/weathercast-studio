"use client";

import { useEffect, useRef, useState } from "react";
import { SongCandidate } from "@/lib/types";
import { cn } from "@/components/ui";

// 한 번에 한 곡만 재생되도록 모듈 단위로 활성 플레이어를 추적
let activeStop: (() => void) | null = null;

const KEY_ROOT: Record<string, number> = {
  "C Major": 261.63,
  "A Minor": 220.0,
  "G Major": 196.0,
  "E Minor": 164.81,
  "D Major": 293.66,
  "F Major": 174.61,
  "B Minor": 246.94,
};

function fmt(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function AudioPlayer({
  song,
  selected,
  onSelect,
}: {
  song: SongCandidate;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);

  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ master: GainNode; oscs: OscillatorNode[] } | null>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(0);

  function teardownNodes() {
    if (nodesRef.current) {
      const { master, oscs } = nodesRef.current;
      try {
        master.gain.cancelScheduledValues(ctxRef.current!.currentTime);
        master.gain.setTargetAtTime(0, ctxRef.current!.currentTime, 0.05);
      } catch {
        /* noop */
      }
      oscs.forEach((o) => {
        try {
          o.stop(ctxRef.current!.currentTime + 0.2);
        } catch {
          /* noop */
        }
      });
      nodesRef.current = null;
    }
  }

  function pause() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    teardownNodes();
    setPlaying(false);
    if (activeStop === pause) activeStop = null;
  }

  function play() {
    if (activeStop && activeStop !== pause) activeStop();
    activeStop = pause;

    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = ctxRef.current ?? new Ctor();
    ctxRef.current = ctx;
    if (ctx.state === "suspended") void ctx.resume();

    // 부드러운 패드 화음 합성 (실제 음원이 아니라 미리듣기용 톤)
    const root = KEY_ROOT[song.musicKey] ?? 220;
    const ratios = [1, 1.25, 1.5];
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    master.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.4);
    const oscs = ratios.map((r, i) => {
      const o = ctx.createOscillator();
      o.type = i === 0 ? "sine" : "triangle";
      o.frequency.value = root * r;
      o.detune.value = (i - 1) * 5;
      const g = ctx.createGain();
      g.gain.value = 0.5 / ratios.length;
      o.connect(g);
      g.connect(master);
      o.start();
      return o;
    });
    nodesRef.current = { master, oscs };

    startRef.current = ctx.currentTime - pos;
    setPlaying(true);

    const loop = () => {
      if (!ctxRef.current) return;
      const t = ctxRef.current.currentTime - startRef.current;
      if (t >= song.durationSec) {
        pause();
        setPos(0);
        return;
      }
      setPos(t);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }

  useEffect(() => {
    return () => pause();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ratio = pos / song.durationSec;

  return (
    <div
      onClick={() => onSelect(song.id)}
      className={cn(
        "group cursor-pointer rounded-xl border p-3 transition",
        selected
          ? "border-sky-400/60 bg-sky-500/10 shadow-glow"
          : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
            selected ? "border-sky-400" : "border-white/30"
          )}
        >
          {selected && <span className="h-2 w-2 rounded-full bg-sky-400" />}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            playing ? pause() : play();
          }}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 text-white transition hover:brightness-110"
          aria-label={playing ? "일시정지" : "재생"}
        >
          {playing ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{song.title}</p>
          <p className="text-[11px] text-slate-400">
            {song.bpm} BPM · {song.musicKey} · {fmt(song.durationSec)}
          </p>
        </div>
      </div>

      {/* 파형 */}
      <div className="mt-3 flex h-10 items-end gap-[2px]">
        {song.waveform.map((v, i) => {
          const filled = (i + 0.5) / song.waveform.length <= ratio;
          return (
            <span
              key={i}
              className={cn(
                "flex-1 rounded-sm transition-colors",
                filled ? "bg-sky-400" : "bg-white/15"
              )}
              style={{ height: `${Math.max(8, v * 100)}%` }}
            />
          );
        })}
      </div>

      <div className="mt-1.5 flex items-center justify-between text-[11px] tabular-nums text-slate-400">
        <span>{fmt(pos)}</span>
        <div className="flex flex-wrap gap-1">
          {song.styleTags.slice(0, 3).map((t) => (
            <span key={t} className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-300">
              {t}
            </span>
          ))}
        </div>
        <span>{fmt(song.durationSec)}</span>
      </div>
    </div>
  );
}
