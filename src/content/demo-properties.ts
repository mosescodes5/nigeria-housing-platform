/**
 * DEMONSTRATION LISTINGS. Not real properties, prices or verifications.
 * Used ONLY as seed input for local/staging databases (prisma/seed.ts). The site reads from the database.
 */
export type PropertyType = "APARTMENT" | "HOUSE" | "DUPLEX" | "BUNGALOW" | "STUDIO";

export interface DemoProperty {
  slug: string;
  title: string;
  state: string;
  city: string;
  neighbourhood: string;
  type: PropertyType;
  annualRentKobo: bigint;
  bedrooms: number;
  bathrooms: number;
  available: boolean;
  verified: boolean;
  /** What the platform actually checked. Everything else is supplied by the owner or agent. */
  verificationScope: string | null;
  description: string;
  features: string[];
  createdAt: string;
}

const naira = (n: number) => BigInt(n) * 100n;

export const DEMO_PROPERTIES: DemoProperty[] = [
  {
    slug: "lekki-phase-1-two-bed",
    title: "Modern 2-bedroom apartment",
    state: "Lagos", city: "Lagos", neighbourhood: "Lekki Phase 1",
    type: "APARTMENT", annualRentKobo: naira(4_500_000), bedrooms: 2, bathrooms: 2,
    available: true, verified: true,
    verificationScope: "Owner identity and authority to let (demonstration data)",
    description: "A bright two-bedroom apartment in a gated estate, close to shops and schools.",
    features: ["Gated estate", "Parking space", "Backup power", "Water supply"],
    createdAt: "2026-11-10",
  },
  {
    slug: "yaba-studio",
    title: "Compact studio near the tech corridor",
    state: "Lagos", city: "Lagos", neighbourhood: "Yaba",
    type: "STUDIO", annualRentKobo: naira(1_800_000), bedrooms: 1, bathrooms: 1,
    available: true, verified: false, verificationScope: null,
    description: "A self-contained studio suited to a single professional.",
    features: ["Tiled floors", "Prepaid meter", "Security"],
    createdAt: "2026-11-05",
  },
  {
    slug: "maitama-three-bed",
    title: "Spacious 3-bedroom flat",
    state: "FCT", city: "Abuja", neighbourhood: "Maitama",
    type: "APARTMENT", annualRentKobo: naira(9_000_000), bedrooms: 3, bathrooms: 3,
    available: true, verified: true,
    verificationScope: "Owner identity and property documents sighted (demonstration data)",
    description: "A well-kept three-bedroom flat in a quiet, central neighbourhood.",
    features: ["Boys' quarters", "Parking", "Generator", "Fitted kitchen"],
    createdAt: "2026-10-28",
  },
  {
    slug: "gwarinpa-duplex",
    title: "4-bedroom semi-detached duplex",
    state: "FCT", city: "Abuja", neighbourhood: "Gwarinpa",
    type: "DUPLEX", annualRentKobo: naira(6_500_000), bedrooms: 4, bathrooms: 4,
    available: false, verified: false, verificationScope: null,
    description: "A family duplex with a compound and room for several cars.",
    features: ["Compound", "Water supply", "Security post"],
    createdAt: "2026-10-15",
  },
  {
    slug: "ikeja-gra-bungalow",
    title: "3-bedroom detached bungalow",
    state: "Lagos", city: "Lagos", neighbourhood: "Ikeja GRA",
    type: "BUNGALOW", annualRentKobo: naira(5_200_000), bedrooms: 3, bathrooms: 3,
    available: true, verified: true,
    verificationScope: "Owner identity and authority to let (demonstration data)",
    description: "A detached bungalow on a quiet street in a residential area.",
    features: ["Garden", "Parking", "Borehole"],
    createdAt: "2026-11-18",
  },
  {
    slug: "port-harcourt-gra-two-bed",
    title: "2-bedroom apartment in a secure compound",
    state: "Rivers", city: "Port Harcourt", neighbourhood: "GRA Phase 2",
    type: "APARTMENT", annualRentKobo: naira(3_200_000), bedrooms: 2, bathrooms: 2,
    available: true, verified: false, verificationScope: null,
    description: "A two-bedroom apartment with reliable access and secure parking.",
    features: ["Secure compound", "Parking", "Water supply"],
    createdAt: "2026-11-01",
  },
];

export function getDemoProperty(slug: string): DemoProperty | undefined {
  return DEMO_PROPERTIES.find((p) => p.slug === slug);
}
