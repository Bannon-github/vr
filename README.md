# vr
# VR – Evolving Quest App

[![Made for Meta Quest](https://img.shields.io/badge/Made%20for-Meta%20Quest-blue.svg)](https://developers.meta.com/horizon/)
[![WebXR & A-Frame](https://img.shields.io/badge/WebXR%20%26%20A--Frame-Ready-blueviolet.svg)](https://aframe.io/)
[![Beginner Friendly](https://img.shields.io/badge/Beginner-Friendly-green.svg)](https://github.com/bannon-github/vr)

**VR** is my personal journey into building immersive apps for the **Meta Quest family** (Quest 2, 3, 3S, Pro). This repository consolidates learnings and reusable patterns from several VR projects into a unified starter foundation.

I'm an uneducated coder with zero formal training or professional experience — just a huge passion for VR and a dream to build a legitimate business on the Meta Horizon platform.

This repo will evolve as I learn, experiment, fail, and improve. The app starts simple and grows based on what feels fun and useful in-headset. No rigid roadmap — just honest progress.

Thanks in advance to **Meta**, **Google**, **GitHub**, **xAI**, and everyone who joins this adventure later. You make this possible for someone like me.

## Current Status (as of September 2026)
- **Bootstrap phase complete**: Imported starter assets and reusable code from three existing projects
- WebXR working games and patterns integrated
- A-Frame hooks and Quest 3 game examples available in `/imports`
- Theme management API and architecture patterns documented
- **Avatar Hands live in Orb Collector** (PR #2): pinch or trigger to collect orbs; **H** toggles hand meshes
- Goal: Build something playable, then iterate toward monetization

See [`FEATURES.md`](./FEATURES.md) for the living feature list and [`MIGRATION_NOTES.md`](./MIGRATION_NOTES.md) for imported content.

## Avatar Hands — how to use

Implemented in `imports/Me-google/platform/quest/game/`.

1. Open Orb Collector (`index.html` via Vite / Quest Browser).
2. Click **Start round** on the overlay (clear UI entry point).
3. Collect orbs:
   - **Hands:** pinch near an orb (WebXR hand tracking).
   - **Controllers / desktop:** aim and click or squeeze trigger.
4. Press **H** to show or hide the semi-transparent avatar-hand meshes.
5. Score and combo update through the existing HUD / `ScoreManager`. Controllers keep working; hands share the same collect callback so the rest of the loop does not break.

**Connections**
- Input to `theme.ts` + `ScoreManager` (orb colours and points).
- Shared `OrbCollectedCallback` with `ControllerManager` output so pinch and trigger take the same scoring path.

![Lobby / start overlay](docs/screenshots/avatar-hands-start.svg)

![Play: pinch collect](docs/screenshots/avatar-hands-play.svg)

## Repository Structure

```
vr/
├── README.md                    # This file
├── FEATURES.md                   # Living feature checklist
├── MIGRATION_NOTES.md           # Import details and next steps
├── docs/screenshots/            # Feature screenshots (SVG)
├── .gitignore                   # Unity/Node/Python/editor artifacts
├── imports/                     # Consolidated starter assets
│   ├── quest-vr-creator/       # A-Frame sandbox hooks & roadmap
│   ├── Me-google/              # WebXR Orb Collector game, ThemeManager API
│   └── WeMadeAGame/            # HTML5/JS mini-games & game-hub patterns
└── [future: main app code & Unity project structure]
```

## What's Included (from PR #1 Bootstrap Import)

### From `quest-vr-creator`
- A-Frame sandbox integration hooks (`hooks/*.js`)
- VR concepts and roadmap documentation

### From `Me-google` (Most Valuable)
- Working WebXR **Orb Collector** Quest 3 game (now with Avatar Hands pinch-collect)
- **ThemeManager API** for runtime theme switching
- JSON schema theme specification + QA validators
- Reusable data models and game architecture patterns
- Architecture decision records (73 files)

### From `WeMadeAGame`
- HTML5/JS slot-machine mini-games
- Game-hub page layout patterns
- Art & audio generator scripts (outputs excluded)

### Project Foundation
- Root `.gitignore` for common build artifacts
- Documentation structure for future development

## Quick Start

These steps are beginner-friendly — copy-paste where possible. No budget needed beyond a Quest headset and free tools.

### 1. Enable Developer Mode on Your Quest
- On headset: **Settings > System > Developer > Toggle Developer Mode ON**

### 2. Install Required Tools
- **Unity Hub & Editor**: https://unity.com/download (latest LTS 2022+)
- Add **Android Build Support** during install
- For Orb Collector locally: Node.js + `npm install` in `imports/Me-google/platform/quest/game`

### 3. Clone This Repo
```bash
git clone https://github.com/Bannon-github/vr.git
cd vr
```

### 4. Explore the Imported Assets
- Start with `/imports/Me-google/platform/quest/game/` for Orb Collector + Avatar Hands
- Check `/imports/quest-vr-creator/` for A-Frame hooks and patterns
- Review `MIGRATION_NOTES.md` and `FEATURES.md`

### 5. Set Up Your Quest for Development
- Connect Quest via USB cable to your dev machine
- Enable USB Debugging on headset
- Use Android Debug Bridge (adb) to install builds

## Next Steps

See [`FEATURES.md`](./FEATURES.md) and [`MIGRATION_NOTES.md`](./MIGRATION_NOTES.md).

## Project Goals & Vision

**Short term**: Get the imported WebXR game running on Quest 3, polish gameplay.

**Medium term**: Expand with new features (multiplayer, persistence, monetization).

**Long term**: Publish to Meta Horizon Store and build a sustainable VR business.

## License & Attribution

This repo integrates code from multiple sources (see `MIGRATION_NOTES.md` for full attribution). Check individual source directories for original licenses.

---

*Last Updated: September 2026 — Avatar Hands (pinch-collect) shipped in Orb Collector on feature/avatar-hands.*
