import { useState, useEffect } from 'react';
import { Search, Plus, Leaf, Check, Tag, ShoppingCart } from 'lucide-react';
import { CATEGORIES } from '../utils/constants';
import CategoryBadge from './CategoryBadge';
import useShoppingStore from '../store/useShoppingStore';

export default function CatalogBrowser() {
  const catalog         = useShoppingStore((s) => s.catalog);
  const items           = useShoppingStore((s) => s.items);
  const fetchCatalog    = useShoppingStore((s) => s.fetchCatalog);
  const isLoading       = useShoppingStore((s) => s.isLoadingCatalog);
  const addDirectItem   = useShoppingStore((s) => s.addDirectItem);

  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [onlySeasonal, setOnlySeasonal] = useState(false);

  useEffect(() => {
    if (!catalog || catalog.length === 0) {
      fetchCatalog();
    }
  }, [catalog, fetchCatalog]);

  // Map of active items and their quantities
  const activeItemMap = new Map();
  (items || [])
    .filter((i) => i && !i.isCompleted && i.name)
    .forEach((i) => {
      activeItemMap.set(i.name.trim().toLowerCase(), Number(i.quantity) || 1);
    });

  const filtered = (catalog || []).filter((product) => {
    if (!product) return false;
    if (
      selectedCat !== 'all' &&
      (product.category || '').trim().toLowerCase() !== selectedCat.trim().toLowerCase()
    ) {
      return false;
    }
    if (onlySeasonal && !product.isSeasonal) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const matchName  = (product.name || '').toLowerCase().includes(q);
      const matchBrand = (product.brand || '').toLowerCase().includes(q);
      const matchCat   = (product.category || '').toLowerCase().includes(q);
      const matchTags  = (product.tags || []).some((t) => (t || '').toLowerCase().includes(q));
      if (!matchName && !matchBrand && !matchCat && !matchTags) return false;
    }
    return true;
  });

  const handleAdd = (product) => {
    if (!product?.name) return;
    addDirectItem({
      name: product.name,
      category: product.category || 'other',
      quantity: 1,
      unit: product.unit || 'piece',
    });
  };

  const catKeys = ['all', ...Object.keys(CATEGORIES)];

  return (
    <div className="pro-card p-4 sm:p-6 flex flex-col flex-1 min-h-[480px]">
      
      {/* Header & Filter Controls */}
      <div className="flex flex-col gap-3.5 pb-4 border-b border-[var(--border-color)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 flex-shrink-0">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                Product Catalog & Department Inventory
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Browse 40+ pantry staples, fresh dairy, and in-season organics
              </p>
            </div>
          </div>

          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800/60">
            {filtered.length} products
          </span>
        </div>

        {/* Search Bar & Seasonal Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products by name, brand, or tag (e.g. Milk, Silk, Apples, Organic)..."
              className="w-full bg-[var(--bg-surface-subtle)] text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] pl-9 pr-4 py-2.5 rounded-xl border border-[var(--border-color)] focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          <button
            type="button"
            onClick={() => setOnlySeasonal(!onlySeasonal)}
            className={`pro-btn text-xs py-2 px-3.5 rounded-xl border flex-shrink-0 w-full sm:w-auto transition-all ${
              onlySeasonal
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 font-semibold'
                : 'pro-btn-secondary'
            }`}
          >
            <Leaf className="w-3.5 h-3.5" />
            <span>🍃 In-Season Only</span>
          </button>
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {catKeys.map((k) => {
            const isAll = k === 'all';
            const cat = CATEGORIES[k];
            const isSelected = selectedCat.toLowerCase() === k.toLowerCase();

            return (
              <button
                key={k}
                type="button"
                onClick={() => setSelectedCat(k)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm scale-105'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                }`}
              >
                {!isAll && <span>{cat?.emoji}</span>}
                <span>{isAll ? '✨ All Departments' : cat?.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Products Grid */}
      <div className="flex-1 py-4 overflow-y-auto max-h-[580px] scrollbar-thin">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-xs text-[var(--text-muted)]">
            Loading catalog inventory...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 px-4">
            <p className="text-sm font-bold text-[var(--text-primary)]">
              No products found in this department
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Try switching back to "All Departments" or clearing your search filter.
            </p>
            <button
              onClick={() => { setSelectedCat('all'); setSearch(''); setOnlySeasonal(false); }}
              className="mt-4 pro-btn pro-btn-primary text-xs py-1.5 px-4 rounded-xl"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filtered.map((product) => {
              const pKey = (product.name || '').trim().toLowerCase();
              const inListQty = activeItemMap.get(pKey);
              const inList = Boolean(inListQty);

              return (
                <div
                  key={product._id || product.name}
                  className="flex flex-col justify-between p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-[var(--border-hover)] hover:shadow-card transition-all group"
                >
                  <div>
                    {/* Top Tag & Category */}
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <CategoryBadge category={product.category} size="xs" />
                      {product.isSeasonal && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/50">
                          <Leaf className="w-2.5 h-2.5" />
                          In Season
                        </span>
                      )}
                    </div>

                    {/* Title & Brand */}
                    <h3 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                      <Tag className="w-3 h-3" />
                      {product.brand && product.brand !== 'Generic' ? product.brand : 'Store Brand'}
                    </p>

                    {/* Substitutes info */}
                    {product.substitutes?.length > 0 && (
                      <div className="mt-2 text-[11px] text-[var(--text-secondary)] bg-[var(--bg-surface-subtle)] px-2 py-1 rounded-md border border-[var(--border-color)]">
                        <span className="text-[var(--text-muted)] font-medium">Alt: </span>
                        {product.substitutes.slice(0, 2).join(', ')}
                      </div>
                    )}
                  </div>

                  {/* Bottom: Price + Action Button */}
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-[var(--border-color)]">
                    <div>
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        ${product.price?.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] ml-1">
                        /{product.unit || 'ea'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAdd(product)}
                      className={`pro-btn text-xs py-1.5 px-3 rounded-lg transition-all active:scale-95 ${
                        inList
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700 font-semibold'
                          : 'pro-btn-primary'
                      }`}
                    >
                      {inList ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Added ({inListQty})</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to List</span>
                        </>
                      )}
                    </button>
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
