/**
 * AvatarHands.ts — Semi-transparent white 3D avatar hands.
 *
 * Implements the `visions/vision-elements.md` "avatar hands" concept inside
 * the Orb Collector scene: ethereal, translucent palms so the player can
 * still see orbs, HUD panels, and the floor grid through them.
 *
 * Two independent groups (left / right) are posed either by:
 *   - WebXR hand joints (Quest hand tracking), or
 *   - a desktop ghost-hand that follows the pointer (browser preview).
 *
 * Wrist readout: the left hand hosts a tiny holographic strip that displays
 * live ScoreManager numbers (score / combo) — the HUD component's data
 * flowing into the hand mesh.
 */

import * as THREE from 'three';
import { AccentColors } from './theme.js';

const PALM_COLOR = 0xf4f7fb;
const FINGER_COLOR = 0xe8eef6;

export class AvatarHands {
  readonly group = new THREE.Group();
  readonly left: THREE.Group;
  readonly right: THREE.Group;

  private readonly leftMat: THREE.MeshStandardMaterial;
  private readonly rightMat: THREE.MeshStandardMaterial;
  private readonly wristCanvas: HTMLCanvasElement;
  private readonly wristTex: THREE.CanvasTexture;
  private pinched = false;
  private glowPhase = 0;
  private visible = true;

  constructor() {
    this.leftMat = this.makeSkinMaterial(0.38);
    this.rightMat = this.makeSkinMaterial(0.38);
    this.left = this.buildHand('left', this.leftMat);
    this.right = this.buildHand('right', this.rightMat);

    this.wristCanvas = document.createElement('canvas');
    this.wristCanvas.width = 256;
    this.wristCanvas.height = 64;
    this.wristTex = new THREE.CanvasTexture(this.wristCanvas);
    const wristGeo = new THREE.PlaneGeometry(0.09, 0.022);
    const wristMat = new THREE.MeshBasicMaterial({
      map: this.wristTex,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const wrist = new THREE.Mesh(wristGeo, wristMat);
    wrist.name = 'wrist-readout';
    wrist.position.set(0, 0.018, -0.01);
    wrist.rotation.x = -Math.PI / 2.6;
    this.left.add(wrist);

    this.group.add(this.left, this.right);
    this.group.name = 'avatar-hands';
    this.restPose();
    this.setWristStats(0, 1);
  }

  addToScene(scene: THREE.Scene): void {
    scene.add(this.group);
  }

  setVisible(v: boolean): void {
    this.visible = v;
    this.group.visible = v;
  }

  isVisible(): boolean {
    return this.visible;
  }

  /** Idle / rest pose slightly in front of a standing player. */
  restPose(): void {
    this.left.position.set(-0.22, 1.22, -0.38);
    this.right.position.set(0.22, 1.22, -0.38);
    this.left.rotation.set(-0.35, 0.15, 0.25);
    this.right.rotation.set(-0.35, -0.15, -0.25);
    this.setPinched(false);
  }

  /**
   * Pose the right (dominant) hand in world space for desktop play.
   * The left hand mirrors at a calmer offset so both remain visible.
   */
  poseDesktop(rightWorld: THREE.Vector3, camera: THREE.Camera, pinched: boolean): void {
    this.right.position.copy(rightWorld);
    this.right.quaternion.copy(camera.quaternion);
    this.right.rotateX(-Math.PI / 2.4);

    const leftOff = new THREE.Vector3(-0.28, -0.06, 0.04).applyQuaternion(camera.quaternion);
    this.left.position.copy(rightWorld).add(leftOff);
    this.left.quaternion.copy(camera.quaternion);
    this.left.rotateX(-Math.PI / 2.6);
    this.left.rotateZ(0.35);

    this.setPinched(pinched);
  }

  /**
   * Pose a hand group from a WebXR hand's wrist joint (matrix already world).
   * `side` 0 = left-ish (index 0), 1 = right-ish (index 1) — Quest order.
   */
  poseFromWristMatrix(side: 0 | 1, matrix: THREE.Matrix4, pinched: boolean): void {
    const target = side === 0 ? this.left : this.right;
    target.matrixAutoUpdate = false;
    target.matrix.copy(matrix);
    if (side === 1) this.setPinched(pinched);
  }

  enableMatrixAutoUpdate(): void {
    this.left.matrixAutoUpdate = true;
    this.right.matrixAutoUpdate = true;
  }

  setPinched(pinched: boolean): void {
    this.pinched = pinched;
    const curl = pinched ? 0.85 : 0.12;
    this.curlFingers(this.right, curl);
    this.curlFingers(this.left, pinched ? 0.35 : 0.12);
  }

  /** ScoreManager → wrist holographic strip (HUD data as hand input). */
  setWristStats(score: number, combo: number): void {
    const ctx = this.wristCanvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, 256, 64);
    ctx.fillStyle = 'rgba(8,12,20,0.72)';
    ctx.fillRect(0, 0, 256, 64);
    ctx.strokeStyle = AccentColors.secondary.getStyle();
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, 252, 60);
    ctx.fillStyle = '#F4F7FB';
    ctx.font = 'bold 28px ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(score).padStart(4, '0'), 14, 32);
    ctx.fillStyle = combo > 1 ? AccentColors.warning.getStyle() : '#8B9BC0';
    ctx.font = 'bold 20px ui-monospace, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(combo > 1 ? `${combo}x` : 'HANDS', 242, 32);
    this.wristTex.needsUpdate = true;
  }

  /** Subtle emissive pulse so the translucent material stays readable. */
  update(deltaMs: number): void {
    this.glowPhase += deltaMs * 0.004;
    const pulse = 0.10 + 0.06 * Math.sin(this.glowPhase);
    const pinchedBoost = this.pinched ? 0.18 : 0;
    this.leftMat.emissiveIntensity = pulse;
    this.rightMat.emissiveIntensity = pulse + pinchedBoost;
  }

  getRightPalmPosition(): THREE.Vector3 {
    const p = new THREE.Vector3();
    this.right.getWorldPosition(p);
    return p;
  }

  dispose(): void {
    this.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        const mat = obj.material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else (mat as THREE.Material).dispose();
      }
    });
    this.wristTex.dispose();
  }

  private makeSkinMaterial(opacity: number): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: PALM_COLOR,
      emissive: AccentColors.secondary,
      emissiveIntensity: 0.12,
      roughness: 0.28,
      metalness: 0.08,
      transparent: true,
      opacity,
      depthWrite: false,
    });
  }

  private buildHand(side: 'left' | 'right', mat: THREE.MeshStandardMaterial): THREE.Group {
    const hand = new THREE.Group();
    hand.name = `hand-${side}`;
    const sign = side === 'left' ? -1 : 1;

    const palmGeo = new THREE.BoxGeometry(0.075, 0.022, 0.095);
    const palm = new THREE.Mesh(palmGeo, mat);
    palm.name = 'palm';
    hand.add(palm);

    const fingerMat = mat.clone();
    fingerMat.color = new THREE.Color(FINGER_COLOR);
    const lengths = [0.055, 0.068, 0.072, 0.064, 0.048];
    const xs = [-0.028, -0.010, 0.010, 0.028, 0.038 * sign];
    const z0 = 0.052;
    for (let i = 0; i < 5; i++) {
      const isThumb = i === 4;
      const geo = new THREE.CapsuleGeometry(isThumb ? 0.008 : 0.007, lengths[i], 4, 8);
      const finger = new THREE.Mesh(geo, fingerMat);
      finger.name = `finger-${i}`;
      if (isThumb) {
        finger.position.set(0.042 * sign, 0.004, 0.012);
        finger.rotation.z = sign * 0.85;
        finger.rotation.x = 0.4;
      } else {
        finger.position.set(xs[i], 0.006, z0 + lengths[i] * 0.35);
        finger.rotation.x = Math.PI / 2;
      }
      hand.add(finger);
    }
    return hand;
  }

  private curlFingers(hand: THREE.Group, amount: number): void {
    hand.children.forEach((child) => {
      if (!child.name.startsWith('finger-')) return;
      const idx = Number(child.name.split('-')[1]);
      if (idx === 4) {
        child.rotation.x = 0.4 + amount * 0.5;
      } else {
        child.rotation.x = Math.PI / 2 + amount * 0.9;
      }
    });
  }
}
