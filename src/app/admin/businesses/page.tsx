import Link from "next/link";
import { DecisionForm } from "@/components/portal/PortalForms";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { reviewBusinessAction } from "@/modules/admin/actions";
import { requireUserWithPermission } from "@/modules/identity/guards";

export const metadata = { title: "Business verification" };

export default async function AdminBusinessesPage() {
  await requireUserWithPermission("business:review");
  const pending = await db.businessProfile.findMany({
    where: { status: "PENDING_REVIEW" },
    orderBy: { updatedAt: "asc" },
    include: { user: { select: { fullName: true, email: true, role: true } } },
  });
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-6 py-12">
      <Link href="/admin" className="text-sm text-emerald underline-offset-4 hover:underline">Administration</Link>
      <h1 className="font-display text-3xl font-bold text-navy">Business verification</h1>
      <p className="text-sm text-muted">Check the person and business against independent evidence before approving. Identity and authority checks are done outside this page; record only the outcome.</p>
      {pending.length === 0 ? <p className="text-muted">Nothing is awaiting review.</p> : (
        <ul className="space-y-6">
          {pending.map((b) => (
            <li key={b.id} className="space-y-3 rounded-card border border-line bg-card p-6 shadow-soft">
              <p className="font-display text-lg font-semibold text-navy">{b.businessName}</p>
              <p className="text-sm text-muted">{b.type.toLowerCase().replaceAll("_", " ")} · {b.user.fullName} ({b.user.email}, {b.user.role.toLowerCase()}) · updated {formatDate(b.updatedAt)}</p>
              <p className="text-sm">{b.address}{b.phone ? ` · ${b.phone}` : ""}</p>
              <DecisionForm
                action={reviewBusinessAction.bind(null, b.id)}
                noteLabel="Reason (required when rejecting)"
                buttons={[{ value: "APPROVE", label: "Verify business", primary: true }, { value: "REJECT", label: "Reject" }]}
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
