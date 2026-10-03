import React, { useState } from 'react';
import { X, Download, Copy, Check, FileCode, Film, Clapperboard, Monitor, Sparkles, AlertCircle } from 'lucide-react';
import { VideoClip, CaptionSegment } from '../types/editor';
import { generateCapCutDraft, generateEDL, generateSRT, downloadFile } from '../utils/capcutExporter';

interface CapCutExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  clips: VideoClip[];
  captions: CaptionSegment[];
  format: '16:9' | '9:16';
  videoUrl: string;
  fileName?: string;
}

export const CapCutExportModal: React.FC<CapCutExportModalProps> = ({
  isOpen,
  onClose,
  projectName,
  clips,
  captions,
  format,
  videoUrl,
  fileName = 'video_fuente.mp4',
}) => {
  const [activeTab, setActiveTab] = useState<'capcut' | 'edl' | 'render'>('capcut');
  const [copiedPath, setCopiedPath] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);

  if (!isOpen) return null;

  const validClips = clips.filter((c) => !c.isSilence);
  const totalDuration = validClips.reduce((acc, c) => acc + (c.end - c.start), 0);

  const windowsPath = `%localappdata%\\CapCut\\User Data\\Projects\\com.lveditor.draft\\${projectName}\\draft_content.json`;
  const macPath = `~/Movies/CapCut/User Data/Projects/com.lveditor.draft/${projectName}/draft_content.json`;

  const handleDownloadDraft = () => {
    const draft = generateCapCutDraft(projectName, clips, captions, format, fileName);
    downloadFile(draft, 'draft_content.json', 'application/json');
  };

  const handleDownloadEDL = () => {
    const edl = generateEDL(projectName, clips, fileName);
    downloadFile(edl, `${projectName}.edl`, 'text/plain');
  };

  const handleDownloadSRT = () => {
    const srt = generateSRT(captions);
    downloadFile(srt, `${projectName}.srt`, 'text/plain');
  };

  const handleCopyPath = (path: string) => {
    navigator.clipboard.writeText(path);
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 2000);
  };

  // Browser-based Client Video Renderer ("que los edite desde aqui")
  const handleRenderInBrowser = async () => {
    try {
      setIsRendering(true);
      setRenderProgress(10);

      // Create off-screen video element
      const video = document.createElement('video');
      video.src = videoUrl;
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.playsInline = true;

      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject(new Error('No se pudo cargar el video fuente para renderizar'));
      });

      const width = format === '9:16' ? 720 : 1280;
      const height = format === '9:16' ? 1280 : 720;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D context no soportado');

      const stream = canvas.captureStream(30);

      // Audio track handling
      try {
        const audioCtx = new AudioContext();
        const sourceNode = audioCtx.createMediaElementSource(video);
        const destNode = audioCtx.createMediaStreamDestination();
        sourceNode.connect(destNode);
        sourceNode.connect(audioCtx.destination);
        destNode.stream.getAudioTracks().forEach(track => stream.addTrack(track));
      } catch (err) {
        console.warn('AudioContext routing not permitted for crossOrigin, video stream only');
      }

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 4000000 });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const outputBlob = new Blob(chunks, { type: 'video/webm' });
        downloadFile(outputBlob, `${projectName}_editado.webm`, 'video/webm');
        setIsRendering(false);
        setRenderProgress(100);
      };

      recorder.start();

      // Play each clip in sequence
      let currentClipIdx = 0;
      let startTime = Date.now();

      const processNextClip = () => {
        if (currentClipIdx >= validClips.length) {
          recorder.stop();
          return;
        }

        const clip = validClips[currentClipIdx];
        video.currentTime = clip.start;
        video.play();

        const renderInterval = setInterval(() => {
          if (video.currentTime >= clip.end || video.ended) {
            clearInterval(renderInterval);
            currentClipIdx++;
            const pct = Math.round((currentClipIdx / validClips.length) * 100);
            setRenderProgress(pct);
            processNextClip();
            return;
          }

          // Draw video on canvas
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, width, height);

          if (clip.hasZoomPunchIn) {
            const zoom = 1.25;
            const dw = width * zoom;
            const dh = height * zoom;
            const dx = (width - dw) / 2;
            const dy = (height - dh) / 2;
            ctx.drawImage(video, dx, dy, dw, dh);
          } else {
            ctx.drawImage(video, 0, 0, width, height);
          }

          // Draw active caption
          const activeCap = captions.find(c => video.currentTime >= c.start && video.currentTime <= c.end);
          if (activeCap) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            ctx.fillRect(width * 0.1, height * 0.82, width * 0.8, height * 0.1);
            ctx.fillStyle = activeCap.highlightColor || '#FACC15';
            ctx.font = `bold ${Math.round(height * 0.045)}px 'Plus Jakarta Sans', sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText(activeCap.text, width / 2, height * 0.88);
          }
        }, 33);
      };

      processNextClip();
    } catch (error: any) {
      console.error('Render error:', error);
      alert('Error en el render: ' + error.message);
      setIsRendering(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Exportar Proyecto & Video
              </h2>
              <p className="text-xs text-neutral-400 font-mono">
                {validClips.length} fragmentos · {totalDuration.toFixed(1)}s duración · Formato {format}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/50 px-6 pt-2">
          <button
            onClick={() => setActiveTab('capcut')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'capcut'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Borrador Nativo CapCut</span>
          </button>

          <button
            onClick={() => setActiveTab('edl')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'edl'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>EDL & Subtítulos SRT</span>
          </button>

          <button
            onClick={() => setActiveTab('render')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'render'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>Renderizar Aquí (Navegador)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {activeTab === 'capcut' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-cyan-950/40 border border-cyan-500/30 rounded-xl flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div className="text-xs text-neutral-300 space-y-1">
                  <p className="font-semibold text-white">¿Cómo funciona la exportación a CapCut?</p>
                  <p>
                    Descarga el archivo <strong>draft_content.json</strong>. Contiene la línea de tiempo exacta con los cortes, la escala 1.25x en los zooms y los subtítulos de CapCut.
                  </p>
                </div>
              </div>

              {/* Download Draft Button */}
              <div className="flex items-center justify-between p-4 bg-neutral-950 rounded-xl border border-neutral-800">
                <div>
                  <h4 className="text-sm font-semibold text-white">Borrador CapCut (draft_content.json)</h4>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Compatible con CapCut Desktop (PC y Mac)
                  </p>
                </div>
                <button
                  onClick={handleDownloadDraft}
                  className="px-4 py-2 text-xs font-bold text-neutral-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 rounded-lg flex items-center gap-1.5 shadow"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Borrador</span>
                </button>
              </div>

              {/* Instructions Box */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                  Instrucciones paso a paso:
                </h4>

                <div className="space-y-2 text-xs text-neutral-300">
                  <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 space-y-2">
                    <span className="font-bold text-cyan-400">Paso 1:</span> Crea un proyecto nuevo en CapCut Desktop, nómbralo <code className="bg-neutral-800 px-1 py-0.5 rounded text-white">{projectName}</code> y ciérralo.
                  </div>

                  <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 space-y-2">
                    <span className="font-bold text-cyan-400">Paso 2:</span> Pega el archivo <code className="text-amber-400">draft_content.json</code> descargado en la carpeta de proyectos:
                    
                    {/* Windows path */}
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono mb-1">
                        <span>Ruta en Windows:</span>
                        <button
                          onClick={() => handleCopyPath(windowsPath)}
                          className="text-cyan-400 hover:underline flex items-center gap-1"
                        >
                          {copiedPath ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>Copiar ruta</span>
                        </button>
                      </div>
                      <div className="bg-neutral-900 p-2 rounded text-[11px] font-mono text-neutral-300 break-all select-all">
                        {windowsPath}
                      </div>
                    </div>

                    {/* Mac path */}
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono mb-1">
                        <span>Ruta en Mac:</span>
                        <button
                          onClick={() => handleCopyPath(macPath)}
                          className="text-cyan-400 hover:underline flex items-center gap-1"
                        >
                          {copiedPath ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>Copiar ruta</span>
                        </button>
                      </div>
                      <div className="bg-neutral-900 p-2 rounded text-[11px] font-mono text-neutral-300 break-all select-all">
                        {macPath}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800">
                    <span className="font-bold text-cyan-400">Paso 3:</span> Abre CapCut y verás el proyecto con todos los cortes, transiciones y pistas organizadas de inmediato.
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'edl' && (
            <div className="space-y-4">
              <p className="text-xs text-neutral-400">
                El formato EDL (Edit Decision List) es el estándar de la industria audiovisual para transferir cortes entre editores como CapCut, Adobe Premiere Pro, DaVinci Resolve y Final Cut Pro.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
                  <h4 className="text-sm font-semibold text-white">Lista de Cortes (.EDL)</h4>
                  <p className="text-xs text-neutral-400">
                    Marcas de tiempo de entrada y salida para cada clip.
                  </p>
                  <button
                    onClick={handleDownloadEDL}
                    className="w-full mt-2 px-3 py-2 text-xs font-semibold text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar {projectName}.edl</span>
                  </button>
                </div>

                <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
                  <h4 className="text-sm font-semibold text-white">Subtítulos (.SRT)</h4>
                  <p className="text-xs text-neutral-400">
                    Subtítulos listos para importar a CapCut o subir a YouTube/TikTok.
                  </p>
                  <button
                    onClick={handleDownloadSRT}
                    className="w-full mt-2 px-3 py-2 text-xs font-semibold text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar {projectName}.srt</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'render' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3">
                <Clapperboard className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-neutral-300 space-y-1">
                  <p className="font-semibold text-amber-300">Renderizar directamente desde aquí</p>
                  <p>
                    Si no tienes CapCut instalado o prefieres obtener el video final de inmediato, este motor de render une todos tus cortes, aplica los zooms y superpone los subtítulos en un archivo de video final listo para publicar.
                  </p>
                </div>
              </div>

              {isRendering ? (
                <div className="p-6 bg-neutral-950 rounded-xl border border-neutral-800 text-center space-y-3">
                  <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mx-auto" />
                  <div>
                    <p className="text-sm font-semibold text-white">Procesando cortes y subtítulos...</p>
                    <p className="text-xs text-neutral-400 font-mono mt-1">{renderProgress}% completado</p>
                  </div>
                  <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-cyan-400 h-full transition-all duration-300"
                      style={{ width: `${renderProgress}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Mantén abierta esta ventana mientras se procesan los fotogramas.
                  </p>
                </div>
              ) : (
                <div className="p-6 bg-neutral-950 rounded-xl border border-neutral-800 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-cyan-400">
                    <Film className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Exportar Video Renderizado</h3>
                    <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                      Genera el archivo final en formato WebM/MP4 con los {validClips.length} fragmentos ensamblados sin silencios.
                    </p>
                  </div>
                  <button
                    onClick={handleRenderInBrowser}
                    className="px-5 py-2.5 text-xs font-bold text-neutral-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 rounded-lg shadow-md transition-all inline-flex items-center gap-2"
                  >
                    <Clapperboard className="w-4 h-4" />
                    <span>Iniciar Renderizado Directo</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-neutral-950 border-t border-neutral-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
