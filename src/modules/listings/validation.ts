import { z } from "zod";
import { NIGERIAN_STATES } from "@/content/nigerian-states";

export const PROPERTY_TYPES = ["APARTMENT", "HOUSE", "DUPLEX", "BUNGALOW", "STUDIO", "OTHER"] as const;

export function parseFeatures(input: string): string[] {
  return input
    .split(/[\n,]/)
    .map((f) => f.trim())
    .filter(Boolean)
    .slice(0, 20)
    .map((f) => f.slice(0, 60));
}

export const listingSchema = z.object({
  title: z.string().trim().min(5, "Use at least 5 characters").max(120),
  description: z.string().trim().min(20, "Describe the property in at least 20 characters").max(4000),
  state: z.enum(NIGERIAN_STATES, { errorMap: () => ({ message: "Choose a state" }) }),
  city: z.string().trim().min(2, "Enter the city").max(80),
  neighbourhood: z.string().trim().max(80).optional().transform((v) => v || undefined),
  type: z.enum(PROPERTY_TYPES),
  annualRentNaira: z.coerce
    .number({ invalid_type_error: "Enter the yearly rent in Naira" })
    .int("Enter a whole Naira amount")
    .min(50_000, "Minimum is ₦50,000")
    .max(500_000_000, "Maximum is ₦500,000,000"),
  bedrooms: z.coerce.number().int().min(0).max(20),
  bathrooms: z.coerce.number().int().min(1, "At least 1 bathroom").max(20),
  features: z.string().max(2000).optional().transform((v) => parseFeatures(v ?? "")),
});

export type ListingInput = z.infer<typeof listingSchema>;

export const businessSchema = z.object({
  businessName: z.string().trim().min(2, "Enter the name you trade under").max(120),
  type: z.enum(["INDIVIDUAL_LANDLORD", "ESTATE_AGENT", "REAL_ESTATE_COMPANY"]),
  phone: z.string().trim().max(30).optional().transform((v) => v || undefined),
  address: z.string().trim().min(5, "Enter a business or contact address").max(250),
});
