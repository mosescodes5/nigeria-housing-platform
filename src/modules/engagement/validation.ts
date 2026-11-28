import { z } from "zod";

export const enquirySchema = z.object({
  message: z.string().trim().min(10, "Please write at least 10 characters").max(1000, "Keep it under 1,000 characters"),
});

const HOUR = 3_600_000;

/** `preferredAt` comes from a datetime-local input and is interpreted as Nigerian time (UTC+1). */
export function makeViewingSchema(now: Date) {
  return z.object({
    preferredAt: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Choose a date and time")
      .transform((s) => new Date(`${s}:00+01:00`))
      .refine((d) => !Number.isNaN(d.getTime()), "Choose a valid date and time")
      .refine((d) => d.getTime() >= now.getTime() + HOUR, "Choose a time at least one hour from now")
      .refine((d) => d.getTime() <= now.getTime() + 90 * 24 * HOUR, "Choose a time within the next 90 days"),
    note: z.string().trim().max(500, "Keep it under 500 characters").optional(),
  });
}
