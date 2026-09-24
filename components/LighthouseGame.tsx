"use client";

import { useEffect, useRef, useState } from "react";
import {
  rooms,
  deltas,
  keyToDirection,
  arrowFor,
  palettes,
  availableDirections,
  type Direction,
} from "@/lib/rooms";
import { art } from "@/lib/art";

// Matches the .scene opacity transition in globals.css; keep them in step.
const DISSOLVE_MS = 260;

interface Pos {
  x: number;
  y: number;
}

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
  const [pos, setPos] = useState<Pos>({ x: 1, y: 1 }); // current room; start on the rocks
  const [outgoing, setOutgoing] = useState<Pos | null>(null); // the room being left
  const [active, setActive] = useState(false); // crossfade engaged (incoming→1, outgoing→0)
  const [message, setMessage] = useState("");
  const movingRef = useRef(false);

  // Re-skin the whole scene per room by writing the palette onto :root. The CSS
  // transitions on body/main cross-shift the colour as the scenes dissolve.
  useEffect(() => {
    const p = palettes[`${pos.x},${pos.y}`];
    const s = document.documentElement.style;
    s.setProperty("--bg-top", p.bgTop);
    s.setProperty("--bg-base", p.bgBase);
    s.setProperty("--panel", p.panel);
    s.setProperty("--edge", p.edge);
    s.setProperty("--accent", p.accent);
    s.setProperty("--ink", p.ink);
  }, [pos]);

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

  // Arrow-key movement. Rebound when the position changes so the handler always
  // sees the current room.
  useEffect(() => {
    const move = (dir: Direction) => {
      const room = rooms[`${pos.x},${pos.y}`];
      const reason = room.blocked[dir];
      if (reason) {
        // A blocked bump is not a move, so don't dissolve — just show why.
        setMessage(reason);
        return;
      }
      const [dx, dy] = deltas[dir];
      const target = rooms[`${pos.x + dx},${pos.y + dy}`];
      if (!target) {
        setMessage("That way is only sea and sky. You can’t go there.");
        return;
      }
      if (movingRef.current) return; // ignore keys mid-dissolve
      movingRef.current = true;

      // Old room becomes the outgoing layer; new room becomes current. The
      // dissolve effect above then cross-fades them.
      setMessage("");
      setActive(false);
      setOutgoing(pos);
      setPos({ x: pos.x + dx, y: pos.y + dy });
    };

    const onKey = (event: KeyboardEvent) => {
      const dir = keyToDirection[event.key];
      if (!dir) return;
      event.preventDefault(); // stop the arrow keys scrolling the page
      move(dir);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pos]);

  const here = `${pos.x},${pos.y}`;
  // While dissolving, the incoming layer sits under the outgoing one and starts
  // hidden; the rAF flip fades it up as the outgoing fades down.
  const incomingOpacity = outgoing && !active ? 0 : 1;

  return (
    <main>
      <div className="topbar">
        {/* 2×2 mini-map, laid out row by row (y) so cells sit in the rooms'
            real positions. The active cell is filled with the room's accent. */}
        <div className="map" aria-label="Map of the lighthouse">
          {[0, 1].map((my) =>
            [0, 1].map((mx) => {
              const key = `${mx},${my}`;
              const r = rooms[key];
              // Drop a leading "The " so the labels stay distinct (S, L, K, R).
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
          x={pos.x}
          y={pos.y}
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

      <p className="message">{message}</p>

      <p className="hint">Use the arrow keys.</p>
    </main>
  );
}
