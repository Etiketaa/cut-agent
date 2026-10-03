import React, { useRef } from 'react';
import { Scissors, Trash2, ZoomIn, Sparkles, VolumeX, Plus } from 'lucide-react';
import { VideoClip, CaptionSegment } from '../types/editor';

interface TimelineProps {
  duration: number;
  currentTime: number;
  clips: VideoClip[];
  captions: CaptionSegment[];
  selectedClipId: string | null;
  onSelectClip: (clipId: string | null) => void;
  onSeek: (time: number) => void;
  onSplitClip: (clipId: string, time: number) => void;
  onDeleteClip: (clipId: string) => void;
  onTogglePunchIn: (clipId: string) => void;
  onRemoveAllSilences: () => void;
  timelineZoom: number;
  setTimelineZoom: (zoom: number) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  duration,
  currentTime,
  clips,
  captions,
  selectedClipId,
  onSelectClip,
  onSeek,
  onDeleteClip,
  onTogglePunchIn,
  onRemoveAllSilences,
  timelineZoom,
  setTimelineZoom,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);

  // Compute total duration of video
  const totalDuration = duration > 0 ? duration : 30;

  // Handle click on timeline ruler/track to seek
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left + trackRef.current.scrollLeft;
    const trackWidth = trackRef.current.scrollWidth;
    const clickPercent = Math.max(0, Math.min(1, clickX / trackWidth));
    const targetTime = clickPercent * totalDuration;
    onSeek(targetTime);
  };

  const selectedClip = clips.find(c => c.id === selectedClipId);
  const silenceCount = clips.filter(c => c.isSilence).length;

  // Format seconds to mm:ss
  const formatRulerTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  // Generate tick markers
  const tickInterval = totalDuration > 60 ? 10 : 2;
  const tickCount = Math.floor(totalDuration / tickInterval);
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => i * tickInterval);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl flex flex-col">
      {/* Timeline Header Toolbar */}
      <div className="px-4 py-2.5 bg-neutral-950/70 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Línea de Tiempo Multitrack
          </span>
          <span className="text-xs text-neutral-500 font-mono">
            {clips.length} cortes · {captions.length} subtítulos
          </span>
        </div>

        {/* Selected Clip Actions */}
        <div className="flex items-center gap-2">
          {silenceCount > 0 && (
            <button
              onClick={onRemoveAllSilences}
              className="px-2.5 py-1 text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded flex items-center gap-1.5 transition-colors"
            >
              <VolumeX className="w-3.5 h-3.5" />
              <span>Quitar {silenceCount} silencios</span>
            </button>
          )}

          {selectedClip && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-neutral-800">
              <span className="text-xs text-neutral-400 font-mono">
                {selectedClip.label} ({Math.max(0, selectedClip.end - selectedClip.start).toFixed(1)}s)
              </span>

              <button
                onClick={() => onTogglePunchIn(selectedClip.id)}
                title="Zoom Punch-in en este fragmento"
                className={`px-2 py-0.5 text-xs font-medium rounded border transition-colors ${
                  selectedClip.hasZoomPunchIn
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'
                }`}
              >
                <ZoomIn className="w-3 h-3 inline mr-1" />
                Punch-in
              </button>

              <button
                onClick={() => onDeleteClip(selectedClip.id)}
                title="Eliminar este clip"
                className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Timeline Zoom Slider */}
          <div className="flex items-center gap-2 pl-3 border-l border-neutral-800">
            <span className="text-[11px] text-neutral-500 font-mono">Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.5}
              value={timelineZoom}
              onChange={(e) => setTimelineZoom(parseFloat(e.target.value))}
              className="w-16 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </div>
      </div>

      {/* Timeline Scrollable Canvas Container */}
      <div
        ref={trackRef}
        onClick={handleTimelineClick}
        className="relative w-full overflow-x-auto overflow-y-hidden bg-neutral-950 p-4 select-none cursor-pointer min-h-[160px]"
      >
        <div
          className="relative h-full transition-all"
          style={{ width: `${100 * timelineZoom}%`, minWidth: '100%' }}
        >
          {/* Time Ruler */}
          <div className="relative h-6 border-b border-neutral-800 flex items-end pb-1 text-[10px] text-neutral-500 font-mono">
            {ticks.map((t) => {
              const leftPercent = (t / totalDuration) * 100;
              return (
                <div
                  key={t}
                  className="absolute flex flex-col items-center -translate-x-1/2"
                  style={{ left: `${leftPercent}%` }}
                >
                  <span>{formatRulerTime(t)}</span>
                  <div className="w-[1px] h-1.5 bg-neutral-700" />
                </div>
              );
            })}
          </div>

          {/* Track 1: Video Clips */}
          <div className="relative mt-3 h-14 bg-neutral-900/60 rounded-md border border-neutral-800 overflow-hidden flex items-center p-1 gap-1">
            <div className="absolute left-2 text-[10px] text-neutral-600 font-mono uppercase tracking-wider pointer-events-none z-0">
              Pista Video 1
            </div>

            {clips.map((clip) => {
              const clipDur = clip.end - clip.start;
              const widthPct = (clipDur / totalDuration) * 100;
              const leftPct = (clip.start / totalDuration) * 100;
              const isSelected = clip.id === selectedClipId;

              if (clip.isSilence) {
                return (
                  <div
                    key={clip.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectClip(clip.id);
                    }}
                    className={`absolute top-1 bottom-1 rounded border border-dashed flex flex-col items-center justify-center transition-all z-10 ${
                      isSelected
                        ? 'bg-red-500/30 border-red-400'
                        : 'bg-red-950/40 border-red-800/80 hover:bg-red-900/40'
                    }`}
                    style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                    title={`Pausa / Silencio: ${clipDur.toFixed(1)}s`}
                  >
                    <VolumeX className="w-3 h-3 text-red-400" />
                    <span className="text-[9px] font-mono text-red-300 truncate max-w-full px-1">
                      Pausa {clipDur.toFixed(1)}s
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={clip.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectClip(clip.id);
                    onSeek(clip.start);
                  }}
                  className={`absolute top-1 bottom-1 rounded border flex flex-col justify-between p-1.5 transition-all z-10 cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-950/80 border-cyan-400 ring-1 ring-cyan-400 shadow-md'
                      : 'bg-neutral-800/90 border-neutral-700 hover:border-neutral-500'
                  }`}
                  style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                >
                  <div className="flex items-center justify-between gap-1 overflow-hidden">
                    <span className="text-[11px] font-medium text-white truncate">
                      {clip.label}
                    </span>
                    {clip.hasZoomPunchIn && (
                      <span className="shrink-0 text-[8px] bg-amber-500/20 text-amber-300 px-1 py-0.5 rounded font-mono font-bold">
                        1.25x
                      </span>
                    )}
                  </div>
                  <div className="text-[9px] text-neutral-400 font-mono">
                    {clipDur.toFixed(1)}s
                  </div>
                </div>
              );
            })}
          </div>

          {/* Track 2: Subtitles / Captions */}
          <div className="relative mt-2 h-9 bg-neutral-900/40 rounded-md border border-neutral-800/80 overflow-hidden flex items-center p-1">
            <div className="absolute left-2 text-[10px] text-neutral-600 font-mono uppercase tracking-wider pointer-events-none z-0">
              Subtítulos
            </div>

            {captions.map((cap) => {
              const capDur = cap.end - cap.start;
              const widthPct = (capDur / totalDuration) * 100;
              const leftPct = (cap.start / totalDuration) * 100;

              return (
                <div
                  key={cap.id}
                  className="absolute top-1 bottom-1 bg-amber-500/15 border border-amber-500/30 rounded px-1.5 flex items-center overflow-hidden hover:bg-amber-500/25 transition-colors z-10"
                  style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                  title={cap.text}
                >
                  <span className="text-[10px] font-mono text-amber-300 truncate">
                    {cap.emoji} {cap.text}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Playhead Vertical Line */}
          <div
            className="absolute top-0 bottom-0 w-[2px] bg-cyan-400 pointer-events-none z-30 flex flex-col items-center"
            style={{ left: `${(currentTime / totalDuration) * 100}%` }}
          >
            {/* Playhead Handle */}
            <div className="w-3.5 h-3.5 -mt-1 bg-cyan-400 rotate-45 rounded-sm shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
          </div>
        </div>
      </div>
    </div>
  );
};
