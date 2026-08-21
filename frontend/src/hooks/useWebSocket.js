import { useEffect, useRef, useCallback } from 'react';
import useShoppingStore from '../store/useShoppingStore';
import useToastStore from '../store/useToastStore';
import { WS_URL, WS_STATUS, VOICE_STATES } from '../utils/constants';

const RECONNECT_DELAY_MS = 3000;
const PING_INTERVAL_MS   = 25_000;

export function useWebSocket(userId) {
  const wsRef         = useRef(null);
  const pingRef       = useRef(null);
  const reconnectRef  = useRef(null);
  const mountedRef    = useRef(true);
  const userIdRef     = useRef(userId);

  // Keep userId ref current without triggering reconnects
  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  // ── Send helpers (stable refs, never recreate) ─────────────────────────────
  const send = useCallback((data) => {
    const socket = wsRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(data));
    } else {
      console.warn('[WS] send() called but socket not open, state:', socket?.readyState);
    }
  }, []);

  const sendBinary = useCallback((buffer) => {
    const socket = wsRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(buffer);
    }
  }, []);

  // ── Message handler (reads from store directly, no closure deps) ───────────
  const handleMessage = useCallback((event) => {
    const store = useShoppingStore.getState();
    const { addToast } = useToastStore.getState();
    let msg;
    try { msg = JSON.parse(event.data); }
    catch { return; }

    switch (msg.type) {
      case 'connected':
        store.setClientId(msg.clientId);
        if (msg.userId) store.setUserId(msg.userId);
        // Request initial list load
        send({ type: 'load_list' });
        break;

      case 'pong':
        break;

      case 'transcript':
        store.setTranscript(msg.text);
        break;

      case 'status':
        if (msg.phase === 'transcribing') store.setVoiceState(VOICE_STATES.TRANSCRIBING);
        if (msg.phase === 'processing')   store.setVoiceState(VOICE_STATES.PROCESSING);
        break;

      case 'list_update':
        store.setItems(msg.items ?? []);
        break;

      case 'suggestions':
        store.setSuggestions(msg.items ?? []);
        break;

      case 'search_results':
        store.setSearchResults(msg.items ?? []);
        break;

      case 'response':
        store.setAiMessage(msg.message ?? '');
        store.setVoiceState(VOICE_STATES.IDLE);
        if (msg.suggestions?.length) store.setSuggestions(msg.suggestions);
        break;

      case 'action':
        const actionName = msg.result?.action || msg.action;
        if (actionName === 'navigate_checkout') {
          store.setActiveTab('checkout');
        } else if (actionName === 'generate_bill') {
          store.setActiveTab('checkout');
          window.dispatchEvent(new CustomEvent('generate-bill'));
        }
        // Emit real-time toast for the action result
        if (msg.result) {
          const r = msg.result;
          if (r.outOfStock) {
            const subs = r.substitutes?.length ? ` Try: ${r.substitutes.slice(0, 2).join(' or ')}.` : '';
            addToast({ message: `⚠️ ${r.itemName} is out of stock.${subs}`, type: 'warning', duration: 6000 });
          } else if (!r.success && r.error) {
            addToast({ message: r.error, type: 'error', duration: 5000 });
          } else if (r.success) {
            switch (r.action) {
              case 'added':      addToast({ message: `✅ Added ${r.item?.name} to your list!`, type: 'success' }); break;
              case 'removed':    addToast({ message: `🗑️ Removed ${r.item?.name} from your list.`, type: 'info' }); break;
              case 'updated':    addToast({ message: `✏️ Updated ${r.item?.name} to ${r.item?.quantity} ${r.item?.unit}.`, type: 'success' }); break;
              case 'completed':  addToast({ message: `✔️ ${r.item?.name} marked as done.`, type: 'success' }); break;
              case 'unmarked':   addToast({ message: `↩️ ${r.item?.name} added back to your list.`, type: 'info' }); break;
              case 'cleared_completed': addToast({ message: `🧹 Cleared ${r.count} completed item(s).`, type: 'info' }); break;
              case 'cleared_all':       addToast({ message: `🗑️ Cleared your entire shopping list.`, type: 'warning' }); break;
              case 'navigate_checkout': break; // handled above
              case 'generate_bill':     addToast({ message: `📄 Generating your bill now!`, type: 'success' }); break;
              default: break;
            }
            // check_item_stock success with found=true
            if (msg.tool === 'check_item_stock' && r.found) {
              const stockMsg = r.inStock ? `✅ ${r.itemName} is in stock at $${r.price?.toFixed(2)}.` : `⚠️ ${r.itemName} is currently out of stock.`;
              addToast({ message: stockMsg, type: r.inStock ? 'success' : 'warning', duration: 5000 });
            }
            if (msg.tool === 'check_item_stock' && !r.found) {
              addToast({ message: `${r.message || 'Item not found in catalog.'}`, type: 'info' });
            }
          }
        }
        break;

      case 'error':
        store.setError(msg.message);
        store.setVoiceState(VOICE_STATES.IDLE);
        setTimeout(() => useShoppingStore.getState().clearError(), 4000);
        break;

      default:
        break;
    }
  }, [send]);

  // ── Connection lifecycle (runs once on mount) ──────────────────────────────
  useEffect(() => {
    mountedRef.current = true;

    function connect() {
      if (!mountedRef.current) return;

      // Don't open a second socket if one is already active
      const existing = wsRef.current;
      if (existing && (existing.readyState === WebSocket.OPEN || existing.readyState === WebSocket.CONNECTING)) {
        return;
      }

      useShoppingStore.getState().setWsStatus(WS_STATUS.CONNECTING);

      const uid = userIdRef.current || 'local-dev-user';
      const url = `${WS_URL}?userId=${encodeURIComponent(uid)}`;
      const socket = new WebSocket(url);
      wsRef.current = socket;

      socket.onopen = () => {
        if (!mountedRef.current) {
          socket.close();
          return;
        }
        console.log('[WS] Connected');
        useShoppingStore.getState().setWsStatus(WS_STATUS.CONNECTED);

        // Heartbeat
        clearInterval(pingRef.current);
        pingRef.current = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'ping' }));
          }
        }, PING_INTERVAL_MS);
      };

      socket.onmessage = handleMessage;

      socket.onclose = () => {
        clearInterval(pingRef.current);
        wsRef.current = null;
        if (!mountedRef.current) return;
        console.log('[WS] Disconnected, reconnecting in', RECONNECT_DELAY_MS, 'ms');
        useShoppingStore.getState().setWsStatus(WS_STATUS.DISCONNECTED);
        reconnectRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
      };

      socket.onerror = (err) => {
        console.warn('[WS] Error:', err);
        useShoppingStore.getState().setWsStatus(WS_STATUS.ERROR);
      };
    }

    connect();

    return () => {
      mountedRef.current = false;
      clearInterval(pingRef.current);
      clearTimeout(reconnectRef.current);
      const socket = wsRef.current;
      if (socket) {
        socket.onclose = null; // prevent reconnect on intentional close
        socket.onerror = null;
        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
          socket.close();
        }
      }
      wsRef.current = null;
    };
  }, [handleMessage]); // handleMessage is stable (only depends on stable `send`)

  return { send, sendBinary, ws: wsRef };
}
