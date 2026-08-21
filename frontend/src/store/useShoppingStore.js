import { create } from 'zustand';
import { VOICE_STATES, WS_STATUS } from '../utils/constants';
import axios from 'axios';

// Initialize theme from localStorage
const initialTheme = localStorage.getItem('vcsa_theme') || 'light';

const getInitialUserId = () => {
  if (typeof window === 'undefined') return 'local-dev-user';
  let uid = sessionStorage.getItem('vcsa_user_id');
  if (!uid) {
    uid = `user-${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem('vcsa_user_id', uid);
  }
  return uid;
};

const getInitialUserDetails = () => {
  if (typeof window === 'undefined') return null;
  const data = sessionStorage.getItem('vcsa_user_details');
  return data ? JSON.parse(data) : null;
};

const initialUserId = getInitialUserId();
const initialUserDetails = getInitialUserDetails();

const useShoppingStore = create((set, get) => ({
  // ── Theme & Navigation ──────────────────────────────────────────────────
  theme: initialTheme,
  activeTab: 'list', // 'list' | 'catalog' | 'suggestions'
  
  // ── Connection ────────────────────────────────────────────────────────────
  wsStatus: WS_STATUS.DISCONNECTED,
  clientId: null,
  userId: initialUserId,
  userDetails: initialUserDetails,

  setUserDetails: (details) => {
    sessionStorage.setItem('vcsa_user_details', JSON.stringify(details));
    set({ userDetails: details });
  },

  // ── Voice pipeline ────────────────────────────────────────────────────────
  voiceState: VOICE_STATES.IDLE,
  transcript: '',
  audioLevel: 0, // 0–1, for waveform animation
  aiMessage: '', // last text response from AI
  recentVoiceLogs: [], // History of voice actions

  // ── Data ──────────────────────────────────────────────────────────────────
  items: [],
  catalog: [],
  suggestions: [],
  searchResults: [],
  catalogCategory: 'all',
  catalogSearchQuery: '',
  isLoadingCatalog: false,
  isLoadingItems: false,

  // ── UI flags ──────────────────────────────────────────────────────────────
  error: null,
  showSearch: false,
  showAddModal: false,

  // ── Actions ───────────────────────────────────────────────────────────────
  setTheme: (theme) => {
    localStorage.setItem('vcsa_theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.setAttribute('data-theme', theme);
    set({ theme });
  },

  toggleTheme: () => {
    const nextTheme = get().theme === 'light' ? 'dark' : 'light';
    get().setTheme(nextTheme);
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setWsStatus: (s) => set({ wsStatus: s }),
  setClientId: (id) => set({ clientId: id }),
  setUserId: (id) => set({ userId: id }),
  setVoiceState: (s) => set({ voiceState: s }),
  setTranscript: (t) => set({ transcript: t || '' }),
  setAudioLevel: (l) => set({ audioLevel: Math.min(1, Math.max(0, l)) }),
  
  setAiMessage: (m) => {
    if (m) {
      set((s) => ({
        aiMessage: m,
        recentVoiceLogs: [
          { text: m, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), id: Date.now() },
          ...s.recentVoiceLogs.slice(0, 9)
        ]
      }));
    } else {
      set({ aiMessage: '' });
    }
  },

  setItems: (rawItems) => {
    const validItems = (rawItems || []).filter((i) => i && i.name && typeof i.name === 'string');
    set({ items: validItems });
  },

  setCatalog: (catalog) => set({ catalog: catalog || [] }),
  setCatalogCategory: (cat) => set({ catalogCategory: cat }),
  setCatalogSearchQuery: (q) => set({ catalogSearchQuery: q }),
  setSuggestions: (items) => set({ suggestions: items || [] }),
  setSearchResults: (items) => set({ searchResults: items || [], showSearch: (items || []).length > 0 }),
  clearSearch: () => set({ searchResults: [], showSearch: false }),
  setError: (msg) => set({ error: msg }),
  clearError: () => set({ error: null }),
  setShowAddModal: (show) => set({ showAddModal: show }),

  // ── Fetch Initial Items via REST ──────────────────────────────────────────
  fetchItems: async () => {
    const uid = get().userId || 'local-dev-user';
    set({ isLoadingItems: true });
    try {
      const res = await axios.get(`/api/items?userId=${encodeURIComponent(uid)}`);
      if (res.data?.items) {
        const validItems = (res.data.items || []).filter((i) => i && i.name && typeof i.name === 'string');
        set({ items: validItems, isLoadingItems: false });
      }
    } catch (err) {
      console.error('Failed to fetch items:', err);
      set({ isLoadingItems: false });
    }
  },

  // ── Fetch Suggestions via REST ────────────────────────────────────────────
  fetchSuggestions: async () => {
    const uid = get().userId || 'local-dev-user';
    try {
      const res = await axios.get(`/api/suggestions?userId=${encodeURIComponent(uid)}`);
      if (res.data?.suggestions) {
        set({ suggestions: res.data.suggestions });
      }
    } catch (err) {
      console.error('Failed to fetch suggestions:', err);
    }
  },

  // ── Optimistic List Mutations ─────────────────────────────────────────────
  removeItemOptimistic: (id) =>
    set((s) => ({ items: (s.items || []).filter((i) => i && i._id !== id) })),

  toggleCompleteOptimistic: (id) =>
    set((s) => ({
      items: (s.items || []).map((i) =>
        i && i._id === id ? { ...i, isCompleted: !i.isCompleted } : i
      ),
    })),

  updateQuantityOptimistic: async (id, delta) => {
    const item = (get().items || []).find((i) => i && i._id === id);
    if (!item) return;

    const newQty = Math.max(1, (Number(item.quantity) || 1) + delta);
    set((s) => ({
      items: (s.items || []).map((i) =>
        i && i._id === id ? { ...i, quantity: newQty } : i
      ),
    }));

    try {
      await axios.patch(`/api/items/${id}`, { quantity: newQty });
    } catch (err) {
      console.error('Failed to update quantity:', err);
    }
  },

  // ── Fetch Catalog Products ────────────────────────────────────────────────
  fetchCatalog: async () => {
    set({ isLoadingCatalog: true });
    try {
      const res = await axios.get('/api/catalog');
      if (res.data?.products) {
        set({ catalog: res.data.products, isLoadingCatalog: false });
      }
    } catch (err) {
      console.error('Failed to fetch catalog:', err);
      set({ isLoadingCatalog: false });
    }
  },

  // ── Direct Instant Add Item (Optimistic + REST) ───────────────────────────
  addDirectItem: async (param) => {
    const rawName = typeof param === 'string' ? param : param?.name;
    if (!rawName || typeof rawName !== 'string' || !rawName.trim()) {
      return { success: false, error: 'Item name is required' };
    }

    const cleanName = rawName.trim();
    const category  = typeof param === 'object' && param?.category ? param.category : 'produce';
    const quantity  = typeof param === 'object' && param?.quantity ? Math.max(1, Number(param.quantity) || 1) : 1;
    const unit      = typeof param === 'object' && param?.unit ? param.unit : 'piece';
    const notes     = typeof param === 'object' && param?.notes ? param.notes : '';
    const uid       = get().userId || 'local-dev-user';
    const tempId    = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    
    const optimisticItem = {
      _id: tempId,
      name: cleanName,
      category: category || 'other',
      quantity,
      unit: unit || 'piece',
      isCompleted: false,
      notes: notes || '',
      userId: uid,
      createdAt: new Date().toISOString(),
    };

    // 1. Instant UI update with 0ms delay
    set((s) => {
      const itemsList = Array.isArray(s.items) ? s.items : [];
      const targetName = cleanName.toLowerCase();
      const existingIdx = itemsList.findIndex(
        (i) => i?.name && typeof i.name === 'string' && i.name.trim().toLowerCase() === targetName
      );

      if (existingIdx >= 0) {
        const updated = [...itemsList];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: (Number(updated[existingIdx].quantity) || 1) + quantity,
          isCompleted: false,
        };
        return { items: updated, showAddModal: false };
      }

      return { items: [optimisticItem, ...itemsList], showAddModal: false };
    });

    // 2. Persist to MongoDB via REST API in background
    try {
      const res = await axios.post('/api/items', {
        name: cleanName,
        category,
        quantity,
        unit,
        notes,
        userId: uid,
      });

      if (res.data?.item) {
        const savedItem = res.data.item;
        set((s) => ({
          items: (s.items || []).map((i) => (i?._id === tempId ? savedItem : i)),
        }));
      }
      return { success: true };
    } catch (err) {
      console.error('Failed to save item to database:', err);
      return { success: false, error: err.message };
    }
  },
}));

export default useShoppingStore;
