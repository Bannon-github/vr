/**
 * OverlayUI.ts — DOM chrome for the Orb Collector (desktop + Quest Browser).
 *
 * This is the visible entry point for the Avatar Hands feature: a start
 * panel with numbered steps, then a compact HUD bar once a round is live.
 * Overlay actions call into Game so the 3D scene, ScoreManager, and hands
 * stay the single source of truth.
 */

import { Game, GameSnapshot, GameState } from './Game.js';

export class OverlayUI {
  private readonly root: HTMLElement;
  private readonly panel: HTMLElement;
  private readonly hud: HTMLElement;
  private readonly scoreEl: HTMLElement;
  private readonly comboEl: HTMLElement;
  private readonly timeEl: HTMLElement;
  private readonly modeEl: HTMLElement;
  private readonly resultEl: HTMLElement;
  private readonly startBtn: HTMLButtonElement;
  private readonly pauseBtn: HTMLButtonElement;
  private readonly handsBtn: HTMLButtonElement;

  constructor(game: Game) {
    this.root = must('#vr-overlay');
    this.panel = must('#vr-panel');
    this.hud = must('#vr-hud');
    this.scoreEl = must('#hud-score');
    this.comboEl = must('#hud-combo');
    this.timeEl = must('#hud-time');
    this.modeEl = must('#hud-mode');
    this.resultEl = must('#vr-result');
    this.startBtn = must('#btn-start') as HTMLButtonElement;
    this.pauseBtn = must('#btn-pause') as HTMLButtonElement;
    this.handsBtn = must('#btn-hands') as HTMLButtonElement;

    this.startBtn.addEventListener('click', () => game.requestStart());
    this.pauseBtn.addEventListener('click', () => game.requestPauseToggle());
    this.handsBtn.addEventListener('click', () => game.toggleHandsVisible());

    window.addEventListener('keydown', (ev) => {
      if (ev.code === 'Space') {
        ev.preventDefault();
        const snap = game.getSnapshot();
        if (snap.state === GameState.MENU || snap.state === GameState.GAME_OVER) {
          game.requestStart();
        } else {
          game.requestPauseToggle();
        }
      }
      if (ev.code === 'KeyH') game.toggleHandsVisible();
    });

    game.subscribe((snap) => this.render(snap));
    this.render(game.getSnapshot());
  }

  private render(snap: GameSnapshot): void {
    const playing = snap.state === GameState.PLAYING;
    const paused = snap.state === GameState.PAUSED;
    const over = snap.state === GameState.GAME_OVER;
    const menu = snap.state === GameState.MENU;

    this.panel.hidden = !(menu || over);
    this.hud.hidden = menu;
    this.root.classList.toggle('is-playing', playing);
    this.root.classList.toggle('is-paused', paused);

    this.startBtn.textContent = over ? 'Play again' : 'Start round';
    this.pauseBtn.textContent = paused ? 'Resume' : 'Pause';
    this.pauseBtn.disabled = menu || over;
    this.handsBtn.setAttribute('aria-pressed', snap.handsVisible ? 'true' : 'false');
    this.handsBtn.textContent = snap.handsVisible ? 'Hands on' : 'Hands off';

    this.scoreEl.textContent = snap.score.toLocaleString();
    this.comboEl.textContent = snap.combo > 1 ? `${snap.combo}×` : '—';
    this.timeEl.textContent = `${Math.ceil(snap.remainingMs / 1000)}s`;
    this.modeEl.textContent = modeLabel(snap.inputMode);

    if (over) {
      const isNew = snap.score >= snap.highScore && snap.score > 0;
      this.resultEl.hidden = false;
      this.resultEl.innerHTML = isNew
        ? `<strong>New best</strong> ${snap.score.toLocaleString()}`
        : `<strong>Score</strong> ${snap.score.toLocaleString()} <span>best ${snap.highScore.toLocaleString()}</span>`;
    } else {
      this.resultEl.hidden = true;
      this.resultEl.textContent = '';
    }
  }
}

function modeLabel(mode: GameSnapshot['inputMode']): string {
  if (mode === 'xr-hands') return 'Quest hands';
  if (mode === 'controllers') return 'Controllers';
  return 'Ghost hands';
}

function must(sel: string): HTMLElement {
  const el = document.querySelector<HTMLElement>(sel);
  if (!el) throw new Error(`OverlayUI missing ${sel}`);
  return el;
}
