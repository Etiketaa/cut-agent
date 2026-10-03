import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Scissors, Clapperboard, Download, RotateCw } from 'lucide-react';
import { AgentMessage } from '../types/editor';

interface AgentChatDrawerProps {
  messages: AgentMessage[];
  onSendMessage: (msg: string) => void;
  isLoading: boolean;
  onExecuteAction: (type: string, payload?: any) => void;
}

export const AgentChatDrawer: React.FC<AgentChatDrawerProps> = ({
  messages,
  onSendMessage,
  isLoading,
  onExecuteAction,
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    '✂️ Corta los silencios y pausas del video',
    '🔥 Encuentra los 3 mejores clips virales',
    '📝 Genera subtítulos estilo Hormozi',
    '🎬 Dame sugerencias de B-roll y sonidos para CapCut',
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl flex flex-col h-full">
      {/* Drawer Header */}
      <div className="px-4 py-3 bg-neutral-950/80 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <img
              src="/src/assets/images/agent_editor_avatar_1791054590026.jpg"
              alt="CutAgent Avatar"
              className="w-8 h-8 rounded-full object-cover border border-cyan-500/40"
              referrerPolicy="no-referrer"
              onError={(e) => {
                // Fallback avatar icon
                e.currentTarget.style.display = 'none';
              }}
            />
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-neutral-950" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>CutAgent Copilot</span>
              <span className="text-[10px] text-cyan-400 font-mono">IA Activa</span>
            </h3>
            <p className="text-[10px] text-neutral-400">
              Editor senior de video & especialista en CapCut
            </p>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[88%] rounded-xl p-3 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-cyan-500 text-neutral-950 font-medium'
                  : 'bg-neutral-950 border border-neutral-800 text-neutral-200'
              }`}
            >
              <p className="whitespace-pre-line">{msg.content}</p>

              {/* Action Buttons emitted by Agent */}
              {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                <div className="mt-3 pt-2 border-t border-neutral-800/80 flex flex-wrap gap-1.5">
                  {msg.suggestedActions.map((act) => (
                    <button
                      key={act.id}
                      onClick={() => onExecuteAction(act.type, act.payload)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-cyan-300 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 rounded transition-colors flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>{act.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <span className="text-[9px] text-neutral-500 mt-1 px-1 font-mono">
              {msg.timestamp}
            </span>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 p-3 bg-neutral-950 border border-neutral-800 rounded-xl max-w-[70%]">
            <RotateCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            <span className="text-xs text-neutral-400">CutAgent está analizando...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div className="px-3 py-2 bg-neutral-950/50 border-t border-neutral-800/80 flex items-center gap-1.5 overflow-x-auto text-[11px]">
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => onSendMessage(p)}
            className="px-2 py-1 rounded bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 whitespace-nowrap transition-colors shrink-0"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form onSubmit={handleSubmit} className="p-3 bg-neutral-950 border-t border-neutral-800 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pide al agente cortar silencios, buscar clips o guiones..."
          className="flex-1 bg-neutral-900 text-xs text-white placeholder-neutral-500 px-3 py-2 rounded-lg border border-neutral-800 focus:outline-none focus:border-cyan-400 transition-colors"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="p-2 rounded-lg bg-cyan-400 text-neutral-950 hover:bg-cyan-300 disabled:opacity-40 transition-colors shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
