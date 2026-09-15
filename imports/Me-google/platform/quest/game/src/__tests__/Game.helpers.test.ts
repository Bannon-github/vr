import { describe, expect, test } from 'vitest';
import { GameState, isSimulating, overlayHudKey, type GameSnapshot } from '../Game.js';

const baseSnapshot = (): GameSnapshot => ({
  state: GameState.PLAYING,
  score: 10,
  combo: 2,
  wave: 1,
  highScore: 100,
  remainingMs: 59_001,
  inputMode: 'desktop-hands',
  handsVisible: true,
  orbCount: 5,
});

describe('isSimulating', () => {
  test('returns true only for PLAYING', () => {
    expect(isSimulating(GameState.LOADING)).toBe(false);
    expect(isSimulating(GameState.MENU)).toBe(false);
    expect(isSimulating(GameState.PAUSED)).toBe(false);
    expect(isSimulating(GameState.GAME_OVER)).toBe(false);
    expect(isSimulating(GameState.PLAYING)).toBe(true);
  });
});

describe('overlayHudKey', () => {
  test('ignores orbCount', () => {
    const a = baseSnapshot();
    const b = { ...a, orbCount: 99 };
    expect(overlayHudKey(a)).toBe(overlayHudKey(b));
  });

  test('changes with second boundary', () => {
    const a = baseSnapshot();
    const b = { ...a, remainingMs: 58_000 };
    expect(overlayHudKey(a)).not.toBe(overlayHudKey(b));
  });

  test('changes with score/combo/state', () => {
    const a = baseSnapshot();
    expect(overlayHudKey({ ...a, score: a.score + 1 })).not.toBe(overlayHudKey(a));
    expect(overlayHudKey({ ...a, combo: a.combo + 1 })).not.toBe(overlayHudKey(a));
    expect(overlayHudKey({ ...a, state: GameState.PAUSED })).not.toBe(overlayHudKey(a));
  });

  test('changes with hands visibility and input mode', () => {
    const a = baseSnapshot();
    expect(overlayHudKey({ ...a, handsVisible: !a.handsVisible })).not.toBe(overlayHudKey(a));
    expect(overlayHudKey({ ...a, inputMode: 'controllers' })).not.toBe(overlayHudKey(a));
  });
});
