// Pure room-movement rules — no browser, no DOM, no React. Given a GameState and
// a direction, `move` returns the next GameState (position, rooms visited, and a
// message). The UI layer renders this; tests drive it directly.
import { rooms, deltas, type Direction } from "./rooms";

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

export function move(state: GameState, dir: Direction): GameState {
  const room = rooms[`${state.x},${state.y}`];

  const reason = room.blocked[dir];
  if (reason) {
    // A wall with a bespoke reason: stay put, explain why.
    return { ...state, message: reason };
  }

  const [dx, dy] = deltas[dir];
  const key = `${state.x + dx},${state.y + dy}`;
  if (!rooms[key]) {
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
