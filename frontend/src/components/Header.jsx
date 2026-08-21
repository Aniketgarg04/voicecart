import { ShoppingBag, Sun, Moon, Plus, CheckCircle2, DollarSign } from 'lucide-react';
import useShoppingStore from '../store/useShoppingStore';
import { WS_STATUS } from '../utils/constants';

export default function Header() {
  const wsStatus     = useShoppingStore((s) => s.wsStatus);
  const items        = useShoppingStore((s) => s.items);
  const catalog      = useShoppingStore((s) => s.catalog);
  const theme        = useShoppingStore((s) => s.theme);
  const toggleTheme  = useShoppingStore((s) => s.toggleTheme);
  const setShowAddModal = useShoppingStore((s) => s.setShowAddModal);

  const activeCount    = items.filter((i) => !i.isCompleted).length;
  const completedCount = items.filter((i) => i.isCompleted).length;
  const totalCount     = items.length;
  const progress       = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Calculate estimated total price by matching items to catalog prices
  const estimatedTotal = (items || []).reduce((sum, item) => {
    if (!item || item.isCompleted) return sum;
    const itemName = (item.name || '').trim().toLowerCase();
    if (!itemName) return sum;
    const match = (catalog || []).find((c) => c?.name && c.name.trim().toLowerCase() === itemName);
    const unitPrice = match?.price ? Number(match.price) : 3.5; // fallback average price $3.50
    return sum + unitPrice * (Number(item.quantity) || 1);
  }, 0);

  return (
    <header className="sticky top-0 z-30 bg-[var(--bg-surface)] border-b border-[var(--border-color)] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 flex-shrink-0">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-tight">
                VoiceCart
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] hidden sm:block">
              Voice-powered grocery & smart list manager
            </p>
          </div>
        </div>

        {/* Center: Real-time Stats Widget (Desktop & Tablet) */}
        <div className="hidden md:flex items-center gap-6 px-4 py-1.5 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-color)]">
          {/* Active Items */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500" />
            <span className="text-xs text-[var(--text-secondary)] font-medium">
              <strong className="text-[var(--text-primary)] font-semibold">{activeCount}</strong> to buy
            </span>
          </div>

          <div className="h-4 w-px bg-[var(--border-color)]" />

          {/* Estimated Budget */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[var(--text-secondary)] font-medium">Est. Total:</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              ${estimatedTotal.toFixed(2)}
            </span>
          </div>

          {/* Completion Progress */}
          {totalCount > 0 && (
            <>
              <div className="h-4 w-px bg-[var(--border-color)]" />
              <div className="flex items-center gap-2">
                <div className="w-20 bg-[var(--border-color)] rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-[11px] font-semibold text-[var(--text-muted)]">
                  {progress}%
                </span>
              </div>
            </>
          )}
        </div>

        {/* Right: Actions (Add Item, Theme Toggle, WS Status) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Add custom item manual button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="pro-btn pro-btn-primary text-xs sm:text-sm py-1.5 px-3 sm:px-4"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Item</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)] border border-[var(--border-color)] transition-colors"
            aria-label="Toggle theme"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

        </div>

      </div>
    </header>
  );
}

function ConnectionBadge({ status }) {
  const configs = {
    [WS_STATUS.CONNECTED]: {
      label: 'Live',
      dotClass: 'bg-emerald-500',
      badgeClass: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/50',
    },
    [WS_STATUS.CONNECTING]: {
      label: 'Connecting',
      dotClass: 'bg-amber-500 animate-pulse',
      badgeClass: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/50',
    },
    [WS_STATUS.DISCONNECTED]: {
      label: 'Offline',
      dotClass: 'bg-slate-400',
      badgeClass: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700',
    },
    [WS_STATUS.ERROR]: {
      label: 'Error',
      dotClass: 'bg-rose-500',
      badgeClass: 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800/50',
    },
  };

  const current = configs[status] || configs[WS_STATUS.DISCONNECTED];

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${current.badgeClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${current.dotClass}`} />
      <span className="hidden sm:inline">{current.label}</span>
    </div>
  );
}
