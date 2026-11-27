import { describe, expect, it } from "vitest";
import { enquirySchema, makeViewingSchema } from "./validation";

describe("enquirySchema", () => {
  it("requires a meaningful message", () => {
    expect(enquirySchema.safeParse({ message: "hi" }).success).toBe(false);
    expect(
      enquirySchema.safeParse({ message: "Is this still available for viewing?" }).success,
    ).toBe(true);
    expect(enquirySchema.safeParse({ message: "x".repeat(1001) }).success).toBe(false);
  });
});

describe("viewing schema", () => {
  const now = new Date("2026-11-27T10:00:00Z");
  const schema = makeViewingSchema(now);
  it("reads the time as Nigerian time", () => {
    const r = schema.parse({ preferredAt: "2026-12-01T14:00" });
    expect(r.preferredAt.toISOString()).toBe("2026-12-01T13:00:00.000Z");
  });
  it("rejects past, too-soon and too-far times", () => {
    expect(schema.safeParse({ preferredAt: "2026-11-20T10:00" }).success).toBe(false);
    expect(schema.safeParse({ preferredAt: "2026-11-27T11:30" }).success).toBe(false);
    expect(schema.safeParse({ preferredAt: "2027-06-01T10:00" }).success).toBe(false);
    expect(schema.safeParse({ preferredAt: "tomorrow" }).success).toBe(false);
  });
});
