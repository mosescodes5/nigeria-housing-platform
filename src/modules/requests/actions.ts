"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import type { FormState } from "@/lib/form-state";
import { requireUserWithPermission } from "@/modules/identity/guards";
import { RateLimiter } from "@/modules/identity/rate-limit";
import { enquirySchema } from "@/modules/engagement/validation";

const applicationLimiter = new RateLimiter(5, 60 * 60 * 1000);

/** Tenant or buyer applies to rent. An application is not a reservation. */
export async function submitApplicationAction(propertyId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUserWithPermission("application:submit");
  if (!applicationLimiter.check(`application:${user.id}`).allowed) return { error: "Too many applications. Please try again later." };

  const parsed = enquirySchema.safeParse({ message: formData.get("message") });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const property = await db.property.findFirst({ where: { id: propertyId, listingStatus: "PUBLISHED", available: true }, select: { id: true } });
  if (!property) return { error: "This property is no longer available." };

  const existing = await db.rentalApplication.findFirst({
    where: { userId: user.id, propertyId: property.id, status: { in: ["SUBMITTED", "APPROVED"] } },
    select: { id: true },
  });
  if (existing) return { error: "You already have an open application for this property." };

  await db.rentalApplication.create({ data: { userId: user.id, propertyId: property.id, message: parsed.data.message } });
  revalidatePath("/dashboard");
  return { success: "Application submitted. It does not reserve the property." };
}

export async function respondToViewingAction(viewingId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUserWithPermission("listing:manage_own");
  const decision = formData.get("decision");
  if (decision !== "CONFIRMED" && decision !== "DECLINED") return { error: "Choose confirm or decline." };

  // Only requests on this partner's own properties, and only while still REQUESTED.
  const res = await db.viewingRequest.updateMany({
    where: { id: viewingId, status: "REQUESTED", property: { ownerId: user.id } },
    data: { status: decision },
  });
  if (res.count === 0) return { error: "Request not found or already answered." };
  await db.auditLog.create({ data: { actorId: user.id, action: `viewing.${decision.toLowerCase()}`, entity: "ViewingRequest", entityId: viewingId } });
  revalidatePath("/portal/requests");
  return { success: decision === "CONFIRMED" ? "Viewing confirmed." : "Viewing declined." };
}

export async function decideApplicationAction(applicationId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUserWithPermission("listing:manage_own");
  const decision = formData.get("decision");
  if (decision !== "APPROVED" && decision !== "REJECTED") return { error: "Choose approve or reject." };

  const res = await db.rentalApplication.updateMany({
    where: { id: applicationId, status: "SUBMITTED", property: { ownerId: user.id } },
    data: { status: decision, decidedAt: new Date() },
  });
  if (res.count === 0) return { error: "Application not found or already decided." };
  await db.auditLog.create({ data: { actorId: user.id, action: `application.${decision.toLowerCase()}`, entity: "RentalApplication", entityId: applicationId } });
  revalidatePath("/portal/requests");
  return { success: decision === "APPROVED" ? "Application approved. This does not reserve the property." : "Application rejected." };
}
