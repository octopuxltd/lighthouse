// The lighthouse, addressed by "x,y" with y growing downward:
//   (1,-1) The gallery
//   (0,0) Spiral stair     (1,0) Lamp room
//   (0,1) Keeper's kitchen  (1,1) The rocks  ← player starts here
// A room is just a name, a description and its grid position. Exits are worked
// out from which rooms sit next to each other (see availableDirections and the
// engine), so adding a room adds its doors. At runtime the rooms come from the
// D1 database; the map below is the static default the engine and tests use.

export type Direction = "up" | "down" | "left" | "right";

export interface Room {
  name: string;
  // Two sentences describing what the player can see.
  description: string;
}

// A set of rooms keyed by "x,y" — the shape both the static default and the
// D1-loaded rooms take.
export type World = Record<string, Room>;

export const rooms: World = {
  "0,0": {
    name: "Spiral stair",
    description:
      "The iron spiral stair coils up through the heart of the tower, its treads worn shallow by decades of boots. Cold air falls from the lamp room above and the kitchen lies a few steps down.",
  },
  "1,0": {
    name: "Lamp room",
    description:
      "Glass panes wrap the lamp room on every side and the great lens sits dark and patient at its centre. A steep hatch in the roof leads up to the gallery, and far below the sea works endlessly against the rocks.",
  },
  "1,-1": {
    name: "The gallery",
    description:
      "You step onto the narrow gallery that circles the lantern, the wind snatching at your coat. The beam sweeps over a black sea and a sky thick with stars.",
  },
  "0,1": {
    name: "Keeper’s kitchen",
    description:
      "A cold cast-iron stove and a single chair furnish the keeper’s kitchen, and a mug of tea has long gone to scum on the table. A narrow doorway opens onto the foot of the stair.",
  },
  "1,1": {
    name: "The rocks",
    description:
      "You stand on the black, weed-slick rocks at the foot of the lighthouse as spray bursts around your knees. The tower door hangs open to the north and a low path skirts the base to the west.",
  },
};

// Which grid cell each arrow key moves toward.
export const deltas: Record<Direction, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

export const keyToDirection: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

export const arrowFor: Record<Direction, string> = {
  up: "↑",
  down: "↓",
  left: "←",
  right: "→",
};

// A direction is an exit when a room sits in the neighbouring cell.
export function availableDirections(
  x: number,
  y: number,
  world: World = rooms,
): Direction[] {
  return (Object.keys(deltas) as Direction[]).filter((dir) => {
    const [dx, dy] = deltas[dir];
    return Boolean(world[`${x + dx},${y + dy}`]);
  });
}

// --- Mood palettes -----------------------------------------------------------
// Each room re-skins the whole scene via CSS custom properties, so entering a
// room shifts its colour and atmosphere. The lamplight (the SVG glow in art.ts)
// stays gold everywhere on purpose — it's the one warm thing in the tower —
// while the room around it changes.
export interface Palette {
  bgTop: string; // top of the background wash
  bgBase: string; // outer background
  panel: string; // the card
  edge: string; // borders
  accent: string; // heading + messages
  ink: string; // body text
}

export const palettes: Record<string, Palette> = {
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
  // The gallery: open night at the top of the tower — indigo sky, starlight.
  "1,-1": {
    bgTop: "#2a2f52",
    bgBase: "#0a0c1a",
    panel: "#16182e",
    edge: "#3a3f66",
    accent: "#b9c4ff",
    ink: "#e8ecff",
  },
};
