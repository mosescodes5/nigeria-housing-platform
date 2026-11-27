import { describe, expect, it } from "vitest";
import { buildOrderBy, buildWhere, parseFilters } from "./filter";

describe("buildWhere", () => {
  it("always restricts to published listings", () => {
    expect(buildWhere({}).listingStatus).toBe("PUBLISHED");
  });

  it("builds a case-insensitive location search", () => {
    const w = buildWhere({ q: " lekki " });
    expect(JSON.stringify(w.AND)).toContain('"contains":"lekki"');
    expect(JSON.stringify(w.AND)).toContain('"mode":"insensitive"');
  });

  it("converts Naira budgets to kobo", () => {
    const w = buildWhere({ minNaira: 1_000_000, maxNaira: 2_000_000 });
    expect(w.AND).toEqual([{ annualRentKobo: { gte: 100_000_000n, lte: 200_000_000n } }]);
  });

  it("applies verified, availability and room filters", () => {
    const w = buildWhere({
      verifiedOnly: true,
      availableOnly: true,
      minBedrooms: 2,
      minBathrooms: 1,
      type: "STUDIO",
    });
    expect(w.AND).toEqual(
      expect.arrayContaining([
        { verificationStatus: "VERIFIED" },
        { available: true },
        { bedrooms: { gte: 2 } },
        { bathrooms: { gte: 1 } },
        { type: "STUDIO" },
      ]),
    );
  });
});

describe("buildOrderBy", () => {
  it("maps sort options", () => {
    expect(buildOrderBy("price_asc")).toEqual({ annualRentKobo: "asc" });
    expect(buildOrderBy("price_desc")).toEqual({ annualRentKobo: "desc" });
    expect(buildOrderBy(undefined)).toEqual({ createdAt: "desc" });
  });
});

describe("parseFilters", () => {
  it("ignores invalid values", () => {
    const f = parseFilters({ type: "CASTLE", min: "-5", sort: "random", beds: "abc" });
    expect(f.type).toBeUndefined();
    expect(f.minNaira).toBeUndefined();
    expect(f.sort).toBeUndefined();
    expect(f.minBedrooms).toBeUndefined();
  });
  it("parses valid values", () => {
    expect(parseFilters({ type: "STUDIO", max: "3000000", verified: "1" })).toMatchObject({
      type: "STUDIO",
      maxNaira: 3_000_000,
      verifiedOnly: true,
    });
  });
});
