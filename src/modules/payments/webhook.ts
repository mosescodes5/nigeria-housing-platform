import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

export function signPayload(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

/** Constant-time HMAC-SHA256 check of the raw request body. */
export function verifySignature(body: string, signature: string | null | undefined, secret: string | undefined): boolean {
  if (!signature || !secret) return false;
  if (!/^[0-9a-f]{64}$/i.test(signature)) return false;
  const expected = Buffer.from(signPayload(body, secret), "hex");
  const given = Buffer.from(signature, "hex");
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export const webhookEventSchema = z.object({
  event: z.enum(["charge.success", "charge.failed", "charge.reversed"]),
  reference: z.string().min(1).max(100),
});
