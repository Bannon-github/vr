/**
 * Game.helpers.test.ts — pause freeze and overlay emit-key contracts.
 */

import { describe, it, expect } from 'vitest';
import {
  GameState,
  overlayHudKey,
  isSimulating,
  type GameSnapshot,
} from '../Game.js';

function snap(over: Partial<GameSnapshot>): GameSnapshot {
  return {
    state: GameState.PLAYING,
    score: 0,
    combo: 1,
    wave: 1,
    highScore: 0,
    remainingMs: 60_000,
    inputMode: 'desktop-hands',
    handsVisible: true,
    orbCount: 0,
    ...over,
  };
}

describe('isSimulating', () => {
  it('runs the world only while PLAYING', () => {
    expect(isSimulating(GameState.PLAYING)).toBe(true);
    expect(isSimulating(GameState.PAUSED)).toBe(false);
    expect(isSimulating(GameState.MENU)).toBe(false);
    expect(isSimulating(GameState.GAME_OVER)).toBe(false);
    expect(isSimulating(GameState.LOADING)).toBe(false);
  });
});

describe('overlayHudKey', () => {
  it('is stable when only orb count changes', () => {
    const a = overlayHudKey(snap({ orbCount: 1 }));
    const b = overlayHudKey(snap({ orbCount: 8 }));
    expect(a).toBe(b);
  });

  it('changes when the displayed second ticks', () => {
    const a = overlayHudKey(snap({ remainingMs: 59_200 }));
    const b = overlayHudKey(snap({ remainingMs: 58_900 }));
    expect(a).not.toBe(b);
  });

  it('changes on score, combo, pause, and hands visibility', () => {
    const base = overlayHudKey(snap({}));
    expect(overlayHudKey(snap({ score: 10 }))).not.toBe(base);
    expect(overlayHudKey(snap({ combo: 3 }))).not.toBe(base);
    expect(overlayHudKey(snap({ state: GameState.PAUSED }))).not.toBe(base);
    expect(overlayHudKey(snap({ handsVisible: false }))).not.toBe(base);
    expect(overlayHudKey(snap({ inputMode: 'xr-hands' }))).not.toBe(base);
  });
});
