"use server";

import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import type { FormState } from "@/lib/form-state";
import { requireUserWithPermission } from "@/modules/identity/guards";
import { PaymentError, confirmContribution, createSandboxDeposit, isSandboxEnabled } from "@/modules/payments/service";
import { canTransition } from "./lifecycle";
import { depositSchema, makeCreateGoalSchema } from "./validation";

const MAX_OPEN_GOALS = 5;

export async function createGoalAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUserWithPermission("savings:manage_own");
  const parsed = makeCreateGoalSchema(new Date()).safeParse({
    targetNaira: formData.get("targetNaira"),
    targetDate: formData.get("targetDate"),
    frequency: formData.get("frequency"),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const open = await db.savingsGoal.count({ where: { userId: user.id, status: { notIn: ["CANCELLED", "SETTLED"] } } });
  if (open >= MAX_OPEN_GOALS) return { error: `You can have at most ${MAX_OPEN_GOALS} open savings goals.` };

  const goal = await db.savingsGoal.create({
    data: {
      userId: user.id,
      targetKobo: BigInt(parsed.data.targetNaira) * 100n,
      targetDate: parsed.data.targetDate,
      frequency: parsed.data.frequency,
    },
  });
  await db.auditLog.create({ data: { actorId: user.id, action: "savings.goal_created", entity: "SavingsGoal", entityId: goal.id } });
  redirect(`/dashboard/savings/${goal.id}`);
}

export async function activateGoalAction(goalId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUserWithPermission("savings:manage_own");
  if (formData.get("acceptAgreement") !== "on") return { error: "Please accept the Rent Savings Agreement to continue." };

  const goal = await db.savingsGoal.findFirst({ where: { id: goalId, userId: user.id } });
  if (!goal) return { error: "Savings goal not found." };
  if (!canTransition(goal.status, "ACTIVE")) return { error: "This goal cannot be activated." };

  const version = await db.legalDocumentVersion.findFirst({
    where: { status: "PUBLISHED", document: { slug: "rent-savings-agreement" } },
    orderBy: { version: "desc" },
  });
  if (!version) return { error: "The Rent Savings Agreement has not been published yet, so goals cannot be activated." };

  await db.$transaction([
    db.consentRecord.create({ data: { userId: user.id, versionId: version.id, kind: "RENT_SAVINGS_AGREEMENT" } }),
    db.savingsGoal.updateMany({ where: { id: goal.id, userId: user.id, status: "DRAFT" }, data: { status: "ACTIVE" } }),
    db.auditLog.create({ data: { actorId: user.id, action: "savings.goal_activated", entity: "SavingsGoal", entityId: goal.id } }),
  ]);
  revalidatePath(`/dashboard/savings/${goal.id}`);
  revalidatePath("/dashboard");
  return { success: "Goal activated." };
}

export async function cancelGoalAction(goalId: string, _prev: FormState, _formData: FormData): Promise<FormState> {
  const user = await requireUserWithPermission("savings:manage_own");
  const goal = await db.savingsGoal.findFirst({ where: { id: goalId, userId: user.id } });
  if (!goal) return { error: "Savings goal not found." };
  if (!canTransition(goal.status, "CANCELLED")) return { error: "This goal cannot be cancelled." };

  const withMoney = await db.contribution.count({ where: { goalId: goal.id, status: { in: ["PENDING", "CONFIRMED"] } } });
  if (withMoney > 0) {
    return { error: "This goal has contributions. Cancelling it with funds needs the refund process, which is not available yet." };
  }
  await db.savingsGoal.updateMany({ where: { id: goal.id, userId: user.id }, data: { status: "CANCELLED" } });
  await db.auditLog.create({ data: { actorId: user.id, action: "savings.goal_cancelled", entity: "SavingsGoal", entityId: goal.id } });
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function sandboxDepositAction(goalId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUserWithPermission("savings:manage_own");
  if (!isSandboxEnabled()) notFound();
  const parsed = depositSchema.safeParse({ amountNaira: formData.get("amountNaira"), idempotencyKey: formData.get("idempotencyKey") });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    await createSandboxDeposit({ userId: user.id, goalId, ...parsed.data });
  } catch (e) {
    if (e instanceof PaymentError) return { error: e.message };
    throw e;
  }
  revalidatePath(`/dashboard/savings/${goalId}`);
  return { success: "Sandbox deposit created as PENDING. It counts as savings only after confirmation." };
}

/** Sandbox stand-in for the partner's success callback. It uses the same service as the webhook. */
export async function sandboxConfirmAction(contributionId: string): Promise<void> {
  const user = await requireUserWithPermission("savings:manage_own");
  if (!isSandboxEnabled()) notFound();
  const c = await db.contribution.findFirst({ where: { id: contributionId, goal: { userId: user.id } } });
  if (!c) notFound();
  await confirmContribution(c.providerReference);
  revalidatePath(`/dashboard/savings/${c.goalId}`);
  revalidatePath("/dashboard");
}
