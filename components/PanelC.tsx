"use client";

import { LyricsResult, WeatherData, SongCandidate, VideoJob, Persona } from "@/lib/types";
import { Button, Card, PanelHeader, StatusBadge, Status, cn } from "@/components/ui";
import { AudioPlayer } from "@/components/AudioPlayer";
import { VideoPreview, VideoStatus } from "@/components/VideoPreview";
import { Thumbnail } from "@/components/Thumbnail";

function SectionLabel({ icon, title, right }: { icon: string; title: string; right?: React.ReactNode }) {
  return (
    <div className="mb-2.5 flex items-center justify-between">
      <h3 className="flex items-center gap-2 text-sm font-bold text-white">
        <span>{icon}</span>
        {title}
      </h3>
      {right}
    </div>
  );
}

export function PanelC({
  lyrics,
  weather,
  persona,
  songs,
  songsStatus,
  selectedSongId,
  onGenerateSongs,
  onSelectSong,
  video,
  videoStatus,
  onRenderVideo,
}: {
  lyrics: LyricsResult | null;
  weather: WeatherData | null;
  persona: Persona;
  songs: SongCandidate[];
  songsStatus: Status;
  selectedSongId: string | null;
  onGenerateSongs: () => void;
  onSelectSong: (id: string) => void;
  video: VideoJob | null;
  videoStatus: VideoStatus;
  onRenderVideo: () => void;
}) {
  const selectedSong = songs.find((s) => s.id === selectedSongId) ?? null;
  const videoBusy = videoStatus === "planning" || videoStatus === "rendering";

  const mediaStatus: Status =
    videoStatus === "done"
      ? "done"
      : videoBusy || songsStatus === "loading"
        ? "loading"
        : "idle";

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <PanelHeader
        step={3}
        title="미디어 생성 · 발행"
        subtitle="Suno 음원 · 영상 · 썸네일"
        right={<StatusBadge status={mediaStatus} idleLabel="대기" />}
      />
      <div className="flex-1 space-y-6 overflow-y-auto p-5">
        {/* ── Suno 음원 ── */}
        <section>
          <SectionLabel
            icon="🎵"
            title="Suno 음원"
            right={
              <Button
                size="sm"
                onClick={onGenerateSongs}
                disabled={!lyrics}
                loading={songsStatus === "loading"}
              >
                {songs.length ? "↻ 재생성" : "후보곡 생성"}
              </Button>
            }
          />
          {songsStatus === "loading" && (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-white/[0.06]" />
              ))}
            </div>
          )}
          {songsStatus !== "loading" && songs.length === 0 && (
            <p className="rounded-lg border border-dashed border-white/10 px-3 py-4 text-center text-xs text-slate-500">
              {lyrics ? "후보곡 2~3개를 생성하고 1곡을 선택하세요." : "먼저 ② 가사를 생성하세요."}
            </p>
          )}
          {songs.length > 0 && (
            <div className="space-y-2">
              {songs.map((s) => (
                <AudioPlayer
                  key={s.id}
                  song={s}
                  selected={s.id === selectedSongId}
                  onSelect={onSelectSong}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── 영상 ── */}
        <section>
          <SectionLabel
            icon="🎬"
            title="영상 (OmniHuman · Seedance)"
            right={
              <Button
                size="sm"
                onClick={onRenderVideo}
                disabled={!selectedSong}
                loading={videoBusy}
              >
                {video ? "↻ 재렌더" : "영상 생성"}
              </Button>
            }
          />
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
            <span className="text-lg">{persona.emoji}</span>
            <div className="min-w-0 text-xs">
              <span className="font-semibold text-white">{persona.name}</span>
              <span className="text-slate-400"> · {persona.role}</span>
            </div>
            <span className="ml-auto rounded bg-white/10 px-2 py-0.5 text-[10px] text-slate-300">
              립싱크 + 모션
            </span>
          </div>
          <VideoPreview
            status={videoStatus}
            job={video}
            persona={persona}
            weather={weather}
            songTitle={selectedSong?.title}
          />
        </section>

        {/* ── 썸네일 ── */}
        <section>
          <SectionLabel icon="🖼" title="썸네일 (실시간 렌더링)" />
          <Thumbnail text={lyrics?.thumbnailText ?? ""} weather={weather} persona={persona} />
        </section>

        {/* ── 패키징 / 발행 ── */}
        <section className="border-t border-white/10 pt-4">
          <SectionLabel icon="📦" title="패키징 · 발행" />
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="subtle"
              size="sm"
              disabled={videoStatus !== "done"}
              className="w-full"
            >
              🎞 영상 다운로드
            </Button>
            <Button variant="subtle" size="sm" disabled className="w-full">
              🚀 발행 연동
            </Button>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
            영상 다운로드·발행 연동은 실제 영상 API(OmniHuman/Seedance) 연결 후 활성화됩니다. 썸네일
            PNG와 대본(.txt)은 지금도 저장할 수 있습니다.
          </p>
        </section>
      </div>
    </Card>
  );
}
