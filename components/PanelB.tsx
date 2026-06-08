"use client";

import { useEffect, useRef, useState } from "react";
import { LyricsResult, WeatherData, Persona } from "@/lib/types";
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
  persona,
  onGenerate,
  onEdit,
}: {
  weather: WeatherData | null;
  lyrics: LyricsResult | null;
  lyricsStatus: Status;
  persona: Persona;
  onGenerate: () => void;
  onEdit: (patch: Partial<LyricsResult>) => void;
}) {
  const [tagInput, setTagInput] = useState("");
  const [styleView, setStyleView] = useState<"tags" | "prompt">("tags");
  const [promptDraft, setPromptDraft] = useState("");
  const [copied, setCopied] = useState(false);
  const [hashCopied, setHashCopied] = useState(false);
  // 내가 프롬프트를 파싱해 올린 변경인지 구분하는 시그니처 (외부 변경만 초안 재동기화)
  const lastSyncedRef = useRef("");

  // 외부에서 태그가 바뀌면(재생성·칩 편집) 프롬프트 초안을 다시 맞춤. 직접 타이핑한 변경은 건너뜀.
  useEffect(() => {
    const tags = lyrics?.sunoStyleTags ?? [];
    const key = tags.join("|");
    if (key !== lastSyncedRef.current) {
      setPromptDraft(tags.join(", "));
      lastSyncedRef.current = key;
    }
  }, [lyrics?.sunoStyleTags]);

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

  // 프롬프트(한 줄 텍스트) 편집 → 쉼표로 분리해 태그 배열로 동기화
  function onStylePromptChange(v: string) {
    if (!lyrics) return;
    setPromptDraft(v);
    const tags = Array.from(
      new Set(
        v
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      )
    );
    lastSyncedRef.current = tags.join("|"); // 내 변경 표시 → useEffect가 초안을 덮어쓰지 않음
    onEdit({ sunoStyleTags: tags });
  }

  async function copyStylePrompt() {
    try {
      await navigator.clipboard.writeText(promptDraft);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* 클립보드 권한 없을 때 무시 */
    }
  }

  async function copyHashtags() {
    if (!lyrics) return;
    try {
      await navigator.clipboard.writeText(lyrics.hashtags.join(" "));
      setHashCopied(true);
      setTimeout(() => setHashCopied(false), 1500);
    } catch {
      /* 무시 */
    }
  }

  function downloadScript() {
    if (!lyrics) return;
    const body =
      `# ${lyrics.title}\n\n` +
      `[오늘의 주인공]\n${persona.name} (${persona.nameEn}) — ${lyrics.castReason}\n\n` +
      `[SUNO Style of Music]\n${lyrics.sunoStyleTags.join(", ")}\n\n` +
      `[가사]\n${lyrics.lyrics}\n\n` +
      `[나레이션]\n${lyrics.narration}\n\n` +
      `[AI 이미지 프롬프트]\n${lyrics.imagePrompt}\n\n` +
      `[영상 프롬프트]\n${lyrics.videoPrompt}\n\n` +
      `[썸네일 텍스트]\n${lyrics.thumbnailText}\n\n` +
      `[소셜 자막]\n${lyrics.socialCaption}\n\n` +
      `[해시태그]\n${lyrics.hashtags.join(" ")}\n`;
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
        right={
          <div className="flex items-center gap-2">
            {lyrics && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1",
                  lyrics.source === "gemini"
                    ? "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30"
                    : "bg-rose-500/15 text-rose-300 ring-rose-400/30"
                )}
              >
                {lyrics.source === "gemini" ? "✨ Gemini 실연동" : "목업"}
              </span>
            )}
            <StatusBadge status={lyricsStatus} idleLabel="미생성" />
          </div>
        }
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
            {lyrics.castReason && (
              <div
                className="flex items-start gap-2 rounded-xl border px-3 py-2.5"
                style={{ borderColor: `${persona.accent}55`, background: `${persona.accent}14` }}
              >
                <span className="text-lg leading-none">{persona.emoji}</span>
                <p className="text-xs leading-relaxed text-slate-200">
                  <b style={{ color: persona.accent }}>오늘의 주인공 · {persona.name}</b>
                  <span className="text-slate-400"> ({persona.nameEn})</span>
                  <br />
                  {lyrics.castReason}
                </p>
              </div>
            )}

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
              <div className="mb-1.5 flex items-center justify-between">
                <p className="text-xs font-medium text-slate-400">Suno 스타일</p>
                <div className="flex overflow-hidden rounded-lg border border-white/10 text-[10px]">
                  {(["tags", "prompt"] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setStyleView(v)}
                      className={cn(
                        "px-2 py-0.5 font-medium transition",
                        styleView === v
                          ? "bg-indigo-500/30 text-indigo-200"
                          : "text-slate-400 hover:bg-white/5"
                      )}
                    >
                      {v === "tags" ? "태그" : "프롬프트"}
                    </button>
                  ))}
                </div>
              </div>

              {styleView === "tags" ? (
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
              ) : (
                <div>
                  <textarea
                    value={promptDraft}
                    onChange={(e) => onStylePromptChange(e.target.value)}
                    rows={3}
                    placeholder="예: Upbeat K-pop, bright synth, female vocal, 128 BPM"
                    className={cn(textareaClass, "text-[13px]")}
                  />
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-500">
                      쉼표로 구분 · Suno의 Style 칸에 붙여넣기
                    </span>
                    <button
                      onClick={copyStylePrompt}
                      className="shrink-0 rounded-lg border border-white/10 px-2.5 py-1 text-[11px] text-slate-200 transition hover:bg-white/5"
                    >
                      {copied ? "✓ 복사됨" : "📋 프롬프트 복사"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <Field label="AI 이미지 프롬프트 (9:16, EN)">
              <textarea
                value={lyrics.imagePrompt}
                onChange={(e) => onEdit({ imagePrompt: e.target.value })}
                rows={3}
                className={cn(textareaClass, "text-[13px] text-slate-300")}
              />
            </Field>

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

            <Field label="소셜 자막 (캡션)">
              <textarea
                value={lyrics.socialCaption}
                onChange={(e) => onEdit({ socialCaption: e.target.value })}
                rows={2}
                className={textareaClass}
              />
            </Field>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <p className="text-xs font-medium text-slate-400">추천 해시태그</p>
                {lyrics.hashtags.length > 0 && (
                  <button
                    onClick={copyHashtags}
                    className="rounded-lg border border-white/10 px-2.5 py-1 text-[11px] text-slate-200 transition hover:bg-white/5"
                  >
                    {hashCopied ? "✓ 복사됨" : "📋 복사"}
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {lyrics.hashtags.length === 0 ? (
                  <span className="text-[11px] text-slate-500">생성된 해시태그가 없습니다.</span>
                ) : (
                  lyrics.hashtags.map((h) => (
                    <span
                      key={h}
                      className="rounded-full bg-sky-500/15 px-2.5 py-1 text-xs text-sky-200 ring-1 ring-sky-400/30"
                    >
                      {h}
                    </span>
                  ))
                )}
              </div>
            </div>

            <Button variant="subtle" size="sm" onClick={downloadScript} className="w-full">
              ⬇ 대본 다운로드 (.txt)
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
