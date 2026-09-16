# Copilot instructions — Bannon-github/vr

You are working on a **solo founder's first shippable Meta Quest product**, not a research dump.

Matthew (Bannon-github) is self-taught. Prefer small, testable PRs a beginner can try in Quest Browser or on a desktop. Do not impress with architecture. Ship the loop.

## Product (locked)

**Orb Collector** is the product. It is a WebXR / three.js game for Meta Quest (Quest Browser first, Horizon Store later).

Playable source of truth:

```
imports/Me-google/platform/quest/game/
```

Until that folder is promoted to `/app`, **all gameplay work happens there**.

### Explicitly out of scope until a human asks

- Unity / OpenXR / Android APK scaffolding
- Importing more repos into `imports/`
- Slot machines, 2D casino demos, or `imports/WeMadeAGame/`
- A-Frame rewrites (`imports/quest-vr-creator` is a vision reference, not a second renderer)
- Analytics, accounts, multiplayer, or monetization SDKs
- New theme systems (ThemeManager already exists; do not duplicate it)

## Goal sequence

1. Playable in desktop browser (ghost hands + click). **Done on PR #2.**
2. Playable in Quest Browser via `adb reverse` + Enter VR (pinch + trigger).
3. HTTPS / GitHub Pages so the headset can load it without a cable. Workflow: `.github/workflows/pages.yml`. Enable Pages in repo settings (GitHub Actions source).
4. Polish (feel, haptics, comfort) until a stranger would play a second round.
5. Only then: Horizon Store packaging.

If a task does not move 2→4, it is the wrong task.

## Code rules

1. One collect pipeline. Controllers, XR pinch, and desktop click must all call the same `OrbCollectedCallback`.
2. Pause/menu must freeze orbs, timer, combo, and collect. Only `GameState.PLAYING` simulates. **Do not call `spawner.update` while paused** — `setActive(false)` only stops *new* spawns.
3. XR pinch uses **world** joint positions (`matrixWorld`), never local `.position`. Latch **per hand**. Run `nextPinchLatch` even while paused so a released pinch unlatches. Desktop latch clears on `pointerup`, `pointerleave`, and `pointercancel`.
4. Arm **both** `HandTrackingManager` and `ControllerManager` with `setCollectArmed(isSimulating(state))` every frame. If you add `setCollectArmed` and never call it, trigger collect is dead.
5. Overlay DOM updates go through `overlayHudKey`. Do not rebind `setOrbCollectedCallback` in `showMenuPanel`.
6. Pure logic (`ScoreManager`, `GameTimer`, `WaveConfig`, `collectProximity`) stays Three.js-free and unit-tested.
7. Keep files under 500 lines (RULE-006).
8. Privacy-first: no network at runtime, no analytics, high score in `localStorage` only.
9. Root scripts (`npm test`, `npm run dev`) proxy into the game folder. Vite is `Number(process.env.PORT) || 5173`. **Not 8080.**

## How to open work

- Branch from `main` unless an open feature PR already owns the files you need. **PR #2 (`feature/avatar-hands`) currently owns the game.** Land follow-ups into that branch.
- Open a pull request. Never push straight to `main` for Copilot-authored work.
- Run `npm test` from repo root. Do not claim done if tests were not run.
- Update `FEATURES.md` when a player-visible behavior ships.
- Keep the README Quick Start copy-pasteable. Never list Unity Hub as a required first step.

## Active PRs — do not duplicate

- **PR #2** (`feature/avatar-hands` → `main`) is the product PR. Merge it after pause-unlatch is in.
- **PR #3** (`copilot/featureavatar-hands`) is an **empty duplicate**. Close it. Do not keep implementing it.

## Review bar

A PR is not done if:

- `npm test` is not green
- Pause still lets orbs expire, controllers collect, or a pinch released during pause stays latched
- Hand tracking uses local joint positions
- New files were added under `imports/` from some other repo
- Unity is mentioned as a required first step
