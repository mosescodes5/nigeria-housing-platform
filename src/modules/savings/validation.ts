import { z } from "zod";
import { LIMITS, monthsUntil } from "./calculator";

export function makeCreateGoalSchema(now: Date) {
  return z.object({
    targetNaira: z.coerce
      .number({ invalid_type_error: "Enter a whole Naira amount" })
      .int("Enter a whole Naira amount")
      .min(
        LIMITS.minTargetNaira,
        `Minimum target is ₦${LIMITS.minTargetNaira.toLocaleString("en-NG")}`,
      )
      .max(
        LIMITS.maxTargetNaira,
        `Maximum target is ₦${LIMITS.maxTargetNaira.toLocaleString("en-NG")}`,
      ),
    targetDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a target date")
      .transform((s) => new Date(`${s}T00:00:00Z`))
      .refine((d) => !Number.isNaN(d.getTime()), "Choose a valid date")
      .refine((d) => {
        const m = monthsUntil(now, d);
        return m >= LIMITS.minMonths && m <= LIMITS.maxMonths;
      }, `Choose a date between 1 and ${LIMITS.maxMonths} months from today`),
    frequency: z.enum(["WEEKLY", "MONTHLY"]),
    propertyId: z.string().trim().min(1).optional(),
  });
}

export const depositSchema = z.object({
  amountNaira: z.coerce
    .number()
    .int("Enter a whole Naira amount")
    .min(1_000, "Minimum is ₦1,000")
    .max(10_000_000, "Maximum is ₦10,000,000"),
  idempotencyKey: z.string().min(8).max(100),
});
