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

- Unity / OpenXR / Android APK scaffolding (the root README used to say this — ignore it)
- Importing more repos into `imports/`
- Slot machines, 2D casino demos, or `imports/WeMadeAGame/`
- A-Frame rewrites (`imports/quest-vr-creator` is a vision reference, not a second renderer)
- Analytics, accounts, multiplayer, or monetization SDKs
- New theme systems (ThemeManager already exists; do not duplicate it)

## Goal sequence

1. Playable in desktop browser (ghost hands + click).
2. Playable in Quest Browser via `adb reverse` + Enter VR (pinch + trigger).
3. HTTPS / GitHub Pages so the headset can load it without a cable.
4. Polish (feel, haptics, comfort) until a stranger would play a second round.
5. Only then: Horizon Store packaging.

If a task does not move 1→4, it is the wrong task.

## Code rules

1. One collect pipeline. Controllers, XR pinch, and desktop click must all call the same `OrbCollectedCallback`. Do not add a second scoring path.
2. Pause/menu must freeze orbs, timer, combo, and collect. Only `GameState.PLAYING` simulates the world.
3. XR pinch math uses **world** joint positions (`matrixWorld`), never local `.position`.
4. Pure logic (`ScoreManager`, `GameTimer`, `WaveConfig`, `collectProximity`) stays Three.js-free and unit-tested.
5. Keep files under 500 lines (existing RULE-006).
6. Privacy-first: no network at runtime, no analytics, high score in `localStorage` only.
7. Root scripts (`npm test`, `npm run dev`) must keep working once added. They proxy into the game folder.

## How to open work

- Branch from `main` unless an open feature PR already owns the files you need.
- Open a pull request. Request review. Never push straight to `main` for Copilot-authored work.
- Run `npm test` in `imports/Me-google/platform/quest/game`. Do not claim done if tests were not run.
- Update `FEATURES.md` when a player-visible behavior ships.
- Do not rewrite the README into a manifesto. Keep the Quick Start copy-pasteable.

## Review bar

A PR is not done if:

- The game cannot be started with Vite from the game folder
- Pause still lets orbs expire or controllers collect
- Hand tracking uses local joint positions
- New files were added under `imports/` from some other repo
- Unity is mentioned as a required first step
