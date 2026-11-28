import { describe, expect, it } from "vitest";
import { calculateSavingsPlan, periodsFor } from "./calculator";

describe("calculateSavingsPlan", () => {
  it("splits a target evenly across monthly periods", () => {
    const p = calculateSavingsPlan({ targetNaira: 1_200_000, months: 12, frequency: "MONTHLY" });
    expect(p.periods).toBe(12);
    expect(p.contributionKobo).toBe(10_000_000n);
    expect(p.totalKobo).toBe(120_000_000n);
  });

  it("rounds contributions up so the target is reached", () => {
    const p = calculateSavingsPlan({ targetNaira: 100_000, months: 3, frequency: "MONTHLY" });
    expect(p.totalKobo >= 10_000_000n).toBe(true);
  });

  it("uses weekly periods", () => {
    expect(periodsFor(12, "WEEKLY")).toBe(52);
  });

  it("rejects invalid inputs", () => {
    expect(() => calculateSavingsPlan({ targetNaira: 500, months: 6, frequency: "MONTHLY" })).toThrow(RangeError);
    expect(() => calculateSavingsPlan({ targetNaira: 500_000, months: 0, frequency: "MONTHLY" })).toThrow(RangeError);
    expect(() => calculateSavingsPlan({ targetNaira: 500_000.5, months: 6, frequency: "MONTHLY" })).toThrow(RangeError);
  });
});

import { addMonthsUTC, buildSchedule, monthsUntil } from "./calculator";

describe("schedule helpers", () => {
  it("clamps month-end dates", () => {
    expect(addMonthsUTC(new Date(Date.UTC(2027, 0, 31)), 1).toISOString().slice(0, 10)).toBe("2027-02-28");
    expect(addMonthsUTC(new Date(Date.UTC(2027, 10, 15)), 3).toISOString().slice(0, 10)).toBe("2028-02-15");
  });
  it("builds monthly and weekly schedules", () => {
    const start = new Date(Date.UTC(2027, 0, 1));
    const monthly = buildSchedule(start, "MONTHLY", 3, 100n);
    expect(monthly.map((s) => s.dueDate.toISOString().slice(0, 10))).toEqual(["2027-02-01", "2027-03-01", "2027-04-01"]);
    const weekly = buildSchedule(start, "WEEKLY", 2, 100n);
    expect(weekly[1]!.dueDate.toISOString().slice(0, 10)).toBe("2027-01-15");
  });
  it("counts months between dates", () => {
    expect(monthsUntil(new Date(Date.UTC(2027, 0, 1)), new Date(Date.UTC(2028, 0, 1)))).toBe(12);
  });
});
