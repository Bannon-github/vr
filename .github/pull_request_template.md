## Why

<!-- What player-facing problem does this solve? One or two sentences. -->

## What changed

-

## How to try

```bash
npm test
npm run dev
```

Desktop: Start round → move pointer → click orbs. Space pauses. H toggles hands.

Quest: `adb reverse tcp:5173 tcp:5173` → Quest Browser → `http://localhost:5173` → Enter VR.

## Checks

- [ ] `npm test` passes
- [ ] Pause freezes orbs / timer / collect
- [ ] Collect still goes through the shared callback (controllers, pinch, click)
- [ ] Did not import a new repo into `imports/`
- [ ] `FEATURES.md` updated if the player can see the change
