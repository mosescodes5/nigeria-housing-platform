import { describe, expect, it } from "vitest";
import { signPayload, verifySignature, webhookEventSchema } from "./webhook";

const secret = "test-webhook-secret";
const body = JSON.stringify({ event: "charge.success", reference: "sbx_1" });

describe("webhook signature verification", () => {
  it("accepts a correct signature", () => {
    expect(verifySignature(body, signPayload(body, secret), secret)).toBe(true);
  });
  it("rejects wrong, tampered, malformed or missing signatures", () => {
    expect(verifySignature(body, signPayload(body, "other-secret"), secret)).toBe(false);
    expect(verifySignature(body + " ", signPayload(body, secret), secret)).toBe(false);
    expect(verifySignature(body, "not-hex", secret)).toBe(false);
    expect(verifySignature(body, null, secret)).toBe(false);
    expect(verifySignature(body, signPayload(body, secret), undefined)).toBe(false);
  });
  it("validates event payloads", () => {
    expect(webhookEventSchema.safeParse(JSON.parse(body)).success).toBe(true);
    expect(webhookEventSchema.safeParse({ event: "charge.unknown", reference: "x" }).success).toBe(
      false,
    );
  });
});
