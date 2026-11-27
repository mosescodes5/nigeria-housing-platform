import { describe, expect, it } from "vitest";
import { canTransition } from "./lifecycle";

describe("savings goal lifecycle", () => {
  it("allows the normal path", () => {
    expect(canTransition("DRAFT", "ACTIVE")).toBe(true);
    expect(canTransition("ACTIVE", "GOAL_COMPLETED")).toBe(true);
    expect(canTransition("GOAL_COMPLETED", "SETTLEMENT_PENDING")).toBe(true);
    expect(canTransition("SETTLEMENT_PENDING", "SETTLED")).toBe(true);
  });
  it("blocks skipping steps and leaving terminal states", () => {
    expect(canTransition("DRAFT", "SETTLED")).toBe(false);
    expect(canTransition("ACTIVE", "SETTLED")).toBe(false);
    expect(canTransition("SETTLED", "ACTIVE")).toBe(false);
    expect(canTransition("CANCELLED", "ACTIVE")).toBe(false);
  });
});
