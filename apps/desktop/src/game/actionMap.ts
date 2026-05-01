export const GAME_ACTIONS = ['chat', 'feed', 'play', 'sleep', 'clean', 'teach', 'task', 'daydream', 'pause', 'confirm', 'cancel'] as const;

export type GameAction = (typeof GAME_ACTIONS)[number];

export const KEYBOARD_ACTION_MAP: Record<string, GameAction> = {
  Enter: 'confirm',
  Escape: 'cancel',
  KeyP: 'pause',
};
