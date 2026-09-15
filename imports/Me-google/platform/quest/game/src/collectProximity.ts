/**
 * collectProximity.ts — Pure nearest-orb helpers shared by hand pinch
 * (AvatarHands / HandTrackingManager) and the desktop click path.
 *
 * Kept Three.js-free so unit tests can cover the collect radius without a
 * WebGL context. Both XR pinch and desktop ghost-hands feed this helper,
 * then call the same OrbCollectedCallback that ControllerManager uses.
 */

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface ProximityCandidate<T> {
  item: T;
  position: Vec3;
  /** Collision radius of the candidate itself (metres). */
  radius: number;
}

export function distance3(a: Vec3, b: Vec3): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Return the nearest eligible candidate whose surface is within `reach`
 * metres of `origin`. `reach` is extra hand/pinch radius on top of the
 * candidate's own radius.
 */
export function findNearestInReach<T>(
  origin: Vec3,
  candidates: readonly ProximityCandidate<T>[],
  reach: number,
): T | null {
  if (reach < 0) return null;
  let best: T | null = null;
  let bestDist = Infinity;
  for (const c of candidates) {
    const d = distance3(origin, c.position) - c.radius;
    if (d <= reach && d < bestDist) {
      bestDist = d;
      best = c.item;
    }
  }
  return best;
}

/** Pinch is considered closed when thumb/index tips are this close (metres). */
export const PINCH_CLOSE_M = 0.028;

/** Extra reach around a pinched hand when collecting an orb (metres). */
export const PINCH_REACH_M = 0.22;

/** Desktop ghost-hand reach is slightly larger so mouse play stays fair. */
export const DESKTOP_REACH_M = 0.38;

export function isPinchClosed(thumbTip: Vec3, indexTip: Vec3): boolean {
  return distance3(thumbTip, indexTip) <= PINCH_CLOSE_M;
}
