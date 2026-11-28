export type ListingStatus = "DRAFT" | "SUBMITTED" | "PUBLISHED" | "REJECTED" | "ARCHIVED";
export type OwnerRole = "LANDLORD" | "AGENT";
export type DocumentKind = "OWNERSHIP_PROOF" | "AUTHORITY_TO_LET" | "ID_DOCUMENT" | "OTHER";
export type BusinessStatus = "PENDING_REVIEW" | "VERIFIED" | "REJECTED";

export function canEditListing(status: ListingStatus): boolean {
  return status === "DRAFT" || status === "REJECTED" || status === "PUBLISHED";
}

export function canSubmitListing(status: ListingStatus): boolean {
  return status === "DRAFT" || status === "REJECTED";
}

/**
 * Editing a live listing changes facts that were reviewed, so it leaves the marketplace and goes
 * back through moderation with its verification cleared.
 */
export function afterEdit(status: ListingStatus) {
  if (status === "PUBLISHED") return { listingStatus: "SUBMITTED" as const, resetVerification: true };
  return { listingStatus: status, resetVerification: false };
}

/** Landlords must show ownership; agents must show authority to let. */
export function requiredDocumentKind(role: OwnerRole): DocumentKind {
  return role === "AGENT" ? "AUTHORITY_TO_LET" : "OWNERSHIP_PROOF";
}

export function hasRequiredDocument(role: OwnerRole, kinds: readonly DocumentKind[]): boolean {
  return kinds.includes(requiredDocumentKind(role));
}

/** Pre-conditions an administrator needs before a listing can be published. */
export function approvalBlockers(input: {
  ownerRole: OwnerRole;
  businessStatus: BusinessStatus | null;
  documentKinds: readonly DocumentKind[];
}): string[] {
  const blockers: string[] = [];
  if (input.businessStatus !== "VERIFIED") blockers.push("The owner's business profile is not verified.");
  if (!hasRequiredDocument(input.ownerRole, input.documentKinds)) {
    blockers.push(input.ownerRole === "AGENT" ? "No authority-to-let document has been uploaded." : "No proof of ownership has been uploaded.");
  }
  return blockers;
}
