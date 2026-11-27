export type Frequency = "WEEKLY" | "MONTHLY";

export interface PlanInput {
  targetNaira: number;
  months: number;
  frequency: Frequency;
}

export interface Plan {
  periods: number;
  contributionKobo: bigint;
  totalKobo: bigint;
}

export const LIMITS = {
  minTargetNaira: 10_000,
  maxTargetNaira: 100_000_000,
  minMonths: 1,
  maxMonths: 60,
};

export function periodsFor(months: number, frequency: Frequency): number {
  return frequency === "MONTHLY" ? months : Math.ceil((months * 52) / 12);
}

/** Illustrative planning maths only. It does not move money or promise any outcome. */
export function calculateSavingsPlan(input: PlanInput): Plan {
  const { targetNaira, months, frequency } = input;
  if (
    !Number.isInteger(targetNaira) ||
    targetNaira < LIMITS.minTargetNaira ||
    targetNaira > LIMITS.maxTargetNaira
  ) {
    throw new RangeError("Target must be a whole Naira amount within the supported range");
  }
  if (!Number.isInteger(months) || months < LIMITS.minMonths || months > LIMITS.maxMonths) {
    throw new RangeError("Duration must be between 1 and 60 months");
  }
  const targetKobo = BigInt(targetNaira) * 100n;
  const periods = periodsFor(months, frequency);
  const n = BigInt(periods);
  const contributionKobo = (targetKobo + n - 1n) / n; // round up so the target is always reached
  return { periods, contributionKobo, totalKobo: contributionKobo * n };
}

const DAY_MS = 86_400_000;

/** Adds calendar months in UTC, clamping to the last day (31 Jan + 1 month = 28/29 Feb). */
export function addMonthsUTC(d: Date, months: number): Date {
  const first = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, 1));
  const lastDay = new Date(
    Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0),
  ).getUTCDate();
  first.setUTCDate(Math.min(d.getUTCDate(), lastDay));
  return first;
}

export function monthsUntil(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / (30.4375 * DAY_MS));
}

export interface ScheduleItem {
  number: number;
  dueDate: Date;
  amountKobo: bigint;
}

export function buildSchedule(
  start: Date,
  frequency: Frequency,
  periods: number,
  contributionKobo: bigint,
): ScheduleItem[] {
  return Array.from({ length: periods }, (_, i) => ({
    number: i + 1,
    dueDate:
      frequency === "MONTHLY"
        ? addMonthsUTC(start, i + 1)
        : new Date(start.getTime() + (i + 1) * 7 * DAY_MS),
    amountKobo: contributionKobo,
  }));
}
