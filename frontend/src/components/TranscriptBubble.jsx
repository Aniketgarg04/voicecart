import { motion, AnimatePresence } from 'framer-motion';

export default function TranscriptBubble({ transcript, aiMessage, voiceState }) {
  const text =
    voiceState === 'transcribing' ? 'Transcribing…'
    : voiceState === 'processing'  ? 'Thinking…'
    : transcript || '';

  const showAi = voiceState === 'idle' && aiMessage && !transcript;

  return (
    <div style={{ minHeight: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <AnimatePresence mode="wait">
        {text && (
          <motion.div
            key={`transcript-${text.slice(0, 20)}`}
            className="transcript-bubble"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            {voiceState === 'transcribing' || voiceState === 'processing' ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }} />
                <span style={{ color: 'var(--text-2)' }}>{text}</span>
              </span>
            ) : (
              <span>
                <span style={{ color: 'var(--text-2)', marginRight: 4, fontSize: 12 }}>You said:</span>
                <span style={{ fontWeight: 500 }}>"{text}"</span>
              </span>
            )}
          </motion.div>
        )}

        {showAi && aiMessage && (
          <motion.div
            key={`ai-${aiMessage.slice(0, 20)}`}
            className="ai-message"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {aiMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
