// Pure room-movement rules — no browser, no DOM, no React. Given a GameState and
// a direction, `move` returns the next GameState (position, rooms visited, and a
// message). The UI layer renders this; tests drive it directly.
import { rooms, deltas, type Direction } from "./rooms";

export const SEA_MESSAGE = "That way is only sea and sky. You can’t go there.";

export interface GameState {
  x: number;
  y: number;
  visited: string[]; // room keys ("x,y") the player has entered
  message: string;
}

export function initialState(): GameState {
  // Start on the rocks (1,1); count it as visited.
  return { x: 1, y: 1, visited: ["1,1"], message: "" };
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

  const visited = state.visited.includes(key)
    ? state.visited
    : [...state.visited, key];
  return { x: state.x + dx, y: state.y + dy, visited, message: "" };
}
