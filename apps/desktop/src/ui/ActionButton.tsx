type ActionButtonProps = {
  action: string;
  icon: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  hotkey?: string;
};

export const ActionButton = ({ action, icon, label, onClick, disabled, active, hotkey }: ActionButtonProps) => {
  return (
    <button
      className={`action-btn ${active ? 'action-btn--active' : ''}`}
      onClick={onClick}
      disabled={disabled}
      title={`${label}${hotkey ? ` (${hotkey})` : ''}`}
      data-action={action}
    >
      <span className="action-btn__icon">{icon}</span>
      <span className="action-btn__label">{label}</span>
      {hotkey && <span className="action-btn__hotkey">{hotkey}</span>}
    </button>
  );
};

export const ACTION_DEFS = [
  { action: 'feed', icon: '🍎', label: 'Feed', color: '#4ade80' },
  { action: 'play', icon: '🎾', label: 'Play', color: '#fbbf24' },
  { action: 'sleep', icon: '😴', label: 'Sleep', color: '#818cf8' },
  { action: 'clean', icon: '✨', label: 'Clean', color: '#60a5fa' },
  { action: 'teach', icon: '📖', label: 'Teach', color: '#c084fc' },
  { action: 'task', icon: '⚡', label: 'Task', color: '#f472b6' },
  { action: 'daydream', icon: '💭', label: 'Dream', color: '#67e8f9' },
] as const;
