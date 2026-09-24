// Tiny text adventure set in a lighthouse.
// The four rooms sit on a 2×2 grid, addressed by [x, y] with y growing downward:
//   (0,0) Spiral Stair   (1,0) Lamp Room
//   (0,1) Keeper's Kitchen (1,1) Rocks  ← player starts here
// Arrow keys move between rooms. A move off the grid is "blocked" and carries
// a reason worded for that specific room and direction, rather than a generic one.

type Direction = "up" | "down" | "left" | "right";

interface Room {
  name: string;
  // Two sentences describing what the player can see.
  description: string;
  // Reasons a given direction can't be taken from this room. A direction that
  // leads to another room is absent here; a direction present here is blocked.
  blocked: Partial<Record<Direction, string>>;
}

// Keyed by "x,y".
const rooms: Record<string, Room> = {
  "0,0": {
    name: "Spiral stair",
    description:
      "The iron spiral stair coils up through the heart of the tower, its treads worn shallow by decades of boots. Cold air falls from the lamp room above and the kitchen lies a few steps down.",
    blocked: {
      up: "The stair simply ends at a bolted hatch; the lamp room is reached from the side, not straight up.",
      left: "Only the curved outer wall of the tower is there, streaked with rust.",
    },
  },
  "1,0": {
    name: "Lamp room",
    description:
      "Glass panes wrap the lamp room on every side and the great lens sits dark and patient at its centre. Far below, the sea works endlessly against the rocks.",
    blocked: {
      up: "There is only the domed roof and the weather vane above; no way up from here.",
      right: "The panes give straight onto a hundred-foot drop to the water. Best not.",
    },
  },
  "0,1": {
    name: "Keeper’s kitchen",
    description:
      "A cold cast-iron stove and a single chair furnish the keeper’s kitchen, and a mug of tea has long gone to scum on the table. A narrow doorway opens onto the foot of the stair.",
    blocked: {
      down: "The flagstone floor is solid; the cellar was bricked up years ago.",
      left: "The seaward wall is blank stone, thick enough to break the winter gales.",
    },
  },
  "1,1": {
    name: "The rocks",
    description:
      "You stand on the black, weed-slick rocks at the foot of the lighthouse as spray bursts around your knees. The tower door hangs open to the north and a low path skirts the base to the west.",
    blocked: {
      down: "There is nothing south but the open sea, grey and heaving.",
      right: "The rocks fall away into deep water on that side.",
    },
  },
};

// Which grid cell each arrow key moves toward.
const deltas: Record<Direction, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

const keyToDirection: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

const arrowFor: Record<Direction, string> = {
  up: "↑",
  down: "↓",
  left: "←",
  right: "→",
};

// --- Illustrations -----------------------------------------------------------
// One hand-drawn line-art picture per room, all sharing a single style: the same
// off-white stroke, a warm accent for anything that glows (the light, steam), and
// one roughen filter (feTurbulence + feDisplacementMap) that wobbles every stroke
// so nothing looks machine-straight. Keeping the filter and stroke in `sketch()`
// rather than on each drawing is what guarantees the four read as one hand.
// Colours are hard-coded rather than currentColor so the accent stays warm
// regardless of the surrounding text colour.
const INK = "#e9edf1";
const FAINT = "#8fb3c9"; // sea, distant scaffolding
const GLOW = "#ffd27d"; // matches the heading accent

function sketch(label: string, inner: string, seed: number): string {
  // Unique filter id per drawing so ids never collide if two are ever in the DOM.
  const fid = `rough-${seed}`;
  return (
    `<svg viewBox="0 0 220 150" role="img" aria-label="${label}" ` +
    `fill="none" stroke="${INK}" stroke-width="2.4" ` +
    `stroke-linecap="round" stroke-linejoin="round">` +
    `<title>${label}</title>` +
    `<defs><filter id="${fid}" x="-10%" y="-10%" width="120%" height="120%">` +
    `<feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" ` +
    `seed="${seed}" result="n"/>` +
    `<feDisplacementMap in="SourceGraphic" in2="n" scale="3.2"/></filter></defs>` +
    `<g filter="url(#${fid})">${inner}</g>` +
    `</svg>`
  );
}

// A spiral stair reads best built from alternating treads fanning off a central
// newel post, so its treads are generated rather than hand-listed.
function spiralStairArt(): string {
  let treads = "";
  for (let i = 0; i < 8; i++) {
    const ty = 36 + i * 11;
    const w = i % 2 === 0 ? 30 : -30; // alternate the fan side each step down
    treads += `<path d="M108 ${ty} l${w} -7 l0 9 l${-w} 7 z"/>`;
  }
  return sketch(
    "A sketch of an iron spiral staircase",
    // central newel post + knob, the treads, and a base ring
    `<line x1="108" y1="24" x2="108" y2="128"/>` +
      `<circle cx="108" cy="22" r="3"/>` +
      treads +
      `<path d="M92 128 Q108 134 124 128" stroke="${FAINT}"/>`,
    4,
  );
}

const art: Record<string, string> = {
  // Spiral stair (top left)
  "0,0": spiralStairArt(),

  // Lamp room (top right): a fresnel-lens drum throwing beams out through glass.
  "1,0": sketch(
    "A sketch of the lamp room lens throwing out beams of light",
    `<line x1="55" y1="124" x2="165" y2="124"/>` +
      `<path d="M92 46 L92 112 L128 112 L128 46 Z"/>` +
      `<path d="M92 46 Q110 40 128 46"/>` +
      `<path d="M92 112 Q110 118 128 112"/>` +
      `<line x1="92" y1="58" x2="128" y2="58"/>` +
      `<line x1="92" y1="68" x2="128" y2="68"/>` +
      `<line x1="92" y1="90" x2="128" y2="90"/>` +
      `<line x1="92" y1="100" x2="128" y2="100"/>` +
      `<path d="M100 112 L98 124 L122 124 L120 112"/>` +
      `<circle cx="110" cy="79" r="6" stroke="${GLOW}"/>` +
      `<path d="M128 66 L192 44" stroke="${GLOW}"/>` +
      `<path d="M128 79 L196 79" stroke="${GLOW}"/>` +
      `<path d="M128 92 L192 114" stroke="${GLOW}"/>` +
      `<path d="M92 66 L28 44" stroke="${GLOW}"/>` +
      `<path d="M92 79 L24 79" stroke="${GLOW}"/>` +
      `<path d="M92 92 L28 114" stroke="${GLOW}"/>`,
    7,
  ),

  // Keeper's kitchen (bottom left): stove with a pot, a steaming mug on a table,
  // a plain chair.
  "0,1": sketch(
    "A sketch of the keeper’s kitchen with a stove, a mug and a chair",
    `<line x1="20" y1="126" x2="200" y2="126"/>` +
      // stove
      `<path d="M34 74 L34 126 L86 126 L86 74 Z"/>` +
      `<line x1="30" y1="74" x2="90" y2="74"/>` +
      `<path d="M44 90 L76 90 L76 118 L44 118 Z"/>` +
      `<line x1="48" y1="86" x2="72" y2="86"/>` +
      // pot on top
      `<path d="M48 66 L48 74 L72 74 L72 66 Z"/>` +
      `<line x1="44" y1="66" x2="76" y2="66"/>` +
      `<line x1="60" y1="60" x2="60" y2="66"/>` +
      // table + steaming mug
      `<line x1="106" y1="122" x2="158" y2="122"/>` +
      `<line x1="114" y1="122" x2="114" y2="126"/>` +
      `<line x1="150" y1="122" x2="150" y2="126"/>` +
      `<path d="M120 100 L120 116 Q120 122 126 122 L134 122 Q140 122 140 116 L140 100 Z"/>` +
      `<line x1="120" y1="100" x2="140" y2="100"/>` +
      `<path d="M140 104 Q150 104 150 110 Q150 116 140 116"/>` +
      `<path d="M126 96 q6 -6 0 -12 q-6 -6 0 -12" stroke="${GLOW}"/>` +
      `<path d="M134 96 q6 -6 0 -12 q-6 -6 0 -12" stroke="${GLOW}"/>` +
      // chair
      `<path d="M176 80 L176 124"/>` +
      `<path d="M176 104 L198 104 L198 124"/>` +
      `<line x1="180" y1="84" x2="176" y2="84"/>`,
    11,
  ),

  // The rocks (bottom right): the lighthouse on the rocks, light lit, waves below.
  "1,1": sketch(
    "A sketch of the lighthouse standing on the rocks above the waves",
    `<path d="M20 132 q9 -7 18 0 t18 0 t18 0 t18 0 t18 0 t18 0 t18 0 t18 0 t18 0" stroke="${FAINT}"/>` +
      `<path d="M45 120 L70 108 L92 120"/>` +
      `<path d="M126 120 L150 106 L176 120"/>` +
      `<path d="M97 118 L102 52 L118 52 L123 118 Z"/>` +
      `<path d="M99 52 L96 45 L124 45 L121 52"/>` +
      `<path d="M103 45 L103 31 L117 31 L117 45"/>` +
      `<line x1="110" y1="31" x2="110" y2="45"/>` +
      `<path d="M100 31 L110 21 L120 31"/>` +
      `<line x1="110" y1="21" x2="110" y2="15"/>` +
      `<line x1="99" y1="75" x2="121" y2="75"/>` +
      `<line x1="98" y1="98" x2="122" y2="98"/>` +
      `<path d="M106 118 L106 106 a4 4 0 0 1 8 0 L114 118"/>` +
      `<path d="M117 34 L150 26" stroke="${GLOW}"/>` +
      `<path d="M117 41 L152 44" stroke="${GLOW}"/>` +
      `<path d="M103 34 L70 26" stroke="${GLOW}"/>`,
    2,
  ),
};

// --- Mood palettes -----------------------------------------------------------
// Each room re-skins the whole scene via CSS custom properties, so entering a
// room shifts its colour and atmosphere. The lamplight (the SVG glow) stays gold
// everywhere on purpose — it's the one warm thing in the tower — while the room
// around it changes. Prototype-level: a flat lookup applied on each render, no
// theming system, since this is only a reference for the proper app.
interface Palette {
  bgTop: string; // top of the background wash
  bgBase: string; // outer background
  panel: string; // the card
  edge: string; // borders
  accent: string; // heading + messages
  ink: string; // body text
}

const palettes: Record<string, Palette> = {
  // Spiral stair: cold iron, dim and enclosed — dull brass on slate.
  "0,0": {
    bgTop: "#2a3742",
    bgBase: "#121a20",
    panel: "#1b2831",
    edge: "#38505f",
    accent: "#c9b48c",
    ink: "#dfe6ec",
  },
  // Lamp room: luminous and airy, up in the twilight — bright gold.
  "1,0": {
    bgTop: "#3b3a52",
    bgBase: "#14141f",
    panel: "#22212e",
    edge: "#4a4763",
    accent: "#ffd27d",
    ink: "#f3eede",
  },
  // Keeper's kitchen: warm, cosy hearth — amber and brown.
  "0,1": {
    bgTop: "#3d2b20",
    bgBase: "#1a1210",
    panel: "#2a1d16",
    edge: "#5a3d2a",
    accent: "#f0a860",
    ink: "#f1e3d6",
  },
  // The rocks: cold, wet and stormy — deep sea teal, pale spray.
  "1,1": {
    bgTop: "#173139",
    bgBase: "#08161c",
    panel: "#0f2129",
    edge: "#244653",
    accent: "#8fd0d6",
    ink: "#e6eef0",
  },
};

function applyPalette(p: Palette): void {
  const s = document.documentElement.style;
  s.setProperty("--bg-top", p.bgTop);
  s.setProperty("--bg-base", p.bgBase);
  s.setProperty("--panel", p.panel);
  s.setProperty("--edge", p.edge);
  s.setProperty("--accent", p.accent);
  s.setProperty("--ink", p.ink);
}

// Start on the rocks.
let x = 1;
let y = 1;

function currentRoom(): Room {
  return rooms[`${x},${y}`];
}

function availableDirections(): Direction[] {
  const room = currentRoom();
  return (Object.keys(deltas) as Direction[]).filter((dir) => {
    if (room.blocked[dir]) return false;
    const [dx, dy] = deltas[dir];
    return Boolean(rooms[`${x + dx},${y + dy}`]);
  });
}

const el = (id: string): HTMLElement => {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing element #${id}`);
  return node;
};

// Build the 2×2 mini-map once, iterating rows (y) then columns (x) so the cells
// sit in the rooms' real grid positions. Each cell's letter drops a leading
// "The " so the labels stay distinct (S, L, K, R).
function buildMap(): void {
  const map = el("map");
  map.innerHTML = "";
  for (let my = 0; my < 2; my++) {
    for (let mx = 0; mx < 2; mx++) {
      const key = `${mx},${my}`;
      const room = rooms[key];
      const cell = document.createElement("div");
      cell.className = "map-cell";
      cell.dataset.key = key;
      cell.title = room.name;
      cell.textContent = room.name.replace(/^the\s+/i, "")[0].toUpperCase();
      map.appendChild(cell);
    }
  }
}

function markMap(): void {
  const here = `${x},${y}`;
  el("map")
    .querySelectorAll<HTMLElement>(".map-cell")
    .forEach((cell) => {
      cell.classList.toggle("active", cell.dataset.key === here);
    });
}

function render(message = ""): void {
  const room = currentRoom();
  applyPalette(palettes[`${x},${y}`]);
  markMap();
  el("room-name").textContent = room.name;
  el("illustration").innerHTML = art[`${x},${y}`];
  el("description").textContent = room.description;

  const dirs = availableDirections();
  const exits = el("exits");
  exits.innerHTML = "";
  dirs.forEach((dir) => {
    const li = document.createElement("li");
    li.textContent = `${arrowFor[dir]} ${dir}`;
    exits.appendChild(li);
  });

  el("message").textContent = message;
}

// Matches the .room-view opacity transition in the stylesheet; keep them in step.
const FADE_MS = 220;
let moving = false;

function move(dir: Direction): void {
  const room = currentRoom();
  if (room.blocked[dir]) {
    // A blocked bump is not a move, so don't fade — just show why.
    render(room.blocked[dir]);
    return;
  }
  const [dx, dy] = deltas[dir];
  const target = rooms[`${x + dx},${y + dy}`];
  if (!target) {
    // No mapped room and no bespoke reason: a plain edge of the world.
    render("That way is only sea and sky. You can’t go there.");
    return;
  }
  if (moving) return; // ignore keys mid-fade so transitions don't stack
  moving = true;

  // Fade the current room out, swap contents at the low point, fade back in.
  const view = el("room-view");
  view.style.opacity = "0";
  window.setTimeout(() => {
    x += dx;
    y += dy;
    render();
    view.style.opacity = "1";
    moving = false;
  }, FADE_MS);
}

window.addEventListener("keydown", (event: KeyboardEvent) => {
  const dir = keyToDirection[event.key];
  if (!dir) return;
  event.preventDefault(); // stop the arrow keys from scrolling the page
  move(dir);
});

buildMap();
render();
