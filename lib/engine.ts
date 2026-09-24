// Pure room-movement rules — no browser, no DOM, no React. Given a GameState, a
// direction and the set of rooms, `move` returns the next GameState (position,
// rooms visited, and a message). Exits come from adjacency in `world`, so the
// same rules work whether the rooms are the static default or loaded from D1.
// The UI layer renders this; tests drive it directly.
import { rooms, deltas, type Direction, type World } from "./rooms";

export const SEA_MESSAGE = "That way is only sea and sky. You can’t go there.";

// The lamp room door stays locked until the player has visited the keeper's
// kitchen (where, notionally, the key is found).
export const LAMP_ROOM = "1,0";
export const KEEPERS_KITCHEN = "0,1";
export const LAMP_LOCKED_MESSAGE = "The lamp room door is locked.";

// Above the lamp room, the gallery hatch stays barred until a thumbs-up is seen
// via the webcam (the UI sets `thumbUnlocked`).
export const GALLERY = "1,-1";
export const GALLERY_BARRED_MESSAGE = "The hatch above is barred.";

export interface GameState {
  x: number;
  y: number;
  visited: string[]; // room keys ("x,y") the player has entered
  message: string;
  thumbUnlocked: boolean; // set once a thumbs-up has been recognised
}

export function initialState(): GameState {
  // Start on the rocks (1,1); count it as visited.
  return { x: 1, y: 1, visited: ["1,1"], message: "", thumbUnlocked: false };
}

export function move(
  state: GameState,
  dir: Direction,
  world: World = rooms,
): GameState {
  const [dx, dy] = deltas[dir];
  const key = `${state.x + dx},${state.y + dy}`;
  if (!world[key]) {
    // No room that way — a wall or the open sea.
    return { ...state, message: SEA_MESSAGE };
  }

  // The lamp room, from any approach, is locked until the kitchen is visited.
  if (key === LAMP_ROOM && !state.visited.includes(KEEPERS_KITCHEN)) {
    return { ...state, message: LAMP_LOCKED_MESSAGE };
  }

  // The gallery hatch is barred until a thumbs-up unlocks it.
  if (key === GALLERY && !state.thumbUnlocked) {
    return { ...state, message: GALLERY_BARRED_MESSAGE };
  }

  const visited = state.visited.includes(key)
    ? state.visited
    : [...state.visited, key];
  return {
    x: state.x + dx,
    y: state.y + dy,
    visited,
    message: "",
    thumbUnlocked: state.thumbUnlocked, // carry the flag across moves
  };
}
