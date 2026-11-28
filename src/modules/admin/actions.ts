"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import type { FormState } from "@/lib/form-state";
import { requireUserWithPermission } from "@/modules/identity/guards";
import { approvalBlockers, type DocumentKind, type OwnerRole } from "@/modules/listings/rules";

export async function moderateListingAction(propertyId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireUserWithPermission("property:moderate");
  const decision = formData.get("decision");
  const note = String(formData.get("note") ?? "").trim().slice(0, 1000);
  const scope = String(formData.get("verificationScope") ?? "").trim().slice(0, 300);

  const property = await db.property.findFirst({
    where: { id: propertyId, listingStatus: "SUBMITTED" },
    include: { owner: { include: { businessProfile: true } }, documents: { select: { kind: true } } },
  });
  if (!property) return { error: "Listing not found or not awaiting review." };

  if (decision === "REJECT") {
    if (note.length < 10) return { error: "Give the owner a reason of at least 10 characters." };
    await db.property.updateMany({ where: { id: property.id, listingStatus: "SUBMITTED" }, data: { listingStatus: "REJECTED", moderationNote: note } });
    await db.auditLog.create({ data: { actorId: admin.id, action: "listing.rejected", entity: "Property", entityId: property.id } });
  } else if (decision === "APPROVE") {
    const blockers = approvalBlockers({
      ownerRole: property.owner.role as OwnerRole,
      businessStatus: property.owner.businessProfile?.status ?? null,
      documentKinds: property.documents.map((d) => d.kind as DocumentKind),
    });
    if (blockers.length) return { error: blockers.join(" ") };
    await db.property.updateMany({
      where: { id: property.id, listingStatus: "SUBMITTED" },
      data: {
        listingStatus: "PUBLISHED",
        // "Verified" is only claimed when the reviewer states what was actually checked.
        verificationStatus: scope ? "VERIFIED" : "UNVERIFIED",
        verificationScope: scope || null,
        moderationNote: null,
      },
    });
    await db.auditLog.create({ data: { actorId: admin.id, action: "listing.approved", entity: "Property", entityId: property.id } });
  } else {
    return { error: "Choose approve or reject." };
  }
  revalidatePath("/admin/listings");
  revalidatePath("/properties");
  revalidatePath("/");
  return { success: decision === "APPROVE" ? "Listing published." : "Listing rejected." };
}

export async function reviewBusinessAction(profileId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireUserWithPermission("business:review");
  const decision = formData.get("decision");
  const note = String(formData.get("note") ?? "").trim().slice(0, 1000);
  if (decision !== "APPROVE" && decision !== "REJECT") return { error: "Choose approve or reject." };
  if (decision === "REJECT" && note.length < 10) return { error: "Give a reason of at least 10 characters." };

  const res = await db.businessProfile.updateMany({
    where: { id: profileId, status: "PENDING_REVIEW" },
    data: { status: decision === "APPROVE" ? "VERIFIED" : "REJECTED", reviewNote: decision === "REJECT" ? note : null },
  });
  if (res.count === 0) return { error: "Profile not found or already reviewed." };
  await db.auditLog.create({ data: { actorId: admin.id, action: `business.${decision.toLowerCase()}d`, entity: "BusinessProfile", entityId: profileId } });
  revalidatePath("/admin/businesses");
  return { success: decision === "APPROVE" ? "Business verified." : "Business rejected." };
}
