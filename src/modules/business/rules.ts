export type PartnerRole = "LANDLORD" | "AGENT";
export type BusinessType = "INDIVIDUAL_LANDLORD" | "ESTATE_AGENT" | "REAL_ESTATE_COMPANY";

export function allowedBusinessTypes(role: PartnerRole): BusinessType[] {
  return role === "LANDLORD" ? ["INDIVIDUAL_LANDLORD", "REAL_ESTATE_COMPANY"] : ["ESTATE_AGENT", "REAL_ESTATE_COMPANY"];
}

/** Which agreement a partner must accept before submitting listings. */
export function agreementFor(role: PartnerRole) {
  return role === "LANDLORD"
    ? ({ slug: "landlord-agreement", kind: "LANDLORD_AGREEMENT" } as const)
    : ({ slug: "agent-agreement", kind: "AGENT_AGREEMENT" } as const);
}

/** Changing identity-defining details of a verified business sends it back for review. */
export function needsReReview(
  existing: { businessName: string; type: string; status: string },
  next: { businessName: string; type: string },
): boolean {
  return existing.status === "REJECTED" || existing.businessName !== next.businessName || existing.type !== next.type;
}
