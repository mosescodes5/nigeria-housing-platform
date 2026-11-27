import { randomUUID } from "node:crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import {
  ActivateGoalForm,
  CancelGoalForm,
  SandboxDepositForm,
} from "@/components/dashboard/SavingsForms";
import { ProgressBar } from "@/components/site/ProgressBar";
import { db } from "@/lib/db";
import { formatDate, formatNairaShort } from "@/lib/format";
import { requireUserWithPermission } from "@/modules/identity/guards";
import { isSandboxEnabled } from "@/modules/payments/service";
import { sandboxConfirmAction } from "@/modules/savings/actions";
import { GOAL_STATUS_LABEL } from "@/modules/savings/lifecycle";
import { planForGoal } from "@/modules/savings/plan";

export const metadata = { title: "Savings goal" };

const card = "rounded-card border border-line bg-card p-6 shadow-soft";

export default async function GoalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUserWithPermission("savings:manage_own");
  // Ownership is part of the query: another customer's goal simply does not exist for this user.
  const goal = await db.savingsGoal.findFirst({
    where: { id, userId: user.id },
    include: { contributions: { orderBy: { createdAt: "desc" } } },
  });
  if (!goal) notFound();

  const { plan, schedule } = planForGoal(goal);
  const sum = (status: string) =>
    goal.contributions.filter((c) => c.status === status).reduce((s, c) => s + c.amountKobo, 0n);
  const confirmed = sum("CONFIRMED");
  const pending = sum("PENDING");
  const pct = Number((confirmed * 10_000n) / goal.targetKobo) / 100;
  const sandbox = isSandboxEnabled();

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-6 py-12">
      <Link href="/dashboard" className="text-sm text-emerald underline-offset-4 hover:underline">
        Back to dashboard
      </Link>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold text-navy">
          {formatNairaShort(goal.targetKobo)} by {formatDate(goal.targetDate)}
        </h1>
        <StatusBadge status={goal.status} label={GOAL_STATUS_LABEL[goal.status]} />
      </header>

      <section className={card}>
        <ProgressBar percent={pct} label="Confirmed savings progress" />
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted">Confirmed</dt>
            <dd className="font-display text-xl font-bold text-navy">
              {formatNairaShort(confirmed)}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Pending (not yet savings)</dt>
            <dd className="font-display text-xl font-bold text-ink">{formatNairaShort(pending)}</dd>
          </div>
          <div>
            <dt className="text-muted">Planned contribution</dt>
            <dd className="font-display text-xl font-bold text-ink">
              {formatNairaShort(plan.contributionKobo)}{" "}
              {goal.frequency === "MONTHLY" ? "monthly" : "weekly"}
            </dd>
          </div>
        </dl>
      </section>

      {goal.status === "DRAFT" ? (
        <section className={`${card} space-y-4`}>
          <h2 className="font-display text-lg font-semibold text-navy">Activate this goal</h2>
          <p className="text-sm text-muted">
            Activating records your acceptance of the Rent Savings Agreement. Review the agreement
            in the Legal &amp; Compliance Centre first.
          </p>
          <ActivateGoalForm goalId={goal.id} />
        </section>
      ) : null}

      {goal.status === "ACTIVE" && !sandbox ? (
        <p className="rounded-panel border border-line bg-card p-4 text-sm text-muted shadow-soft">
          Deposits are not available yet. They will be enabled only after legal, regulatory and
          partner approvals.
        </p>
      ) : null}

      {goal.status === "ACTIVE" && sandbox ? (
        <section className={`${card} space-y-3`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
            Sandbox only: fake money, local/test environments
          </p>
          <SandboxDepositForm goalId={goal.id} idempotencyKey={randomUUID()} />
        </section>
      ) : null}

      <section className={card}>
        <h2 className="font-display text-lg font-semibold text-navy">Contribution history</h2>
        {goal.contributions.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No contributions yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-muted">
                <tr>
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {goal.contributions.map((c) => (
                  <tr key={c.id}>
                    <td className="py-2">{formatDate(c.createdAt)}</td>
                    <td className="py-2">{formatNairaShort(c.amountKobo)}</td>
                    <td className="py-2">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="py-2">
                      {sandbox && c.status === "PENDING" ? (
                        <form action={sandboxConfirmAction.bind(null, c.id)}>
                          <button className="text-xs font-medium text-emerald underline-offset-4 hover:underline">
                            Simulate partner confirmation (sandbox)
                          </button>
                        </form>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className={card}>
        <h2 className="font-display text-lg font-semibold text-navy">Savings schedule</h2>
        <p className="mt-1 text-xs text-muted">
          Planning dates only. They do not create automatic payments.
        </p>
        <ol className="mt-3 max-h-64 space-y-1 overflow-y-auto text-sm">
          {schedule.map((s) => (
            <li key={s.number} className="flex justify-between">
              <span className="text-muted">
                #{s.number} · {formatDate(s.dueDate)}
              </span>
              <span>{formatNairaShort(s.amountKobo)}</span>
            </li>
          ))}
        </ol>
      </section>

      {goal.status === "DRAFT" || goal.status === "ACTIVE" ? (
        <CancelGoalForm goalId={goal.id} />
      ) : null}
    </main>
  );
}
