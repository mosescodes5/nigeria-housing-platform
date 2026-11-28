"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import type { FormState } from "@/lib/form-state";
import { requireUserWithPermission } from "@/modules/identity/guards";
import { businessSchema } from "@/modules/listings/validation";
import { agreementFor, allowedBusinessTypes, needsReReview, type PartnerRole } from "./rules";

export async function saveBusinessProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUserWithPermission("listing:manage_own");
  const role = user.role as PartnerRole;

  const parsed = businessSchema.safeParse({
    businessName: formData.get("businessName"),
    type: formData.get("type"),
    phone: formData.get("phone") || undefined,
    address: formData.get("address"),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  if (!allowedBusinessTypes(role).includes(parsed.data.type)) {
    return { fieldErrors: { type: ["This business type does not match your account type"] } };
  }

  const existing = await db.businessProfile.findUnique({ where: { userId: user.id } });
  const resetReview = existing ? needsReReview(existing, parsed.data) : true;

  await db.businessProfile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...parsed.data },
    update: { ...parsed.data, ...(resetReview ? { status: "PENDING_REVIEW" as const, reviewNote: null } : {}) },
  });
  await db.auditLog.create({ data: { actorId: user.id, action: "business.saved", entity: "BusinessProfile", entityId: user.id } });
  revalidatePath("/portal");
  revalidatePath("/portal/onboarding");
  return { success: resetReview ? "Saved. Your business details are pending review." : "Saved." };
}

export async function acceptPartnerAgreementAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUserWithPermission("listing:manage_own");
  if (formData.get("acceptAgreement") !== "on") return { error: "Please accept the agreement to continue." };

  const { slug, kind } = agreementFor(user.role as PartnerRole);
  const version = await db.legalDocumentVersion.findFirst({
    where: { status: "PUBLISHED", document: { slug } },
    orderBy: { version: "desc" },
  });
  if (!version) return { error: "This agreement has not been published yet, so it cannot be accepted." };

  const already = await db.consentRecord.findFirst({ where: { userId: user.id, versionId: version.id, kind, withdrawnAt: null } });
  if (already) return { success: "You have already accepted the current agreement." };

  await db.consentRecord.create({ data: { userId: user.id, versionId: version.id, kind } });
  await db.auditLog.create({ data: { actorId: user.id, action: "consent.partner_agreement", entity: "LegalDocumentVersion", entityId: version.id } });
  revalidatePath("/portal");
  revalidatePath("/portal/onboarding");
  return { success: "Agreement accepted." };
}
