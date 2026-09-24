"use client";

import { useEffect, useRef, useState } from "react";
import {
  rooms,
  arrowFor,
  palettes,
  availableDirections,
  keyToDirection,
  type World,
} from "@/lib/rooms";
import { art } from "@/lib/art";
import {
  initialState,
  move,
  GALLERY_BARRED_MESSAGE,
  type GameState,
} from "@/lib/engine";
import ThumbUnlock from "@/components/ThumbUnlock";

// Matches the .scene opacity transition in globals.css; keep them in step.
const DISSOLVE_MS = 260;

interface Pos {
  x: number;
  y: number;
}

const range = (from: number, to: number): number[] =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

// One room's contents. Both the outgoing and incoming rooms render as a Scene,
// stacked in the same grid cell so they can cross-dissolve. When `illustration`
// is given (the webcam), it takes the place of the room's picture.
function Scene({
  x,
  y,
  world,
  style,
  illustration,
}: Pos & {
  world: World;
  style: React.CSSProperties;
  illustration?: React.ReactNode;
}) {
  const key = `${x},${y}`;
  const room = world[key];
  const dirs = availableDirections(x, y, world);
  if (!room) return <div className="scene" style={style} />;
  return (
    <div className="scene" style={style}>
      <h1 className="room-name">{room.name}</h1>
      <div className="illustration">
        {illustration ?? (
          <div dangerouslySetInnerHTML={{ __html: art[key] ?? "" }} />
        )}
      </div>
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
  const [world, setWorld] = useState<World | null>(null); // rooms loaded from D1
  const [game, setGame] = useState<GameState>(initialState); // movement lives in the engine
  const [outgoing, setOutgoing] = useState<Pos | null>(null); // the room being left
  const [active, setActive] = useState(false); // crossfade engaged (incoming→1, outgoing→0)
  const [showCamera, setShowCamera] = useState(false); // the thumbs-up unlock panel
  const movingRef = useRef(false);

  // Load the rooms from the D1-backed route handler once, on mount. Fall back
  // to the static default if the request fails so the game still runs.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/rooms")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setWorld((data.rooms as World) ?? rooms);
      })
      .catch(() => {
        if (!cancelled) setWorld(rooms);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Re-skin the whole scene per room by writing the palette onto :root. The CSS
  // transitions on body/main cross-shift the colour as the scenes dissolve.
  useEffect(() => {
    const p = palettes[`${game.x},${game.y}`];
    if (!p) return;
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

  // Arrow-key movement, delegated to the engine with the loaded world. Rebound
  // when the state changes so the handler always sees the current room.
  useEffect(() => {
    const handle = (dir: Parameters<typeof move>[1]) => {
      if (movingRef.current || !world) return; // ignore keys mid-dissolve / pre-load
      const next = move(game, dir, world);
      if (next.x === game.x && next.y === game.y) {
        // Blocked or locked: no move, just surface the message (no dissolve).
        setGame(next);
        // The barred gallery hatch opens the webcam panel to try a thumbs-up.
        if (next.message === GALLERY_BARRED_MESSAGE) setShowCamera(true);
        return;
      }
      // A real move: the old room becomes the outgoing dissolve layer.
      movingRef.current = true;
      setActive(false);
      setOutgoing({ x: game.x, y: game.y });
      setGame(next);
    };

    const onKey = (event: KeyboardEvent) => {
      if (showCamera) {
        // While the camera panel is open, Escape closes it; ignore movement.
        if (event.key === "Escape") {
          event.preventDefault();
          setShowCamera(false);
        }
        return;
      }
      const dir = keyToDirection[event.key];
      if (!dir) return;
      event.preventDefault(); // stop the arrow keys scrolling the page
      handle(dir);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [game, showCamera, world]);

  // Recognised a thumbs-up: record it, close the camera, and dissolve up into
  // the gallery. (Mirrors the dissolve in the movement handler above.)
  const onThumbUnlock = () => {
    setShowCamera(false);
    if (movingRef.current || !world) return;
    const next = move({ ...game, thumbUnlocked: true }, "up", world);
    movingRef.current = true;
    setActive(false);
    setOutgoing({ x: game.x, y: game.y });
    setGame(next);
  };

  if (!world) {
    return (
      <main>
        <p className="hint">Loading the lighthouse…</p>
      </main>
    );
  }

  const here = `${game.x},${game.y}`;
  // While dissolving, the incoming layer sits under the outgoing one and starts
  // hidden; the rAF flip fades it up as the outgoing fades down.
  const incomingOpacity = outgoing && !active ? 0 : 1;

  // Mini-map bounds, derived from the loaded rooms so the grid follows the map
  // however it grows. Gaps render as empty cells.
  const coords = Object.keys(world).map(
    (k) => k.split(",").map(Number) as [number, number],
  );
  const minX = Math.min(...coords.map(([x]) => x));
  const maxX = Math.max(...coords.map(([x]) => x));
  const minY = Math.min(...coords.map(([, y]) => y));
  const maxY = Math.max(...coords.map(([, y]) => y));

  return (
    <main>
      <div className="topbar">
        <div
          className="map"
          style={{ gridTemplateColumns: `repeat(${maxX - minX + 1}, 1fr)` }}
          aria-label="Map of the lighthouse"
        >
          {range(minY, maxY).map((cy) =>
            range(minX, maxX).map((cx) => {
              const key = `${cx},${cy}`;
              const r = world[key];
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
          world={world}
          style={{ opacity: incomingOpacity }}
          illustration={
            showCamera ? (
              <ThumbUnlock
                onUnlock={onThumbUnlock}
                onClose={() => setShowCamera(false)}
              />
            ) : undefined
          }
        />
        {outgoing && (
          <Scene
            key="outgoing"
            x={outgoing.x}
            y={outgoing.y}
            world={world}
            style={{ opacity: active ? 0 : 1 }}
          />
        )}
      </div>

      <p className="message">{game.message}</p>

      <p className="hint">Use the arrow keys.</p>
    </main>
  );
}
