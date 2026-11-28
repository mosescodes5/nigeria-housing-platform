import { randomBytes } from "node:crypto";

export function slugify(input: string, maxLength = 60): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength)
    .replace(/-+$/g, "");
}

/** Readable, unique-enough slug: title words plus a random suffix. */
export function listingSlug(title: string, city: string): string {
  const base = slugify(`${title} ${city}`, 55) || "listing";
  return `${base}-${randomBytes(3).toString("hex")}`;
}
