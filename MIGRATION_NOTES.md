# Migration Notes — Bootstrap Import from Related Repos

This document tracks the initial import of starter content from three other
repositories owned by `Bannon-github` into this repo (`Bannon-github/vr`), to
give this Meta Quest VR project a head start.

**Method used:** plain file copy into namespaced folders under `imports/`.
No git submodules and no `git subtree` history merge were used — these are
independent snapshots of selected files, with no shared git history to the
source repositories. This keeps the import easy to inspect, cherry-pick from,
refactor, or delete later.

**Sources evaluated:**
- `Bannon-github/quest-vr-creator`
- `Bannon-github/Me-google`
- `Bannon-github/WeMadeAGame`

**Attribution / licensing:** none of the three source repositories contain a
`LICENSE` file. All three are owned by the same account (`Bannon-github`) as
this repository, so importing the files here does not change ownership. If
any of these repos are later made public, add an explicit license to both
the source repo and this one, and note it in each `imports/<repo>/README.md`.

---

## `imports/quest-vr-creator/`

**What was imported** (5 files):
- `TODO.md` — living roadmap/status notes for an A-Frame based "Quest VR
  Creator" sandbox app (spawn primitives, tablet UI, physics, materials).
- `hooks/*.js` (4 files) — modular vanilla-JS "hooks" meant to be wired into
  an A-Frame scene: `error-mitigation-hook.js`, `state-management-hook.js`,
  `spawn-intelligence-hook.js`, `tablet-ui-hook.js`.
- `visions/vision-elements.md` — concept notes for planned UI/interaction
  elements (translucent avatar hands, wrist-mounted holographic tablet).

**Rationale:** This repo's core idea — an in-headset object-spawning sandbox
with a wrist tablet UI, undo/redo history, and PBR material presets — is
directly applicable to a Quest starter project and is a good reference for
A-Frame + WebXR patterns (error handling, state management, spawn logic).

**Known caveats:**
- **The source repo's `index.html` and `README.md` were empty (0 bytes)** at
  the time of import (the project's own `TODO.md` mentions "Fix prior empty
  push", suggesting a bad commit that was never fully recovered). This means
  the actual A-Frame `<a-scene>` markup that the hooks were designed to
  attach to **does not exist yet** — only the hook scripts and design docs
  were recovered.
- `screenshots/PROOF.md` was also empty and was not imported.
- The hooks reference globals (e.g. a `VRCreatorState` object, `.spawned-object`
  entities, `oculus-touch-controls`) that assume a specific A-Frame scene
  structure that must be (re)written from scratch using `visions/` and
  `TODO.md` as a guide.

---

## `imports/Me-google/`

**What was imported** (73 files):
- `README.md` — one-paragraph project pitch (an "xrOS" concept).
- `platform/quest/` (in full) — the most directly relevant material:
  - `game/` — a small WebXR **"Orb Collector" Quest 3 game** (TypeScript +
    Vite + three.js), with controller/hand-tracking input, haptics, wave
    progression, HUD, and unit tests (`src/__tests__`).
  - `api/ThemeManager.ts` (+ `.test.ts`, plus Kotlin/Swift stub ports) — a
    runtime theme-switching API with a guaranteed fallback theme.
  - `themes/` — a JSON-schema-defined ("DTCG-aligned") VR theme spec, plus
    the shipped `me-google-default` theme (tokens, accessibility overrides).
  - `qa/` — Python validators (contrast, motion-safety, schema) and
    checklists (accessibility audit, release gate, PR review) for VR UI/theme
    QA.
- `core/models/` — small, framework-agnostic TypeScript data models
  (`session.ts`, `user.ts`, `spatial_item.ts`) with unit tests; useful as a
  starting point for session/state modeling.
- `docs/adr/` (9 ADRs) — architecture decision records covering system
  architecture, anonymous networking, the theme system, Quest UI standards,
  accessibility conformance, the theme QA framework, and the iterative theme
  pipeline. Good background reading for the `platform/quest` code above.
- `docs/api/README.md` — short pointer describing the project's API surface
  conventions.
- `scripts/theme_pipeline.py` — the CLI referenced by `platform/quest/README.md`
  to validate/build/generate/publish themes.

**Rationale:** `platform/quest/game` is a working, self-contained Quest 3
WebXR game (orb-collecting with score/combo/wave systems) — a strong
head-start for gameplay code. The theme system (`api/`, `themes/`, `qa/`)
provides a reusable, accessibility-conscious UI theming approach for Quest
apps, and the ADRs explain the reasoning so it isn't a black box.

**Deliberately not imported** (to avoid clutter unrelated to a VR starter):
- `game.js`, root `index.html`, `styles.css`, `GAME.md`, `DEVLOG.md` — a
  separate 2D browser game ("CHROMABOUND") unrelated to the Quest/VR work.
- `scripts/ai_client.py`, `council*.py`, `generate_tasks.py`, `pr_review.py`,
  `premortem.py`, `reflect.py`, `scout.py` and their tests — AI-agent
  workflow tooling specific to that repo's own development process.
- `dashboard/`, `reports/` (dated reflection logs), `services/README.md`
  (an empty stub), `AGENTS.md`, `TASKS.md`, `.task-state.json` — project
  management / agent-workflow artifacts, not reusable VR code.

**Known caveats:**
- `platform/quest/game` and `platform/quest/api` each have their own
  `package.json`/`package-lock.json` and expect `npm install` in that
  subfolder; they are not wired into any root-level build yet.
- `scripts/theme_pipeline.py` may import sibling modules from the original
  repo's `scripts/` directory that were not copied; it should be treated as
  a reference implementation until verified standalone.
- The QA Python validators (`platform/quest/qa/validators/`) may expect a
  `requirements`/`pyproject` context that wasn't imported; check for missing
  imports before relying on them.

---

## `imports/WeMadeAGame/`

**What was imported** (17 files):
- `README.md` — project pitch (AI-driven, ship-to-app-stores experiment).
- `games/casino-slots/` — a small standalone HTML/JS slot-machine demo
  (`index.html`, `edit.html`, `config.js`).
- `games/index.html`, `games/overview.html`, `games/glossary.html` — a
  simple static "game hub" page structure and a glossary/overview example,
  useful as a pattern for listing multiple mini-experiences from one repo.
- `docs/styles/hub.css` — shared stylesheet for the hub pages above.
- `docs/games/lucky-plumber-slots/` (code only: `index.html`, `css/style.css`,
  `js/game.js`, `js/config.js`, `README.md`, `ASSETS.md`) — a more polished
  slot-machine game whose art/audio are designed as swappable, labeled
  placeholders (see `ASSETS.md`).
- `tools/lucky-plumber-slots/gen_audio.py`, `gen_images.py`, `README.md` —
  small Python scripts used to generate the above placeholder art/audio.

**Rationale:** These are small, self-contained HTML5/JS mini-games and a
"hub" page pattern. While not VR-native, they are lightweight, easy-to-read
examples of game loop / config-driven asset patterns that could be adapted
into a Quest browser experience or used as placeholder content while the VR
app matures.

**Deliberately not imported (heavy/binary or unrelated):**
- `games/assets/background_image.png` (5.6 MB) and `games/assets/img/casino-bg.jpg`
  (908 KB) — large binary images, per the "avoid heavy/generated/binary
  clutter" guidance. `games/casino-slots/` will need placeholder art if run
  as-is.
- `docs/games/lucky-plumber-slots/assets/` (audio `.wav` + image `.png`,
  ~550 KB total) — binary placeholder art/audio described in `ASSETS.md`;
  regenerate locally with `tools/lucky-plumber-slots/gen_audio.py` /
  `gen_images.py`, or copy over from the source repo if needed.
- `games/assets/css/theme.css` — depends on the un-imported background
  images above.
- `CLAUDE.md`, `.nojekyll`, `CNAME`, `instructions`, `instructions-formatted.md` —
  agent-workflow / GitHub Pages hosting metadata specific to that repo.

**Known caveats:**
- `games/casino-slots/index.html` and `docs/games/lucky-plumber-slots/index.html`
  will show broken image/audio links until the missing `assets/` binaries
  are supplied (see above).
- The `docs/` folder in the source repo was published via GitHub Pages
  (`.nojekyll`, `CNAME`); those hosting-specific files were not imported.

---

## Suggested next cleanup steps

1. **Pick one primary direction first.** The most VR-relevant, ready-to-run
   piece is `imports/Me-google/platform/quest/game` (Quest 3 WebXR game).
   Consider moving it out of `imports/` into a top-level Unity/WebXR project
   structure once you decide whether this project will be Unity-based (per
   the root `README.md`) or WebXR-based (per this game) — the two are not
   directly compatible.
2. Run `npm install && npm test` inside `imports/Me-google/platform/quest/game`
   and `imports/Me-google/platform/quest/api` to confirm they still work
   standalone after the copy.
3. Decide whether to keep the theme system (`platform/quest/themes`, `api/`,
   `qa/`) — it's a nice-to-have accessibility/theming layer, not required
   for a first playable prototype.
4. For `imports/quest-vr-creator/`, either recreate a minimal `index.html`
   A-Frame scene that wires up the four `hooks/*.js` files, or drop the
   hooks if the project moves in a Unity direction instead of A-Frame/WebXR.
5. For `imports/WeMadeAGame/`, either regenerate placeholder art/audio with
   the provided `tools/lucky-plumber-slots/gen_*.py` scripts, or drop that
   folder if 2D slot-machine mini-games aren't part of the roadmap.
6. Once content is triaged, delete unused subfolders under `imports/` and
   remove this file's now-stale sections, or fold any decisions into the
   root `README.md` roadmap/status section.
