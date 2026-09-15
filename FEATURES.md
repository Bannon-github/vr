# VR features list

Living checklist for `Bannon-github/vr`. Mark an item **done** only when the code, a UI entry point, a README how-to, and at least one screenshot all exist on the same branch.

## Done

1. **Bootstrap import** (PR #1) — starter assets from `quest-vr-creator`, `Me-google`, and `WeMadeAGame` under `imports/`.
2. **Avatar Hands (TODO #4) — pinch-collect orbs in Orb Collector** — **implemented on `feature/avatar-hands` (PR #2)**.
   - Entry: Orb Collector overlay **Start round** button, then pinch (hands) or trigger (controllers). Press **H** to toggle the avatar-hand meshes.
   - Connections: hand + controller collect both call the shared `OrbCollectedCallback`; colours come from `theme.ts`; score/combo is written through `ScoreManager`.
   - Docs: root `README.md` “Avatar Hands” section; `imports/Me-google/platform/quest/game/README.md`.
   - Screenshots: `docs/screenshots/avatar-hands-start.svg`, `docs/screenshots/avatar-hands-play.svg`.

## Still open (from quest-vr-creator TODO + repo notes)

- Real-device Quest Browser full interaction test + feedback loop
- Full binary glTF export via official GLTFExporter
- Scene share via cloud / shortened link
- Opacity live controls + more advanced material panel polish
- Multiplayer, persistence beyond localStorage, Horizon Store packaging

## Notes for the next agent

Do not rewrite Orb Collector game files unless a test fails. Preview convention from earlier sessions: Vite on `0.0.0.0:8080` when a sandbox `/workspace/startup.sh` exists.
