"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import type { FormState } from "@/lib/form-state";
import { listingSlug } from "@/lib/slug";
import { agreementFor, type PartnerRole } from "@/modules/business/rules";
import { requireUserWithPermission } from "@/modules/identity/guards";
import { getStorage, StorageUnavailableError } from "@/modules/storage/storage";
import { MAX_UPLOAD_BYTES, sanitizeFileName, sniffFile } from "@/modules/storage/validate";
import { afterEdit, canEditListing, canSubmitListing, hasRequiredDocument, type DocumentKind, type ListingStatus } from "./rules";
import { listingSchema } from "./validation";

const MAX_LISTINGS = 50;
const MAX_DOCS_PER_PROPERTY = 10;
const DOC_KINDS = ["OWNERSHIP_PROOF", "AUTHORITY_TO_LET", "ID_DOCUMENT", "OTHER"] as const;

function readListing(formData: FormData) {
  return listingSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    state: formData.get("state"),
    city: formData.get("city"),
    neighbourhood: formData.get("neighbourhood") || undefined,
    type: formData.get("type"),
    annualRentNaira: formData.get("annualRentNaira"),
    bedrooms: formData.get("bedrooms"),
    bathrooms: formData.get("bathrooms"),
    features: formData.get("features") || undefined,
  });
}

export async function createListingAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUserWithPermission("listing:manage_own");
  const business = await db.businessProfile.findUnique({ where: { userId: user.id }, select: { id: true } });
  if (!business) return { error: "Complete your business profile before creating listings." };

  const parsed = readListing(formData);
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  if ((await db.property.count({ where: { ownerId: user.id } })) >= MAX_LISTINGS) return { error: "You have reached the listing limit." };

  const { annualRentNaira, ...rest } = parsed.data;
  const property = await db.property.create({
    data: {
      ...rest,
      slug: listingSlug(rest.title, rest.city),
      ownerId: user.id,
      annualRentKobo: BigInt(annualRentNaira) * 100n,
      available: formData.get("available") !== null ? formData.get("available") === "on" : true,
    },
  });
  await db.auditLog.create({ data: { actorId: user.id, action: "listing.created", entity: "Property", entityId: property.id } });
  redirect(`/portal/listings/${property.id}`);
}

export async function updateListingAction(propertyId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUserWithPermission("listing:manage_own");
  // Ownership is part of the query.
  const property = await db.property.findFirst({ where: { id: propertyId, ownerId: user.id } });
  if (!property) return { error: "Listing not found." };
  if (!canEditListing(property.listingStatus)) return { error: "This listing cannot be edited while it is under review or archived." };

  const parsed = readListing(formData);
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const { annualRentNaira, ...rest } = parsed.data;
  const change = afterEdit(property.listingStatus);
  await db.property.update({
    where: { id: property.id },
    data: {
      ...rest,
      neighbourhood: rest.neighbourhood ?? null,
      annualRentKobo: BigInt(annualRentNaira) * 100n,
      available: formData.get("available") === "on",
      listingStatus: change.listingStatus,
      ...(change.resetVerification
        ? { verificationStatus: "UNVERIFIED" as const, verificationScope: null, moderationNote: null, submittedAt: new Date() }
        : {}),
    },
  });
  await db.auditLog.create({ data: { actorId: user.id, action: "listing.updated", entity: "Property", entityId: property.id } });
  revalidatePath(`/portal/listings/${property.id}`);
  revalidatePath("/portal/listings");
  return {
    success: change.resetVerification
      ? "Saved. Because this listing was live, it has gone back to moderation and is hidden until it is approved again."
      : "Saved.",
  };
}

export async function submitListingAction(propertyId: string, _prev: FormState, _formData: FormData): Promise<FormState> {
  const user = await requireUserWithPermission("listing:manage_own");
  const role = user.role as PartnerRole;
  const property = await db.property.findFirst({
    where: { id: propertyId, ownerId: user.id },
    include: { documents: { select: { kind: true } } },
  });
  if (!property) return { error: "Listing not found." };
  if (!canSubmitListing(property.listingStatus)) return { error: "This listing cannot be submitted in its current state." };

  const [business, consent] = await Promise.all([
    db.businessProfile.findUnique({ where: { userId: user.id }, select: { id: true } }),
    db.consentRecord.findFirst({ where: { userId: user.id, kind: agreementFor(role).kind, withdrawnAt: null }, select: { id: true } }),
  ]);
  if (!business) return { error: "Complete your business profile first." };
  if (!consent) return { error: "Accept your partner agreement on the onboarding page first." };
  const kinds = property.documents.map((d) => d.kind as DocumentKind);
  if (!hasRequiredDocument(role, kinds)) {
    return { error: role === "AGENT" ? "Upload your authority-to-let document first." : "Upload proof of ownership first." };
  }

  await db.property.updateMany({
    where: { id: property.id, ownerId: user.id, listingStatus: property.listingStatus as ListingStatus },
    data: { listingStatus: "SUBMITTED", submittedAt: new Date(), moderationNote: null },
  });
  await db.auditLog.create({ data: { actorId: user.id, action: "listing.submitted", entity: "Property", entityId: property.id } });
  revalidatePath(`/portal/listings/${property.id}`);
  revalidatePath("/portal/listings");
  return { success: "Submitted for moderation." };
}

export async function uploadDocumentAction(propertyId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUserWithPermission("listing:manage_own");
  const property = await db.property.findFirst({
    where: { id: propertyId, ownerId: user.id },
    select: { id: true, listingStatus: true, _count: { select: { documents: true } } },
  });
  if (!property) return { error: "Listing not found." };
  if (property.listingStatus === "ARCHIVED") return { error: "Archived listings cannot receive documents." };
  if (property._count.documents >= MAX_DOCS_PER_PROPERTY) return { error: "Document limit reached for this listing." };

  const kind = formData.get("kind");
  if (typeof kind !== "string" || !(DOC_KINDS as readonly string[]).includes(kind)) return { error: "Choose a document type." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a file to upload." };
  if (file.size > MAX_UPLOAD_BYTES) return { error: "Files must be 5 MB or smaller." };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const detected = sniffFile(bytes);
  if (!detected) return { error: "Only PDF, JPEG and PNG files are accepted." };

  let storage;
  try {
    storage = getStorage();
  } catch (e) {
    if (e instanceof StorageUnavailableError) return { error: "Document uploads are not available in this environment yet." };
    throw e;
  }

  const storageKey = `properties/${property.id}/${randomUUID()}.${detected.ext}`;
  await storage.put(storageKey, bytes);
  const doc = await db.propertyDocument.create({
    data: {
      propertyId: property.id,
      uploadedById: user.id,
      kind: kind as DocumentKind,
      originalName: sanitizeFileName(file.name),
      mimeType: detected.mime,
      sizeBytes: bytes.length,
      storageKey,
    },
  });
  await db.auditLog.create({ data: { actorId: user.id, action: "document.uploaded", entity: "PropertyDocument", entityId: doc.id } });
  revalidatePath(`/portal/listings/${property.id}`);
  return { success: "Document uploaded." };
}
