import { describe, expect, it } from "vitest";
import { businessSchema, listingSchema, parseFeatures } from "./validation";

const valid = {
  title: "Modern 2-bedroom apartment",
  description: "A bright two-bedroom apartment in a gated estate.",
  state: "Lagos",
  city: "Lagos",
  neighbourhood: "",
  type: "APARTMENT",
  annualRentNaira: "4500000",
  bedrooms: "2",
  bathrooms: "2",
  features: "Parking, Backup power\nWater supply",
};

describe("listingSchema", () => {
  it("accepts and normalises a valid listing", () => {
    const r = listingSchema.parse(valid);
    expect(r.annualRentNaira).toBe(4_500_000);
    expect(r.neighbourhood).toBeUndefined();
    expect(r.features).toEqual(["Parking", "Backup power", "Water supply"]);
  });
  it("rejects unknown states, bad rent and missing bathrooms", () => {
    expect(listingSchema.safeParse({ ...valid, state: "Atlantis" }).success).toBe(false);
    expect(listingSchema.safeParse({ ...valid, annualRentNaira: "10" }).success).toBe(false);
    expect(listingSchema.safeParse({ ...valid, bathrooms: "0" }).success).toBe(false);
  });
});

describe("parseFeatures", () => {
  it("trims, drops blanks and caps the list", () => {
    expect(parseFeatures(" a , ,b\n\nc ")).toEqual(["a", "b", "c"]);
    expect(parseFeatures(Array.from({ length: 30 }, (_, i) => `f${i}`).join(","))).toHaveLength(20);
  });
});

describe("businessSchema", () => {
  it("requires name, type and address", () => {
    expect(businessSchema.safeParse({ businessName: "Ade Homes", type: "ESTATE_AGENT", address: "12 Broad Street, Lagos" }).success).toBe(true);
    expect(businessSchema.safeParse({ businessName: "A", type: "ESTATE_AGENT", address: "x" }).success).toBe(false);
  });
});
