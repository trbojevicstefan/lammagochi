import { describe, expect, it } from 'vitest';
import { addXp, getWordCapForLevel } from './index';

describe('core progression', () => {
  it('enforces expected word cap at low levels', () => {
    expect(getWordCapForLevel(1)).toBe(1);
    expect(getWordCapForLevel(4)).toBe(4);
    expect(getWordCapForLevel(10)).toBe(10);
  });

  it('levels up when xp reaches threshold', () => {
    const result = addXp(0, 1, 40);
    expect(result.level).toBeGreaterThan(1);
  });
});
