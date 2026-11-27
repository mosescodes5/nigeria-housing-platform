/**
 * Regulated capabilities. These are hard-coded to false on purpose.
 * Enabling any of them requires legal, regulatory and partner approval first
 * (see docs/COMPLIANCE_LAUNCH.md) and a reviewed code change, never an env toggle.
 */
export const REGULATED_FEATURES = {
  realMoneyDeposits: false,
  withdrawals: false,
  landlordSettlements: false,
  rentFinancing: false,
  regulatedMortgageApplications: false,
} as const;

export type RegulatedFeature = keyof typeof REGULATED_FEATURES;

export function isRegulatedFeatureEnabled(feature: RegulatedFeature): boolean {
  return REGULATED_FEATURES[feature];
}
