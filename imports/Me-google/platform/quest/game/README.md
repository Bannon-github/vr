# Orb Collector — Meta Quest 3 Game

A WebXR game built for **Meta Quest 3**, integrated with the Me-google xrOS platform and
its default VR theme system. Play it in the **Meta Quest Browser** with full 6DoF controller
support, hand-tracking, and haptic feedback.

## Game Overview

Floating orbs appear in 3D space around you. Use your **Quest 3 controllers** (aim + trigger)
or **hand tracking** (pinch gesture) to collect them before they expire. Score as many points
as possible in **60 seconds**.

| Orb Colour | Tier       | Points | Spawn Rate |
|------------|------------|--------|------------|
| Cyan       | Common     | 10     | 45 %       |
| Green      | Uncommon   | 25     | 30 %       |
| Amber      | Rare       | 50     | 15 %       |
| Rose       | Epic       | 100    | 7 %        |
| Violet     | Legendary  | 250    | 3 %        |

**Combo multiplier**: collect orbs within 2 s of each other to chain combos (up to 8×).

**Wave progression**: difficulty ramps automatically as your score climbs through 5 tiers —
more orbs, shorter lifetime, faster drift.

## Avatar Hands (pinch-collect)

**Entry point:** the overlay **Start round** button in `index.html` / `OverlayUI.ts`.

How to use:
1. Start a round from the overlay.
2. Collect with **pinch** (hand tracking) or **click / trigger** (controller / desktop).
3. Press **H** to toggle the semi-transparent avatar-hand meshes (`AvatarHands.ts`).

Wiring:
- `HandTrackingManager` and `ControllerManager` both fire the shared `OrbCollectedCallback`.
- Colours and HUD chrome come from `theme.ts`.
- Points go through `ScoreManager` so combos and waves stay intact.
- `collectProximity.ts` + `src/__tests__/collectProximity.test.ts` cover pinch reach.

Screenshots (repo root):
- `docs/screenshots/avatar-hands-start.svg`
- `docs/screenshots/avatar-hands-play.svg`

## Controls

| Action         | Controller / desktop | Hands |
|----------------|----------------------|-------|
| Aim at orb     | Point controller     | Reach |
| Collect orb    | Squeeze trigger / click | Pinch |
| Pause / Resume | Grip squeeze         | (overlay) |
| Toggle hands   | **H** key            | **H** key |

## Directory Layout

```
game/
├── index.html              Entry page (served via Vite dev or deployed to Quest Browser)
├── package.json            npm project (three, vite, vitest)
├── tsconfig.json           TypeScript strict mode
├── vite.config.ts          Vite build configuration
└── src/
    ├── main.ts             Renderer setup, VRButton, Game bootstrap
    ├── Game.ts             State machine + animation loop
    ├── theme.ts            Me-google → THREE.Color palette bridge
    ├── WaveConfig.ts       Wave difficulty table (pure logic)
    ├── GameTimer.ts        Countdown timer (pure logic)
    ├── ScoreManager.ts     Score + combo tracking (pure logic)
    ├── Orb.ts              Orb mesh entity
    ├── OrbSpawner.ts       Spawn pool and lifecycle
    ├── ControllerManager.ts XR controller input + raycasting
    ├── HandTrackingManager.ts Pinch collect + shared callback
    ├── AvatarHands.ts      Semi-transparent hand meshes (H toggle)
    ├── OverlayUI.ts        Start-round overlay entry point
    ├── HapticManager.ts    Vibration feedback wrapper
    ├── HUDManager.ts       Spatial floating UI panels
    ├── collectProximity.ts Pinch / ray collect reach helper
    └── __tests__/          Unit tests (vitest)
```

## Development

From this folder, or from the repo root (`npm install` / `npm test` / `npm run dev` proxy here):

```bash
npm install
npm test
npm run dev      # http://localhost:5173
npm run build    # production → dist/
```

### Quest Browser

Do **not** point Quest Browser at your LAN IP with a self-signed cert. `localhost` is a secure context:

```bash
# computer: leave npm run dev running
adb reverse tcp:5173 tcp:5173
```

Headset: Quest Browser → `http://localhost:5173` → **Enter VR**.

Hand tracking **is implemented** (`HandTrackingManager` + `AvatarHands`). Pinch uses world joint positions (`matrixWorld`). Pause freezes orbs and unlatches pinch so the next pinch after resume still works.

After this repo is on `main` with GitHub Pages enabled, the headset can load the HTTPS Pages URL with no cable.

## Architecture Notes

- **WebXR Device API** via Three.js `WebGLRenderer.xr` — no native SDK required.
- **Me-google theme colours** are pulled from `src/theme.ts` (mirrors the DTCG tokens in
  `platform/quest/themes/me-google-default/tokens/color.json`).
- **Privacy-first**: no analytics, no user identifiers, no network requests at runtime.
- High scores are persisted to `localStorage` only; no data leaves the device.
- All source files comply with the 500-line limit (RULE-006).

## Public API

This module exports nothing at the package level — it is a self-contained runnable app.
The pure-logic classes (`ScoreManager`, `GameTimer`, `WaveConfig`) can be imported by other
`core/` modules if shared logic is needed in future.
