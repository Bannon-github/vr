# Orb Collector (Meta Quest WebXR)

This repository ships **Orb Collector**, a three.js/WebXR game for Meta Quest.

Playable source of truth:

`/home/runner/work/vr/vr/imports/Me-google/platform/quest/game`

## Quick Start

```bash
git clone https://github.com/Bannon-github/vr.git
cd vr
npm test
npm run build
npm run dev
```

Desktop play: open the Vite URL shown in terminal.

Quest Browser over USB:

```bash
adb reverse tcp:5173 tcp:5173
```

Then open `http://localhost:5173` in Quest Browser and press **Enter VR**.

## Controls

- Desktop: move pointer + left click to collect
- Quest controllers: aim + trigger to collect, squeeze to pause/resume
- Quest hands: pinch thumb/index to collect

## Notes

- No Unity setup is required for current gameplay development.
- Do not import additional repositories under `imports/`.
- Player-visible updates are tracked in `FEATURES.md`.
