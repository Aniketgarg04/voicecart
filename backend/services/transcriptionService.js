/**
 * Transcription Service — Hybrid Adapter
 *
 * TRANSCRIPTION_PROVIDER=local    → Calls a local whisper Docker/whisper.cpp HTTP server
 *                                    (zero API cost, fully offline)
 * TRANSCRIPTION_PROVIDER=openai   → Calls OpenAI Whisper API
 *                                    (production, set OPENAI_API_KEY)
 * TRANSCRIPTION_PROVIDER=disabled → Voice input disabled; use text input only
 */

import { Readable } from 'stream';
import FormData from 'form-data';
import fetch from 'node-fetch';
import OpenAI from 'openai';

const PROVIDER = process.env.TRANSCRIPTION_PROVIDER || 'local';
const WHISPER_BASE_URL = process.env.WHISPER_BASE_URL || 'http://localhost:8080';
const WHISPER_MODEL = process.env.WHISPER_MODEL || 'base';

// ── OpenAI provider (production) ──────────────────────────────────────────────
const openaiClient =
  PROVIDER === 'openai'
    ? new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })
    : null;

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Transcribe audio buffer to text.
 * @param {Buffer} audioBuffer  Raw audio bytes from MediaRecorder
 * @param {string} mimeType     MIME type (e.g., "audio/webm;codecs=opus")
 * @returns {Promise<string>}   Transcript text
 */
export async function transcribeAudio(audioBuffer, mimeType = 'audio/webm') {
  if (PROVIDER === 'disabled') {
    throw new Error(
      'Voice transcription is disabled in .env. Use the text input bar or enable in-browser Web Speech.'
    );
  }
  if (PROVIDER === 'openai') {
    return transcribeWithOpenAI(audioBuffer, mimeType);
  }
  return transcribeWithLocalWhisper(audioBuffer, mimeType);
}

// ── Local whisper container / server ──────────────────────────────────────────

async function transcribeWithLocalWhisper(audioBuffer, mimeType) {
  const ext = mimeTypeToExtension(mimeType);
  const filename = `audio.${ext}`;

  // Try /asr endpoint first (onerahmet/openai-whisper-asr-webservice standard)
  try {
    const formAsr = new FormData();
    formAsr.append('audio_file', Readable.from(audioBuffer), {
      filename,
      contentType: mimeType,
      knownLength: audioBuffer.length,
    });

    const res = await fetch(`${WHISPER_BASE_URL}/asr?task=transcribe&output=json`, {
      method: 'POST',
      body: formAsr,
      headers: formAsr.getHeaders(),
      signal: AbortSignal.timeout(30_000),
    });

    if (res.ok) {
      const data = await res.json();
      const text = data.text || data.transcript || (typeof data === 'string' ? data : '');
      if (text.trim()) return text.trim();
    }
  } catch (e) {
    // If /asr fails, try fallback /v1/audio/transcriptions
  }

  // Fallback: /v1/audio/transcriptions (whisper.cpp standard)
  const formV1 = new FormData();
  formV1.append('file', Readable.from(audioBuffer), {
    filename,
    contentType: mimeType,
    knownLength: audioBuffer.length,
  });
  formV1.append('model', WHISPER_MODEL);
  formV1.append('response_format', 'json');

  let res;
  try {
    res = await fetch(`${WHISPER_BASE_URL}/v1/audio/transcriptions`, {
      method: 'POST',
      body: formV1,
      headers: formV1.getHeaders(),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (err) {
    const isConnRefused =
      err.code === 'ECONNREFUSED' ||
      err.cause?.code === 'ECONNREFUSED' ||
      err.message?.includes('ECONNREFUSED') ||
      err.message?.includes('fetch failed');

    if (isConnRefused) {
      throw new Error(
        `Whisper server is not reachable at ${WHISPER_BASE_URL}. Ensure Docker container is running.`
      );
    }
    throw new Error(`Transcription request failed: ${err.message}`);
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Whisper server error ${res.status}: ${body}`);
  }

  const json = await res.json();
  return json.text ?? json.results?.[0]?.transcript ?? '';
}

// ── OpenAI Whisper API (production) ───────────────────────────────────────────

async function transcribeWithOpenAI(audioBuffer, mimeType) {
  if (!openaiClient) {
    throw new Error('OPENAI_API_KEY is not configured in .env');
  }

  const ext = mimeTypeToExtension(mimeType);
  const filename = `audio.${ext}`;

  const file = new File([audioBuffer], filename, { type: mimeType });

  const transcription = await openaiClient.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    response_format: 'json',
  });

  return transcription.text || '';
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function mimeTypeToExtension(mimeType) {
  if (mimeType.includes('webm')) return 'webm';
  if (mimeType.includes('ogg')) return 'ogg';
  if (mimeType.includes('mp4') || mimeType.includes('m4a')) return 'm4a';
  if (mimeType.includes('wav')) return 'wav';
  if (mimeType.includes('mp3') || mimeType.includes('mpeg')) return 'mp3';
  return 'webm';
}
