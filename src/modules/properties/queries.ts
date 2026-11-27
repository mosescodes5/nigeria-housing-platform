import type { Property, PropertyType } from "@prisma/client";
import { db } from "@/lib/db";
import { buildOrderBy, buildWhere, type PropertyFilters } from "./filter";

export interface PropertyView {
  id: string;
  slug: string;
  title: string;
  state: string;
  city: string;
  neighbourhood: string | null;
  type: PropertyType;
  annualRentKobo: bigint;
  bedrooms: number;
  bathrooms: number;
  available: boolean;
  verified: boolean;
  verificationScope: string | null;
  description: string;
  features: string[];
}

function toView(p: Property): PropertyView {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    state: p.state,
    city: p.city,
    neighbourhood: p.neighbourhood,
    type: p.type,
    annualRentKobo: p.annualRentKobo,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    available: p.available,
    verified: p.verificationStatus === "VERIFIED",
    verificationScope: p.verificationScope,
    description: p.description,
    features: p.features,
  };
}

export async function listProperties(filters: PropertyFilters, take = 48): Promise<PropertyView[]> {
  const rows = await db.property.findMany({
    where: buildWhere(filters),
    orderBy: buildOrderBy(filters.sort),
    take,
  });
  return rows.map(toView);
}

export async function featuredProperties(n = 3): Promise<PropertyView[]> {
  const rows = await db.property.findMany({
    where: { listingStatus: "PUBLISHED", available: true },
    orderBy: [{ verificationStatus: "desc" }, { createdAt: "desc" }],
    take: n,
  });
  return rows.map(toView);
}

export async function getPublishedPropertyBySlug(slug: string): Promise<PropertyView | null> {
  const row = await db.property.findFirst({ where: { slug, listingStatus: "PUBLISHED" } });
  return row ? toView(row) : null;
}

export async function similarProperties(p: PropertyView, n = 2): Promise<PropertyView[]> {
  const rows = await db.property.findMany({
    where: { listingStatus: "PUBLISHED", city: p.city, NOT: { id: p.id } },
    orderBy: { createdAt: "desc" },
    take: n,
  });
  return rows.map(toView);
}

export async function favouriteIdsFor(userId: string): Promise<Set<string>> {
  const rows = await db.favourite.findMany({ where: { userId }, select: { propertyId: true } });
  return new Set(rows.map((r) => r.propertyId));
}
