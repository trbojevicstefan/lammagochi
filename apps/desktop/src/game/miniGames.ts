/** Mini-games: Memory Match, Word Scramble, Rhythm Tap */

export type MiniGameType = 'memory'|'scramble'|'rhythm';

export interface MiniGameState {
  type: MiniGameType;
  active: boolean;
  score: number;
  highScore: number;
  round: number;
  data: any;
}

// Memory Match
export const createMemoryGame = (level: number): MiniGameState => {
  const pairs = Math.min(4 + Math.floor(level / 3), 10);
  const symbols = ['🍎','🎾','📚','🌟','💎','🎵','🌈','🦋','🌸','🍀'].slice(0, pairs);
  const cards = [...symbols, ...symbols].sort(() => Math.random() - 0.5).map((s, i) => ({ id: i, symbol: s, flipped: false, matched: false }));
  return { type:'memory', active:true, score:0, highScore:0, round:1, data:{ cards, flipped:[], pairsFound:0, totalPairs:pairs } };
};

export const flipMemoryCard = (state: MiniGameState, cardId: number): MiniGameState => {
  const cards = state.data.cards.map((c:any) => c.id === cardId ? { ...c, flipped: true } : c);
  const flipped = cards.filter((c:any) => c.flipped && !c.matched);
  if (flipped.length === 2) {
    if (flipped[0].symbol === flipped[1].symbol) {
      const newCards = cards.map((c:any) => flipped.some((f:any) => f.id === c.id) ? { ...c, matched: true } : c);
      const pairsFound = state.data.pairsFound + 1;
      const done = pairsFound >= state.data.totalPairs;
      return { ...state, score: state.score + 100, data: { ...state.data, cards: newCards, pairsFound, flipped:[] }, active:!done, round: done ? state.round + 1 : state.round };
    }
    // Mismatch — flip back after delay
    setTimeout(() => {}, 800);
  }
  return { ...state, data: { ...state.data, cards, flipped } };
};

// Word Scramble
const SCRAMBLE_WORDS = ['happy','play','learn','grow','love','care','feed','rest','clean','teach','dream','trust'];

export const createScrambleGame = (): MiniGameState => {
  const word = SCRAMBLE_WORDS[Math.floor(Math.random() * SCRAMBLE_WORDS.length)];
  const scrambled = word.split('').sort(() => Math.random() - 0.5).join('');
  return { type:'scramble', active:true, score:0, highScore:0, round:1, data:{ word, scrambled, guess:'' } };
};

export const checkScrambleGuess = (state: MiniGameState, guess: string): MiniGameState => {
  const correct = guess.toLowerCase() === state.data.word;
  if (correct) {
    return { ...state, active:false, score: state.score + 150, data: { ...state.data, guess } };
  }
  return { ...state, score: Math.max(0, state.score - 10), data: { ...state.data, guess } };
};

// Rhythm Tap
export const createRhythmGame = (): MiniGameState => {
  const pattern = Array.from({ length: 6 + Math.floor(Math.random() * 5) }, () => Math.floor(Math.random() * 4));
  return { type:'rhythm', active:true, score:0, highScore:0, round:1, data:{ pattern, currentBeat:0, playerTaps:[] as number[], showBeat:false } };
};

export const tapRhythm = (state: MiniGameState): MiniGameState => {
  const newTaps = [...state.data.playerTaps, Date.now()];
  const patternLen = state.data.pattern.length;
  if (newTaps.length >= patternLen) {
    const correct = state.data.pattern.every((b:number, i:number) => b === newTaps[i] % 4);
    return { ...state, active:false, score: state.score + (correct ? 200 : 0), data: { ...state.data, playerTaps: newTaps } };
  }
  return { ...state, data: { ...state.data, playerTaps: newTaps } };
};
