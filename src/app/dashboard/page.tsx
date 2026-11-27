import Link from "next/link";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { ProgressBar } from "@/components/site/ProgressBar";
import { db } from "@/lib/db";
import { formatDate, formatNairaShort } from "@/lib/format";
import { logoutAction } from "@/modules/identity/actions";
import { requireUser } from "@/modules/identity/guards";
import { hasPermission } from "@/modules/identity/rbac";
import { getConfirmedBalanceKobo } from "@/modules/payments/service";
import { GOAL_STATUS_LABEL } from "@/modules/savings/lifecycle";
import { nextDue, planForGoal } from "@/modules/savings/plan";

export const metadata = { title: "Dashboard" };

const card = "rounded-card border border-line bg-card p-6 shadow-soft";

export default async function DashboardPage() {
  const user = await requireUser();
  const customer = hasPermission(user.role, "savings:manage_own");

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-6 py-12">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-navy">Welcome, {user.fullName}</h1>
          <p className="text-sm text-muted">Signed in as {user.role.toLowerCase()}.</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/properties"
            className="rounded-control border border-line bg-card px-4 py-2 text-sm font-medium shadow-soft transition hover:border-navy"
          >
            Explore properties
          </Link>
          <form action={logoutAction}>
            <button className="rounded-control border border-line bg-card px-4 py-2 text-sm font-medium shadow-soft transition hover:border-navy">
              Sign out
            </button>
          </form>
        </div>
      </header>

      {user.status === "PENDING_VERIFICATION" ? (
        <p className="rounded-panel border border-line bg-card p-4 text-sm text-muted shadow-soft">
          Your email is not verified yet. Email and phone verification arrives with the notification
          integrations.
        </p>
      ) : null}

      {customer ? (
        <CustomerSections userId={user.id} />
      ) : (
        <p className="text-muted">Your portal tools arrive in a later release.</p>
      )}
    </main>
  );
}

async function CustomerSections({ userId }: { userId: string }) {
  const [balanceKobo, goals, pendingAgg, recent, favourites, enquiries, viewings] =
    await Promise.all([
      getConfirmedBalanceKobo(userId),
      db.savingsGoal.findMany({
        where: { userId, status: { not: "CANCELLED" } },
        orderBy: { createdAt: "desc" },
        include: { contributions: { select: { status: true, amountKobo: true } } },
      }),
      db.contribution.aggregate({
        where: { goal: { userId }, status: "PENDING" },
        _sum: { amountKobo: true },
      }),
      db.contribution.findMany({
        where: { goal: { userId } },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      db.favourite.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { property: true },
      }),
      db.enquiry.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { property: true },
      }),
      db.viewingRequest.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { property: true },
      }),
    ]);
  const pendingKobo = pendingAgg._sum.amountKobo ?? 0n;
  const now = new Date();

  return (
    <>
      <section className="grid gap-4 md:grid-cols-2">
        <div className={card}>
          <p className="text-sm text-muted">Confirmed savings</p>
          <p className="font-display text-3xl font-bold text-navy">
            {formatNairaShort(balanceKobo)}
          </p>
          <p className="mt-1 text-xs text-muted">Only confirmed contributions count as savings.</p>
        </div>
        <div className={card}>
          <p className="text-sm text-muted">Pending contributions</p>
          <p className="font-display text-3xl font-bold text-ink">
            {formatNairaShort(pendingKobo)}
          </p>
          <p className="mt-1 text-xs text-muted">Not yet available as savings.</p>
        </div>
      </section>

      <section className={card}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-navy">Rent savings goals</h2>
          <Link
            href="/dashboard/savings/new"
            className="rounded-control bg-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy/90"
          >
            New goal
          </Link>
        </div>
        {goals.length === 0 ? (
          <p className="mt-4 text-sm text-muted">You have no savings goals yet.</p>
        ) : (
          <ul className="mt-4 space-y-5">
            {goals.map((g) => {
              const confirmed = g.contributions
                .filter((c) => c.status === "CONFIRMED")
                .reduce((s, c) => s + c.amountKobo, 0n);
              const pct = Number((confirmed * 10_000n) / g.targetKobo) / 100;
              const due = g.status === "ACTIVE" ? nextDue(planForGoal(g).schedule, now) : null;
              return (
                <li key={g.id} className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      href={`/dashboard/savings/${g.id}`}
                      className="font-medium text-navy underline-offset-4 hover:underline"
                    >
                      Target {formatNairaShort(g.targetKobo)} by {formatDate(g.targetDate)}
                    </Link>
                    <StatusBadge
                      status={g.status === "ACTIVE" ? "ACTIVE" : g.status}
                      label={GOAL_STATUS_LABEL[g.status]}
                    />
                  </div>
                  <ProgressBar percent={pct} label="Confirmed savings progress" />
                  <p className="text-xs text-muted">
                    {formatNairaShort(confirmed)} confirmed ({Math.round(pct)}%)
                    {due
                      ? ` · next contribution ${formatNairaShort(due.amountKobo)} due ${formatDate(due.dueDate)}`
                      : ""}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className={card}>
        <h2 className="font-display text-xl font-semibold text-navy">Recent transactions</h2>
        {recent.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No transactions yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-muted">
                <tr>
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {recent.map((c) => (
                  <tr key={c.id}>
                    <td className="py-2">{formatDate(c.createdAt)}</td>
                    <td className="py-2">{formatNairaShort(c.amountKobo)}</td>
                    <td className="py-2">
                      <StatusBadge status={c.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className={card}>
          <h2 className="font-display text-lg font-semibold text-navy">Saved properties</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {favourites.length === 0 ? (
              <li className="text-muted">None yet.</li>
            ) : (
              favourites.map((f) => (
                <li key={f.id}>
                  <Link
                    className="text-emerald underline-offset-4 hover:underline"
                    href={`/properties/${f.property.slug}`}
                  >
                    {f.property.title}
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
        <div className={card}>
          <h2 className="font-display text-lg font-semibold text-navy">Enquiries</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {enquiries.length === 0 ? (
              <li className="text-muted">None yet.</li>
            ) : (
              enquiries.map((e) => (
                <li key={e.id} className="text-muted">
                  <span className="text-ink">{e.property.title}</span>, {formatDate(e.createdAt)}
                </li>
              ))
            )}
          </ul>
        </div>
        <div className={card}>
          <h2 className="font-display text-lg font-semibold text-navy">Viewing requests</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {viewings.length === 0 ? (
              <li className="text-muted">None yet.</li>
            ) : (
              viewings.map((v) => (
                <li key={v.id} className="text-muted">
                  <span className="text-ink">{v.property.title}</span>, {formatDate(v.preferredAt)}{" "}
                  <StatusBadge
                    status={v.status}
                    label={
                      v.status === "REQUESTED"
                        ? "Requested"
                        : v.status.charAt(0) + v.status.slice(1).toLowerCase()
                    }
                  />
                </li>
              ))
            )}
          </ul>
        </div>
      </section>
    </>
  );
}
