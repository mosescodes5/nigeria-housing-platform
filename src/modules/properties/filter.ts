import type { Prisma, PropertyType } from "@prisma/client";

export interface PropertyFilters {
  q?: string;
  minNaira?: number;
  maxNaira?: number;
  type?: PropertyType;
  minBedrooms?: number;
  minBathrooms?: number;
  availableOnly?: boolean;
  verifiedOnly?: boolean;
  sort?: "newest" | "price_asc" | "price_desc";
}

/** Public marketplace only ever shows PUBLISHED listings. */
export function buildWhere(f: PropertyFilters): Prisma.PropertyWhereInput {
  const and: Prisma.PropertyWhereInput[] = [];
  const q = f.q?.trim();
  if (q) {
    and.push({
      OR: [
        { city: { contains: q, mode: "insensitive" } },
        { state: { contains: q, mode: "insensitive" } },
        { neighbourhood: { contains: q, mode: "insensitive" } },
        { title: { contains: q, mode: "insensitive" } },
      ],
    });
  }
  if (f.minNaira !== undefined || f.maxNaira !== undefined) {
    and.push({
      annualRentKobo: {
        ...(f.minNaira !== undefined ? { gte: BigInt(f.minNaira) * 100n } : {}),
        ...(f.maxNaira !== undefined ? { lte: BigInt(f.maxNaira) * 100n } : {}),
      },
    });
  }
  if (f.type) and.push({ type: f.type });
  if (f.minBedrooms !== undefined) and.push({ bedrooms: { gte: f.minBedrooms } });
  if (f.minBathrooms !== undefined) and.push({ bathrooms: { gte: f.minBathrooms } });
  if (f.availableOnly) and.push({ available: true });
  if (f.verifiedOnly) and.push({ verificationStatus: "VERIFIED" });
  return { listingStatus: "PUBLISHED", AND: and };
}

export function buildOrderBy(
  sort: PropertyFilters["sort"],
): Prisma.PropertyOrderByWithRelationInput {
  if (sort === "price_asc") return { annualRentKobo: "asc" };
  if (sort === "price_desc") return { annualRentKobo: "desc" };
  return { createdAt: "desc" };
}

const num = (v: string | undefined) => {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n <= 1_000_000_000 ? Math.floor(n) : undefined;
};

/** Parses URL search params defensively; unknown values are ignored. */
export function parseFilters(sp: Record<string, string | string[] | undefined>): PropertyFilters {
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k]![0] : (sp[k] as string | undefined));
  const types = ["APARTMENT", "HOUSE", "DUPLEX", "BUNGALOW", "STUDIO", "OTHER"];
  const sorts = ["newest", "price_asc", "price_desc"];
  const type = one("type");
  const sort = one("sort");
  return {
    q: one("q")?.slice(0, 80) || undefined,
    minNaira: num(one("min")),
    maxNaira: num(one("max")),
    type: type && types.includes(type) ? (type as PropertyType) : undefined,
    minBedrooms: num(one("beds")),
    minBathrooms: num(one("baths")),
    availableOnly: one("available") === "1",
    verifiedOnly: one("verified") === "1",
    sort: sort && sorts.includes(sort) ? (sort as PropertyFilters["sort"]) : undefined,
  };
}
