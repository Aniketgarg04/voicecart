import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

import connectDB from './config/db.js';
import apiRoutes from './routes/api.js';
import { errorHandler } from './middleware/errorHandler.js';
import { transcribeAudio } from './services/transcriptionService.js';
import { processCommand } from './services/aiService.js';
import { executeTool } from './tools/toolExecutor.js';
import { ShoppingItem } from './models/ShoppingItem.js';

// ── Express ───────────────────────────────────────────────────────────────────

const app = express();
const httpServer = createServer(app);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use('/api', apiRoutes);
app.use(errorHandler);

// ── WebSocket Server ──────────────────────────────────────────────────────────

const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

/** @type {Map<string, ClientState>} */
const clients = new Map();

wss.on('connection', (ws, req) => {
  const clientId = uuidv4();
  const url = new URL(req.url, `http://${req.headers.host}`);
  const userId = url.searchParams.get('userId') || process.env.DEFAULT_USER_ID || 'anonymous';

  /** @type {ClientState} */
  const state = {
    ws,
    userId,
    audioChunks: [],
    audioMimeType: 'audio/webm',
    conversationHistory: [],
    isProcessing: false,
  };

  clients.set(clientId, state);
  console.log(`[WS] Client connected: ${clientId}  userId: ${userId}`);

  const send = (data) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(data));
    }
  };

  // ── Message Handler ─────────────────────────────────────────────────────────

  ws.on('message', async (data, isBinary) => {
    // Binary = raw audio chunk
    if (isBinary) {
      state.audioChunks.push(Buffer.from(data));
      return;
    }

    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch {
      send({ type: 'error', message: 'Invalid message format — expected JSON' });
      return;
    }

    switch (msg.type) {
      case 'ping':
        send({ type: 'pong', ts: Date.now() });
        break;

      // ── Audio pipeline end ────────────────────────────────────────────────
      case 'audio_end': {
        if (state.isProcessing) {
          send({ type: 'error', message: 'Already processing a command' });
          return;
        }
        if (state.audioChunks.length === 0) {
          send({ type: 'error', message: 'No audio received' });
          return;
        }

        const audioBuffer = Buffer.concat(state.audioChunks);
        state.audioChunks = [];
        state.audioMimeType = msg.mimeType || state.audioMimeType;
        state.isProcessing = true;

        try {
          send({ type: 'status', phase: 'transcribing' });
          const transcript = await transcribeAudio(audioBuffer, state.audioMimeType);

          if (!transcript?.trim()) {
            send({ type: 'error', message: "Couldn't understand that — please try again." });
            return;
          }

          send({ type: 'transcript', text: transcript });
          send({ type: 'status', phase: 'processing' });
          await runAgenticLoop(state, transcript, send);
        } catch (err) {
          console.error('[Pipeline]', err.message);
          send({ type: 'error', message: err.message });
        } finally {
          state.isProcessing = false;
        }
        break;
      }

      // ── Text command (dev / fallback) ─────────────────────────────────────
      case 'text_command': {
        if (state.isProcessing) {
          console.log(`[WS] Rejecting text_command — already processing for ${userId}`);
          send({ type: 'error', message: 'Already processing a command — please wait.' });
          return;
        }
        const text = msg.text?.trim();
        if (!text) return;

        state.isProcessing = true;
        console.log(`[WS] text_command received: "${text}" from ${userId}`);
        try {
          send({ type: 'transcript', text });
          send({ type: 'status', phase: 'processing' });
          await runAgenticLoop(state, text, send);
        } catch (err) {
          console.error('[Pipeline]', err.message);
          send({ type: 'error', message: err.message });
        } finally {
          state.isProcessing = false;
          console.log(`[WS] text_command complete for ${userId}`);
        }
        break;
      }

      // ── Client requests initial list load ─────────────────────────────────
      case 'load_list': {
        try {
          const items = await ShoppingItem.find({
            userId: state.userId,
            isCompleted: false,
          })
            .sort({ category: 1, createdAt: -1 })
            .lean();
          send({ type: 'list_update', items });
        } catch (err) {
          send({ type: 'error', message: 'Failed to load list' });
        }
        break;
      }

      default:
        send({ type: 'error', message: `Unknown message type: ${msg.type}` });
    }
  });

  ws.on('close', () => {
    clients.delete(clientId);
    console.log(`[WS] Client disconnected: ${clientId}`);
  });

  ws.on('error', (err) => {
    console.error(`[WS] Error for ${clientId}:`, err.message);
    clients.delete(clientId);
  });

  // Greet the client
  send({ type: 'connected', clientId, userId });
});

// ── Agentic Loop ──────────────────────────────────────────────────────────────

const LIST_MUTATING_TOOLS = new Set([
  'add_item_to_db',
  'remove_item_from_db',
  'update_item_quantity',
  'mark_item_complete',
  'unmark_item',
  'clear_completed_items',
  'clear_all_items',
]);

async function runAgenticLoop(state, userText, send) {
  state.conversationHistory.push({ role: 'user', content: userText });

  try {
    console.log(`[Agent] Calling AI with ${state.conversationHistory.length} messages...`);
    const startTime = Date.now();
    const result = await processCommand(state.conversationHistory, state.userId);
    console.log(`[Agent] AI responded in ${Date.now() - startTime}ms`);

    if (result.toolCall) {
      const { name, parameters } = result.toolCall;
      console.log(`[Agent] Tool call: ${name}`, parameters);

      const toolResult = await executeTool(name, parameters, state.userId);

      // Push to history — if out of stock, inject that fact so AI can follow up intelligently
      let assistantContext = result.message || `Executed ${name}`;
      if (toolResult.outOfStock) {
        assistantContext = `${toolResult.itemName} is out of stock. Substitutes: ${toolResult.substitutes.join(', ') || 'none'}`;
      } else if (!toolResult.success && toolResult.error) {
        assistantContext = `Error: ${toolResult.error}`;
      }
      state.conversationHistory.push({ role: 'assistant', content: assistantContext });

      // Emit action event (with full result for frontend to interpret)
      send({ type: 'action', tool: name, parameters, result: toolResult });

      if (LIST_MUTATING_TOOLS.has(name)) {
        const items = await ShoppingItem.find({
          userId: state.userId,
          isCompleted: false,
        })
          .sort({ category: 1, createdAt: -1 })
          .lean();
        send({ type: 'list_update', items });
      }

      if (name === 'search_catalog') {
        send({ type: 'search_results', items: toolResult.results ?? [] });
      }

      if (name === 'get_suggestions') {
        send({ type: 'suggestions', items: toolResult.suggestions ?? [] });
      }

      // Determine message: use AI message if success, or friendly error message
      let finalMessage = result.message || `Updated your shopping list.`;
      if (toolResult.outOfStock) {
        const subs = toolResult.substitutes?.length ? ` Try: ${toolResult.substitutes.slice(0, 2).join(' or ')}.` : '';
        finalMessage = `⚠️ ${toolResult.itemName} is currently out of stock.${subs}`;
      } else if (!toolResult.success && toolResult.error) {
        finalMessage = `Sorry, I couldn't do that: ${toolResult.error}`;
      }

      // Send final response message so UI state transitions to IDLE
      send({
        type: 'response',
        message: finalMessage,
        toolResult,
        suggestions: result.suggestions ?? [],
      });
    } else {
      // Conversational response without tool call
      state.conversationHistory.push({
        role: 'assistant',
        content: result.message,
      });

      send({
        type: 'response',
        message: result.message,
        suggestions: result.suggestions ?? [],
      });
    }


    // Reset history on checkout / clear commands to keep context clean
    const toolName = result.toolCall?.name;
    if (toolName && ['navigate_to_checkout', 'generate_bill', 'clear_all_items', 'clear_completed_items'].includes(toolName)) {
      state.conversationHistory = [];
    }

    // Trim history to avoid unbounded context growth (keep it tight for small models)
    if (state.conversationHistory.length > 10) {
      state.conversationHistory = state.conversationHistory.slice(-8);
    }
  } catch (err) {
    console.error('[Agentic Loop Error]', err.message);
    send({ type: 'error', message: err.message || 'Error processing command' });
  }
}

// ── Boot ──────────────────────────────────────────────────────────────────────

connectDB().then(() => {
  const PORT = parseInt(process.env.PORT || '5000', 10);
  httpServer.listen(PORT, () => {
    console.log(`\n🚀  Server listening on http://localhost:${PORT}`);
    console.log(`🤖  AI Provider         : ${process.env.AI_PROVIDER || 'ollama'}`);
    console.log(`🎤  Transcription       : ${process.env.TRANSCRIPTION_PROVIDER || 'local'}`);
    console.log(`🌐  Frontend origin     : ${process.env.FRONTEND_URL || 'http://localhost:5173'}\n`);
  });
});
