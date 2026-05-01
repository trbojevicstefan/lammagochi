let audioCtx: AudioContext | null = null;

const getCtx = (): AudioContext => {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
};

const playTone = (frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.08) => {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio not available
  }
};

const playSequence = (notes: Array<[number, number, number]>, type: OscillatorType = 'sine') => {
  try {
    const ctx = getCtx();
    notes.forEach(([freq, startOffset, duration]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startOffset);
      gain.gain.setValueAtTime(0.07, ctx.currentTime + startOffset);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startOffset + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + startOffset);
      osc.stop(ctx.currentTime + startOffset + duration);
    });
  } catch {
    // Audio not available
  }
};

export const soundEffects = {
  chirp: () => playTone(600 + Math.random() * 200, 0.1, 'sine', 0.06),
  chirpHigh: () => playTone(800 + Math.random() * 300, 0.08, 'sine', 0.05),
  chirpLow: () => playTone(300 + Math.random() * 150, 0.12, 'sine', 0.06),

  blip: () => playTone(440, 0.05, 'square', 0.04),

  hatchEgg: () => {
    playSequence([
      [200, 0, 0.15],
      [300, 0.08, 0.12],
      [400, 0.16, 0.1],
      [500, 0.22, 0.08],
      [700, 0.28, 0.15],
      [900, 0.35, 0.2],
      [1200, 0.42, 0.3],
    ], 'sine');
  },

  levelUp: () => {
    playSequence([
      [400, 0, 0.1],
      [500, 0.08, 0.1],
      [600, 0.16, 0.1],
      [800, 0.24, 0.15],
      [1000, 0.34, 0.2],
      [1200, 0.44, 0.3],
    ], 'triangle');
  },

  action: (type: string) => {
    switch (type) {
      case 'feed':
        playSequence([[300, 0, 0.08], [500, 0.06, 0.1]], 'sine');
        break;
      case 'play':
        playSequence([[500, 0, 0.06], [700, 0.05, 0.06], [900, 0.1, 0.08]], 'square');
        break;
      case 'sleep':
        playSequence([[400, 0, 0.15], [300, 0.2, 0.2], [200, 0.45, 0.25]], 'sine');
        break;
      case 'clean':
        playSequence([[600, 0, 0.06], [800, 0.05, 0.06], [1000, 0.1, 0.06]], 'triangle');
        break;
      case 'teach':
        playSequence([[350, 0, 0.1], [500, 0.08, 0.12], [650, 0.18, 0.15]], 'sine');
        break;
      case 'task':
        playSequence([[400, 0, 0.06], [600, 0.08, 0.06], [800, 0.16, 0.08]], 'square');
        break;
      case 'daydream':
        playSequence([[300, 0, 0.12], [500, 0.1, 0.12], [700, 0.2, 0.15], [600, 0.3, 0.2]], 'sine');
        break;
    }
  },

  achievement: () => {
    playSequence([
      [500, 0, 0.08],
      [600, 0.06, 0.08],
      [700, 0.12, 0.08],
      [800, 0.18, 0.08],
      [1000, 0.24, 0.15],
      [1200, 0.32, 0.25],
    ], 'triangle');
  },

  error: () => {
    playSequence([[200, 0, 0.1], [150, 0.15, 0.2]], 'square');
  },

  notification: () => {
    playSequence([[600, 0, 0.06], [800, 0.08, 0.08]], 'sine');
  },
};
