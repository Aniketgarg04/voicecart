import { History, Mic, CheckCircle2, Clock } from 'lucide-react';
import useShoppingStore from '../store/useShoppingStore';

export default function VoiceHistoryPanel() {
  const recentLogs = useShoppingStore((s) => s.recentVoiceLogs);

  return (
    <div className="pro-card p-4 sm:p-6 flex flex-col flex-1">
      <div className="flex items-center gap-2 pb-4 border-b border-[var(--border-color)]">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <History className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[var(--text-primary)]">
            Assistant Activity Log
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            Real-time history of voice & AI agent actions
          </p>
        </div>
      </div>

      <div className="flex-1 py-3 overflow-y-auto max-h-[300px] scrollbar-thin">
        {recentLogs.length === 0 ? (
          <div className="text-center py-8 text-xs text-[var(--text-muted)]">
            No voice activity yet. Speak or type a command to see the live log!
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {recentLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-color)] text-xs"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-[var(--text-primary)] font-medium line-clamp-2">
                    {log.text}
                  </p>
                  <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 mt-1">
                    <Clock className="w-2.5 h-2.5" />
                    {log.timestamp}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
