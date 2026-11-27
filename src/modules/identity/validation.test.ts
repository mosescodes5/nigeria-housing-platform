import { describe, expect, it } from "vitest";
import { loginSchema, normalizeNigerianPhone, registerSchema } from "./validation";

const valid = {
  fullName: "Ada Okafor",
  email: "Ada@Example.com ",
  phone: "08031234567",
  password: "correct-horse-9",
  role: "TENANT",
  acceptTerms: true,
  acceptPrivacy: true,
};

describe("registerSchema", () => {
  it("normalises email and phone", () => {
    const r = registerSchema.parse(valid);
    expect(r.email).toBe("ada@example.com");
    expect(r.phone).toBe("+2348031234567");
  });

  it("never allows self-assigned ADMIN or SUPPORT roles", () => {
    expect(registerSchema.safeParse({ ...valid, role: "ADMIN" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, role: "SUPPORT" }).success).toBe(false);
  });

  it("requires explicit consent", () => {
    expect(registerSchema.safeParse({ ...valid, acceptTerms: false }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, acceptPrivacy: false }).success).toBe(false);
  });

  it("enforces the password policy", () => {
    expect(registerSchema.safeParse({ ...valid, password: "short1" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, password: "onlylettersnodigits" }).success).toBe(
      false,
    );
  });

  it("allows phone to be omitted but rejects invalid numbers", () => {
    expect(registerSchema.safeParse({ ...valid, phone: undefined }).success).toBe(true);
    expect(registerSchema.safeParse({ ...valid, phone: "12345" }).success).toBe(false);
  });
});

describe("normalizeNigerianPhone", () => {
  it("accepts common formats", () => {
    expect(normalizeNigerianPhone("+234 803 123 4567")).toBe("+2348031234567");
    expect(normalizeNigerianPhone("2348031234567")).toBe("+2348031234567");
    expect(normalizeNigerianPhone("0701-234-5678")).toBe("+2347012345678");
  });
  it("rejects invalid numbers", () => {
    expect(normalizeNigerianPhone("0603123456")).toBeNull();
  });
});

describe("loginSchema", () => {
  it("lowercases email", () => {
    expect(loginSchema.parse({ email: "A@B.COM", password: "x" }).email).toBe("a@b.com");
  });
});
