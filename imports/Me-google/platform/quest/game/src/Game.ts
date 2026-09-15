/**
 * Game.ts — Main game orchestrator and state machine.
 *
 * Manages the Three.js scene, WebXR session, animation loop, and all
 * subsystems (timer, score, spawner, controllers, HUD, avatar hands).
 *
 *   LOADING → MENU → PLAYING ↔ PAUSED → GAME_OVER → MENU
 *
 * Avatar hands (vision-elements "avatar hands") and HandTrackingManager
 * share the same collect callback as ControllerManager so pinch, trigger,
 * and desktop click all award points through ScoreManager → HUD.
 */

import * as THREE from 'three';
import { ScoreManager } from './ScoreManager.js';
import { GameTimer } from './GameTimer.js';
import { OrbSpawner } from './OrbSpawner.js';
import { ControllerManager } from './ControllerManager.js';
import { HapticManager } from './HapticManager.js';
import { HUDManager } from './HUDManager.js';
import { AvatarHands } from './AvatarHands.js';
import { HandTrackingManager, type InputMode } from './HandTrackingManager.js';
import { Orb } from './Orb.js';
import { getWaveForScore } from './WaveConfig.js';
import {
  SurfaceColors, FOG_COLOR, AMBIENT_COLOR, FILL_COLOR,
} from './theme.js';

export enum GameState {
  LOADING   = 'LOADING',
  MENU      = 'MENU',
  PLAYING   = 'PLAYING',
  PAUSED    = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
}

export interface GameSnapshot {
  state: GameState;
  score: number;
  combo: number;
  wave: number;
  highScore: number;
  remainingMs: number;
  inputMode: InputMode;
  handsVisible: boolean;
  orbCount: number;
}

const ROUND_DURATION_MS = 60_000;

export class Game {
  private readonly scene    = new THREE.Scene();
  private readonly camera   = new THREE.PerspectiveCamera(75, 1, 0.1, 50);
  private readonly clock    = new THREE.Clock();

  private readonly score      = new ScoreManager();
  private readonly timer      = new GameTimer(ROUND_DURATION_MS);
  private readonly haptic     : HapticManager;
  private readonly spawner    : OrbSpawner;
  private readonly controllers: ControllerManager;
  private readonly hud        : HUDManager;
  private readonly avatar     : AvatarHands;
  private readonly hands      : HandTrackingManager;

  private state: GameState = GameState.LOADING;
  private menuGroup?: THREE.Group;
  private gameOverGroup?: THREE.Group;
  private readonly listeners = new Set<(snap: GameSnapshot) => void>();
  private lastHudKey = '';

  constructor(private readonly renderer: THREE.WebGLRenderer) {
    this.buildScene();

    this.haptic      = new HapticManager(renderer);
    this.spawner     = new OrbSpawner(this.scene, this.camera);
    this.controllers = new ControllerManager(renderer, this.spawner, this.haptic);
    this.hud         = new HUDManager();
    this.avatar      = new AvatarHands();
    this.hands       = new HandTrackingManager(
      renderer,
      this.camera,
      this.spawner,
      this.haptic,
      this.avatar,
      renderer.domElement,
    );

    this.controllers.addToScene(this.scene);
    this.hands.addToScene(this.scene);
    this.avatar.addToScene(this.scene);
    this.hud.addToScene(this.scene);

    const onCollect = (orb: Orb): void => this.onOrbCollected(orb);
    this.controllers.setOrbCollectedCallback(onCollect);
    this.hands.setOrbCollectedCallback(onCollect);

    for (const ctrl of this.controllers.controllers) {
      ctrl.addEventListener('squeezestart', () => {
        if (this.state === GameState.PLAYING) this.pauseRound();
        else if (this.state === GameState.PAUSED) this.resumeRound();
      });
    }

    renderer.xr.addEventListener('sessionstart', () => {
      this.spawner.setPreferForward(false);
      this.enterMenu();
    });
    renderer.xr.addEventListener('sessionend', () => {
      this.spawner.setPreferForward(true);
      this.enterMenu();
    });

    renderer.setAnimationLoop(() => this.loop());

    const updateAspect = (): void => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    };
    updateAspect();
    window.addEventListener('resize', updateAspect);

    this.state = GameState.MENU;
    this.showMenuPanel();
  }

  // ---------------------------------------------------------------------------
  // Public API — OverlayUI entry point
  // ---------------------------------------------------------------------------

  subscribe(fn: (snap: GameSnapshot) => void): () => void {
    this.listeners.add(fn);
    fn(this.getSnapshot());
    return () => this.listeners.delete(fn);
  }

  getSnapshot(): GameSnapshot {
    const wave = getWaveForScore(this.score.getScore());
    return {
      state: this.state,
      score: this.score.getScore(),
      combo: this.score.getCombo(),
      wave: wave.wave,
      highScore: this.score.loadHighScore(),
      remainingMs: this.timer.getRemainingMs(),
      inputMode: this.hands.getInputMode(),
      handsVisible: this.avatar.isVisible(),
      orbCount: this.spawner.getCount(),
    };
  }

  /** Start (or restart) a round from the overlay Start button / Space. */
  requestStart(): void {
    if (this.state === GameState.PLAYING) return;
    if (this.state === GameState.PAUSED) {
      this.resumeRound();
      return;
    }
    this.startRound();
  }

  requestPauseToggle(): void {
    if (this.state === GameState.PLAYING) this.pauseRound();
    else if (this.state === GameState.PAUSED) this.resumeRound();
  }

  toggleHandsVisible(): void {
    this.avatar.setVisible(!this.avatar.isVisible());
    this.emit();
  }

  // ---------------------------------------------------------------------------
  // State transitions
  // ---------------------------------------------------------------------------

  private enterMenu(): void {
    this.state = GameState.MENU;
    this.timer.reset();
    this.score.reset();
    this.spawner.clearAll();
    this.spawner.setActive(false);
    this.removeGameOverPanel();
    this.showMenuPanel();
    this.hud.updateScore(0, 1, 1);
    this.hud.updateTimer(ROUND_DURATION_MS, ROUND_DURATION_MS);
    this.avatar.setWristStats(0, 1);
    this.avatar.restPose();
    this.emit();
  }

  private startRound(): void {
    this.state = GameState.PLAYING;
    this.removeMenuPanel();
    this.removeGameOverPanel();
    this.score.reset();
    this.timer.reset();
    this.timer.start();
    this.spawner.clearAll();
    this.spawner.setActive(true);
    this.spawner.primeFirstSpawn();
    this.haptic.countdownBeat();
    this.hud.updateScore(0, 1, 1);
    this.avatar.setWristStats(0, 1);
    this.emit();
  }

  private pauseRound(): void {
    if (this.state !== GameState.PLAYING) return;
    this.state = GameState.PAUSED;
    this.timer.pause();
    this.spawner.setActive(false);
    this.emit();
  }

  private resumeRound(): void {
    if (this.state !== GameState.PAUSED) return;
    this.state = GameState.PLAYING;
    this.timer.start();
    this.spawner.setActive(true);
    this.emit();
  }

  private endRound(): void {
    this.state = GameState.GAME_OVER;
    this.timer.pause();
    this.spawner.setActive(false);
    this.score.saveHighScore();
    this.haptic.gameOver();
    this.showGameOverPanel();
    this.emit();
  }

  private emit(): void {
    this.lastHudKey = '';
    this.emitHudIfChanged();
  }

  /**
   * Overlay subscribers (DOM chips) do not need 90 Hz updates. Emit only
   * when a value the overlay actually displays has changed.
   */
  private emitHudIfChanged(): void {
    const snap = this.getSnapshot();
    const key = overlayHudKey(snap);
    if (key === this.lastHudKey) return;
    this.lastHudKey = key;
    this.listeners.forEach((fn) => fn(snap));
  }

  // ---------------------------------------------------------------------------
  // Animation loop
  // ---------------------------------------------------------------------------

  private loop(): void {
    const delta = Math.min(this.clock.getDelta() * 1_000, 100);

    if (this.state === GameState.PLAYING) {
      this.score.tick(delta);
      this.timer.tick(delta);

      const wave = getWaveForScore(this.score.getScore());
      this.spawner.update(delta, wave);

      this.hud.updateScore(this.score.getScore(), this.score.getCombo(), wave.wave);
      this.hud.updateTimer(this.timer.getRemainingMs(), ROUND_DURATION_MS);
      this.avatar.setWristStats(this.score.getScore(), this.score.getCombo());

      if (this.timer.isExpired()) this.endRound();
      else this.emitHudIfChanged();
    }

    const armed = isSimulating(this.state);
    this.hands.setCollectArmed(armed);
    this.controllers.setCollectArmed(armed);
    this.hands.update();
    this.avatar.update(delta);
    this.hud.setVisible(this.renderer.xr.isPresenting);
    this.hud.updateFrame(this.camera);
    this.renderer.render(this.scene, this.camera);
  }

  private onOrbCollected(orb: Orb): void {
    if (this.state !== GameState.PLAYING) return;
    const wave = getWaveForScore(this.score.getScore());
    this.score.addPoints(orb.points, wave.scoreMultiplier);
    this.hud.updateScore(this.score.getScore(), this.score.getCombo(), wave.wave);
    this.avatar.setWristStats(this.score.getScore(), this.score.getCombo());
    this.emit();
  }

  // ---------------------------------------------------------------------------
  // Scene construction
  // ---------------------------------------------------------------------------

  private buildScene(): void {
    this.scene.background = SurfaceColors.sunken.clone();
    this.scene.fog = new THREE.FogExp2(FOG_COLOR.getHex(), 0.06);

    this.camera.position.set(0, 1.6, 0);
    this.camera.lookAt(0, 1.35, -2.2);

    const ambient = new THREE.AmbientLight(AMBIENT_COLOR.getHex(), 8);
    this.scene.add(ambient);

    const fill = new THREE.DirectionalLight(FILL_COLOR.getHex(), 6);
    fill.position.set(3, 5, 2);
    this.scene.add(fill);

    const pl1 = new THREE.PointLight(0x7B5CFF, 3, 8);
    pl1.position.set(-3, 2, -3);
    this.scene.add(pl1);

    const pl2 = new THREE.PointLight(0x00D4FF, 2, 6);
    pl2.position.set(3, 1, 3);
    this.scene.add(pl2);

    const gridHelper = new THREE.GridHelper(20, 20, 0x1E2536, 0x151A26);
    gridHelper.position.y = 0;
    this.scene.add(gridHelper);
  }

  private billboardPos(): [number, number, number] {
    return this.renderer.xr.isPresenting ? [0, 1.4, -1.8] : [0, 1.45, -2.15];
  }

  private showMenuPanel(): void {
    if (this.menuGroup) return;
    if (!this.renderer.xr.isPresenting) return;
    this.menuGroup = this.buildBillboard(
      ['ORB COLLECTOR', '', 'Pinch or click to collect', 'Hands follow your pointer', '', `High Score: ${this.score.loadHighScore()}`],
      [0x7B5CFF,        0,   0xE8EAF0,                  0x00E5A0,                     0,  0xFFB800],
      this.billboardPos(),
    );

    for (const ctrl of this.controllers.controllers) {
      const existing = ctrl.userData['menuSelectHandler'] as (() => void) | undefined;
      if (existing) ctrl.removeEventListener('selectstart', existing);

      const handler = (): void => {
        if (this.state === GameState.MENU) this.startRound();
        else if (this.state === GameState.GAME_OVER) this.startRound();
      };
      ctrl.userData['menuSelectHandler'] = handler;
      ctrl.addEventListener('selectstart', handler);
    }

    this.scene.add(this.menuGroup);
  }

  private removeMenuPanel(): void {
    if (!this.menuGroup) return;
    this.scene.remove(this.menuGroup);
    this.menuGroup.children.forEach((c) => {
      if (c instanceof THREE.Mesh) {
        c.geometry.dispose();
        (c.material as THREE.Material).dispose();
      }
    });
    this.menuGroup = undefined;
  }

  private showGameOverPanel(): void {
    if (!this.renderer.xr.isPresenting) return;
    const high = this.score.loadHighScore();
    const isNew = this.score.getScore() >= high;
    this.gameOverGroup = this.buildBillboard(
      [
        'GAME OVER',
        '',
        `Score: ${this.score.getScore()}`,
        isNew ? 'NEW HIGH SCORE' : `Best: ${high}`,
        '',
        'Start to play again',
      ],
      [0xFF4D6D, 0, 0xE8EAF0, isNew ? 0xFFB800 : 0x8B9BC0, 0, 0x00E5A0],
      this.billboardPos(),
    );
    this.scene.add(this.gameOverGroup);
  }

  private removeGameOverPanel(): void {
    if (!this.gameOverGroup) return;
    this.scene.remove(this.gameOverGroup);
    this.gameOverGroup.children.forEach((c) => {
      if (c instanceof THREE.Mesh) {
        c.geometry.dispose();
        (c.material as THREE.Material).dispose();
      }
    });
    this.gameOverGroup = undefined;
  }

  private buildBillboard(
    lines: string[],
    colors: number[],
    position: [number, number, number],
  ): THREE.Group {
    const group     = new THREE.Group();
    const canvasW   = 640;
    const canvasH   = 64 * (lines.length + 1);
    const canvas    = document.createElement('canvas');
    canvas.width    = canvasW;
    canvas.height   = canvasH;
    const ctx       = canvas.getContext('2d')!;

    ctx.fillStyle = 'rgba(11,14,22,0.88)';
    this.roundRectCanvas(ctx, 8, 8, canvasW - 16, canvasH - 16, 20);
    ctx.fill();

    lines.forEach((line, i) => {
      if (!line) return;
      const hex = '#' + (colors[i] ?? 0xE8EAF0).toString(16).padStart(6, '0');
      ctx.fillStyle  = hex;
      ctx.font       = i === 0 ? 'bold 52px monospace' : '36px system-ui';
      ctx.textAlign  = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(line, canvasW / 2, 48 + i * 62);
    });

    const tex  = new THREE.CanvasTexture(canvas);
    const geo  = new THREE.PlaneGeometry(1.2, 1.2 * (canvasH / canvasW));
    const mat  = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(...position);
    group.add(mesh);
    return group;
  }

  private roundRectCanvas(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number, r: number,
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x, y + h - r);
    ctx.quadraticCurveTo(x, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}

/** True only during an active round — pause/menu must freeze the world. */
export function isSimulating(state: GameState): boolean {
  return state === GameState.PLAYING;
}

/** Compact key of overlay-visible fields so Game can skip redundant DOM writes. */
export function overlayHudKey(snap: GameSnapshot): string {
  return [
    snap.state,
    snap.score,
    snap.combo,
    Math.ceil(snap.remainingMs / 1000),
    snap.inputMode,
    snap.handsVisible ? '1' : '0',
  ].join('|');
}
