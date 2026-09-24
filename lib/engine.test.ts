import { describe, it, expect } from "vitest";
import { initialState, move } from "./engine";

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
