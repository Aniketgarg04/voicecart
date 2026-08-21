import { useRef, useCallback, useEffect } from 'react';
import useShoppingStore from '../store/useShoppingStore';
import { VOICE_STATES } from '../utils/constants';

/**
 * useVoiceCapture
 *
 * Hybrid Audio Pipeline:
 * 1. Web Speech API (SpeechRecognition / webkitSpeechRecognition) for instant,
 *    zero-setup in-browser voice transcription.
 * 2. MediaRecorder for binary audio streaming to backend Whisper server when enabled.
 * 3. AudioContext + AnalyserNode for real-time waveform visualization.
 */

const SpeechRecognition =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

export function useVoiceCapture(sendBinary, send) {
  const recorderRef    = useRef(null);
  const streamRef      = useRef(null);
  const analyserRef    = useRef(null);
  const rafRef         = useRef(null);
  const mimeTypeRef    = useRef('audio/webm');
  const speechRecRef   = useRef(null);
  const speechTextRef  = useRef('');

  // ── Audio Level Loop ──────────────────────────────────────────────────────
  const startLevelMonitor = useCallback((stream) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx      = new AudioCtx();
      const source   = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = { analyser, ctx };

      const buf = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        if (!analyserRef.current) return;
        analyser.getByteFrequencyData(buf);
        const avg = buf.reduce((a, b) => a + b, 0) / buf.length;
        useShoppingStore.getState().setAudioLevel(avg / 128); // 0–1
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (err) {
      console.warn('[Voice] Waveform monitor not supported:', err);
    }
  }, []);

  const stopLevelMonitor = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    analyserRef.current?.ctx.close().catch(() => {});
    analyserRef.current = null;
    useShoppingStore.getState().setAudioLevel(0);
  }, []);

  // ── Start Recording ───────────────────────────────────────────────────────
  const startListening = useCallback(async () => {
    if (useShoppingStore.getState().voiceState !== VOICE_STATES.IDLE) return;
    speechTextRef.current = '';

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      streamRef.current = stream;

      // 1. In-browser speech recognition (if available)
      if (SpeechRecognition) {
        try {
          const rec = new SpeechRecognition();
          rec.continuous = true;
          rec.interimResults = true;
          rec.lang = 'en-US';

          rec.onresult = (event) => {
            let interim = '';
            let final = '';
            for (let i = 0; i < event.results.length; i++) {
              const res = event.results[i];
              if (res.isFinal) {
                final += res[0].transcript + ' ';
              } else {
                interim += res[0].transcript;
              }
            }
            const recognized = (final + interim).trim();
            if (recognized) {
              speechTextRef.current = recognized;
              useShoppingStore.getState().setTranscript(recognized);
            }
          };

          rec.onerror = (e) => {
            console.warn('[SpeechRecognition] error:', e.error);
          };

          rec.start();
          speechRecRef.current = rec;
        } catch (e) {
          console.warn('[SpeechRecognition] Init failed:', e);
        }
      }

      // 2. MediaRecorder for binary audio streaming
      const preferred = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
      ];
      const mimeType = preferred.find((m) => MediaRecorder.isTypeSupported(m)) || '';
      mimeTypeRef.current = mimeType || 'audio/webm';

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          e.data.arrayBuffer().then((buf) => sendBinary(buf));
        }
      };

      recorder.onstop = () => {
        const recognized = speechTextRef.current.trim();
        // If in-browser speech captured text, send it as text_command to Gemma directly!
        if (recognized) {
          useShoppingStore.getState().setTranscript(recognized);
          useShoppingStore.getState().setVoiceState(VOICE_STATES.PROCESSING);
          send({ type: 'text_command', text: recognized });
        } else {
          // Fallback to backend transcription
          send({ type: 'audio_end', mimeType: mimeTypeRef.current });
        }

        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        stopLevelMonitor();
      };

      recorder.start(250); // Stream chunks
      startLevelMonitor(stream);
      useShoppingStore.getState().setVoiceState(VOICE_STATES.LISTENING);
    } catch (err) {
      console.error('[Voice] Microphone error:', err.message);
      useShoppingStore.getState().setError('Microphone access denied. Please click "Allow" in your browser.');
    }
  }, [sendBinary, send, startLevelMonitor, stopLevelMonitor]);

  // ── Stop Recording ────────────────────────────────────────────────────────
  const stopListening = useCallback(() => {
    if (speechRecRef.current) {
      try {
        speechRecRef.current.stop();
      } catch {}
      speechRecRef.current = null;
    }

    const recorder = recorderRef.current;
    if (recorder && recorder.state === 'recording') {
      recorder.stop();
      useShoppingStore.getState().setVoiceState(VOICE_STATES.TRANSCRIBING);
    }
  }, []);

  // ── Text command (dev & prompt chips) ───────────────────────────────────
  const sendTextCommand = useCallback((text) => {
    if (!text?.trim()) return;
    useShoppingStore.getState().setTranscript(text.trim());
    useShoppingStore.getState().setVoiceState(VOICE_STATES.PROCESSING);
    send({ type: 'text_command', text: text.trim() });
  }, [send]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLevelMonitor();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (speechRecRef.current) {
        try { speechRecRef.current.stop(); } catch {}
      }
      if (recorderRef.current?.state === 'recording') {
        recorderRef.current.stop();
      }
    };
  }, [stopLevelMonitor]);

  return { startListening, stopListening, sendTextCommand };
}
