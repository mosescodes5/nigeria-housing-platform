import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";
import { generateToken, hashToken } from "./session-token";

describe("password hashing", () => {
  it("verifies the right password and rejects the wrong one", async () => {
    const hash = await hashPassword("correct-horse-9");
    expect(hash).not.toContain("correct-horse-9");
    expect(await verifyPassword("correct-horse-9", hash)).toBe(true);
    expect(await verifyPassword("wrong-horse-9", hash)).toBe(false);
  });
});

describe("session tokens", () => {
  it("generates unique tokens and hashes deterministically", () => {
    const a = generateToken();
    expect(a).not.toBe(generateToken());
    expect(a.length).toBeGreaterThanOrEqual(43);
    expect(hashToken(a)).toBe(hashToken(a));
    expect(hashToken(a)).not.toBe(a);
    expect(hashToken(a)).toMatch(/^[0-9a-f]{64}$/);
  });
});
