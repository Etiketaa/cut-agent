import React from 'react';
import { Scissors, Download, Sparkles, Video, HelpCircle } from 'lucide-react';

interface HeaderProps {
  onOpenExport: () => void;
  onOpenUpload: () => void;
  onOpenHelp: () => void;
  activeView: 'editor' | 'viral_scanner' | 'capcut_guide';
  setActiveView: (view: 'editor' | 'viral_scanner' | 'capcut_guide') => void;
  format: '16:9' | '9:16';
  onToggleFormat: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenExport,
  onOpenUpload,
  onOpenHelp,
  activeView,
  setActiveView,
  format,
  onToggleFormat,
}) => {
  return (
    <header className="flex items-center justify-between px-6 py-3.5 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-40">
      {/* Zone 1: Wordmark */}
      <div className="flex items-center gap-3">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setActiveView('editor');
          }}
          className="text-lg font-bold tracking-tight text-white flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-amber-400 p-[1px] flex items-center justify-center">
            <div className="w-full h-full bg-neutral-950 rounded-[7px] flex items-center justify-center">
              <Scissors className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <span>CutAgent AI</span>
        </a>
        <span className="hidden sm:inline text-xs text-neutral-500 font-mono">· Copiloto CapCut</span>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-neutral-400">
        <button
          onClick={() => setActiveView('editor')}
          className={`transition-colors hover:text-white pb-0.5 ${
            activeView === 'editor' ? 'text-white border-b-2 border-cyan-400' : ''
          }`}
        >
          Editor de Video
        </button>
        <button
          onClick={() => setActiveView('viral_scanner')}
          className={`transition-colors hover:text-white pb-0.5 flex items-center gap-1.5 ${
            activeView === 'viral_scanner' ? 'text-white border-b-2 border-cyan-400' : ''
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Escáner Viral Shorts</span>
        </button>
        <button
          onClick={() => setActiveView('capcut_guide')}
          className={`transition-colors hover:text-white pb-0.5 ${
            activeView === 'capcut_guide' ? 'text-white border-b-2 border-cyan-400' : ''
          }`}
        >
          Guía de CapCut
        </button>
        <button
          onClick={onOpenUpload}
          className="transition-colors hover:text-white flex items-center gap-1.5"
        >
          <Video className="w-3.5 h-3.5" />
          <span>Subir Mi Video</span>
        </button>
      </nav>

      {/* Zone 3: Actions */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onToggleFormat}
          title={`Cambiar a ${format === '9:16' ? 'Horizontal 16:9 (YouTube)' : 'Vertical 9:16 (TikTok/Shorts)'}`}
          className="px-2.5 py-1.5 text-xs font-mono text-neutral-300 bg-neutral-900 border border-neutral-800 rounded-md hover:bg-neutral-800 transition-colors whitespace-nowrap"
        >
          Formato: <span className="text-cyan-400 font-semibold">{format}</span>
        </button>

        <button
          onClick={onOpenHelp}
          title="Ayuda y atajos"
          className="p-1.5 text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 rounded-md transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenExport}
          className="px-3.5 py-1.5 text-xs font-semibold text-neutral-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 rounded-md shadow-sm transition-all flex items-center gap-1.5 whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Exportar CapCut / Video</span>
        </button>
      </div>
    </header>
  );
};
