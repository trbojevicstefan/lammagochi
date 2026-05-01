import { useEffect, useRef, useState } from 'react';

type StatMeterProps = {
  label: string;
  value: number;
  max?: number;
  icon?: string;
  color?: MeterColor;
  showValue?: boolean;
  compact?: boolean;
};

const colorMap = {
  green: { bar: 'linear-gradient(90deg, #22c55e, #4ade80)', glow: 'rgba(34,197,94,0.3)' },
  teal: { bar: 'linear-gradient(90deg, #14b8a6, #5eead4)', glow: 'rgba(20,184,166,0.3)' },
  amber: { bar: 'linear-gradient(90deg, #d97706, #fbbf24)', glow: 'rgba(217,119,6,0.3)' },
  red: { bar: 'linear-gradient(90deg, #dc2626, #f87171)', glow: 'rgba(220,38,38,0.3)' },
  blue: { bar: 'linear-gradient(90deg, #2563eb, #60a5fa)', glow: 'rgba(37,99,235,0.3)' },
  purple: { bar: 'linear-gradient(90deg, #7c3aed, #a78bfa)', glow: 'rgba(124,58,237,0.3)' },
};

type MeterColor = 'green' | 'teal' | 'amber' | 'red' | 'blue' | 'purple';

const getColorForValue = (value: number): MeterColor => {
  if (value <= 20) return 'red';
  if (value <= 40) return 'amber';
  if (value <= 65) return 'teal';
  return 'green';
};

export const StatMeter = ({
  label,
  value,
  max = 100,
  icon,
  color: forcedColor,
  showValue = true,
  compact = false,
}: StatMeterProps) => {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const color: MeterColor = forcedColor ?? getColorForValue(value);
  const colors = colorMap[color];
  const [displayPct, setDisplayPct] = useState(pct);
  const prevPct = useRef(pct);

  useEffect(() => {
    const start = prevPct.current;
    const end = pct;
    prevPct.current = end;
    const duration = 400;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplayPct(start + (end - start) * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [pct]);

  return (
    <div className={`stat-meter ${compact ? 'stat-meter--compact' : ''}`}>
      <div className="stat-meter__header">
        {icon && <span className="stat-meter__icon">{icon}</span>}
        <span className="stat-meter__label">{label}</span>
        {showValue && <span className="stat-meter__value">{Math.round(value)}</span>}
      </div>
      <div className="stat-meter__track">
        <div
          className="stat-meter__fill"
          style={{
            width: `${displayPct}%`,
            background: colors.bar,
            boxShadow: `0 0 8px ${colors.glow}`,
          }}
        />
      </div>
    </div>
  );
};
