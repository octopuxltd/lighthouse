# Lighthouse text adventure

**Status:** live Next.js app on Cloudflare Workers. Rebuilt from an earlier framework-free prototype (static `index.html` + compiled `game.ts`); the design is unchanged from that prototype, only the stack moved.

## What it is

A tiny text adventure. Four rooms on a 2×2 grid:

```
(0,0) Spiral stair     (1,0) Lamp room
(0,1) Keeper's kitchen  (1,1) The rocks  ← player starts here
```

Arrow keys move between rooms. Each room shows its name, a hand-drawn SVG illustration, a two-sentence description, the directions you can go, and a message line. Blocked directions give a reason worded for that room and direction.

## Ground truth

- **Next.js 16 (App Router, React 19, TypeScript, plain CSS)**, deployed to Cloudflare Workers via the **OpenNext adapter** (`@opennextjs/cloudflare`).
- Game code: `components/LighthouseGame.tsx` (client component with all state + input), data in `lib/rooms.ts` (rooms, deltas, palettes, `availableDirections`), art in `lib/art.ts` (the SVG builders). Styles in `app/globals.css` (ported verbatim from the prototype). Page shell: `app/page.tsx` + `app/layout.tsx`.
- Local dev: `cd /Users/paul.annett/lighthouse && npm run dev -- -p 8767` → http://127.0.0.1:8767. Port 8767 is reserved (not auto-served) in `/Users/paul.annett/schemes/PORTS.md`; `.claude/launch.json` runs `npm run dev`.
- **Live at https://lighthouse.cloudflare-ktncw.workers.dev** — auto-deployed on every push to `main`. URL unchanged across the migration because the Worker name stayed `lighthouse`.
- Repo: https://github.com/octopuxltd/lighthouse (public, account octopuxltd, commits use the GitHub noreply email).

## Deployment

- **Every push to `main` deploys** via `.github/workflows/deploy.yml`: checkout → Node 20 → `npm ci` → `npx opennextjs-cloudflare build && npx opennextjs-cloudflare deploy`, with `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` in env.
- `opennextjs-cloudflare deploy` runs `wrangler deploy` under the hood, reading `wrangler.jsonc`: `main: .open-next/worker.js`, `nodejs_compat` + `global_fetch_strictly_public`, assets `.open-next/assets`, a `WORKER_SELF_REFERENCE` service (= `lighthouse`), and the `IMAGES` binding. `open-next.config.ts` uses `defineCloudflareConfig()` with **no** incremental cache (no R2/KV → the existing "Edit Cloudflare Workers" token is enough).
- Cloudflare account ID `1b4c2e262789e38cf337b9c098ea5fb1`, workers.dev subdomain `cloudflare-ktncw`. Secrets set with `scripts/set-cf-secrets.sh` (`gh secret set`, piped via stdin). The local `wrangler` OAuth login can't be reused in CI — CI needs the API token.
- `.open-next/`, `.wrangler/`, `.dev.vars` are gitignored (build output / local vars).

## Decisions

- **Migration: create-next-app in a sibling folder, then rsync into the repo** excluding `.git`/`node_modules`, preserving git history and `.github`/`worklogs`/`.claude`. Prototype files (`index.html`, `js/`, `src/game.ts`, `wrangler.toml`) removed.
- **Kept the Worker name `lighthouse`** so the live URL didn't change (that was an explicit requirement).
- **Ported to React, design identical.** Room data/art/palettes are plain modules; the client component renders the same markup/classes and writes the per-room palette onto `:root` in an effect. SVG injected with `dangerouslySetInnerHTML` (static, author-controlled).
- **Scenes cross-dissolve** (changed from the prototype's fade-out-then-in). `.room-view` is a CSS grid; outgoing and incoming rooms are two `.scene` layers stacked in the same cell (`grid-area: 1/1`) that fade opposite ways over `DISSOLVE_MS` (260ms, matched to the CSS `.scene` transition). A rAF flip starts the crossfade; a `movingRef` guard drops keypresses mid-dissolve. Blocked bumps don't dissolve.
- **Disabled Next 16's auto-generated `AGENTS.md`/`CLAUDE.md`** via `agentRules: false` in `next.config.ts` (removed the generated files) — this project's agent rules live in global `~/.claude`, not a repo file.
- One hand-drawn style via a shared `sketch()` helper (same stroke + one roughen filter). SVG lamplight glow is hard-coded gold, not the room accent — the light is the one constant warm thing.

## Gotchas

- **Next 16 regenerates `AGENTS.md`/`CLAUDE.md` on `next dev`** unless `agentRules: false`. The auto-mode classifier also blocks deleting `CLAUDE.md`/`AGENTS.md` by name — excluded them from the rsync rather than deleting.
- **Stray `package-lock.json` in `/Users/paul.annett`** (parent of the repo) makes Next warn about workspace-root inference; it's ignored and the repo is used. Harmless; could set `turbopack.root` to silence.
- **HMR cross-origin warning** when opening on `127.0.0.1` — fixed with `allowedDevOrigins: ["127.0.0.1", "localhost"]` in `next.config.ts`.
- `@opennextjs/cloudflare` peer-requires `next >=15.5.24 <16 || >=16.3.3`; create-next-app installed 16.3.6, which is supported. Watch this if Next is bumped.

## Open questions / next steps

- Not yet built (deliberately minimal): inventory/items, puzzles, win state, mobile polish, persistence. These are "the proper app".
- Favicon is still the create-next-app default (`app/favicon.ico`) — replace with a lighthouse icon per the favicon rules when it matters.
