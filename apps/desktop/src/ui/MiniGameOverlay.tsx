import { useState, useEffect, useRef } from 'react';
import { createMemoryGame, flipMemoryCard, createScrambleGame, checkScrambleGuess, createRhythmGame, tapRhythm, type MiniGameState } from '../game/miniGames';

type Props = { level:number; isOpen:boolean; onClose:()=>void; onReward:(xp:number,msg:string)=>void; };

export const MiniGameOverlay = ({ level, isOpen, onClose, onReward }: Props) => {
  if (!isOpen) return null;
  const [gameType, setGameType] = useState<'menu'|'memory'|'scramble'|'rhythm'>('menu');
  const [game, setGame] = useState<MiniGameState | null>(null);
  const [scrambleGuess, setScrambleGuess] = useState('');
  const rhythmTimer = useRef<ReturnType<typeof setInterval>>();

  const startGame = (type: 'memory'|'scramble'|'rhythm') => {
    setGameType(type);
    if (type === 'memory') setGame(createMemoryGame(level));
    if (type === 'scramble') { setGame(createScrambleGame()); setScrambleGuess(''); }
    if (type === 'rhythm') {
      const g = createRhythmGame();
      setGame(g);
      let beat = 0;
      rhythmTimer.current = setInterval(() => {
        if (beat < g.data.pattern.length) beat++;
        else { clearInterval(rhythmTimer.current); }
      }, 500);
    }
  };

  useEffect(() => () => { if (rhythmTimer.current) clearInterval(rhythmTimer.current); }, []);

  const handleMemoryClick = (cardId: number) => {
    if (!game) return;
    const next = flipMemoryCard(game, cardId);
    setGame(next);
    if (!next.active) onReward(next.score, `Memory Match: ${next.score}pts!`);
  };

  const handleScrambleSubmit = () => {
    if (!game) return;
    const next = checkScrambleGuess(game, scrambleGuess);
    setGame(next);
    if (!next.active) onReward(next.score, `Word Unscrambled: +${next.score}pts!`);
  };

  const handleRhythmTap = () => {
    if (!game) return;
    const next = tapRhythm(game);
    setGame(next);
    if (!next.active) onReward(next.score, `Rhythm Master: +${next.score}pts!`);
  };

  if (gameType === 'menu') {
    return (
      <div className="settings-overlay" onClick={onClose}>
        <div className="settings-card" onClick={e => e.stopPropagation()} style={{maxWidth:360}}>
          <div className="settings-header"><h2>🎮 Mini-Games</h2><button className="settings-close" onClick={onClose}>✕</button></div>
          <div className="settings-body">
            <button onClick={()=>startGame('memory')} style={{padding:'16px',textAlign:'left',fontSize:'0.9rem'}}>
              <span style={{fontSize:'1.5rem'}}>🧠</span> Memory Match<br/>
              <small style={{color:'var(--text-muted)'}}>Match pairs to earn XP</small>
            </button>
            <button onClick={()=>startGame('scramble')} style={{padding:'16px',textAlign:'left',fontSize:'0.9rem'}}>
              <span style={{fontSize:'1.5rem'}}>🔤</span> Word Scramble<br/>
              <small style={{color:'var(--text-muted)'}}>Unscramble words to teach vocabulary</small>
            </button>
            <button onClick={()=>startGame('rhythm')} style={{padding:'16px',textAlign:'left',fontSize:'0.9rem'}}>
              <span style={{fontSize:'1.5rem'}}>🎵</span> Rhythm Tap<br/>
              <small style={{color:'var(--text-muted)'}}>Tap to the beat for bonus XP</small>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-card" onClick={e => e.stopPropagation()} style={{maxWidth:420}}>
        <div className="settings-header">
          <h2>{gameType === 'memory' ? '🧠 Memory Match' : gameType === 'scramble' ? '🔤 Word Scramble' : '🎵 Rhythm Tap'}</h2>
          <button className="settings-close" onClick={onClose}>✕</button>
        </div>
        <div className="settings-body">
          {/* Score */}
          <div style={{textAlign:'center',fontSize:'0.8rem',color:'var(--accent-cyan)',marginBottom:'12px'}}>
            Score: {game?.score || 0} pts
          </div>

          {/* Memory Match */}
          {gameType === 'memory' && game && (
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'6px'}}>
              {game.data.cards.map((c:any) => (
                <button key={c.id} onClick={() => !c.matched && handleMemoryClick(c.id)}
                  style={{
                    aspectRatio:'1',fontSize:'1.5rem',padding:'8px',
                    background: c.flipped || c.matched ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.4)',
                    border: c.matched ? '2px solid #4ade80' : '1px solid var(--border-subtle)',
                    borderRadius:'var(--radius-sm)',
                  }}>
                  {(c.flipped || c.matched) ? c.symbol : '?'}
                </button>
              ))}
            </div>
          )}

          {/* Word Scramble */}
          {gameType === 'scramble' && game && (
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:'2rem',letterSpacing:'0.3em',marginBottom:'16px',fontFamily:'Press Start 2P, monospace'}}>
                {game.data.scrambled}
              </div>
              <div style={{display:'flex',gap:'8px'}}>
                <input value={scrambleGuess} onChange={e=>setScrambleGuess(e.target.value)}
                  placeholder="Your guess..." style={{flex:1}}
                  onKeyDown={e => e.key==='Enter' && handleScrambleSubmit()} />
                <button onClick={handleScrambleSubmit} className="btn-primary">Guess</button>
              </div>
              {!game.active && game.data.word && (
                <p style={{color:'#4ade80',marginTop:'12px'}}>✅ The word was: <strong>{game.data.word}</strong></p>
              )}
            </div>
          )}

          {/* Rhythm Tap */}
          {gameType === 'rhythm' && game && (
            <div style={{textAlign:'center'}}>
              <p style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>Tap to the beat!</p>
              <button onClick={handleRhythmTap}
                style={{width:'120px',height:'120px',borderRadius:'50%',fontSize:'3rem',
                  background:'rgba(99,102,241,0.2)',border:'3px solid var(--accent-cyan)',
                  animation:'pulse 0.5s ease-in-out infinite'}}>
                🎵
              </button>
              <p style={{fontSize:'0.7rem',color:'var(--text-muted)',marginTop:'8px'}}>
                Tapped: {game.data.playerTaps.length}/{game.data.pattern.length}
              </p>
              <style>{`@keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.08); } }`}</style>
            </div>
          )}

          {/* Play again */}
          {!game?.active && (
            <button onClick={() => startGame(gameType as any)}
              className="btn-primary" style={{width:'100%',marginTop:'16px'}}>
              Play Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
