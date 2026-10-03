import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { VideoPlayer } from './components/VideoPlayer';
import { Timeline } from './components/Timeline';
import { ViralShortsPanel } from './components/ViralShortsPanel';
import { AgentChatDrawer } from './components/AgentChatDrawer';
import { CapCutExportModal } from './components/CapCutExportModal';
import { UploadModal } from './components/UploadModal';
import { CapCutGuideModal } from './components/CapCutGuideModal';
import { VideoProject, VideoClip, CaptionSegment, ViralClipSuggestion, AgentMessage } from './types/editor';
import { DEMO_PROJECTS } from './utils/demoVideos';
import { Sparkles, Scissors, Zap, Film, Download, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [project, setProject] = useState<VideoProject>(DEMO_PROJECTS[0]);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [timelineZoom, setTimelineZoom] = useState<number>(1);
  const [skipSilencesMode, setSkipSilencesMode] = useState<boolean>(true);

  // Active view: 'editor' | 'viral_scanner' | 'capcut_guide'
  const [activeView, setActiveView] = useState<'editor' | 'viral_scanner' | 'capcut_guide'>('editor');

  // Modals
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

  // Viral clips cache
  const [viralClips, setViralClips] = useState<ViralClipSuggestion[]>([]);
  const [isScanningVirality, setIsScanningVirality] = useState<boolean>(false);

  // Agent Chat state
  const [agentMessages, setAgentMessages] = useState<AgentMessage[]>([
    {
      id: 'msg-welcome',
      role: 'agent',
      content: `¡Hola! Soy CutAgent, tu editor y copiloto de CapCut. He cargado tu video "${DEMO_PROJECTS[0].title}".\n\nPuedo ayudarte a:
1. ✂️ Eliminar automáticamente pausas muertas y respiraciones.
2. 🔥 Encontrar los ganchos más virales para TikTok, Shorts y Reels.
3. 💾 Generar el archivo de borrador para abrir directamente en tu CapCut Desktop o renderizar el video aquí mismo.`,
      timestamp: 'Ahora',
      suggestedActions: [
        { id: 'act-1', label: '✂️ Eliminar Silencios (1-Clic)', type: 'CUT_SILENCES' },
        { id: 'act-2', label: '🔥 Escanear Clips Virales', type: 'SCAN_VIRALITY' },
        { id: 'act-3', label: '💾 Exportar a CapCut', type: 'EXPORT_CAPCUT' },
      ],
    },
  ]);
  const [isAgentThinking, setIsAgentThinking] = useState<boolean>(false);

  // Keyboard Shortcuts (Space: Play/Pause, S: Split, Del: Delete)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleSplitAtCurrentTime();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedClipId) {
          e.preventDefault();
          handleDeleteClip(selectedClipId);
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentTime((prev) => Math.max(0, prev - 2));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentTime((prev) => Math.min(project.duration, prev + 2));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedClipId, currentTime, project.duration, project.clips]);

  // Initial Scan Virality for Demo 1
  useEffect(() => {
    if (viralClips.length === 0) {
      setViralClips([
        {
          id: 'v1',
          title: 'El error del 90% de creadores en los primeros 3 segundos',
          start: 0.0,
          end: 8.5,
          hook: 'El 90% de los creadores cometen un error fatal en sus primeros 3 segundos...',
          hookScore: 97,
          viralReason: 'Detiene el scroll usando un porcentaje alto y una advertencia de error.',
          brollPrompt: 'Gráfico animado con flecha cayendo en picada y signo de exclamación.',
          soundEffect: 'Whoosh rápido + alerta de error',
          hashtags: ['creadores', 'capcut', 'viralvideo', 'marketingdigital'],
        },
        {
          id: 'v2',
          title: 'El truco de CapCut: Zoom Punch-In y cortes dinámicos',
          start: 10.2,
          end: 15.0,
          hook: 'En CapCut el truco está en cortar cada respiración y meter un punch-in...',
          hookScore: 92,
          viralReason: 'Consejo práctico y accionable de edición con demostración visual.',
          brollPrompt: 'Captura de pantalla de la interfaz de CapCut recortando la pista de audio.',
          soundEffect: 'Corte de tijeras + Pop sutil',
          hashtags: ['capcuttutorial', 'ediciondevideo', 'hacks', 'shorts'],
        },
      ]);
    }
  }, []);

  // Split active clip at playhead
  const handleSplitAtCurrentTime = useCallback(() => {
    const t = currentTime;
    setProject((prev) => {
      const clipIndex = prev.clips.findIndex((c) => t > c.start + 0.1 && t < c.end - 0.1);
      if (clipIndex === -1) return prev;

      const target = prev.clips[clipIndex];
      const part1: VideoClip = {
        ...target,
        id: `clip-${Date.now()}-1`,
        end: t,
        label: `${target.label} (Parte 1)`,
      };
      const part2: VideoClip = {
        ...target,
        id: `clip-${Date.now()}-2`,
        start: t,
        label: `${target.label} (Parte 2)`,
        hasZoomPunchIn: !target.hasZoomPunchIn, // alternate punch-in for dynamic pacing!
      };

      const newClips = [...prev.clips];
      newClips.splice(clipIndex, 1, part1, part2);
      return { ...prev, clips: newClips };
    });
  }, [currentTime]);

  // Delete clip
  const handleDeleteClip = (clipId: string) => {
    setProject((prev) => ({
      ...prev,
      clips: prev.clips.filter((c) => c.id !== clipId),
    }));
    if (selectedClipId === clipId) {
      setSelectedClipId(null);
    }
  };

  // Toggle Zoom Punch-in on a clip
  const handleTogglePunchIn = (clipId: string) => {
    setProject((prev) => ({
      ...prev,
      clips: prev.clips.map((c) =>
        c.id === clipId ? { ...c, hasZoomPunchIn: !c.hasZoomPunchIn } : c
      ),
    }));
  };

  // Toggle Zoom Punch-in for current clip under playhead
  const handleTogglePunchInForCurrentClip = () => {
    const active = project.clips.find((c) => currentTime >= c.start && currentTime <= c.end);
    if (active) {
      handleTogglePunchIn(active.id);
    }
  };

  // 1-Click Remove All Silences
  const handleRemoveAllSilences = () => {
    const silences = project.clips.filter((c) => c.isSilence);
    if (silences.length === 0) {
      alert('No se detectaron silencios pendientes en este video.');
      return;
    }

    setProject((prev) => ({
      ...prev,
      clips: prev.clips.filter((c) => !c.isSilence),
    }));

    // Add agent notification
    const timeSaved = silences.reduce((acc, s) => acc + (s.end - s.start), 0);
    setAgentMessages((prev) => [
      ...prev,
      {
        id: `msg-silence-${Date.now()}`,
        role: 'agent',
        content: `✂️ ¡Listo! He eliminado ${silences.length} pausas y silencios muertos. Tu video es ahora ${timeSaved.toFixed(1)} segundos más dinámico y retentivo.`,
        timestamp: 'Ahora',
        suggestedActions: [
          { id: 'act-capcut', label: '💾 Exportar Borrador a CapCut', type: 'EXPORT_CAPCUT' },
        ],
      },
    ]);
  };

  // Toggle Format (16:9 vs 9:16)
  const handleToggleFormat = () => {
    const nextFormat = project.format === '9:16' ? '16:9' : '9:16';
    setProject((prev) => ({ ...prev, format: nextFormat }));
  };

  // Trigger Gemini Viral Scanner
  const handleScanVirality = async () => {
    setIsScanningVirality(true);
    try {
      const res = await fetch('/api/agent/analyze-virality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: project.title,
          duration: project.duration,
          transcript: project.transcript,
          clips: project.clips,
        }),
      });

      const data = await res.json();
      if (data.viralClips && data.viralClips.length > 0) {
        setViralClips(data.viralClips);
        setActiveView('viral_scanner');
        setAgentMessages((prev) => [
          ...prev,
          {
            id: `msg-scan-${Date.now()}`,
            role: 'agent',
            content: `🔥 He escaneado tu video y encontré ${data.viralClips.length} ganchos virales con alto potencial de retención para TikTok y Shorts. Puedes verlos en la pestaña "Escáner Viral".`,
            timestamp: 'Ahora',
          },
        ]);
      }
    } catch (err) {
      console.error('Virality scan error:', err);
    } finally {
      setIsScanningVirality(false);
    }
  };

  // Apply viral clip to timeline
  const handleApplyViralClipToTimeline = (clip: ViralClipSuggestion) => {
    setProject((prev) => ({
      ...prev,
      format: '9:16', // Switch to vertical for short
      clips: [
        {
          id: `viral-clip-${Date.now()}-1`,
          start: clip.start,
          end: clip.start + (clip.end - clip.start) * 0.4,
          label: `Gancho: ${clip.hook.slice(0, 24)}...`,
          hasZoomPunchIn: true,
        },
        {
          id: `viral-clip-${Date.now()}-2`,
          start: clip.start + (clip.end - clip.start) * 0.4,
          end: clip.end,
          label: clip.title,
          hasZoomPunchIn: false,
        },
      ],
    }));
    setCurrentTime(clip.start);
    setActiveView('editor');

    setAgentMessages((prev) => [
      ...prev,
      {
        id: `msg-applied-${Date.now()}`,
        role: 'agent',
        content: `🎯 He ajustado tu línea de tiempo exclusivamente al clip "${clip.title}" (${(clip.end - clip.start).toFixed(0)}s) en formato 9:16 vertical con Zoom Punch-In en el gancho inicial.`,
        timestamp: 'Ahora',
        suggestedActions: [
          { id: 'act-export', label: '💾 Exportar este Short a CapCut', type: 'EXPORT_CAPCUT' },
        ],
      },
    ]);
  };

  // Preview clip segment
  const handlePreviewClip = (start: number, end: number) => {
    setCurrentTime(start);
    setIsPlaying(true);
    setActiveView('editor');
  };

  // Send message to Agent Copilot
  const handleSendAgentMessage = async (text: string) => {
    const userMsg: AgentMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: 'Ahora',
    };
    setAgentMessages((prev) => [...prev, userMsg]);
    setIsAgentThinking(true);

    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: agentMessages.slice(-5),
          currentVideo: project,
          clips: project.clips,
          format: project.format,
        }),
      });

      const data = await res.json();
      const replyMsg: AgentMessage = {
        id: `msg-agent-${Date.now()}`,
        role: 'agent',
        content: data.reply || 'He recibido tu solicitud y actualizado las sugerencias.',
        timestamp: 'Ahora',
        suggestedActions: data.suggestedActions,
        suggestedClips: data.suggestedClips,
      };

      setAgentMessages((prev) => [...prev, replyMsg]);
    } catch (err: any) {
      console.error('Agent chat error:', err);
      setAgentMessages((prev) => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          role: 'agent',
          content: 'Ocurrió un error al consultar con el modelo. Por favor intenta de nuevo.',
          timestamp: 'Ahora',
        },
      ]);
    } finally {
      setIsAgentThinking(false);
    }
  };

  // Execute Agent Action
  const handleExecuteAction = (type: string, payload?: any) => {
    switch (type) {
      case 'CUT_SILENCES':
        handleRemoveAllSilences();
        break;
      case 'SCAN_VIRALITY':
        handleScanVirality();
        break;
      case 'EXPORT_CAPCUT':
        setIsExportOpen(true);
        break;
      case 'SWITCH_FORMAT':
        handleToggleFormat();
        break;
      case 'SELECT_CLIP':
        if (payload?.start !== undefined) {
          handleApplyViralClipToTimeline(payload);
        } else {
          setActiveView('viral_scanner');
        }
        break;
      default:
        console.log('Action triggered:', type, payload);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {/* Top 3-Zone Header */}
      <Header
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenHelp={() => setIsGuideOpen(true)}
        format={project.format}
        onToggleFormat={handleToggleFormat}
      />

      {/* Main Studio Viewport */}
      <main className="flex-1 max-w-[1560px] w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Video Workspace or Active View (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col space-y-5">
          {activeView === 'editor' && (
            <>
              {/* Project Title Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                <div>
                  <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    <span>{project.title}</span>
                    {project.isCustomUpload && (
                      <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/30">
                        Archivo local
                      </span>
                    )}
                  </h1>
                  <p className="text-xs text-neutral-400 mt-0.5 font-mono">
                    Duración: {project.duration}s · {project.clips.filter((c) => !c.isSilence).length} clips activos · Formato {project.format}
                  </p>
                </div>

                {/* Quick Action Badges */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRemoveAllSilences}
                    className="px-2.5 py-1 text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded flex items-center gap-1.5 transition-colors"
                  >
                    <Scissors className="w-3.5 h-3.5" />
                    <span>Eliminar Silencios</span>
                  </button>

                  <button
                    onClick={handleScanVirality}
                    disabled={isScanningVirality}
                    className="px-2.5 py-1 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isScanningVirality ? 'Escaneando...' : 'Escanear Virales'}</span>
                  </button>
                </div>
              </div>

              {/* Video Player Canvas */}
              <VideoPlayer
                videoUrl={project.videoUrl}
                currentTime={currentTime}
                duration={project.duration}
                isPlaying={isPlaying}
                format={project.format}
                activeClips={project.clips}
                captions={project.captions}
                onTimeUpdate={setCurrentTime}
                onTogglePlay={() => setIsPlaying((p) => !p)}
                onSplitAtCurrentTime={handleSplitAtCurrentTime}
                onTogglePunchInForCurrentClip={handleTogglePunchInForCurrentClip}
                playbackRate={playbackRate}
                onChangePlaybackRate={setPlaybackRate}
                skipSilencesMode={skipSilencesMode}
                onToggleSkipSilences={() => setSkipSilencesMode((s) => !s)}
              />

              {/* Multitrack Timeline */}
              <Timeline
                duration={project.duration}
                currentTime={currentTime}
                clips={project.clips}
                captions={project.captions}
                selectedClipId={selectedClipId}
                onSelectClip={setSelectedClipId}
                onSeek={setCurrentTime}
                onSplitClip={(id, time) => handleSplitAtCurrentTime()}
                onDeleteClip={handleDeleteClip}
                onTogglePunchIn={handleTogglePunchIn}
                onRemoveAllSilences={handleRemoveAllSilences}
                timelineZoom={timelineZoom}
                setTimelineZoom={setTimelineZoom}
              />
            </>
          )}

          {activeView === 'viral_scanner' && (
            <ViralShortsPanel
              viralClips={viralClips}
              isScanning={isScanningVirality}
              onScanVirality={handleScanVirality}
              onPreviewClip={handlePreviewClip}
              onApplyClipToTimeline={handleApplyViralClipToTimeline}
              onExportClipToCapCut={(clip) => {
                handleApplyViralClipToTimeline(clip);
                setIsExportOpen(true);
              }}
            />
          )}

          {activeView === 'capcut_guide' && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                <div className="flex items-center gap-2">
                  <Film className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-base font-bold text-white">Guía de Flujo de Trabajo con CapCut</h2>
                </div>
                <button
                  onClick={() => setActiveView('editor')}
                  className="px-3 py-1.5 text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-white rounded transition-colors"
                >
                  Regresar al Editor
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    <span>Flujo A: Borrador Nativo CapCut</span>
                  </h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    CutAgent genera el archivo <code>draft_content.json</code> que CapCut usa internamente. Al reemplazar este archivo en tu carpeta de proyectos de CapCut, tendrás todos los cortes, pistas y subtítulos colocados sin mover un solo dedo.
                  </p>
                  <button
                    onClick={() => setIsExportOpen(true)}
                    className="mt-2 px-3 py-1.5 text-xs font-semibold text-neutral-950 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors inline-flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Abrir Ventana de Exportación</span>
                  </button>
                </div>

                <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    <span>Flujo B: Editar y Renderizar Aquí Mismo</span>
                  </h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    No necesitas instalar CapCut si no lo deseas. Usa las herramientas de corte, Zoom Punch-in 1.25x y subtítulos animados directamente en este navegador y descarga tu video terminado.
                  </p>
                  <button
                    onClick={() => {
                      setActiveView('editor');
                      setIsExportOpen(true);
                    }}
                    className="mt-2 px-3 py-1.5 text-xs font-semibold text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded transition-colors inline-flex items-center gap-1.5"
                  >
                    <Film className="w-3.5 h-3.5" />
                    <span>Probar Render en Navegador</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: CutAgent AI Copilot Assistant (4 Cols) */}
        <div className="lg:col-span-4 min-h-[500px] lg:min-h-0 flex flex-col">
          <AgentChatDrawer
            messages={agentMessages}
            onSendMessage={handleSendAgentMessage}
            isLoading={isAgentThinking}
            onExecuteAction={handleExecuteAction}
          />
        </div>
      </main>

      {/* Modals */}
      <CapCutExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        projectName={project.title.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30)}
        clips={project.clips}
        captions={project.captions}
        format={project.format}
        videoUrl={project.videoUrl}
        fileName={project.fileName}
      />

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSelectProject={(newProject) => {
          setProject(newProject);
          setCurrentTime(0);
          setIsPlaying(false);
          setViralClips([]);
          setActiveView('editor');
          setAgentMessages((prev) => [
            ...prev,
            {
              id: `msg-project-switch-${Date.now()}`,
              role: 'agent',
              content: `He cargado el video "${newProject.title}". ¡Listo para comenzar los cortes y detectar momentos virales!`,
              timestamp: 'Ahora',
              suggestedActions: [
                { id: 'act-sil', label: '✂️ Eliminar Silencios', type: 'CUT_SILENCES' },
                { id: 'act-scan', label: '🔥 Escanear Clips Virales', type: 'SCAN_VIRALITY' },
              ],
            },
          ]);
        }}
        currentProjectId={project.id}
      />

      <CapCutGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}
