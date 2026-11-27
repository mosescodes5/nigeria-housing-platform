import bcrypt from "bcryptjs";
import { z } from "zod";

const COST = 12;

export const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters")
  .max(128, "Use at most 128 characters")
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), "Include at least one letter and one number");

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, COST);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

let dummyHash: string | undefined;
/** Compared against when the email is unknown, so response time does not reveal which emails exist. */
export async function verifyAgainstDummy(password: string): Promise<void> {
  dummyHash ??= await bcrypt.hash("not-a-real-password", COST);
  await bcrypt.compare(password, dummyHash);
}
