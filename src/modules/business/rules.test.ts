import { describe, expect, it } from "vitest";
import { agreementFor, allowedBusinessTypes, needsReReview } from "./rules";

describe("business rules", () => {
  it("limits business types by role", () => {
    expect(allowedBusinessTypes("LANDLORD")).not.toContain("ESTATE_AGENT");
    expect(allowedBusinessTypes("AGENT")).not.toContain("INDIVIDUAL_LANDLORD");
    expect(allowedBusinessTypes("AGENT")).toContain("REAL_ESTATE_COMPANY");
  });
  it("maps roles to agreements", () => {
    expect(agreementFor("LANDLORD").slug).toBe("landlord-agreement");
    expect(agreementFor("AGENT").kind).toBe("AGENT_AGREEMENT");
  });
  it("re-reviews only identity changes or previously rejected profiles", () => {
    const base = { businessName: "Ade Homes", type: "ESTATE_AGENT", status: "VERIFIED" };
    expect(needsReReview(base, { businessName: "Ade Homes", type: "ESTATE_AGENT" })).toBe(false);
    expect(needsReReview(base, { businessName: "Ade Homes Ltd", type: "ESTATE_AGENT" })).toBe(true);
    expect(needsReReview({ ...base, status: "REJECTED" }, { businessName: "Ade Homes", type: "ESTATE_AGENT" })).toBe(true);
  });
});
