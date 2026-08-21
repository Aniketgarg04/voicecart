import { Sparkles, Plus, Leaf, ArrowRight, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useShoppingStore from '../store/useShoppingStore';
import CategoryBadge from './CategoryBadge';

export default function SuggestionsPanel({ onSendText }) {
  const suggestions   = useShoppingStore((s) => s.suggestions);
  const items         = useShoppingStore((s) => s.items);
  const addDirectItem = useShoppingStore((s) => s.addDirectItem);

  const activeNames = new Set(
    (items || [])
      .filter((i) => i && !i.isCompleted && i.name)
      .map((i) => i.name.trim().toLowerCase())
  );

  const handleAdd = (product) => {
    const pName = typeof product === 'string' ? product : product?.name;
    const pCat  = product?.category || 'produce';
    const pUnit = product?.unit || 'piece';
    if (pName) {
      addDirectItem({ name: pName, category: pCat, quantity: 1, unit: pUnit });
    }
  };

  const handleRequestMore = () => {
    if (onSendText) {
      onSendText('What should I buy? Give me smart grocery recommendations');
    }
  };

  return (
    <div className="pro-card p-4 sm:p-6 flex flex-col flex-1 min-h-[480px]">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20 flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
              AI Smart Suggestions
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Personalized ideas, seasonal picks & healthier swaps
            </p>
          </div>
        </div>

        <button
          onClick={handleRequestMore}
          className="pro-btn pro-btn-secondary text-xs py-1.5 px-3"
          title="Ask Gemma for fresh suggestions"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 py-4 overflow-y-auto max-h-[580px] scrollbar-thin">
        {suggestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white mb-3 shadow-md shadow-amber-500/20 animate-float">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              No Suggestions Generated Yet
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1.5 max-w-xs leading-relaxed">
              Click the button below or say <strong>"What should I buy?"</strong> to get personalized recommendations based on the season.
            </p>
            <button
              onClick={handleRequestMore}
              className="mt-5 pro-btn pro-btn-primary text-xs py-2 px-5 rounded-xl shadow-md shadow-indigo-500/25"
            >
              Get AI Recommendations
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <AnimatePresence mode="popLayout">
              {suggestions.map((item, idx) => {
                const name = item.name || item;
                const price = typeof item.price === 'number' ? item.price : 3.49;
                const category = item.category || 'other';
                const isSeasonal = Boolean(item.isSeasonal);
                const substitutes = item.substitutes || [];
                const inList = activeNames.has(name.toLowerCase());

                return (
                  <motion.div
                    key={item._id || name || idx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18, delay: idx * 0.04 }}
                    className="p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-[var(--border-hover)] hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <CategoryBadge category={category} size="xs" />
                          {isSeasonal && (
                            <span className="flex items-center gap-1 text-[10px] uppercase tracking-wide font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 dark:text-emerald-100 dark:bg-emerald-800/80 dark:border-emerald-700 px-2.5 py-0.5 rounded-md shadow-sm">
                              <Leaf className="w-3 h-3" />
                              Peak Season
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-bold text-[var(--text-primary)] truncate">
                          {name}
                        </h4>

                        {item.brand && item.brand !== 'Generic' && (
                          <p className="text-xs text-[var(--text-muted)]">
                            Brand: {item.brand}
                          </p>
                        )}

                        {substitutes.length > 0 && (
                          <p className="text-[11px] text-[var(--text-secondary)] mt-1.5 bg-[var(--bg-surface-subtle)] px-2 py-1 rounded-md border border-[var(--border-color)]">
                            <span className="text-[var(--text-muted)] font-medium">Smart Swap: </span>
                            {substitutes.join(', ')}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          ${price.toFixed(2)}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleAdd(item)}
                          disabled={inList}
                          className={`pro-btn text-xs py-1 px-3 rounded-lg ${
                            inList
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200'
                              : 'pro-btn-primary'
                          }`}
                        >
                          {inList ? (
                            <span>In List</span>
                          ) : (
                            <>
                              <Plus className="w-3 h-3" />
                              <span>Add</span>
                            </>
                          )}
                        </button>
                      </div>

                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

    </div>
  );
}
