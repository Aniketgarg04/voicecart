import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ShoppingBag,
  Sparkles,
  Search,
  History,
  AlertCircle,
  X,
  ListFilter,
  Mic,
  ChevronRight,
  DollarSign,
} from 'lucide-react';

import Header from './components/Header';
import VoiceAssistantHero from './components/VoiceAssistantHero';
import ShoppingList from './components/ShoppingList';
import CatalogBrowser from './components/CatalogBrowser';
import SuggestionsPanel from './components/SuggestionsPanel';
import SearchResults from './components/SearchResults';
import VoiceHistoryPanel from './components/VoiceHistoryPanel';
import AddItemModal from './components/AddItemModal';
import Checkout from './components/Checkout';
import OnboardingModal from './components/OnboardingModal';
import ToastContainer from './components/ToastContainer';

import { useWebSocket } from './hooks/useWebSocket';
import { useVoiceCapture } from './hooks/useVoiceCapture';
import useShoppingStore from './store/useShoppingStore';

export default function App() {
  const userId            = useShoppingStore((s) => s.userId);
  const { send, sendBinary } = useWebSocket(userId);
  const { startListening, stopListening, sendTextCommand } = useVoiceCapture(sendBinary, send);

  const theme             = useShoppingStore((s) => s.theme);
  const setTheme          = useShoppingStore((s) => s.setTheme);
  const items             = useShoppingStore((s) => s.items);
  const catalog           = useShoppingStore((s) => s.catalog);
  const fetchCatalog      = useShoppingStore((s) => s.fetchCatalog);
  const fetchItems        = useShoppingStore((s) => s.fetchItems);
  const fetchSuggestions  = useShoppingStore((s) => s.fetchSuggestions);
  const activeTab         = useShoppingStore((s) => s.activeTab);
  const setActiveTab      = useShoppingStore((s) => s.setActiveTab);
  const error             = useShoppingStore((s) => s.error);
  const clearError        = useShoppingStore((s) => s.clearError);
  const showSearch        = useShoppingStore((s) => s.showSearch);
  const addDirectItem     = useShoppingStore((s) => s.addDirectItem);

  // Sync theme to DOM on mount and fetch initial data
  useEffect(() => {
    setTheme(theme);
    fetchCatalog();
    fetchItems();
    fetchSuggestions();
  }, []);

  const activeCount = (items || []).filter((i) => i && !i.isCompleted).length;

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] flex flex-col font-sans transition-colors pb-20 sm:pb-8">
      
      {/* Top Header Navigation */}
      <Header />

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6 flex-1">
        
        {/* Voice Assistant Hero Banner / Card */}
        <VoiceAssistantHero
          onPressStart={startListening}
          onPressEnd={stopListening}
          onSendText={sendTextCommand}
        />

        {/* Voice Search Results (Conditional) */}
        {showSearch && <SearchResults onSendText={sendTextCommand} />}

        {/* View Navigation Tabs */}
        <div className="flex items-center justify-between gap-2 border-b border-[var(--border-color)] pb-2 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('list')}
              className={`nav-tab-pill ${activeTab === 'list' ? 'active' : ''}`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Shopping List</span>
              {activeCount > 0 && (
                <span className="text-[11px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-500 text-white">
                  {activeCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('catalog')}
              className={`nav-tab-pill ${activeTab === 'catalog' ? 'active' : ''}`}
            >
              <ListFilter className="w-4 h-4" />
              <span>Browse Catalog</span>
              <span className="text-[11px] font-semibold text-[var(--text-muted)]">
                {catalog?.length || 40}+
              </span>
            </button>

            <button
              onClick={() => setActiveTab('suggestions')}
              className={`nav-tab-pill ${activeTab === 'suggestions' ? 'active' : ''}`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>AI Ideas & In-Season</span>
            </button>

            <button
              onClick={() => setActiveTab('checkout')}
              className={`nav-tab-pill ${activeTab === 'checkout' ? 'active' : ''}`}
            >
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span>Checkout</span>
            </button>
          </div>
        </div>

        {/* Tab Content Display */}
        <div className="flex-1">
          {activeTab === 'list' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left/Main Column: Shopping List (7 or 8 cols on desktop) */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                <ShoppingList />
              </div>

              {/* Right Column: AI Suggestions & Activity Log (4 cols on desktop) */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                <SuggestionsPanel onSendText={sendTextCommand} />
                <VoiceHistoryPanel />
              </div>

            </div>
          )}

          {activeTab === 'catalog' && (
            <CatalogBrowser
              onAddItem={(name, category, qty, unit) => {
                addDirectItem({ name, category, quantity: qty, unit });
              }}
            />
          )}

          {activeTab === 'suggestions' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7">
                <SuggestionsPanel onSendText={sendTextCommand} />
              </div>
              <div className="lg:col-span-5">
                <VoiceHistoryPanel />
              </div>
            </div>
          )}

          {activeTab === 'checkout' && (
            <Checkout />
          )}
        </div>

      </main>

      {/* Manual Add Custom Item Modal */}
      <AddItemModal />

      {/* User Onboarding Modal */}
      <OnboardingModal />

      {/* Real-time Toast Notifications */}
      <ToastContainer />

      {/* Mobile Sticky Bottom Navigation */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-surface)] border-t border-[var(--border-color)] px-4 py-2 flex items-center justify-around shadow-elevated">
        <button
          onClick={() => setActiveTab('list')}
          className={`flex flex-col items-center gap-1 text-[11px] font-semibold py-1 ${
            activeTab === 'list' ? 'text-indigo-600 dark:text-indigo-400' : 'text-[var(--text-muted)]'
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
          <span>My List</span>
        </button>

        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex flex-col items-center gap-1 text-[11px] font-semibold py-1 ${
            activeTab === 'catalog' ? 'text-indigo-600 dark:text-indigo-400' : 'text-[var(--text-muted)]'
          }`}
        >
          <ListFilter className="w-5 h-5" />
          <span>Catalog</span>
        </button>

        <button
          onClick={() => setActiveTab('suggestions')}
          className={`flex flex-col items-center gap-1 text-[11px] font-semibold py-1 ${
            activeTab === 'suggestions' ? 'text-indigo-600 dark:text-indigo-400' : 'text-[var(--text-muted)]'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span>Ideas</span>
        </button>

        <button
          onClick={() => setActiveTab('checkout')}
          className={`flex flex-col items-center gap-1 text-[11px] font-semibold py-1 ${
            activeTab === 'checkout' ? 'text-indigo-600 dark:text-indigo-400' : 'text-[var(--text-muted)]'
          }`}
        >
          <DollarSign className="w-5 h-5" />
          <span>Pay</span>
        </button>
      </nav>

      {/* Global Error Toast Notification */}
      <AnimatePresence>
        {error && (
          <motion.div
            key="global-error"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 sm:bottom-6 right-6 z-50 flex items-start gap-3 p-4 rounded-xl bg-rose-950/90 text-rose-200 border border-rose-800 shadow-2xl backdrop-blur-md max-w-sm"
          >
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-rose-100">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="text-rose-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
