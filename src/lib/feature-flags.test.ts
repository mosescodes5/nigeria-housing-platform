import { describe, expect, it } from "vitest";
import { REGULATED_FEATURES, isRegulatedFeatureEnabled } from "./feature-flags";

describe("regulated feature launch restrictions", () => {
  it("keeps every regulated feature disabled", () => {
    for (const [name, enabled] of Object.entries(REGULATED_FEATURES)) {
      expect(enabled, `${name} must stay disabled until approvals are recorded`).toBe(false);
    }
  });

  it("reports disabled through the helper", () => {
    expect(isRegulatedFeatureEnabled("landlordSettlements")).toBe(false);
  });
});
