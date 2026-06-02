"use client";

import { useState } from "react";
import { LyricsResult, WeatherData } from "@/lib/types";
import {
  Button,
  Card,
  PanelHeader,
  StatusBadge,
  Field,
  inputClass,
  cn,
  Status,
} from "@/components/ui";

export function PanelB({
  weather,
  lyrics,
  lyricsStatus,
  onGenerate,
  onEdit,
}: {
  weather: WeatherData | null;
  lyrics: LyricsResult | null;
  lyricsStatus: Status;
  onGenerate: () => void;
  onEdit: (patch: Partial<LyricsResult>) => void;
}) {
  const [tagInput, setTagInput] = useState("");

  function addTag() {
    const t = tagInput.trim();
    if (!t || !lyrics) return;
    if (!lyrics.sunoStyleTags.includes(t)) {
      onEdit({ sunoStyleTags: [...lyrics.sunoStyleTags, t] });
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    if (!lyrics) return;
    onEdit({ sunoStyleTags: lyrics.sunoStyleTags.filter((t) => t !== tag) });
  }

  function downloadScript() {
    if (!lyrics) return;
    const body = `# ${lyrics.title}\n\n[가사]\n${lyrics.lyrics}\n\n[나레이션]\n${lyrics.narration}\n\n[Suno 스타일]\n${lyrics.sunoStyleTags.join(
      ", "
    )}\n\n[영상 프롬프트]\n${lyrics.videoPrompt}\n\n[썸네일 텍스트]\n${lyrics.thumbnailText}\n`;
    const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `script_${weather?.region ?? "weather"}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const textareaClass = cn(inputClass, "resize-y leading-relaxed");

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <PanelHeader
        step={2}
        title="기획 · 텍스트 생성"
        subtitle="Gemini 가사·스크립트 · 직접 편집 가능"
        right={<StatusBadge status={lyricsStatus} idleLabel="미생성" />}
      />
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        <Button
          onClick={onGenerate}
          disabled={!weather}
          loading={lyricsStatus === "loading"}
          className="w-full"
        >
          {lyricsStatus === "loading"
            ? "Gemini 생성 중…"
            : lyrics
              ? "↻ 가사 재생성"
              : "✨ Gemini로 가사·프롬프트 생성"}
        </Button>

        {!weather && (
          <p className="rounded-lg border border-dashed border-white/10 px-3 py-4 text-center text-xs text-slate-500">
            먼저 ① 패널에서 케이웨더 데이터를 호출하세요.
          </p>
        )}

        {lyricsStatus === "loading" && (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-4 animate-pulse rounded bg-white/10" style={{ width: `${90 - i * 15}%` }} />
            ))}
          </div>
        )}

        {lyrics && lyricsStatus !== "loading" && (
          <div className="animate-fade-in space-y-4">
            <Field label="제목">
              <input
                value={lyrics.title}
                onChange={(e) => onEdit({ title: e.target.value })}
                className={inputClass}
              />
            </Field>

            <Field label="가사 (Suno 메타태그 포함)">
              <textarea
                value={lyrics.lyrics}
                onChange={(e) => onEdit({ lyrics: e.target.value })}
                rows={10}
                className={textareaClass}
              />
            </Field>

            <Field label="나레이션 스크립트">
              <textarea
                value={lyrics.narration}
                onChange={(e) => onEdit({ narration: e.target.value })}
                rows={3}
                className={textareaClass}
              />
            </Field>

            <div>
              <p className="mb-1.5 text-xs font-medium text-slate-400">Suno 스타일 태그</p>
              <div className="flex flex-wrap gap-1.5">
                {lyrics.sunoStyleTags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-full bg-indigo-500/15 px-2.5 py-1 text-xs text-indigo-200 ring-1 ring-indigo-400/30"
                  >
                    {t}
                    <button
                      onClick={() => removeTag(t)}
                      className="text-indigo-300/70 hover:text-white"
                      aria-label="삭제"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  placeholder="+ 태그 추가"
                  className="w-24 rounded-full border border-white/10 bg-ink-900/60 px-2.5 py-1 text-xs text-slate-200 outline-none focus:border-sky-400/50"
                />
              </div>
            </div>

            <Field label="영상 생성 프롬프트 (EN)">
              <textarea
                value={lyrics.videoPrompt}
                onChange={(e) => onEdit({ videoPrompt: e.target.value })}
                rows={3}
                className={cn(textareaClass, "text-[13px] text-slate-300")}
              />
            </Field>

            <Field label="썸네일 메인 텍스트">
              <textarea
                value={lyrics.thumbnailText}
                onChange={(e) => onEdit({ thumbnailText: e.target.value })}
                rows={2}
                className={textareaClass}
              />
            </Field>

            <Button variant="subtle" size="sm" onClick={downloadScript} className="w-full">
              ⬇ 대본 다운로드 (.txt)
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
