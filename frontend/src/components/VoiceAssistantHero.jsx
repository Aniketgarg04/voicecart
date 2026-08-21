import { useState } from 'react';
import { Mic, MicOff, Loader2, Sparkles, Send, Volume2, CornerDownLeft, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useShoppingStore from '../store/useShoppingStore';
import { VOICE_STATES, QUICK_VOICE_PROMPTS } from '../utils/constants';

export default function VoiceAssistantHero({
  onPressStart,
  onPressEnd,
  onSendText,
}) {
  const voiceState  = useShoppingStore((s) => s.voiceState);
  const audioLevel  = useShoppingStore((s) => s.audioLevel);
  const transcript  = useShoppingStore((s) => s.transcript);
  const aiMessage   = useShoppingStore((s) => s.aiMessage);
  const [textInput, setTextInput] = useState('');

  const isListening = voiceState === VOICE_STATES.LISTENING;
  const isBusy      = voiceState === VOICE_STATES.TRANSCRIBING || voiceState === VOICE_STATES.PROCESSING;

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!textInput.trim() || isBusy) return;
    onSendText(textInput.trim());
    setTextInput('');
  };

  const handlePromptClick = (promptText) => {
    if (isBusy) return;
    onSendText(promptText);
  };

  return (
    <div className="pro-card p-4 sm:p-6 bg-gradient-to-b from-[var(--bg-surface)] to-[var(--bg-surface-subtle)] relative overflow-hidden">
      
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-48 h-48 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
        
        {/* Left: Interactive Mic & Dynamic Audio Waves */}
        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          <div className="relative flex items-center justify-center">
            {/* Animated Pulse Rings when listening */}
            {isListening && (
              <>
                <div
                  className="absolute inset-0 rounded-full border-2 border-red-500/40 animate-ping pointer-events-none"
                  style={{ transform: `scale(${1.2 + audioLevel * 0.5})` }}
                />
                <div className="absolute -inset-2 rounded-full border border-red-500/20 pointer-events-none animate-pulse" />
              </>
            )}

            {/* Mic Button */}
            <button
              id="voice-mic-button-hero"
              onMouseDown={!isBusy ? onPressStart : undefined}
              onMouseUp={isListening ? onPressEnd : undefined}
              onTouchStart={!isBusy ? (e) => { e.preventDefault(); onPressStart(); } : undefined}
              onTouchEnd={isListening ? (e) => { e.preventDefault(); onPressEnd(); } : undefined}
              disabled={isBusy}
              aria-label={isListening ? 'Release to process' : 'Hold to speak'}
              className={`mic-btn-pro ${
                isListening ? 'listening' : isBusy ? 'processing' : 'idle'
              }`}
            >
              {isListening ? (
                <MicOff className="w-7 h-7 animate-bounce" />
              ) : isBusy ? (
                <Loader2 className="w-7 h-7 animate-spin" />
              ) : (
                <Mic className="w-7 h-7" />
              )}
            </button>
          </div>

          {/* Audio Waveform visualization */}
          <div className="waveform-container">
            {[0.4, 0.8, 1, 0.7, 0.5].map((scale, i) => (
              <div
                key={i}
                className="waveform-bar-pro"
                style={{
                  height: isListening
                    ? `${Math.max(6, (audioLevel || 0.3) * 28 * scale)}px`
                    : '6px',
                  backgroundColor: isListening ? '#ef4444' : 'var(--accent-primary)',
                  opacity: isListening ? 1 : 0.4,
                }}
              />
            ))}
          </div>

          <span className="text-[11px] font-semibold text-[var(--text-secondary)] tracking-wide">
            {isListening
              ? '🎙️ Release to Send'
              : voiceState === VOICE_STATES.TRANSCRIBING
              ? 'Transcribing audio...'
              : voiceState === VOICE_STATES.PROCESSING
              ? 'Gemma is thinking...'
              : 'Press & Hold to Speak'}
          </span>
        </div>

        {/* Center & Right: Live Transcript, AI Response & Interactive Controls */}
        <div className="flex-1 w-full flex flex-col gap-3">
          
          {/* Status & Live Bubble Area */}
          <div className="min-h-[44px] flex items-center justify-between gap-3 p-3 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-color)]">
            <div className="flex items-center gap-2 overflow-hidden">
              <Sparkles className="w-4 h-4 text-indigo-500 flex-shrink-0" />
              <div className="text-xs sm:text-sm text-[var(--text-primary)] truncate font-medium">
                {isListening ? (
                  <span className="text-red-500 font-semibold animate-pulse">
                    Listening to your voice...
                  </span>
                ) : transcript ? (
                  <span>
                    <span className="text-[var(--text-muted)] mr-1.5">You:</span>
                    <strong className="text-[var(--text-primary)]">"{transcript}"</strong>
                  </span>
                ) : aiMessage ? (
                  <span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-semibold mr-1.5">Assistant:</span>
                    {aiMessage}
                  </span>
                ) : (
                  <span className="text-[var(--text-muted)]">
                    Speak naturally or type: "Add 2 bottles of olive oil", "Find apples under $4"
                  </span>
                )}
              </div>
            </div>

            {isBusy && (
              <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-semibold flex-shrink-0">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Processing</span>
              </div>
            )}
          </div>

          {/* Quick Voice Prompt Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800/60 uppercase tracking-wider flex-shrink-0 mr-0.5">
              ⚡ Try Prompts:
            </span>
            {QUICK_VOICE_PROMPTS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handlePromptClick(p.text)}
                disabled={isBusy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-700 dark:hover:text-indigo-300 shadow-sm transition-all cursor-pointer whitespace-nowrap active:scale-95 flex-shrink-0"
              >
                <span>{p.icon}</span>
                <span>{p.label}</span>
              </button>
            ))}
          </div>

          {/* Text input bar */}
          <form onSubmit={handleTextSubmit} className="relative flex items-center">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              disabled={isBusy}
              placeholder='Type a command... (e.g. "Add 3 avocados", "Find toothpaste under $5")'
              className="w-full bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder-[var(--text-muted)] text-xs sm:text-sm rounded-xl pl-4 pr-12 py-2.5 border border-[var(--border-color)] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
            />
            <button
              type="submit"
              disabled={!textInput.trim() || isBusy}
              aria-label="Send command"
              className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-30 text-white flex items-center justify-center transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

        </div>

      </div>
    </div>
  );
}
