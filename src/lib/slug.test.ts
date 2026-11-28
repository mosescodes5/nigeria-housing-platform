import { describe, expect, it } from "vitest";
import { listingSlug, slugify } from "./slug";

describe("slugify", () => {
  it("normalises text", () => {
    expect(slugify("  Modern 2-Bedroom Apartment!  ")).toBe("modern-2-bedroom-apartment");
    expect(slugify("Ìkéjá GRA")).toBe("ikeja-gra");
  });
  it("never leaves trailing hyphens after truncation", () => {
    expect(slugify("a".repeat(10) + " " + "b".repeat(10), 11)).toBe("aaaaaaaaaa");
  });
});

describe("listingSlug", () => {
  it("adds a random suffix", () => {
    const a = listingSlug("Studio", "Lagos");
    expect(a).toMatch(/^studio-lagos-[0-9a-f]{6}$/);
    expect(a).not.toBe(listingSlug("Studio", "Lagos"));
  });
});
