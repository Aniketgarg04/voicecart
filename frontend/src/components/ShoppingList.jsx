import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ShoppingBag, CheckCheck, Trash2, Filter, Plus, ArrowUpDown } from 'lucide-react';
import ListItem from './ListItem';
import { CATEGORIES } from '../utils/constants';
import useShoppingStore from '../store/useShoppingStore';
import axios from 'axios';

export default function ShoppingList() {
  const items           = useShoppingStore((s) => s.items);
  const setItems         = useShoppingStore((s) => s.setItems);
  const setShowAddModal = useShoppingStore((s) => s.setShowAddModal);
  const userId          = useShoppingStore((s) => s.userId);
  const addDirectItem   = useShoppingStore((s) => s.addDirectItem);

  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'pending' | 'completed'
  const [selectedCat, setSelectedCat] = useState('all');

  const activeItems    = (items || []).filter((i) => i && !i.isCompleted);
  const completedItems = (items || []).filter((i) => i && i.isCompleted);

  // Apply filters
  const filteredItems = (items || []).filter((item) => {
    if (!item) return false;
    if (filterMode === 'pending' && item.isCompleted) return false;
    if (filterMode === 'completed' && !item.isCompleted) return false;
    if (selectedCat !== 'all' && item.category !== selectedCat) return false;
    return true;
  });

  // Group active items by category
  const grouped = filteredItems.reduce((acc, item) => {
    const cat = item.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const catKeys = Object.keys(grouped);

  // Clear all completed items
  const handleClearCompleted = async () => {
    const remaining = items.filter((i) => !i.isCompleted);
    setItems(remaining);
    try {
      await axios.delete('/api/items?completed=true', {
        headers: { 'x-user-id': userId },
      });
    } catch (err) {
      console.error('Failed to clear completed items:', err);
    }
  };

  const handleQuickAdd = (name, category, quantity = 1, unit = 'piece') => {
    addDirectItem({ name, category, quantity, unit });
  };

  return (
    <div className="pro-card p-4 sm:p-6 flex flex-col flex-1 min-h-[480px]">
      
      {/* Top Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border-color)]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
              Shopping List
            </h2>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Organized automatically by grocery department
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter Tabs */}
          <div className="flex items-center bg-[var(--bg-surface-subtle)] p-1 rounded-lg border border-[var(--border-color)] text-xs">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                filterMode === 'all'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              All ({items.length})
            </button>
            <button
              onClick={() => setFilterMode('pending')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                filterMode === 'pending'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              To Buy ({activeItems.length})
            </button>
            {completedItems.length > 0 && (
              <button
                onClick={() => setFilterMode('completed')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                  filterMode === 'completed'
                    ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Done ({completedItems.length})
              </button>
            )}
          </div>

          {/* Clear Completed Action */}
          {completedItems.length > 0 && (
            <button
              onClick={handleClearCompleted}
              className="pro-btn pro-btn-secondary text-xs py-1 px-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border-red-200 dark:border-red-900/40"
              title="Remove checked off items"
            >
              <Trash2 className="w-3 h-3" />
              <span className="hidden sm:inline">Clear Done</span>
            </button>
          )}
        </div>
      </div>

      {/* Main List Body */}
      <div className="flex-1 py-3 overflow-y-auto max-h-[620px] scrollbar-thin">
        {filteredItems.length === 0 ? (
          <EmptyListState onQuickAdd={handleQuickAdd} onOpenAdd={() => setShowAddModal(true)} />
        ) : (
          <div className="flex flex-col gap-6">
            {catKeys.map((catKey) => {
              const catConfig = CATEGORIES[catKey] || CATEGORIES.other;
              const catItems = grouped[catKey];

              return (
                <div key={catKey} className="flex flex-col gap-2">
                  
                  {/* Category Header */}
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{catConfig.emoji}</span>
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                        {catConfig.label}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-[var(--text-muted)] bg-[var(--bg-surface-subtle)] px-2 py-0.5 rounded-full border border-[var(--border-color)]">
                      {catItems.length} {catItems.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>

                  {/* Category Item Cards */}
                  <div className="flex flex-col gap-2">
                    <AnimatePresence mode="popLayout">
                      {catItems.map((item) => (
                        <ListItem key={item._id} item={item} />
                      ))}
                    </AnimatePresence>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}

function EmptyListState({ onQuickAdd, onOpenAdd }) {
  const suggestions = [
    { name: 'Whole Milk', category: 'dairy', emoji: '🥛', unit: 'litre' },
    { name: 'Organic Apples', category: 'produce', emoji: '🍎', unit: 'kg' },
    { name: 'Sourdough Bread', category: 'bakery', emoji: '🍞', unit: 'loaf' },
    { name: 'Eggs', category: 'dairy', emoji: '🥚', unit: 'dozen' },
    { name: 'Avocado', category: 'produce', emoji: '🥑', unit: 'piece' },
    { name: 'Cold Brew Coffee', category: 'beverages', emoji: '☕', unit: 'bottle' },
  ];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white mb-4 shadow-lg shadow-emerald-500/25 animate-float">
        <ShoppingBag className="w-8 h-8 text-white" />
      </div>

      <h3 className="text-lg font-bold text-[var(--text-primary)]">
        Your Shopping List is Empty
      </h3>
      <p className="text-xs text-[var(--text-secondary)] mt-1.5 max-w-sm leading-relaxed">
        Speak naturally with voice commands like <strong>"Add 2 litres of milk"</strong> or click any staple below to add it instantly.
      </p>


      <button
        type="button"
        onClick={onOpenAdd}
        className="mt-6 pro-btn pro-btn-primary text-xs sm:text-sm py-2.5 px-5 rounded-xl shadow-md shadow-indigo-500/25"
      >
        <Plus className="w-4 h-4" />
        Add Custom Item
      </button>
    </div>
  );
}
