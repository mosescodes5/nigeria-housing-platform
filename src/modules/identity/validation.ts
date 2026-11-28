import { z } from "zod";
import { passwordSchema } from "./password";

/** Roles a person may choose at public sign-up. ADMIN and SUPPORT are never self-assigned. */
export const SELF_SERVICE_ROLES = ["TENANT", "BUYER", "LANDLORD", "AGENT"] as const;

const NG_PHONE = /^(?:\+234|234|0)([789][01]\d{8})$/;

/** Normalises Nigerian mobile numbers to +234XXXXXXXXXX, or returns null if invalid. */
export function normalizeNigerianPhone(input: string): string | null {
  const m = input.replace(/[\s-]/g, "").match(NG_PHONE);
  return m ? `+234${m[1]}` : null;
}

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(254),
  phone: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine((v) => v === undefined || normalizeNigerianPhone(v) !== null, "Enter a valid Nigerian phone number")
    .transform((v) => (v === undefined ? undefined : normalizeNigerianPhone(v)!)),
  password: passwordSchema,
  role: z.enum(SELF_SERVICE_ROLES),
  acceptTerms: z.boolean().refine((v) => v === true, "You must accept the Terms and Conditions"),
  acceptPrivacy: z.boolean().refine((v) => v === true, "You must acknowledge the Privacy Notice"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(128),
});

export type RegisterInput = z.infer<typeof registerSchema>;
