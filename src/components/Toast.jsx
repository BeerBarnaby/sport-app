import { useState, useCallback } from 'react';

// ─── Hook ────────────────────────────────────────────────
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const add = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, add, remove };
}

// ─── Component ───────────────────────────────────────────
const TYPE_STYLES = {
  success: 'bg-emerald-500',
  error:   'bg-red-500',
  warning: 'bg-amber-500',
  info:    'bg-blue-500',
};
const TYPE_ICON = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };

export default function Toast({ toasts, remove }) {
  return (
    <div
      className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none"
      style={{ maxWidth: 'calc(100vw - 32px)' }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast-enter pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-white text-sm font-medium ${TYPE_STYLES[t.type] ?? 'bg-blue-500'}`}
        >
          <span className="text-base flex-shrink-0">{TYPE_ICON[t.type] ?? 'ℹ'}</span>
          <span className="flex-1">{t.message}</span>
          <button
            onClick={() => remove(t.id)}
            className="opacity-70 hover:opacity-100 text-lg leading-none"
            aria-label="ปิด"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
