import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  PARTNER_CLEARING_CODE,
  assertBalanced,
  customerSavingsCode,
  netBalanceKobo,
  type EntryInput,
} from "@/modules/ledger/ledger";

export class PaymentError extends Error {
  constructor(
    public code: "NOT_FOUND" | "INVALID_STATE" | "DISABLED",
    message: string,
  ) {
    super(message);
  }
}

export type ProcessResult = "processed" | "already_processed";

/** Sandbox (fake-money) deposits exist only in local and test environments. */
export function isSandboxEnabled(appEnv: string | undefined = process.env.APP_ENV): boolean {
  return appEnv === "local" || appEnv === "test";
}

async function ensureAccount(
  tx: Prisma.TransactionClient,
  code: string,
  name: string,
  type: "ASSET" | "LIABILITY",
  userId?: string,
) {
  return tx.ledgerAccount.upsert({
    where: { code },
    update: {},
    create: { code, name, type, userId },
  });
}

/** Validates, then writes a balanced transaction. The unique reference makes double-posting impossible. */
async function postLedger(
  tx: Prisma.TransactionClient,
  input: { reference: string; description: string; entries: EntryInput[]; userId: string },
) {
  assertBalanced(input.entries);
  const clearing = await ensureAccount(
    tx,
    PARTNER_CLEARING_CODE,
    "Funds held at payment partner",
    "ASSET",
  );
  const customer = await ensureAccount(
    tx,
    customerSavingsCode(input.userId),
    "Customer savings (liability)",
    "LIABILITY",
    input.userId,
  );
  const idFor = (code: string) => (code === PARTNER_CLEARING_CODE ? clearing.id : customer.id);
  await tx.ledgerTransaction.create({
    data: {
      reference: input.reference,
      description: input.description,
      entries: {
        create: input.entries.map((e) => ({
          accountId: idFor(e.accountCode),
          direction: e.direction,
          amountKobo: e.amountKobo,
        })),
      },
    },
  });
}

async function loadContribution(tx: Prisma.TransactionClient, providerReference: string) {
  const c = await tx.contribution.findUnique({
    where: { providerReference },
    include: { goal: true },
  });
  if (!c) throw new PaymentError("NOT_FOUND", "Unknown payment reference");
  return c;
}

/** Called only by a verified partner callback (or the sandbox simulator). Idempotent. */
export async function confirmContribution(providerReference: string): Promise<ProcessResult> {
  return db.$transaction(async (tx) => {
    const c = await loadContribution(tx, providerReference);
    if (c.status === "CONFIRMED") return "already_processed";
    if (c.status !== "PENDING")
      throw new PaymentError("INVALID_STATE", `Cannot confirm a ${c.status} contribution`);

    const claimed = await tx.contribution.updateMany({
      where: { id: c.id, status: "PENDING" },
      data: { status: "CONFIRMED", confirmedAt: new Date() },
    });
    if (claimed.count === 0) return "already_processed";

    const userId = c.goal.userId;
    await postLedger(tx, {
      reference: `contribution:${c.id}`,
      description: "Confirmed savings contribution",
      userId,
      entries: [
        { accountCode: PARTNER_CLEARING_CODE, direction: "DEBIT", amountKobo: c.amountKobo },
        { accountCode: customerSavingsCode(userId), direction: "CREDIT", amountKobo: c.amountKobo },
      ],
    });
    await tx.auditLog.create({
      data: { action: "payment.confirmed", entity: "Contribution", entityId: c.id },
    });
    return "processed";
  });
}

export async function failContribution(providerReference: string): Promise<ProcessResult> {
  return db.$transaction(async (tx) => {
    const c = await loadContribution(tx, providerReference);
    if (c.status === "FAILED") return "already_processed";
    if (c.status !== "PENDING")
      throw new PaymentError("INVALID_STATE", `Cannot fail a ${c.status} contribution`);
    const claimed = await tx.contribution.updateMany({
      where: { id: c.id, status: "PENDING" },
      data: { status: "FAILED" },
    });
    if (claimed.count === 0) return "already_processed";
    await tx.auditLog.create({
      data: { action: "payment.failed", entity: "Contribution", entityId: c.id },
    });
    return "processed";
  });
}

/** Reverses a confirmed contribution with an opposite ledger transaction. Ledger rows are never edited. */
export async function reverseContribution(providerReference: string): Promise<ProcessResult> {
  return db.$transaction(async (tx) => {
    const c = await loadContribution(tx, providerReference);
    if (c.status === "REVERSED") return "already_processed";
    if (c.status !== "CONFIRMED")
      throw new PaymentError("INVALID_STATE", `Cannot reverse a ${c.status} contribution`);
    const claimed = await tx.contribution.updateMany({
      where: { id: c.id, status: "CONFIRMED" },
      data: { status: "REVERSED" },
    });
    if (claimed.count === 0) return "already_processed";

    const userId = c.goal.userId;
    await postLedger(tx, {
      reference: `contribution-reversal:${c.id}`,
      description: "Reversal of savings contribution",
      userId,
      entries: [
        { accountCode: customerSavingsCode(userId), direction: "DEBIT", amountKobo: c.amountKobo },
        { accountCode: PARTNER_CLEARING_CODE, direction: "CREDIT", amountKobo: c.amountKobo },
      ],
    });
    await tx.auditLog.create({
      data: { action: "payment.reversed", entity: "Contribution", entityId: c.id },
    });
    return "processed";
  });
}

/** Fake-money deposit for local/test only. Creates a PENDING contribution, never a balance. */
export async function createSandboxDeposit(input: {
  userId: string;
  goalId: string;
  amountNaira: number;
  idempotencyKey: string;
}): Promise<void> {
  if (!isSandboxEnabled())
    throw new PaymentError("DISABLED", "Sandbox deposits are not available here");
  const goal = await db.savingsGoal.findFirst({
    where: { id: input.goalId, userId: input.userId },
  });
  if (!goal) throw new PaymentError("NOT_FOUND", "Savings goal not found");
  if (goal.status !== "ACTIVE")
    throw new PaymentError("INVALID_STATE", "The goal must be active to deposit");
  try {
    await db.contribution.create({
      data: {
        goalId: goal.id,
        amountKobo: BigInt(input.amountNaira) * 100n,
        providerReference: `sbx_${randomUUID()}`,
        idempotencyKey: input.idempotencyKey,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return; // duplicate submit
    throw e;
  }
}

/** Confirmed savings as recorded in the ledger. This is the only source for a customer's balance. */
export async function getConfirmedBalanceKobo(userId: string): Promise<bigint> {
  const rows = await db.ledgerEntry.groupBy({
    by: ["direction"],
    where: { account: { code: customerSavingsCode(userId) } },
    _sum: { amountKobo: true },
  });
  return netBalanceKobo(
    rows.map((r) => ({ direction: r.direction, amountKobo: r._sum.amountKobo ?? 0n })),
    "CREDIT",
  );
}
