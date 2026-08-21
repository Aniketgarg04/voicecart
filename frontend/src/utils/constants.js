export const WS_URL = `ws://localhost:5000/ws`;

export const CATEGORIES = {
  dairy: {
    label: 'Dairy & Eggs',
    emoji: '🥛',
    color: '#0284c7', // Sky blue
    bgColor: '#e0f2fe',
    darkBg: 'rgba(2, 132, 199, 0.15)',
    border: '#bae6fd',
  },
  produce: {
    label: 'Fresh Produce',
    emoji: '🥦',
    color: '#16a34a', // Fresh green
    bgColor: '#dcfce7',
    darkBg: 'rgba(22, 163, 74, 0.15)',
    border: '#bbf7d0',
  },
  meat: {
    label: 'Meat & Seafood',
    emoji: '🥩',
    color: '#ea580c', // Orange/red
    bgColor: '#ffedd5',
    darkBg: 'rgba(234, 88, 12, 0.15)',
    border: '#fed7aa',
  },
  bakery: {
    label: 'Bakery & Bread',
    emoji: '🍞',
    color: '#d97706', // Warm amber
    bgColor: '#fef3c7',
    darkBg: 'rgba(217, 119, 6, 0.15)',
    border: '#fde68a',
  },
  beverages: {
    label: 'Beverages',
    emoji: '🧃',
    color: '#2563eb', // Blue
    bgColor: '#dbeafe',
    darkBg: 'rgba(37, 99, 235, 0.15)',
    border: '#bfdbfe',
  },
  snacks: {
    label: 'Snacks & Sweets',
    emoji: '🍿',
    color: '#db2777', // Pink/Rose
    bgColor: '#fce7f3',
    darkBg: 'rgba(219, 39, 119, 0.15)',
    border: '#fbcfe8',
  },
  frozen: {
    label: 'Frozen Foods',
    emoji: '🧊',
    color: '#7c3aed', // Purple
    bgColor: '#ede9fe',
    darkBg: 'rgba(124, 58, 237, 0.15)',
    border: '#ddd6fe',
  },
  household: {
    label: 'Household Essentials',
    emoji: '🧼',
    color: '#475569', // Slate
    bgColor: '#f1f5f9',
    darkBg: 'rgba(71, 85, 105, 0.15)',
    border: '#e2e8f0',
  },
  personal_care: {
    label: 'Personal Care',
    emoji: '🧴',
    color: '#9333ea', // Violet
    bgColor: '#fae8ff',
    darkBg: 'rgba(147, 51, 234, 0.15)',
    border: '#f5d0fe',
  },
  other: {
    label: 'Pantry & Other',
    emoji: '🛒',
    color: '#64748b',
    bgColor: '#f8fafc',
    darkBg: 'rgba(100, 116, 139, 0.15)',
    border: '#e2e8f0',
  },
};

export const QUICK_VOICE_PROMPTS = [
  { icon: '🥛', label: 'Add 2L Whole Milk', text: 'Add 2 litres of whole milk' },
  { icon: '🥑', label: 'Add 4 Avocados', text: 'Add 4 avocados to my list' },
  { icon: '🍞', label: 'Add Sourdough Bread', text: 'Add sourdough bread' },
  { icon: '🌿', label: "What's in season?", text: 'What items are in season right now?' },
  { icon: '🔍', label: 'Find apples under $4', text: 'Find organic apples under 4 dollars' },
  { icon: '💡', label: 'Recommend dinner items', text: 'What should I buy for dinner?' },
];

export const VOICE_STATES = {
  IDLE:         'idle',
  LISTENING:    'listening',
  TRANSCRIBING: 'transcribing',
  PROCESSING:   'processing',
};

export const WS_STATUS = {
  DISCONNECTED: 'disconnected',
  CONNECTING:   'connecting',
  CONNECTED:    'connected',
  ERROR:        'error',
};
