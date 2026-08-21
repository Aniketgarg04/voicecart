import { useState } from 'react';
import { X, Plus, Sparkles } from 'lucide-react';
import { CATEGORIES } from '../utils/constants';
import useShoppingStore from '../store/useShoppingStore';

export default function AddItemModal() {
  const showModal       = useShoppingStore((s) => s.showAddModal);
  const setShowModal    = useShoppingStore((s) => s.setShowAddModal);
  const addDirectItem   = useShoppingStore((s) => s.addDirectItem);

  const [name, setName]         = useState('');
  const [category, setCategory] = useState('produce');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit]         = useState('piece');
  const [notes, setNotes]       = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!showModal) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    await addDirectItem({
      name: name.trim(),
      category,
      quantity: Number(quantity) || 1,
      unit,
      notes: notes.trim(),
    });
    setIsSubmitting(false);
    setName('');
    setNotes('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md pro-card p-6 bg-[var(--bg-surface)] border-[var(--border-color)] shadow-elevated relative animate-scale-up">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Add Custom Item
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Add directly to your active shopping list
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowModal(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
          
          {/* Name input */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Item Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Organic Almond Butter"
              className="w-full bg-[var(--bg-surface-subtle)] text-sm text-[var(--text-primary)] rounded-lg px-3 py-2 border border-[var(--border-color)] focus:border-indigo-500 outline-none"
              autoFocus
            />
          </div>

          {/* Department / Category */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Department / Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[var(--bg-surface-subtle)] text-sm text-[var(--text-primary)] rounded-lg px-3 py-2 border border-[var(--border-color)] focus:border-indigo-500 outline-none"
            >
              {Object.entries(CATEGORIES).map(([k, cat]) => (
                <option key={k} value={k}>
                  {cat.emoji} {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity & Unit Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full bg-[var(--bg-surface-subtle)] text-sm text-[var(--text-primary)] rounded-lg px-3 py-2 border border-[var(--border-color)] focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Unit
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. bottle, pack, kg"
                className="w-full bg-[var(--bg-surface-subtle)] text-sm text-[var(--text-primary)] rounded-lg px-3 py-2 border border-[var(--border-color)] focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Notes or Brand Preference (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Unsalted, Large size"
              className="w-full bg-[var(--bg-surface-subtle)] text-sm text-[var(--text-primary)] rounded-lg px-3 py-2 border border-[var(--border-color)] focus:border-indigo-500 outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-color)] mt-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="pro-btn pro-btn-secondary text-xs py-2 px-4"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="pro-btn pro-btn-primary text-xs py-2 px-5"
            >
              {isSubmitting ? 'Adding...' : 'Add Item'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
