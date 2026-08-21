import { Mic, MicOff, Loader } from 'lucide-react';
import { VOICE_STATES } from '../utils/constants';

const STATE_CONFIG = {
  [VOICE_STATES.IDLE]: {
    label: 'Hold to speak',
    icon:  <Mic size={26} strokeWidth={2} />,
    color: 'idle',
  },
  [VOICE_STATES.LISTENING]: {
    label: 'Release to send',
    icon:  <MicOff size={26} strokeWidth={2} />,
    color: 'listening',
  },
  [VOICE_STATES.TRANSCRIBING]: {
    label: 'Transcribing…',
    icon:  <Loader size={24} strokeWidth={2} className="spin" />,
    color: 'transcribing',
  },
  [VOICE_STATES.PROCESSING]: {
    label: 'Thinking…',
    icon:  <Loader size={24} strokeWidth={2} className="spin" />,
    color: 'processing',
  },
};

export default function VoiceButton({ voiceState, audioLevel, onPressStart, onPressEnd }) {
  const cfg = STATE_CONFIG[voiceState] || STATE_CONFIG[VOICE_STATES.IDLE];
  const isBusy = voiceState === VOICE_STATES.TRANSCRIBING || voiceState === VOICE_STATES.PROCESSING;
  const isListening = voiceState === VOICE_STATES.LISTENING;

  // Scale the visual ring based on audio level
  const ringScale = 1 + audioLevel * 0.5;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      {/* Waveform */}
      <div className={`waveform${isListening ? ' active' : ''}`}>
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="waveform-bar"
            style={{
              height: 24,
              background: isListening ? 'var(--accent)' : 'var(--text-m)',
              opacity: isListening ? 1 : 0.4,
              transform: isListening ? undefined : 'scaleY(0.35)',
              // Dynamic height from audio level
              ...(isListening && audioLevel > 0 && {
                animation: 'none',
                transform: `scaleY(${0.15 + audioLevel * (0.7 + i * 0.07)})`,
                transition: 'transform 0.08s ease',
              }),
            }}
          />
        ))}
      </div>

      {/* Button + rings */}
      <div className={`mic-btn-wrap ${isListening ? 'listening' : ''}`}>
        {/* Pulse rings (visible when listening) */}
        {isListening && (
          <>
            <div
              className="mic-ring"
              style={{ transform: `scale(${ringScale})`, borderColor: 'rgba(239,68,68,0.5)' }}
            />
            <div className="mic-ring" style={{ borderColor: 'rgba(239,68,68,0.3)' }} />
          </>
        )}

        <button
          id="voice-mic-button"
          className={`mic-btn ${cfg.color}`}
          onMouseDown={!isBusy ? onPressStart : undefined}
          onMouseUp={isListening ? onPressEnd : undefined}
          onTouchStart={!isBusy ? (e) => { e.preventDefault(); onPressStart(); } : undefined}
          onTouchEnd={isListening ? (e) => { e.preventDefault(); onPressEnd(); } : undefined}
          disabled={isBusy}
          aria-label={cfg.label}
          style={{
            ...(isBusy && {
              animation: 'mic-pulse 1.5s ease-in-out infinite',
            }),
          }}
        >
          {cfg.icon}
        </button>
      </div>

      {/* State label */}
      <span
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: 'var(--text-2)',
          letterSpacing: '0.01em',
          transition: 'color 0.2s',
        }}
      >
        {cfg.label}
      </span>
    </div>
  );
}
