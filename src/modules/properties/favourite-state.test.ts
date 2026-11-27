import { describe, expect, it } from "vitest";
import { favouriteState } from "./favourite-state";

describe("favouriteState", () => {
  const saved = new Set(["p1"]);
  it("handles anonymous, ineligible and eligible users", () => {
    expect(favouriteState(null, saved, "p1")).toBe("anon");
    expect(favouriteState({ role: "LANDLORD" }, saved, "p1")).toBe("hidden");
    expect(favouriteState({ role: "TENANT" }, saved, "p1")).toBe("saved");
    expect(favouriteState({ role: "BUYER" }, saved, "p2")).toBe("unsaved");
  });
});
