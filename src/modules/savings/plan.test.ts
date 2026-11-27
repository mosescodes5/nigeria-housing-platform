import { describe, expect, it } from "vitest";
import { nextDue, planForGoal } from "./plan";

describe("planForGoal", () => {
  const goal = {
    targetKobo: 120_000_000n,
    targetDate: new Date(Date.UTC(2027, 11, 1)),
    frequency: "MONTHLY" as const,
    createdAt: new Date(Date.UTC(2026, 11, 1)),
  };
  it("derives plan and schedule", () => {
    const { plan, schedule } = planForGoal(goal);
    expect(plan.periods).toBe(12);
    expect(plan.contributionKobo).toBe(10_000_000n);
    expect(schedule).toHaveLength(12);
  });
  it("finds the next due contribution", () => {
    const { schedule } = planForGoal(goal);
    expect(nextDue(schedule, new Date(Date.UTC(2027, 0, 10)))?.number).toBe(2);
    expect(nextDue(schedule, new Date(Date.UTC(2030, 0, 1)))).toBeNull();
  });
});
