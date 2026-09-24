import { describe, it, expect } from "vitest";
import { initialState, move, type GameState } from "./engine";

// The Lamp room door stays locked until the player has visited the Keeper's
// kitchen. From the rocks, "up" leads to the lamp room.
describe("the lamp room door", () => {
  it("is locked from the rocks at the start", () => {
    const after = move(initialState(), "up");

    // The player must not have moved off the rocks.
    expect(after.x).toBe(1);
    expect(after.y).toBe(1);
    expect(after.message).toBe("The lamp room door is locked.");
  });

  it("unlocks once the keeper's kitchen has been visited", () => {
    let s = initialState(); // the rocks (1,1)
    s = move(s, "left"); // → keeper's kitchen (0,1)
    expect(`${s.x},${s.y}`).toBe("0,1");
    s = move(s, "right"); // → back to the rocks (1,1)
    expect(`${s.x},${s.y}`).toBe("1,1");

    s = move(s, "up"); // → lamp room (1,0), now unlocked
    expect(`${s.x},${s.y}`).toBe("1,0");
    expect(s.message).toBe("");
  });
});

// Above the lamp room is the gallery (1,-1). Its hatch is barred until a
// thumbs-up (seen via webcam in the UI) sets `thumbUnlocked`.
describe("the gallery hatch (thumbs-up)", () => {
  // Reach the lamp room: rocks → kitchen (unlocks the lamp room) → rocks → up.
  function atLampRoom(): GameState {
    let s = initialState();
    s = move(s, "left");
    s = move(s, "right");
    s = move(s, "up");
    return s;
  }

  it("is barred until a thumbs-up unlocks it", () => {
    const s = atLampRoom();
    expect(`${s.x},${s.y}`).toBe("1,0");

    const after = move(s, "up"); // try to climb into the gallery
    expect(`${after.x},${after.y}`).toBe("1,0"); // stayed in the lamp room
    expect(after.message).toBe("The hatch above is barred.");
  });

  it("opens once thumbUnlocked is set", () => {
    const s: GameState = { ...atLampRoom(), thumbUnlocked: true };

    const after = move(s, "up");
    expect(`${after.x},${after.y}`).toBe("1,-1"); // entered the gallery
    expect(after.message).toBe("");
  });
});
