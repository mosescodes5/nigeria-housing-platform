import { describe, expect, it } from "vitest";
import { afterEdit, approvalBlockers, canEditListing, canSubmitListing, hasRequiredDocument } from "./rules";

describe("listing rules", () => {
  it("restricts editing and submission by status", () => {
    expect(canEditListing("DRAFT")).toBe(true);
    expect(canEditListing("SUBMITTED")).toBe(false);
    expect(canEditListing("ARCHIVED")).toBe(false);
    expect(canSubmitListing("REJECTED")).toBe(true);
    expect(canSubmitListing("PUBLISHED")).toBe(false);
  });

  it("sends edited live listings back to moderation and clears verification", () => {
    expect(afterEdit("PUBLISHED")).toEqual({ listingStatus: "SUBMITTED", resetVerification: true });
    expect(afterEdit("DRAFT")).toEqual({ listingStatus: "DRAFT", resetVerification: false });
  });

  it("requires role-appropriate documents", () => {
    expect(hasRequiredDocument("LANDLORD", ["OWNERSHIP_PROOF"])).toBe(true);
    expect(hasRequiredDocument("LANDLORD", ["AUTHORITY_TO_LET"])).toBe(false);
    expect(hasRequiredDocument("AGENT", ["AUTHORITY_TO_LET"])).toBe(true);
    expect(hasRequiredDocument("AGENT", ["OWNERSHIP_PROOF", "ID_DOCUMENT"])).toBe(false);
  });

  it("lists approval blockers", () => {
    expect(approvalBlockers({ ownerRole: "AGENT", businessStatus: "PENDING_REVIEW", documentKinds: [] })).toHaveLength(2);
    expect(approvalBlockers({ ownerRole: "LANDLORD", businessStatus: "VERIFIED", documentKinds: ["OWNERSHIP_PROOF"] })).toEqual([]);
    expect(approvalBlockers({ ownerRole: "LANDLORD", businessStatus: null, documentKinds: ["OWNERSHIP_PROOF"] })).toHaveLength(1);
  });
});
