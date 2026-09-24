"use client";

import { useEffect, useRef, useState } from "react";
import {
  rooms,
  arrowFor,
  palettes,
  availableDirections,
  keyToDirection,
} from "@/lib/rooms";
import { art } from "@/lib/art";
import { initialState, move, type GameState } from "@/lib/engine";

// Matches the .scene opacity transition in globals.css; keep them in step.
const DISSOLVE_MS = 260;

interface Pos {
  x: number;
  y: number;
}

// Mini-map bounds, derived from the actual rooms so the grid follows the map
// however it grows (no longer a hardcoded 2×2). Empty cells fill the gaps.
const COORDS = Object.keys(rooms).map(
  (k) => k.split(",").map(Number) as [number, number],
);
const MIN_X = Math.min(...COORDS.map(([x]) => x));
const MAX_X = Math.max(...COORDS.map(([x]) => x));
const MIN_Y = Math.min(...COORDS.map(([, y]) => y));
const MAX_Y = Math.max(...COORDS.map(([, y]) => y));
const MAP_COLS = MAX_X - MIN_X + 1;

const range = (from: number, to: number): number[] =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

// One room's contents. Both the outgoing and incoming rooms render as a Scene,
// stacked in the same grid cell so they can cross-dissolve.
function Scene({ x, y, style }: Pos & { style: React.CSSProperties }) {
  const key = `${x},${y}`;
  const room = rooms[key];
  const dirs = availableDirections(x, y);
  return (
    <div className="scene" style={style}>
      <h1 className="room-name">{room.name}</h1>
      <div
        className="illustration"
        dangerouslySetInnerHTML={{ __html: art[key] }}
      />
      <p className="description">{room.description}</p>

      <h2>You can go</h2>
      <ul className="exits">
        {dirs.map((dir) => (
          <li key={dir}>
            {arrowFor[dir]} {dir}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function LighthouseGame() {
  const [game, setGame] = useState<GameState>(initialState); // movement lives in the engine
  const [outgoing, setOutgoing] = useState<Pos | null>(null); // the room being left
  const [active, setActive] = useState(false); // crossfade engaged (incoming→1, outgoing→0)
  const movingRef = useRef(false);

  // Re-skin the whole scene per room by writing the palette onto :root. The CSS
  // transitions on body/main cross-shift the colour as the scenes dissolve.
  useEffect(() => {
    const p = palettes[`${game.x},${game.y}`];
    const s = document.documentElement.style;
    s.setProperty("--bg-top", p.bgTop);
    s.setProperty("--bg-base", p.bgBase);
    s.setProperty("--panel", p.panel);
    s.setProperty("--edge", p.edge);
    s.setProperty("--accent", p.accent);
    s.setProperty("--ink", p.ink);
  }, [game.x, game.y]);

  // Whenever an outgoing scene appears, run the dissolve: on the next frame flip
  // `active` so both layers transition (old→0, new→1), then drop the old layer.
  useEffect(() => {
    if (!outgoing) return;
    const raf = requestAnimationFrame(() => setActive(true));
    const timer = window.setTimeout(() => {
      setOutgoing(null);
      setActive(false);
      movingRef.current = false;
    }, DISSOLVE_MS);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [outgoing]);

  // Arrow-key movement, delegated to the engine. Rebound when the state changes
  // so the handler always sees the current room and visited set.
  useEffect(() => {
    const handle = (dir: Parameters<typeof move>[1]) => {
      if (movingRef.current) return; // ignore keys mid-dissolve
      const next = move(game, dir);
      if (next.x === game.x && next.y === game.y) {
        // Blocked or locked: no move, just surface the message (no dissolve).
        setGame(next);
        return;
      }
      // A real move: the old room becomes the outgoing dissolve layer.
      movingRef.current = true;
      setActive(false);
      setOutgoing({ x: game.x, y: game.y });
      setGame(next);
    };

    const onKey = (event: KeyboardEvent) => {
      const dir = keyToDirection[event.key];
      if (!dir) return;
      event.preventDefault(); // stop the arrow keys scrolling the page
      handle(dir);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [game]);

  const here = `${game.x},${game.y}`;
  // While dissolving, the incoming layer sits under the outgoing one and starts
  // hidden; the rAF flip fades it up as the outgoing fades down.
  const incomingOpacity = outgoing && !active ? 0 : 1;

  return (
    <main>
      <div className="topbar">
        {/* Mini-map laid out row by row (y) so cells sit in the rooms' real
            positions. Gaps in the grid render as empty cells; the active cell
            is filled with the room's accent. */}
        <div
          className="map"
          style={{ gridTemplateColumns: `repeat(${MAP_COLS}, 1fr)` }}
          aria-label="Map of the lighthouse"
        >
          {range(MIN_Y, MAX_Y).map((cy) =>
            range(MIN_X, MAX_X).map((cx) => {
              const key = `${cx},${cy}`;
              const r = rooms[key];
              if (!r) {
                return (
                  <div
                    key={key}
                    className="map-cell map-cell--empty"
                    aria-hidden="true"
                  />
                );
              }
              // Drop a leading "The " so labels stay distinct (S, L, K, R, G).
              const letter = r.name.replace(/^the\s+/i, "")[0].toUpperCase();
              return (
                <div
                  key={key}
                  className={key === here ? "map-cell active" : "map-cell"}
                  title={r.name}
                >
                  {letter}
                </div>
              );
            }),
          )}
        </div>
      </div>

      <div className="room-view">
        <Scene
          key="current"
          x={game.x}
          y={game.y}
          style={{ opacity: incomingOpacity }}
        />
        {outgoing && (
          <Scene
            key="outgoing"
            x={outgoing.x}
            y={outgoing.y}
            style={{ opacity: active ? 0 : 1 }}
          />
        )}
      </div>

      <p className="message">{game.message}</p>

      <p className="hint">Use the arrow keys.</p>
    </main>
  );
}
