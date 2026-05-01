import { useEffect, useState, useCallback } from 'react';

export type ToastType = 'xp' | 'level' | 'achievement' | 'evolve' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  icon: string;
  title: string;
  subtitle?: string;
  expiresAt: number;
}

// Singleton toast store (outside React tree so any code can trigger toasts)
let toastListeners: Array<(toasts: ToastMessage[]) => void> = [];
let currentToasts: ToastMessage[] = [];

export const showToast = (type: ToastType, title: string, subtitle?: string, duration = 3000) => {
  const icons: Record<ToastType, string> = {
    xp: '⚡',
    level: '⬆️',
    achievement: '🏆',
    evolve: '🦋',
    info: '💡',
    warning: '⚠️',
  };
  const toast: ToastMessage = {
    id: `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type,
    icon: icons[type],
    title,
    subtitle,
    expiresAt: Date.now() + duration,
  };
  currentToasts = [...currentToasts, toast];
  toastListeners.forEach((fn) => fn(currentToasts));

  // Auto-remove
  setTimeout(() => {
    currentToasts = currentToasts.filter((t) => t.id !== toast.id);
    toastListeners.forEach((fn) => fn(currentToasts));
  }, duration);
};

export const useToasts = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>(currentToasts);

  useEffect(() => {
    toastListeners.push(setToasts);
    return () => {
      toastListeners = toastListeners.filter((fn) => fn !== setToasts);
    };
  }, []);

  return toasts;
};

export const ToastContainer = () => {
  const toasts = useToasts();

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.type}`}>
          <span className="toast__icon">{toast.icon}</span>
          <div className="toast__content">
            <span className="toast__title">{toast.title}</span>
            {toast.subtitle && <span className="toast__subtitle">{toast.subtitle}</span>}
          </div>
        </div>
      ))}
    </div>
  );
};
