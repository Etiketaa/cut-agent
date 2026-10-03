import React from 'react';
import { X, Film, Download, Check, Sparkles, Scissors, Zap, ShieldCheck } from 'lucide-react';

interface CapCutGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CapCutGuideModal: React.FC<CapCutGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">Guía de Integración con CapCut</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-neutral-300">
          <div className="p-4 bg-cyan-950/30 border border-cyan-500/20 rounded-xl">
            <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>¿Cómo te ayuda CutAgent con tus videos largos en CapCut?</span>
            </h3>
            <p className="mt-1.5 leading-relaxed">
              Editar un video de 1 hora directamente a mano en CapCut puede tomar entre 3 y 5 horas cortando respiraciones y buscando momentos buenos. CutAgent hace el trabajo pesado por ti:
            </p>
          </div>

          {/* 3 Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1.5">
              <Scissors className="w-4 h-4 text-cyan-400" />
              <h4 className="font-semibold text-white">1. Quitar Silencios</h4>
              <p className="text-[11px] text-neutral-400 leading-normal">
                Detecta pausas y respiraciones muertas de más de 0.5s y las recorta con un clic.
              </p>
            </div>

            <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              <h4 className="font-semibold text-white">2. Extraer Shorts</h4>
              <p className="text-[11px] text-neutral-400 leading-normal">
                Encuentra los ganchos virales con mayor probabilidad de retención para TikTok y Reels.
              </p>
            </div>

            <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1.5">
              <Download className="w-4 h-4 text-emerald-400" />
              <h4 className="font-semibold text-white">3. Borrador CapCut</h4>
              <p className="text-[11px] text-neutral-400 leading-normal">
                Exporta el archivo de borrador nativo (.json) o EDL para abrirlo directamente en CapCut.
              </p>
            </div>
          </div>

          {/* Technical Steps for Windows & Mac */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Cómo abrir el borrador exportado en CapCut Desktop:
            </h4>

            <ol className="space-y-2.5 list-decimal list-inside text-neutral-300">
              <li className="p-3 bg-neutral-950 rounded-lg border border-neutral-800">
                <strong className="text-white">Crea un proyecto en blanco:</strong> Abre CapCut en tu computadora, crea un proyecto con el mismo nombre y ciérralo.
              </li>
              <li className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 space-y-1.5">
                <strong className="text-white">Localiza la carpeta de proyectos de CapCut:</strong>
                <div className="text-[11px] font-mono bg-neutral-900 p-2 rounded text-neutral-300 mt-1 select-all">
                  Windows: %localappdata%\CapCut\User Data\Projects\com.lveditor.draft\
                </div>
                <div className="text-[11px] font-mono bg-neutral-900 p-2 rounded text-neutral-300 select-all">
                  Mac: ~/Movies/CapCut/User Data/Projects/com.lveditor.draft/
                </div>
              </li>
              <li className="p-3 bg-neutral-950 rounded-lg border border-neutral-800">
                <strong className="text-white">Reemplaza el archivo:</strong> Pega el <code className="text-cyan-400">draft_content.json</code> generado por CutAgent dentro de la carpeta del proyecto.
              </li>
              <li className="p-3 bg-neutral-950 rounded-lg border border-neutral-800">
                <strong className="text-white">¡Listo!</strong> Abre CapCut de nuevo. Todos los cortes, zoom punch-ins y subtítulos estarán colocados en las pistas de tu línea de tiempo.
              </li>
            </ol>
          </div>

          {/* Alternative: In-Browser Editing */}
          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>¿No quieres instalar CapCut? Edita directamente aquí</span>
            </h4>
            <p className="text-[11px] text-neutral-400 leading-normal">
              Puedes hacer todos los cortes, probar los zoom punch-ins y renderizar el video completo en tu navegador usando la opción <strong>"Renderizar Aquí"</strong> dentro del modal de exportación.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-neutral-950 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-neutral-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors"
          >
            Entendido, volver al editor
          </button>
        </div>
      </div>
    </div>
  );
};
