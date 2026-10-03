import React, { useState } from 'react';
import { X, Upload, Film, CheckCircle2, Sparkles } from 'lucide-react';
import { VideoProject } from '../types/editor';
import { DEMO_PROJECTS } from '../utils/demoVideos';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProject: (project: VideoProject) => void;
  currentProjectId: string;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onSelectProject,
  currentProjectId,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customTranscript, setCustomTranscript] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    setUploadedFile(file);
    if (!customTitle) {
      setCustomTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleLoadCustomVideo = () => {
    if (!uploadedFile) return;

    const fileUrl = URL.createObjectURL(uploadedFile);
    const tempVideo = document.createElement('video');
    tempVideo.src = fileUrl;

    tempVideo.onloadedmetadata = () => {
      const dur = tempVideo.duration || 60;
      const newProject: VideoProject = {
        id: `custom-${Date.now()}`,
        title: customTitle || uploadedFile.name,
        videoUrl: fileUrl,
        duration: Math.round(dur),
        format: '9:16',
        transcript: customTranscript || `Video subido por el usuario: ${uploadedFile.name}. Duración ${Math.round(dur)}s.`,
        clips: [
          { id: 'clip-1', start: 0, end: dur, label: 'Video Completo', hasZoomPunchIn: false },
        ],
        captions: [
          { id: 'cap-1', start: 0, end: Math.min(3, dur), text: 'NUEVO VIDEO IMPORTADO', highlightWord: 'IMPORTADO', highlightColor: '#FACC15', emoji: '✨' },
        ],
        isCustomUpload: true,
        fileName: uploadedFile.name,
      };

      onSelectProject(newProject);
      onClose();
    };
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">Seleccionar o Subir Video</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Section 1: Pre-loaded Demo Projects */}
          <div>
            <h3 className="font-semibold text-neutral-300 uppercase tracking-wider mb-2.5">
              Proyectos de demostración (Listos para probar)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DEMO_PROJECTS.map((demo) => {
                const isCurrent = demo.id === currentProjectId;
                return (
                  <div
                    key={demo.id}
                    onClick={() => {
                      onSelectProject(demo);
                      onClose();
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isCurrent
                        ? 'bg-cyan-950/40 border-cyan-400 ring-1 ring-cyan-400/50'
                        : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-cyan-400 font-mono font-bold">
                          {demo.format} · {demo.duration}s
                        </span>
                        {isCurrent && (
                          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                        )}
                      </div>
                      <h4 className="text-xs font-semibold text-white mt-1.5 line-clamp-2">
                        {demo.title}
                      </h4>
                    </div>

                    <div className="mt-3 pt-2 border-t border-neutral-800/80 text-[10px] text-neutral-400">
                      Incluye silencios, pausas y subtítulos precargados.
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-neutral-800 w-full" />
            <span className="bg-neutral-900 px-3 text-[10px] text-neutral-500 font-mono uppercase">
              O SUBE TU PROPIO ARCHIVO
            </span>
          </div>

          {/* Section 2: Upload File Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
              dragActive
                ? 'border-cyan-400 bg-cyan-950/20'
                : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700'
            }`}
          >
            <input
              type="file"
              id="file-upload"
              accept="video/*,audio/*"
              onChange={handleFileInput}
              className="hidden"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center justify-center space-y-2"
            >
              <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-cyan-400">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">
                  {uploadedFile ? uploadedFile.name : 'Haz clic para seleccionar o arrastra tu video'}
                </p>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Soporta MP4, WebM, MOV, MKV (procesado localmente en tu navegador)
                </p>
              </div>
            </label>
          </div>

          {uploadedFile && (
            <div className="space-y-3 p-3.5 bg-neutral-950 rounded-xl border border-neutral-800">
              <div>
                <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                  Título del Video
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                  Transcripción / Notas (Opcional - ayuda al Agente a detectar los ganchos)
                </label>
                <textarea
                  value={customTranscript}
                  onChange={(e) => setCustomTranscript(e.target.value)}
                  rows={3}
                  placeholder="Pega aquí el guión o transcripción de tu video para que el agente encuentre los momentos virales con exactitud..."
                  className="w-full bg-neutral-900 border border-neutral-800 rounded p-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <button
                onClick={handleLoadCustomVideo}
                className="w-full py-2 text-xs font-bold text-neutral-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Cargar en el Editor</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
