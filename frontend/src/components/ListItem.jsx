import { forwardRef } from 'react';
import { Check, Trash2, Plus, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import CategoryBadge from './CategoryBadge';
import axios from 'axios';
import useShoppingStore from '../store/useShoppingStore';

const ListItem = forwardRef(function ListItem({ item }, ref) {
  const { removeItemOptimistic, toggleCompleteOptimistic, updateQuantityOptimistic, catalog } = useShoppingStore.getState();

  // Match item to catalog for price estimation
  const itemName = (item?.name || '').trim().toLowerCase();
  const catalogItem = (catalog || []).find(
    (c) => c?.name && c.name.trim().toLowerCase() === itemName
  );
  const unitPrice = catalogItem?.price ? Number(catalogItem.price) : 3.49;
  const lineTotal = (unitPrice * (Number(item?.quantity) || 1)).toFixed(2);

  const isTemp = item?._id?.startsWith('temp-');

  const handleToggle = async () => {
    if (!item?._id || isTemp) return;
    toggleCompleteOptimistic(item._id);
    try {
      await axios.patch(`/api/items/${item._id}`, { isCompleted: !item.isCompleted });
    } catch {
      toggleCompleteOptimistic(item._id); // revert on error
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!item?._id || isTemp) return;
    removeItemOptimistic(item._id);
    try {
      await axios.delete(`/api/items/${item._id}`);
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const handleStepQty = (e, delta) => {
    e.stopPropagation();
    if (!item?._id || isTemp) return;
    updateQuantityOptimistic(item._id, delta);
  };

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`group flex items-center justify-between gap-3 p-3.5 rounded-xl border transition-all ${
        item.isCompleted
          ? 'bg-[var(--bg-surface-subtle)] border-transparent opacity-60'
          : 'bg-[var(--bg-surface)] border-[var(--border-color)] hover:border-[var(--border-hover)] hover:shadow-sm'
      }`}
    >
      {/* Left: Checkbox + Name + Category + Brand */}
      <div className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer" onClick={handleToggle}>
        <button
          type="button"
          onClick={handleToggle}
          className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors flex-shrink-0 ${
            item.isCompleted
              ? 'bg-emerald-500 border-emerald-500 text-white'
              : 'border-[var(--border-color)] group-hover:border-indigo-400 bg-[var(--bg-surface)]'
          }`}
          aria-label={item.isCompleted ? 'Mark as active' : 'Mark as completed'}
        >
          {item.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-semibold truncate ${
                item.isCompleted
                  ? 'line-through text-[var(--text-muted)]'
                  : 'text-[var(--text-primary)]'
              }`}
            >
              {item.name}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <CategoryBadge category={item.category} size="xs" />
            {item.notes && (
              <span className="text-[11px] text-[var(--text-muted)] truncate max-w-[140px]">
                {item.notes}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Quantity Stepper + Estimated Price + Delete */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        
        {/* Quantity Controls */}
        <div
          className="flex items-center border border-[var(--border-color)] rounded-lg bg-[var(--bg-surface-subtle)] p-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={(e) => handleStepQty(e, -1)}
            disabled={item.quantity <= 1 || item.isCompleted}
            className="w-6 h-6 rounded flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] disabled:opacity-30 transition-colors"
            title="Decrease quantity"
          >
            <Minus className="w-3 h-3" />
          </button>

          <span className="text-xs font-bold text-[var(--text-primary)] px-2 min-w-[28px] text-center">
            {item.quantity || 1}
            {item.unit && item.unit !== 'piece' && (
              <span className="text-[10px] text-[var(--text-muted)] font-normal ml-0.5">
                {item.unit}
              </span>
            )}
          </span>

          <button
            type="button"
            onClick={(e) => handleStepQty(e, 1)}
            disabled={item.isCompleted}
            className="w-6 h-6 rounded flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] disabled:opacity-30 transition-colors"
            title="Increase quantity"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {/* Estimated Price */}
        <div className="text-right min-w-[50px] hidden sm:block">
          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
            ${lineTotal}
          </div>
          <div className="text-[10px] text-[var(--text-muted)]">
            ${unitPrice.toFixed(2)}/ea
          </div>
        </div>

        {/* Delete action */}
        <button
          type="button"
          onClick={handleDelete}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
          title={`Remove ${item.name}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

      </div>
    </motion.div>
  );
});

export default ListItem;
