import { CATEGORIES } from '../utils/constants';

export default function CategoryBadge({ category, size = 'sm' }) {
  const cat = CATEGORIES[category] || CATEGORIES.other;

  return (
    <span
      className="pro-badge"
      style={{
        color: cat.color,
        backgroundColor: `var(--bg-surface-subtle)`,
        border: `1px solid ${cat.color}30`,
        fontSize: size === 'xs' ? 10 : 11,
        padding: size === 'xs' ? '2px 6px' : '3px 8px',
      }}
    >
      <span style={{ fontSize: size === 'xs' ? 10 : 12 }}>{cat.emoji}</span>
      <span>{cat.label}</span>
    </span>
  );
}
