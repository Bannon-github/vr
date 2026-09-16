/**
 * HandTrackingManager.ts — Quest hand tracking + desktop ghost-hand input.
 *
 *   1. Attaches WebXR `XRHand` spaces when the session advertises them.
 *   2. Detects a thumb/index pinch from **world** joint positions
 *      (`matrixWorld`) and collects the nearest live orb.
 *   3. On desktop (no XR session), maps the pointer onto a plane in front
 *      of the camera and treats click as a pinch.
 *
 * Output: the same `OrbCollectedCallback` ControllerManager uses.
 */

import * as THREE from 'three';
import { Orb } from './Orb.js';
import { OrbSpawner } from './OrbSpawner.js';
import { HapticManager } from './HapticManager.js';
import { AvatarHands } from './AvatarHands.js';
import { ORB_RADIUS } from './theme.js';
import {
  DESKTOP_REACH_M,
  PINCH_REACH_M,
  findNearestInReach,
  isPinchClosed,
  nextPinchLatch,
  type ProximityCandidate,
} from './collectProximity.js';
import type { OrbCollectedCallback } from './ControllerManager.js';

export type InputMode = 'desktop-hands' | 'xr-hands' | 'controllers';

export class HandTrackingManager {
  private onOrbCollected?: OrbCollectedCallback;
  private readonly raycaster = new THREE.Raycaster();
  private readonly ndc = new THREE.Vector2();
  private readonly tmp = new THREE.Vector3();
  private readonly xrHands: THREE.XRHandSpace[] = [];
  private pointerNdcX = 0;
  private pointerNdcY = 0;
  private pointerDown = false;
  private desktopPinchLatched = false;
  private readonly xrPinchLatched = [false, false];
  private desktopEnabled = true;
  private xrHandsLive = false;
  private collectArmed = false;
  private readonly thumbWorld = new THREE.Vector3();
  private readonly indexWorld = new THREE.Vector3();

  constructor(
    private readonly renderer: THREE.WebGLRenderer,
    private readonly camera: THREE.Camera,
    private readonly spawner: OrbSpawner,
    private readonly haptic: HapticManager,
    private readonly avatar: AvatarHands,
    canvas: HTMLElement,
  ) {
    for (let i = 0; i < 2; i++) {
      const hand = renderer.xr.getHand(i);
      this.xrHands.push(hand);
    }

    canvas.addEventListener('pointermove', (ev) => this.onPointerMove(ev, canvas));
    canvas.addEventListener('pointerdown', (ev) => this.onPointerDown(ev, canvas));
    canvas.addEventListener('pointerup', () => this.clearDesktopLatch());
    canvas.addEventListener('pointerleave', () => this.clearDesktopLatch());
    canvas.addEventListener('pointercancel', () => this.clearDesktopLatch());

    renderer.xr.addEventListener('sessionstart', () => {
      this.desktopEnabled = false;
    });
    renderer.xr.addEventListener('sessionend', () => {
      this.desktopEnabled = true;
      this.xrHandsLive = false;
      this.xrPinchLatched[0] = false;
      this.xrPinchLatched[1] = false;
      this.avatar.enableMatrixAutoUpdate();
      this.avatar.restPose();
    });
  }

  addToScene(scene: THREE.Scene): void {
    for (const hand of this.xrHands) scene.add(hand);
  }

  setOrbCollectedCallback(fn: OrbCollectedCallback): void {
    this.onOrbCollected = fn;
  }

  getInputMode(): InputMode {
    if (this.renderer.xr.isPresenting && this.xrHandsLive) return 'xr-hands';
    if (this.renderer.xr.isPresenting) return 'controllers';
    return 'desktop-hands';
  }

  /** Game.loop arms this only while PLAYING so menu clicks do not collect. */
  setCollectArmed(armed: boolean): void {
    this.collectArmed = armed;
  }

  private clearDesktopLatch(): void {
    this.pointerDown = false;
    this.desktopPinchLatched = false;
    this.avatar.setPinched(false);
  }

  /**
   * Pose avatar hands. Call once per frame from Game.loop.
   * Desktop collect fires on pointerdown (not on the frame loop) so a click
   * cannot miss between down and up.
   */
  update(): void {
    if (this.renderer.xr.isPresenting) {
      this.updateXr(this.collectArmed);
      return;
    }
    if (!this.desktopEnabled) return;
    this.updateDesktop();
  }

  /** Desktop click path used when collect is armed. */
  tryDesktopCollect(): Orb | null {
    const onScreen = this.pickNearestOnScreen(0.14);
    if (onScreen) {
      this.commitCollect(onScreen);
      return onScreen;
    }
    const fromRay = this.raycastFromPointer();
    if (fromRay) {
      this.commitCollect(fromRay);
      return fromRay;
    }
    const palm = this.avatar.getRightPalmPosition();
    const near = this.collectNear(palm, DESKTOP_REACH_M);
    if (near) {
      this.commitCollect(near);
      return near;
    }
    this.haptic.miss();
    return null;
  }

  private updateDesktop(): void {
    this.tmp.set(this.pointerNdcX * 0.55, this.pointerNdcY * 0.32, -1.15);
    this.tmp.applyMatrix4(this.camera.matrixWorld);
    this.avatar.poseDesktop(this.tmp, this.camera, this.pointerDown);
  }

  private updateXr(collectEnabled: boolean): void {
    let anyJoints = false;
    for (let i = 0; i < this.xrHands.length; i++) {
      const hand = this.xrHands[i];
      const joints = (hand as unknown as { joints?: Record<string, THREE.Object3D> }).joints;
      const wrist = joints?.['wrist'];
      const thumb = joints?.['thumb-tip'];
      const index = joints?.['index-finger-tip'];
      if (!wrist) continue;
      anyJoints = true;
      const side: 0 | 1 = i === 0 ? 0 : 1;
      this.avatar.poseFromWristMatrix(side, wrist.matrixWorld, false);
      if (thumb && index) {
        this.thumbWorld.setFromMatrixPosition(thumb.matrixWorld);
        this.indexWorld.setFromMatrixPosition(index.matrixWorld);
        const pinched = isPinchClosed(this.thumbWorld, this.indexWorld);
        if (side === 1) this.avatar.setPinched(pinched);
        const next = nextPinchLatch(pinched, this.xrPinchLatched[i]);
        this.xrPinchLatched[i] = next.latched;
        if (next.fire && collectEnabled) {
          const origin = this.indexWorld.clone();
          const hit = this.collectNear(origin, PINCH_REACH_M);
          if (hit) this.commitCollect(hit);
          else this.haptic.miss();
        }
      }
    }
    this.xrHandsLive = anyJoints;
    this.avatar.setVisible(true);
  }

  private collectNear(origin: THREE.Vector3, reach: number): Orb | null {
    const candidates: ProximityCandidate<Orb>[] = [];
    for (const orb of this.spawner.getOrbs()) {
      if (orb.isCollected()) continue;
      candidates.push({
        item: orb,
        position: orb.mesh.position,
        radius: ORB_RADIUS[orb.tier] ?? 0.06,
      });
    }
    return findNearestInReach(origin, candidates, reach);
  }

  private pickNearestOnScreen(maxNdc: number): Orb | null {
    let best: Orb | null = null;
    let bestD = maxNdc;
    const v = new THREE.Vector3();
    for (const orb of this.spawner.getOrbs()) {
      if (orb.isCollected()) continue;
      v.copy(orb.mesh.position).project(this.camera);
      if (v.z < -1 || v.z > 1) continue;
      const d = Math.hypot(v.x - this.pointerNdcX, v.y - this.pointerNdcY);
      if (d < bestD) {
        bestD = d;
        best = orb;
      }
    }
    return best;
  }

  private raycastFromPointer(): Orb | null {
    this.ndc.set(this.pointerNdcX, this.pointerNdcY);
    this.raycaster.setFromCamera(this.ndc, this.camera);
    const meshes = this.spawner.getOrbs()
      .filter((o) => !o.isCollected())
      .map((o) => o.mesh);
    const hits = this.raycaster.intersectObjects(meshes, false);
    if (hits.length === 0) return null;
    return (hits[0].object.userData['orb'] as Orb | undefined) ?? null;
  }

  private commitCollect(orb: Orb): void {
    if (orb.isCollected()) return;
    orb.collect();
    this.haptic.collectOrb(orb.tier);
    this.onOrbCollected?.(orb);
  }

  private onPointerMove(ev: PointerEvent, canvas: HTMLElement): void {
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    this.pointerNdcX = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointerNdcY = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private onPointerDown(ev: PointerEvent, canvas: HTMLElement): void {
    if (ev.button !== 0) return;
    this.onPointerMove(ev, canvas);
    this.pointerDown = true;
    if (this.collectArmed && !this.desktopPinchLatched) {
      this.desktopPinchLatched = true;
      this.tryDesktopCollect();
    }
  }
}
