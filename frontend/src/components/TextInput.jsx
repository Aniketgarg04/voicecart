import { useState } from 'react';
import { CornerDownLeft } from 'lucide-react';

export default function TextInput({ onSubmit, disabled }) {
  const [value, setValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!value.trim() || disabled) return;
    onSubmit(value.trim());
    setValue('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 10px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        width: '100%',
        maxWidth: 440,
      }}
    >
      <input
        id="text-command-input"
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        placeholder='Or type a command… "Add 3 avocados"'
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          fontSize: 13,
          color: 'var(--text-1)',
          fontFamily: 'Inter, sans-serif',
        }}
      />
      <button
        type="submit"
        disabled={!value.trim() || disabled}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 26, height: 26,
          borderRadius: 6,
          border: 'none',
          background: value.trim() && !disabled ? 'rgba(91,108,249,0.2)' : 'transparent',
          color: value.trim() && !disabled ? '#818cf8' : 'var(--text-m)',
          cursor: value.trim() && !disabled ? 'pointer' : 'default',
          transition: 'all 0.15s',
          flexShrink: 0,
        }}
        aria-label="Send command"
      >
        <CornerDownLeft size={13} />
      </button>
    </form>
  );
}
