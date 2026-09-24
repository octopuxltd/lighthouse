# Lighthouse text-adventure prototype

**Status:** working prototype, served locally. Framework-free by intent — this is a reference for the proper app, not the app itself.

## What it is

A tiny text adventure. Four rooms on a 2×2 grid:

```
(0,0) Spiral stair    (1,0) Lamp room
(0,1) Keeper's kitchen (1,1) The rocks  ← player starts here
```

Arrow keys move between rooms. Each room shows its name, a hand-drawn SVG illustration, a two-sentence description, the directions you can go, and a message line. Blocked directions give a reason worded for that room and direction.

## Ground truth

- Source: `src/game.ts` → compiled by `tsc` to `js/game.js`, loaded by `index.html` as a plain `<script>`. No bundler, no framework.
- Build: `cd /Users/paul.annett/lighthouse && ./node_modules/.bin/tsc`
- Served on **port 8767** (row in `/Users/paul.annett/schemes/PORTS.md`, LaunchAgent serves it). `.claude/launch.json` points the harness at `http://127.0.0.1:8767`.
- `tsconfig.json`: `module: none`, `outDir: js`, `rootDir: src`. All game state (`x`, `y`), room data, art, palettes and render live in the one file.

## Decisions

- **One hand-drawn style via a shared `sketch()` helper.** Every illustration is wrapped in the same off-white stroke + one roughen filter (`feTurbulence` + `feDisplacementMap`) so the four read as one hand. Rejected: per-drawing styling — it drifts.
- **SVG lamplight glow is hard-coded gold, not the room accent.** The light is the one constant warm thing in the tower; the room around it changes. So the palette does not touch the SVG.
- **Per-room mood via CSS custom properties**, applied on each render by `applyPalette`. Background, panel, edge, accent and ink all shift; body/main transition over 600ms so colour cross-fades. Rejected: separate stylesheets per room — overkill for a prototype.
- **Content cross-fade on move only.** `move()` fades `.room-view` opacity to 0, swaps contents after `FADE_MS` (220ms, kept in step with the CSS transition), fades back in. A `moving` flag drops keypresses mid-fade so transitions don't stack. Blocked bumps do NOT fade — they only update the message. Chose `setTimeout` over a `transitionend` listener for simplicity.
- **Mini-map** is a 2×2 grid built once by `buildMap()`, laid out in real room positions; the active cell is filled with the room's accent (so the marker also carries mood). Cell letters strip a leading "The " to stay distinct: S, L, K, R.

## Gotchas

- `outDir: "."` made tsc exclude the whole project ("No inputs found"). Output must go to a subfolder (`js/`), not the project root.
- Verification is structural only so far — the Chrome extension reports "not connected", so no screenshot has been taken. SVGs were validated as well-formed XML via `xmllint`; palette/map wiring confirmed to compile and be served. **Not yet seen rendering.**

## Open questions / next steps

- `src/game.ts` is 385 lines. If it crosses 400, split the SVG art (a clean "illustrations" seam) into its own module — but that means switching to ES modules + `type="module"` (classic scripts share one global scope). Held off for now to keep the prototype single-file and simple.
- Not yet built (deliberately — kept minimal): inventory/items, puzzles, win state, mobile layout polish, persistence. These belong to "the proper app".
- Visual check still outstanding: confirm each room's illustration, palette and the move fade look right in a browser.
