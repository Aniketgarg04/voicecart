import { Search, X, Plus, Tag, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useShoppingStore from '../store/useShoppingStore';
import CategoryBadge from './CategoryBadge';

export default function SearchResults({ onSendText }) {
  const results     = useShoppingStore((s) => s.searchResults);
  const clearSearch = useShoppingStore((s) => s.clearSearch);
  const items       = useShoppingStore((s) => s.items);

  const addDirectItem = useShoppingStore((s) => s.addDirectItem);

  if (!results || results.length === 0) return null;

  const activeNames = new Set(
    (items || [])
      .filter((i) => i && !i.isCompleted && i.name)
      .map((i) => i.name.trim().toLowerCase())
  );

  const handleAdd = (item) => {
    const pName = typeof item === 'string' ? item : item?.name;
    const pCat  = item?.category || 'other';
    const pUnit = item?.unit || 'piece';
    if (pName) {
      addDirectItem({ name: pName, category: pCat, quantity: 1, unit: pUnit });
    }
  };

  return (
    <div className="pro-card p-4 sm:p-6 mb-6 border-indigo-200 dark:border-indigo-800/60 bg-gradient-to-b from-[var(--bg-surface)] to-[var(--bg-surface-subtle)] shadow-md">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Search className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Voice Search Results
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Found {results.length} matching item{results.length === 1 ? '' : 's'} in inventory
            </p>
          </div>
        </div>

        <button
          onClick={clearSearch}
          className="pro-btn pro-btn-secondary text-xs py-1 px-2"
          aria-label="Dismiss search results"
        >
          <X className="w-3.5 h-3.5" />
          <span>Dismiss</span>
        </button>
      </div>

      {/* Grid of Results */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-3">
        {results.map((product) => {
          const inList = activeNames.has(product.name.toLowerCase());

          return (
            <div
              key={product._id || product.name}
              className="p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <CategoryBadge category={product.category} size="xs" />
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    ${product.price?.toFixed(2)}
                  </span>
                </div>

                <h4 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate">
                  {product.name}
                </h4>

                {product.brand && (
                  <p className="text-[11px] text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                    <Tag className="w-2.5 h-2.5" />
                    {product.brand}
                  </p>
                )}
              </div>

              <div className="pt-2.5 mt-2 border-t border-[var(--border-color)] flex items-center justify-between">
                <span className="text-[11px] text-[var(--text-muted)]">
                  /{product.unit || 'piece'}
                </span>

                <button
                  type="button"
                  onClick={() => handleAdd(product)}
                  disabled={inList || !product.inStock}
                  className={`pro-btn text-xs py-1 px-2.5 rounded-lg ${
                    inList
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200'
                      : 'pro-btn-primary'
                  }`}
                >
                  {inList ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Added</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3 h-3" />
                      <span>Add to List</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
