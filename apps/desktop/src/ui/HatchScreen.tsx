import { useEffect, useState } from 'react';

type HatchScreenProps = {
  petName: string;
  onComplete: () => void;
};

export const HatchScreen = ({ petName, onComplete }: HatchScreenProps) => {
  const [phase, setPhase] = useState<'cracking' | 'bursting' | 'revealing'>('cracking');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('bursting'), 1800);
    const t2 = setTimeout(() => setPhase('revealing'), 2800);
    const t3 = setTimeout(() => onComplete(), 4200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <div className={`hatch-overlay hatch-overlay--${phase}`}>
      <div className="hatch-content">
        <div className={`hatch-egg-display hatch-egg-display--${phase}`}>
          <div className="hatch-egg-glow" />
          {phase === 'cracking' && (
            <>
              <div className="hatch-crack hatch-crack--1" />
              <div className="hatch-crack hatch-crack--2" />
              <div className="hatch-crack hatch-crack--3" />
            </>
          )}
          {(phase === 'bursting' || phase === 'revealing') && (
            <>
              <div className="hatch-light-burst" />
              <div className="hatch-particles">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="hatch-particle" style={{
                    '--angle': `${(i/20)*360}deg`, '--delay': `${Math.random()*0.5}s`,
                    '--distance': `${80+Math.random()*120}px`,
                  } as React.CSSProperties} />
                ))}
              </div>
              {/* Confetti */}
              <div className="hatch-confetti">
                {Array.from({ length: 24 }).map((_, i) => {
                  const colors = ['#fbbf24','#f472b6','#67e8f9','#a78bfa','#4ade80','#f59e0b'];
                  return (
                    <div key={`c${i}`} className="hatch-confetti-piece" style={{
                      '--delay': `${0.8+Math.random()*1.2}s`, '--distance': `${100+Math.random()*150}px`,
                      '--drift': `${(Math.random()-0.5)*200}px`,
                      background: colors[i%colors.length],
                      left: `${40+Math.random()*20}%`,
                    } as React.CSSProperties} />
                  );
                })}
              </div>
            </>
          )}
          {phase === 'revealing' && (
            <div className="hatch-creature-reveal">
              <div className="hatch-creature-silhouette">🦕</div>
              <p className="hatch-greeting">Hello, world!</p>
            </div>
          )}
        </div>

        <div className="hatch-text">
          {phase === 'cracking' && <p>Cracking...</p>}
          {phase === 'bursting' && <p>Something is emerging!</p>}
          {phase === 'revealing' && (
            <h2>
              <span className="hatch-name">{petName}</span> is born!
            </h2>
          )}
        </div>
      </div>
    </div>
  );
};
