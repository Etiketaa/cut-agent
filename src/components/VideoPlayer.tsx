import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, Maximize2, Split, ZoomIn } from 'lucide-react';
import { CaptionSegment, VideoClip } from '../types/editor';

interface VideoPlayerProps {
  videoUrl: string;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  format: '16:9' | '9:16';
  activeClips: VideoClip[];
  captions: CaptionSegment[];
  onTimeUpdate: (time: number) => void;
  onTogglePlay: () => void;
  onSplitAtCurrentTime: () => void;
  onTogglePunchInForCurrentClip: () => void;
  playbackRate: number;
  onChangePlaybackRate: (rate: number) => void;
  skipSilencesMode: boolean;
  onToggleSkipSilences: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  currentTime,
  duration,
  isPlaying,
  format,
  activeClips,
  captions,
  onTimeUpdate,
  onTogglePlay,
  onSplitAtCurrentTime,
  onTogglePunchInForCurrentClip,
  playbackRate,
  onChangePlaybackRate,
  skipSilencesMode,
  onToggleSkipSilences,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);

  // Identify current clip under playhead
  const currentClip = activeClips.find(c => currentTime >= c.start && currentTime <= c.end);
  const isPunchIn = currentClip?.hasZoomPunchIn;
  const isCurrentSilence = currentClip?.isSilence;

  // Identify active caption under playhead
  const activeCaption = captions.find(c => currentTime >= c.start && currentTime <= c.end);

  // Sync video element time and playing state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Math.abs(video.currentTime - currentTime) > 0.3) {
      video.currentTime = currentTime;
    }
  }, [currentTime]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying && video.paused) {
      video.play().catch(e => console.warn('Autoplay prevented:', e));
    } else if (!isPlaying && !video.paused) {
      video.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Video time update event
  const handleNativeTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    const t = video.currentTime;
    onTimeUpdate(t);

    // If skip silences is ON and we hit a silence segment, automatically skip to next clip start!
    if (skipSilencesMode && activeClips.length > 0) {
      const silenceHit = activeClips.find(c => c.isSilence && t >= c.start && t < c.end);
      if (silenceHit) {
        // Find next non-silence clip
        const nextClip = activeClips.find(c => !c.isSilence && c.start >= silenceHit.end);
        if (nextClip) {
          video.currentTime = nextClip.start;
          onTimeUpdate(nextClip.start);
        }
      }
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    onTimeUpdate(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const jump = (delta: number) => {
    const video = videoRef.current;
    if (!video) return;
    const target = Math.max(0, Math.min(duration, video.currentTime + delta));
    video.currentTime = target;
    onTimeUpdate(target);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${ms}`;
  };

  return (
    <div ref={containerRef} className="flex flex-col bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Video Viewport Area */}
      <div className="relative w-full bg-black flex items-center justify-center overflow-hidden min-h-[360px] md:min-h-[460px] max-h-[580px]">
        {/* Blurred backdrop for 9:16 mode on widescreen screens */}
        {format === '9:16' && (
          <div className="absolute inset-0 overflow-hidden opacity-30 blur-2xl pointer-events-none scale-125">
            <video
              src={videoUrl}
              className="w-full h-full object-cover"
              muted
              playsInline
            />
          </div>
        )}

        {/* Framing Container */}
        <div
          className={`relative transition-all duration-300 overflow-hidden flex items-center justify-center ${
            format === '9:16'
              ? 'h-full aspect-[9/16] max-w-[340px] md:max-w-[380px] shadow-2xl border-x border-neutral-800/80 bg-black'
              : 'w-full aspect-[16/9] max-w-4xl'
          }`}
        >
          {/* Main Video Element with Zoom Punch-in transition */}
          <video
            ref={videoRef}
            src={videoUrl}
            onTimeUpdate={handleNativeTimeUpdate}
            onEnded={() => onTogglePlay()}
            playsInline
            muted={isMuted}
            className={`w-full h-full object-cover transition-transform duration-200 ease-out ${
              isPunchIn ? 'scale-[1.25]' : 'scale-100'
            }`}
          />

          {/* Visual Punch-in Indicator Pill */}
          {isPunchIn && (
            <div className="absolute top-4 right-4 bg-amber-500/90 text-neutral-950 text-[10px] font-bold tracking-wider px-2 py-0.5 rounded shadow flex items-center gap-1 uppercase">
              <ZoomIn className="w-3 h-3" />
              <span>Punch-in 1.25x</span>
            </div>
          )}

          {/* Silence detected warning on frame */}
          {isCurrentSilence && (
            <div className="absolute top-4 left-4 bg-red-500/90 text-white text-[10px] font-bold tracking-wider px-2 py-0.5 rounded shadow uppercase">
              Silencio detectado (Pausa)
            </div>
          )}

          {/* Animated Hormozi / CapCut Style Subtitles Overlay */}
          {activeCaption && (
            <div className="absolute bottom-12 inset-x-4 flex justify-center items-center pointer-events-none z-20">
              <div className="bg-black/75 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/10 shadow-2xl text-center transform scale-100 transition-transform animate-in fade-in zoom-in-95 duration-100">
                <span className="text-xl md:text-2xl font-extrabold tracking-tight text-white uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                  {activeCaption.text.split(' ').map((word, i) => {
                    const isHighlight =
                      activeCaption.highlightWord &&
                      word.toUpperCase().includes(activeCaption.highlightWord.toUpperCase());
                    return (
                      <span
                        key={i}
                        className={isHighlight ? 'text-amber-400 font-black drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]' : ''}
                      >
                        {word}{' '}
                      </span>
                    );
                  })}
                  {activeCaption.emoji && <span className="ml-1 text-2xl">{activeCaption.emoji}</span>}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scrub Bar & Controls Panel */}
      <div className="p-4 bg-neutral-950 border-t border-neutral-800 space-y-3">
        {/* Scrubber Range */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-cyan-400 w-16 text-right tabular-nums">
            {formatTime(currentTime)}
          </span>
          <div className="relative flex-1 group py-1">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.05}
              value={currentTime}
              onChange={handleSeekChange}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:h-2 transition-all"
            />
          </div>
          <span className="text-xs font-mono text-neutral-400 w-16 tabular-nums">
            {formatTime(duration)}
          </span>
        </div>

        {/* Buttons Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: Playback Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => jump(-5)}
              title="Retroceder 5s"
              className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={onTogglePlay}
              className="w-9 h-9 rounded-full bg-cyan-400 hover:bg-cyan-300 text-neutral-950 flex items-center justify-center font-bold shadow-lg transition-transform active:scale-95"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 translate-x-0.5" />}
            </button>

            <button
              onClick={() => jump(5)}
              title="Avanzar 5s"
              className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <div className="h-4 w-[1px] bg-neutral-800 mx-1" />

            {/* Audio Volume */}
            <button
              onClick={toggleMute}
              className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setVolume(v);
                setIsMuted(v === 0);
                if (videoRef.current) {
                  videoRef.current.volume = v;
                  videoRef.current.muted = v === 0;
                }
              }}
              className="w-16 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Center: Editing Tools */}
          <div className="flex items-center gap-2">
            <button
              onClick={onSplitAtCurrentTime}
              title="Dividir clip en el tiempo actual (Atajo: S)"
              className="px-2.5 py-1 text-xs font-semibold text-neutral-200 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded flex items-center gap-1.5 transition-colors"
            >
              <Split className="w-3.5 h-3.5 text-cyan-400" />
              <span>Dividir (S)</span>
            </button>

            <button
              onClick={onTogglePunchInForCurrentClip}
              title="Alternar Zoom Punch-in 1.25x en este fragmento"
              className={`px-2.5 py-1 text-xs font-semibold rounded flex items-center gap-1.5 border transition-colors ${
                isPunchIn
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'
              }`}
            >
              <ZoomIn className="w-3.5 h-3.5" />
              <span>Punch-in {isPunchIn ? 'Activo' : ''}</span>
            </button>

            <button
              onClick={onToggleSkipSilences}
              title="Saltear automáticamente silencios al reproducir"
              className={`px-2.5 py-1 text-xs font-semibold rounded border transition-colors ${
                skipSilencesMode
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:bg-neutral-700'
              }`}
            >
              <span>Auto-saltar Pausas {skipSilencesMode ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          {/* Right: Speed & Fullscreen */}
          <div className="flex items-center gap-2">
            <select
              value={playbackRate}
              onChange={(e) => onChangePlaybackRate(parseFloat(e.target.value))}
              className="bg-neutral-800 text-neutral-300 text-xs font-mono px-2 py-1 rounded border border-neutral-700 focus:outline-none focus:border-cyan-400"
            >
              <option value={1}>1.0x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2.0x</option>
            </select>

            <button
              onClick={toggleFullscreen}
              title="Pantalla Completa"
              className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
