import Link from "next/link";
import { DecisionForm } from "@/components/portal/PortalForms";
import { db } from "@/lib/db";
import { formatDate, formatNairaShort } from "@/lib/format";
import { moderateListingAction } from "@/modules/admin/actions";
import { requireUserWithPermission } from "@/modules/identity/guards";
import { approvalBlockers, type DocumentKind, type OwnerRole } from "@/modules/listings/rules";

export const metadata = { title: "Listing moderation" };

export default async function AdminListingsPage() {
  await requireUserWithPermission("property:moderate");
  const queue = await db.property.findMany({
    where: { listingStatus: "SUBMITTED" },
    orderBy: { submittedAt: "asc" },
    include: { owner: { include: { businessProfile: true } }, documents: true },
  });

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-6 py-12">
      <Link href="/admin" className="text-sm text-emerald underline-offset-4 hover:underline">Administration</Link>
      <h1 className="font-display text-3xl font-bold text-navy">Listing moderation</h1>
      {queue.length === 0 ? <p className="text-muted">Nothing is awaiting review.</p> : (
        <ul className="space-y-6">
          {queue.map((p) => {
            const blockers = approvalBlockers({
              ownerRole: p.owner.role as OwnerRole,
              businessStatus: p.owner.businessProfile?.status ?? null,
              documentKinds: p.documents.map((d) => d.kind as DocumentKind),
            });
            return (
              <li key={p.id} className="space-y-3 rounded-card border border-line bg-card p-6 shadow-soft">
                <div>
                  <p className="font-display text-lg font-semibold text-navy">{p.title}</p>
                  <p className="text-sm text-muted">{p.neighbourhood ? `${p.neighbourhood}, ` : ""}{p.city}, {p.state} · {formatNairaShort(p.annualRentKobo)} / year · submitted {p.submittedAt ? formatDate(p.submittedAt) : "n/a"}</p>
                  <p className="mt-1 text-sm text-muted">Owner: {p.owner.fullName} ({p.owner.role.toLowerCase()}), business {p.owner.businessProfile ? `${p.owner.businessProfile.businessName} (${p.owner.businessProfile.status.toLowerCase().replace("_", " ")})` : "not set up"}</p>
                </div>
                <p className="text-sm text-ink">{p.description}</p>
                <ul className="text-sm">
                  {p.documents.length === 0 ? <li className="text-muted">No documents.</li> : p.documents.map((d) => (
                    <li key={d.id}><a className="text-emerald underline-offset-4 hover:underline" href={`/api/documents/${d.id}`}>{d.originalName}</a> <span className="text-muted">({d.kind.toLowerCase().replaceAll("_", " ")})</span></li>
                  ))}
                </ul>
                {blockers.length ? <p role="note" className="rounded-panel bg-surface p-3 text-sm text-ink">Cannot approve yet: {blockers.join(" ")}</p> : null}
                <DecisionForm
                  action={moderateListingAction.bind(null, p.id)}
                  scopeLabel="Verification scope: what you actually checked (leave blank to publish as unverified)"
                  noteLabel="Reason (required when rejecting)"
                  buttons={[{ value: "APPROVE", label: "Approve and publish", primary: true }, { value: "REJECT", label: "Reject" }]}
                />
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
