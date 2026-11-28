// Integration tests: need a migrated PostgreSQL (DATABASE_URL). Run with `npm run test:integration`.
import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  PaymentError,
  confirmContribution,
  createSandboxDeposit,
  failContribution,
  getConfirmedBalanceKobo,
  reverseContribution,
} from "./service";

beforeAll(() => {
  process.env.APP_ENV = "test";
});

async function setup() {
  const user = await db.user.create({
    data: { email: `t-${randomUUID()}@example.test`, fullName: "Test User", passwordHash: "x", role: "TENANT" },
  });
  const goal = await db.savingsGoal.create({
    data: { userId: user.id, targetKobo: 300_000_000n, targetDate: new Date(Date.UTC(2028, 0, 1)), frequency: "MONTHLY", status: "ACTIVE" },
  });
  const deposit = async (amountNaira = 50_000) => {
    await createSandboxDeposit({ userId: user.id, goalId: goal.id, amountNaira, idempotencyKey: randomUUID() });
    return db.contribution.findFirstOrThrow({ where: { goalId: goal.id }, orderBy: { createdAt: "desc" } });
  };
  return { user, goal, deposit };
}

describe("contribution processing", () => {
  it("keeps unconfirmed deposits out of the balance", async () => {
    const { user, deposit } = await setup();
    await deposit();
    expect(await getConfirmedBalanceKobo(user.id)).toBe(0n);
  });

  it("confirms once, posts a balanced ledger transaction and ignores duplicate callbacks", async () => {
    const { user, deposit } = await setup();
    const c = await deposit(50_000);
    expect(await confirmContribution(c.providerReference)).toBe("processed");
    expect(await confirmContribution(c.providerReference)).toBe("already_processed");
    expect(await getConfirmedBalanceKobo(user.id)).toBe(5_000_000n);

    const tx = await db.ledgerTransaction.findMany({ where: { reference: `contribution:${c.id}` }, include: { entries: true } });
    expect(tx).toHaveLength(1);
    const debit = tx[0]!.entries.filter((e) => e.direction === "DEBIT").reduce((s, e) => s + e.amountKobo, 0n);
    const credit = tx[0]!.entries.filter((e) => e.direction === "CREDIT").reduce((s, e) => s + e.amountKobo, 0n);
    expect(debit).toBe(credit);
  });

  it("handles concurrent duplicate callbacks without double-crediting", async () => {
    const { user, deposit } = await setup();
    const c = await deposit(20_000);
    const results = await Promise.allSettled(Array.from({ length: 5 }, () => confirmContribution(c.providerReference)));
    expect(results.every((r) => r.status === "fulfilled")).toBe(true);
    expect(await getConfirmedBalanceKobo(user.id)).toBe(2_000_000n);
  });

  it("does not allow confirming a failed contribution", async () => {
    const { deposit } = await setup();
    const c = await deposit();
    await failContribution(c.providerReference);
    await expect(confirmContribution(c.providerReference)).rejects.toThrow(PaymentError);
  });

  it("reverses a confirmed contribution and returns the balance to zero", async () => {
    const { user, deposit } = await setup();
    const c = await deposit(10_000);
    await confirmContribution(c.providerReference);
    expect(await reverseContribution(c.providerReference)).toBe("processed");
    expect(await reverseContribution(c.providerReference)).toBe("already_processed");
    expect(await getConfirmedBalanceKobo(user.id)).toBe(0n);
  });

  it("deduplicates sandbox deposits with the same idempotency key", async () => {
    const { user, goal } = await setup();
    const key = randomUUID();
    await createSandboxDeposit({ userId: user.id, goalId: goal.id, amountNaira: 5_000, idempotencyKey: key });
    await createSandboxDeposit({ userId: user.id, goalId: goal.id, amountNaira: 5_000, idempotencyKey: key });
    expect(await db.contribution.count({ where: { goalId: goal.id } })).toBe(1);
  });

  it("refuses to deposit into another customer's goal", async () => {
    const { goal } = await setup();
    const other = await setup();
    await expect(
      createSandboxDeposit({ userId: other.user.id, goalId: goal.id, amountNaira: 5_000, idempotencyKey: randomUUID() }),
    ).rejects.toThrow(PaymentError);
  });
});
