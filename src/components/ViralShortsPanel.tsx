import React, { useState } from 'react';
import { Sparkles, Play, Scissors, Download, Hash, Video, Volume2, ArrowRight } from 'lucide-react';
import { ViralClipSuggestion } from '../types/editor';

interface ViralShortsPanelProps {
  viralClips: ViralClipSuggestion[];
  isScanning: boolean;
  onScanVirality: () => void;
  onPreviewClip: (start: number, end: number) => void;
  onApplyClipToTimeline: (clip: ViralClipSuggestion) => void;
  onExportClipToCapCut: (clip: ViralClipSuggestion) => void;
}

export const ViralShortsPanel: React.FC<ViralShortsPanelProps> = ({
  viralClips,
  isScanning,
  onScanVirality,
  onPreviewClip,
  onApplyClipToTimeline,
  onExportClipToCapCut,
}) => {
  const [selectedClipIndex, setSelectedClipIndex] = useState<number>(0);

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl flex flex-col h-full">
      {/* Panel Header */}
      <div className="px-5 py-4 bg-neutral-950/70 border-b border-neutral-800 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Escáner de Clips Virales (Shorts / Reels)</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Detecta automáticamente los momentos con mayor gancho y retención para TikTok y Shorts.
          </p>
        </div>

        <button
          onClick={onScanVirality}
          disabled={isScanning}
          className="px-3 py-1.5 text-xs font-semibold text-neutral-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 rounded-md transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isScanning ? 'Escaneando con IA...' : 'Re-escanear Video'}</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="p-4 flex-1 overflow-y-auto space-y-3">
        {viralClips.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center mx-auto text-neutral-400">
              <Sparkles className="w-6 h-6 text-amber-400" />
            </div>
            <div className="max-w-xs mx-auto">
              <p className="text-sm font-medium text-neutral-200">No hay clips escaneados aún</p>
              <p className="text-xs text-neutral-400 mt-1">
                Haz clic en el botón para que el agente examine la transcripción y detecte los ganchos virales.
              </p>
            </div>
            <button
              onClick={onScanVirality}
              disabled={isScanning}
              className="mt-2 px-4 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-md"
            >
              {isScanning ? 'Analizando...' : 'Escanear Ahora'}
            </button>
          </div>
        ) : (
          viralClips.map((clip, idx) => {
            const durationSec = clip.end - clip.start;
            const isSelected = selectedClipIndex === idx;

            return (
              <div
                key={idx}
                onClick={() => setSelectedClipIndex(idx)}
                className={`p-4 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-neutral-800/90 border-cyan-500/60 shadow-lg'
                    : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                {/* Top row: Title and Hook Score */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-cyan-400 font-bold">
                        Clip #{idx + 1}
                      </span>
                      <span className="text-xs text-neutral-500 font-mono">
                        {formatSeconds(clip.start)} - {formatSeconds(clip.end)} ({durationSec.toFixed(0)}s)
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-white mt-1">
                      {clip.title}
                    </h3>
                  </div>

                  {/* Hook score badge */}
                  <div className="text-right shrink-0">
                    <span className="inline-block px-2 py-0.5 text-xs font-mono font-bold rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Gancho {clip.hookScore}%
                    </span>
                  </div>
                </div>

                {/* Hook phrase */}
                <div className="mt-2.5 p-2 rounded bg-neutral-900/90 border border-neutral-800/80 text-xs">
                  <span className="text-neutral-400 block text-[10px] font-mono uppercase tracking-wider mb-0.5">
                    Gancho de los primeros 3 segundos:
                  </span>
                  <p className="font-medium text-neutral-200 italic">
                    "{clip.hook}"
                  </p>
                </div>

                {/* Viral premise */}
                <p className="text-xs text-neutral-400 mt-2">
                  <strong className="text-neutral-300">Por qué funciona: </strong>
                  {clip.viralReason}
                </p>

                {/* CapCut Cues: B-Roll & SFX */}
                {(clip.brollPrompt || clip.soundEffect) && (
                  <div className="mt-3 pt-2.5 border-t border-neutral-800/80 flex flex-wrap gap-3 text-[11px] text-neutral-400 font-mono">
                    {clip.brollPrompt && (
                      <div className="flex items-center gap-1.5 text-neutral-300">
                        <Video className="w-3 h-3 text-cyan-400" />
                        <span>B-Roll: {clip.brollPrompt}</span>
                      </div>
                    )}
                    {clip.soundEffect && (
                      <div className="flex items-center gap-1.5 text-neutral-300">
                        <Volume2 className="w-3 h-3 text-amber-400" />
                        <span>SFX: {clip.soundEffect}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Hashtags */}
                {clip.hashtags && clip.hashtags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] text-neutral-500 font-mono">
                    {clip.hashtags.map((h, i) => (
                      <span key={i}>#{h.replace(/^#/, '')}</span>
                    ))}
                  </div>
                )}

                {/* Actions row */}
                <div className="mt-3 pt-3 border-t border-neutral-800 flex items-center justify-end gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPreviewClip(clip.start, clip.end);
                    }}
                    className="px-2.5 py-1 text-xs font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 rounded flex items-center gap-1 transition-colors"
                  >
                    <Play className="w-3 h-3" />
                    <span>Previsualizar</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onApplyClipToTimeline(clip);
                    }}
                    className="px-2.5 py-1 text-xs font-semibold text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 rounded flex items-center gap-1 transition-colors"
                  >
                    <Scissors className="w-3 h-3" />
                    <span>Recortar Timeline</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onExportClipToCapCut(clip);
                    }}
                    className="px-2.5 py-1 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded flex items-center gap-1 transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    <span>A CapCut</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
