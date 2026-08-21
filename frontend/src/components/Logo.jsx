export default function Logo({ size = 38, showText = true, textClass = '' }) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0 drop-shadow-md"
      >
        <defs>
          <linearGradient id="logoBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="50%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
          <linearGradient id="logoWaveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#A7F3D0" />
          </linearGradient>
        </defs>

        {/* Squircle container */}
        <rect x="6" y="6" width="88" height="88" rx="26" fill="url(#logoBgGrad)" />
        <rect x="7" y="7" width="86" height="86" rx="25" stroke="white" strokeWidth="1.5" strokeOpacity="0.25" />

        {/* Bag Body */}
        <path
          d="M30 42 C30 38, 33 35, 37 35 L63 35 C67 35, 70 38, 70 42 L74 72 C74 77, 70 81, 65 81 L35 81 C30 81, 26 77, 26 72 Z"
          fill="white"
          fillOpacity="0.18"
          stroke="white"
          strokeWidth="3"
          strokeLinejoin="round"
        />

        {/* Bag Handle */}
        <path
          d="M40 36 V28 C40 22.477, 44.477 18, 50 18 C55.523 18, 60 22.477, 60 28 V36"
          stroke="white"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Audio Wavebars */}
        <rect x="36" y="55" width="4" height="12" rx="2" fill="url(#logoWaveGrad)" />
        <rect x="43" y="48" width="4" height="26" rx="2" fill="url(#logoWaveGrad)" />
        <rect x="50" y="43" width="4" height="36" rx="2" fill="white" />
        <rect x="57" y="48" width="4" height="26" rx="2" fill="url(#logoWaveGrad)" />
        <rect x="64" y="55" width="4" height="12" rx="2" fill="url(#logoWaveGrad)" />

        {/* AI Sparkle */}
        <path
          d="M78 18 C78 22, 82 22, 82 22 C82 22, 78 22, 78 26 C78 22, 74 22, 74 22 C74 22, 78 22, 78 18 Z"
          fill="#FDE047"
        />
      </svg>

      {showText && (
        <div className="flex flex-col">
          <span className={`font-black tracking-tight text-[var(--text-primary)] leading-none ${textClass || 'text-lg'}`}>
            Voice<span className="bg-gradient-to-r from-emerald-500 to-indigo-500 bg-clip-text text-transparent">Cart</span>
          </span>
          <span className="text-[10px] tracking-wider uppercase font-semibold text-[var(--text-muted)] mt-0.5">
            AI Assistant
          </span>
        </div>
      )}
    </div>
  );
}
