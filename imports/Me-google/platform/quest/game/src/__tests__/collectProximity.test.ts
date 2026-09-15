/**
 * collectProximity.test.ts — unit tests for pinch / ghost-hand collect math.
 */

import { describe, it, expect } from 'vitest';
import {
  distance3,
  findNearestInReach,
  isPinchClosed,
  nextPinchLatch,
  PINCH_CLOSE_M,
  PINCH_REACH_M,
} from '../collectProximity.js';

describe('distance3', () => {
  it('returns 0 for identical points', () => {
    expect(distance3({ x: 1, y: 2, z: 3 }, { x: 1, y: 2, z: 3 })).toBe(0);
  });

  it('computes Euclidean length', () => {
    expect(distance3({ x: 0, y: 0, z: 0 }, { x: 3, y: 4, z: 0 })).toBe(5);
  });
});

describe('isPinchClosed', () => {
  it('is closed at or below the threshold', () => {
    expect(isPinchClosed({ x: 0, y: 0, z: 0 }, { x: PINCH_CLOSE_M, y: 0, z: 0 })).toBe(true);
    expect(isPinchClosed({ x: 0, y: 0, z: 0 }, { x: PINCH_CLOSE_M - 0.001, y: 0, z: 0 })).toBe(true);
  });

  it('is open beyond the threshold', () => {
    expect(isPinchClosed({ x: 0, y: 0, z: 0 }, { x: PINCH_CLOSE_M + 0.01, y: 0, z: 0 })).toBe(false);
  });
});

describe('findNearestInReach', () => {
  const orb = (id: string, pos: { x: number; y: number; z: number }, radius = 0.06) => ({
    item: id,
    position: pos,
    radius,
  });

  it('returns null when nothing is in reach', () => {
    const found = findNearestInReach(
      { x: 0, y: 0, z: 0 },
      [orb('far', { x: 10, y: 0, z: 0 })],
      PINCH_REACH_M,
    );
    expect(found).toBeNull();
  });

  it('collects an orb whose surface is inside the hand reach', () => {
    const found = findNearestInReach(
      { x: 0, y: 0, z: 0 },
      [orb('near', { x: 0.2, y: 0, z: 0 }, 0.06)],
      PINCH_REACH_M,
    );
    expect(found).toBe('near');
  });

  it('picks the nearest of several in-range orbs', () => {
    const found = findNearestInReach(
      { x: 0, y: 0, z: 0 },
      [
        orb('a', { x: 0.25, y: 0, z: 0 }, 0.06),
        orb('b', { x: 0.12, y: 0, z: 0 }, 0.06),
        orb('c', { x: 0.18, y: 0, z: 0 }, 0.06),
      ],
      PINCH_REACH_M,
    );
    expect(found).toBe('b');
  });

  it('accounts for the orb radius so large legendary orbs are easier to pinch', () => {
    const found = findNearestInReach(
      { x: 0, y: 0, z: 0 },
      [orb('legend', { x: 0.34, y: 0, z: 0 }, 0.13)],
      PINCH_REACH_M,
    );
    expect(found).toBe('legend');
  });

  it('rejects negative reach', () => {
    const found = findNearestInReach(
      { x: 0, y: 0, z: 0 },
      [orb('touching', { x: 0, y: 0, z: 0 })],
      -1,
    );
    expect(found).toBeNull();
  });
});

describe('nextPinchLatch', () => {
  it('fires on the rising edge and then stays latched', () => {
    const open = nextPinchLatch(false, false);
    expect(open).toEqual({ fire: false, latched: false });
    const down = nextPinchLatch(true, open.latched);
    expect(down).toEqual({ fire: true, latched: true });
    const held = nextPinchLatch(true, down.latched);
    expect(held).toEqual({ fire: false, latched: true });
  });

  it('unlatches when the pinch opens, including while collect is disarmed', () => {
    const released = nextPinchLatch(false, true);
    expect(released).toEqual({ fire: false, latched: false });
    const nextDown = nextPinchLatch(true, released.latched);
    expect(nextDown.fire).toBe(true);
  });
});
