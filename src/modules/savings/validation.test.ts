import { describe, expect, it } from "vitest";
import { makeCreateGoalSchema } from "./validation";

const now = new Date(Date.UTC(2026, 10, 27));
const schema = makeCreateGoalSchema(now);

describe("createGoalSchema", () => {
  it("accepts a valid goal", () => {
    const r = schema.parse({
      targetNaira: "3000000",
      targetDate: "2027-11-27",
      frequency: "MONTHLY",
    });
    expect(r.targetNaira).toBe(3_000_000);
    expect(r.targetDate.toISOString().slice(0, 10)).toBe("2027-11-27");
  });
  it("rejects dates too soon, too far, or malformed", () => {
    expect(
      schema.safeParse({ targetNaira: 500000, targetDate: "2026-11-28", frequency: "MONTHLY" })
        .success,
    ).toBe(false);
    expect(
      schema.safeParse({ targetNaira: 500000, targetDate: "2033-01-01", frequency: "MONTHLY" })
        .success,
    ).toBe(false);
    expect(
      schema.safeParse({ targetNaira: 500000, targetDate: "soon", frequency: "MONTHLY" }).success,
    ).toBe(false);
  });
  it("rejects bad amounts and frequencies", () => {
    expect(
      schema.safeParse({ targetNaira: 100, targetDate: "2027-11-27", frequency: "MONTHLY" })
        .success,
    ).toBe(false);
    expect(
      schema.safeParse({ targetNaira: 500000.5, targetDate: "2027-11-27", frequency: "MONTHLY" })
        .success,
    ).toBe(false);
    expect(
      schema.safeParse({ targetNaira: 500000, targetDate: "2027-11-27", frequency: "DAILY" })
        .success,
    ).toBe(false);
  });
});
