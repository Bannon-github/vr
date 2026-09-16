/**
 * main.ts — Entry point for the Orb Collector Meta Quest 3 game.
 *
 * Responsibilities:
 *   1. Create and configure the Three.js WebGL renderer with XR enabled.
 *   2. Inject the Three.js VRButton into the page.
 *   3. Handle window resize for the non-XR flat preview.
 *   4. Instantiate Game and the OverlayUI entry point (Avatar Hands).
 */

import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { Game } from './Game.js';
import { OverlayUI } from './OverlayUI.js';

const renderer = new THREE.WebGLRenderer({
  antialias:        true,
  alpha:            true,
  powerPreference:  'high-performance',
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping      = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.shadowMap.enabled = false;
renderer.xr.enabled = true;

document.body.appendChild(renderer.domElement);

const vrBtn = VRButton.createButton(renderer);
vrBtn.id = vrBtn.id || 'VRButton';
vrBtn.style.display = 'none';
document.body.appendChild(vrBtn);

const xr = (navigator as Navigator & { xr?: { isSessionSupported: (m: string) => Promise<boolean> } }).xr;
if (xr?.isSessionSupported) {
  void xr.isSessionSupported('immersive-vr').then((ok) => {
    if (ok) vrBtn.style.display = '';
  });
}

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const game: Game = new Game(renderer);
const overlay: OverlayUI = new OverlayUI(game);

// Retain references so GC cannot collect the live session.
void overlay;

(window as unknown as { __vrGame: Game }).__vrGame = game;
