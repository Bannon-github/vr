# VR features list

Living checklist for `Bannon-github/vr`. Mark an item **done** only when the code, a UI entry point, a README how-to, and at least one screenshot all exist on the same branch.

## Done

1. **Bootstrap import** (PR #1) — starter assets from `quest-vr-creator`, `Me-google`, and `WeMadeAGame` under `imports/`.
2. **Avatar Hands — pinch-collect in Orb Collector** (PR #2).
   - Entry: overlay **Start round**, then pinch / trigger / click. **H** toggles meshes.
   - One `OrbCollectedCallback`. Score/combo through `ScoreManager`.
3. **Pause freezes the world** — only `GameState.PLAYING` simulates. Controllers and hands arm only while playing.
4. **World-space XR pinch** — thumb/index use `matrixWorld`. Per-hand latch. Desktop `pointerleave` / `pointerup` / `pointercancel` clear the click latch.
5. **Pause unlatches pinch** — `nextPinchLatch` still runs while paused so a released pinch can fire again after resume.

## Next (in this order)

1. On-headset QA in Quest Browser (`adb reverse tcp:5173 tcp:5173`) with a real device screenshot
2. Enable GitHub Pages (Settings → Pages → GitHub Actions) so the workflow in `.github/workflows/pages.yml` can serve HTTPS to the headset without a cable
3. Comfort / feel polish until a stranger plays a second round
4. Only then: Horizon Store packaging

Out of scope until a human asks: Unity, more `imports/` dumps, slot machines, A-Frame rewrite, accounts, multiplayer, monetization SDKs.

## Notes for agents

- Product path: `imports/Me-google/platform/quest/game/`
- `npm install && npm test && npm run dev` from the **repo root**
- Vite default is **5173**, not 8080
- PR #3 is a stale empty duplicate of `feature/avatar-hands`. Do not continue it. Merge PR #2 after the pause-unlatch fix lands.
