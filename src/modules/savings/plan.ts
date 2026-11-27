import {
  LIMITS,
  buildSchedule,
  calculateSavingsPlan,
  monthsUntil,
  type Frequency,
} from "./calculator";

/** Derives the contribution plan and schedule for a stored goal. */
export function planForGoal(goal: {
  targetKobo: bigint;
  targetDate: Date;
  frequency: Frequency;
  createdAt: Date;
}) {
  const months = Math.min(
    LIMITS.maxMonths,
    Math.max(LIMITS.minMonths, monthsUntil(goal.createdAt, goal.targetDate)),
  );
  const plan = calculateSavingsPlan({
    targetNaira: Number(goal.targetKobo / 100n),
    months,
    frequency: goal.frequency,
  });
  const schedule = buildSchedule(
    goal.createdAt,
    goal.frequency,
    plan.periods,
    plan.contributionKobo,
  );
  return { plan, schedule };
}

export function nextDue(schedule: { dueDate: Date; amountKobo: bigint }[], now: Date) {
  return schedule.find((s) => s.dueDate.getTime() >= now.getTime()) ?? null;
}
