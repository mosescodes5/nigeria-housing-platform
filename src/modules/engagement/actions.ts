"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { FormState } from "@/lib/form-state";
import { requireUserWithPermission } from "@/modules/identity/guards";
import { RateLimiter } from "@/modules/identity/rate-limit";
import { enquirySchema, makeViewingSchema } from "./validation";

const enquiryLimiter = new RateLimiter(10, 60 * 60 * 1000);
const viewingLimiter = new RateLimiter(10, 60 * 60 * 1000);

export async function toggleFavouriteAction(propertyId: string): Promise<void> {
  const user = await requireUserWithPermission("property:favourite");
  const property = await db.property.findFirst({ where: { id: propertyId, listingStatus: "PUBLISHED" }, select: { id: true } });
  if (!property) return;

  const removed = await db.favourite.deleteMany({ where: { userId: user.id, propertyId } });
  if (removed.count === 0) {
    try {
      await db.favourite.create({ data: { userId: user.id, propertyId } });
    } catch (e) {
      if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) throw e;
    }
  }
  revalidatePath("/");
  revalidatePath("/properties");
  revalidatePath("/dashboard");
}

async function findOpenProperty(propertyId: string) {
  return db.property.findFirst({
    where: { id: propertyId, listingStatus: "PUBLISHED", available: true },
    select: { id: true, slug: true },
  });
}

export async function submitEnquiryAction(propertyId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUserWithPermission("property:enquire");
  if (!enquiryLimiter.check(`enquiry:${user.id}`).allowed) return { error: "Too many enquiries. Please try again later." };

  const parsed = enquirySchema.safeParse({ message: formData.get("message") });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const property = await findOpenProperty(propertyId);
  if (!property) return { error: "This property is no longer available for enquiries." };

  await db.enquiry.create({ data: { userId: user.id, propertyId: property.id, message: parsed.data.message } });
  revalidatePath("/dashboard");
  return { success: "Your enquiry has been recorded. The landlord or agent will be able to respond once messaging is enabled." };
}

export async function requestViewingAction(propertyId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUserWithPermission("property:enquire");
  if (!viewingLimiter.check(`viewing:${user.id}`).allowed) return { error: "Too many requests. Please try again later." };

  const parsed = makeViewingSchema(new Date()).safeParse({
    preferredAt: formData.get("preferredAt"),
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const property = await findOpenProperty(propertyId);
  if (!property) return { error: "This property is no longer available for viewings." };

  await db.viewingRequest.create({
    data: { userId: user.id, propertyId: property.id, preferredAt: parsed.data.preferredAt, note: parsed.data.note },
  });
  revalidatePath("/dashboard");
  return { success: "Viewing request recorded. It is not confirmed until the landlord or agent accepts it." };
}
