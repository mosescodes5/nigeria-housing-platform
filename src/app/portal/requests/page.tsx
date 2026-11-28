import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { DecisionForm } from "@/components/portal/PortalForms";
import { db } from "@/lib/db";
import { formatDate, formatDateTime } from "@/lib/format";
import { requireUserWithPermission } from "@/modules/identity/guards";
import { decideApplicationAction, respondToViewingAction } from "@/modules/requests/actions";

export const metadata = { title: "Requests" };
const card = "rounded-card border border-line bg-card p-6 shadow-soft";

export default async function RequestsPage() {
  const user = await requireUserWithPermission("listing:manage_own");
  const owned = { property: { ownerId: user.id } };
  const person = { select: { fullName: true, email: true } };
  const [viewings, applications, enquiries] = await Promise.all([
    db.viewingRequest.findMany({ where: owned, orderBy: { createdAt: "desc" }, take: 50, include: { user: person, property: { select: { title: true } } } }),
    db.rentalApplication.findMany({ where: owned, orderBy: { createdAt: "desc" }, take: 50, include: { user: person, property: { select: { title: true } } } }),
    db.enquiry.findMany({ where: owned, orderBy: { createdAt: "desc" }, take: 50, include: { user: person, property: { select: { title: true } } } }),
  ]);

  return (
    <main className="space-y-6 py-8">
      <h1 className="font-display text-3xl font-bold text-navy">Requests</h1>
      <p className="text-sm text-muted">Contact details are shown only so you can respond to people who contacted you about your listings. Use them for that purpose only.</p>

      <section className={card}>
        <h2 className="font-display text-lg font-semibold text-navy">Viewing requests</h2>
        <ul className="mt-4 space-y-5">
          {viewings.length === 0 ? <li className="text-sm text-muted">None yet.</li> : viewings.map((v) => (
            <li key={v.id} className="space-y-2 text-sm">
              <p><span className="font-medium text-ink">{v.property.title}</span>: {v.user.fullName} ({v.user.email}) wants {formatDateTime(v.preferredAt)}</p>
              {v.note ? <p className="text-muted">Note: {v.note}</p> : null}
              {v.status === "REQUESTED" ? (
                <DecisionForm action={respondToViewingAction.bind(null, v.id)} buttons={[{ value: "CONFIRMED", label: "Confirm", primary: true }, { value: "DECLINED", label: "Decline" }]} />
              ) : <StatusBadge status={v.status === "CONFIRMED" ? "ACTIVE" : "FAILED"} label={v.status === "CONFIRMED" ? "Confirmed" : v.status.charAt(0) + v.status.slice(1).toLowerCase()} />}
            </li>
          ))}
        </ul>
      </section>

      <section className={card}>
        <h2 className="font-display text-lg font-semibold text-navy">Rental applications</h2>
        <p className="mt-1 text-xs text-muted">Approving an application does not reserve the property. Reservations need separate documented terms.</p>
        <ul className="mt-4 space-y-5">
          {applications.length === 0 ? <li className="text-sm text-muted">None yet.</li> : applications.map((a) => (
            <li key={a.id} className="space-y-2 text-sm">
              <p><span className="font-medium text-ink">{a.property.title}</span>: {a.user.fullName} ({a.user.email}), {formatDate(a.createdAt)}</p>
              <p className="text-muted">{a.message}</p>
              {a.status === "SUBMITTED" ? (
                <DecisionForm action={decideApplicationAction.bind(null, a.id)} buttons={[{ value: "APPROVED", label: "Approve", primary: true }, { value: "REJECTED", label: "Reject" }]} />
              ) : <StatusBadge status={a.status === "APPROVED" ? "ACTIVE" : "FAILED"} label={a.status.charAt(0) + a.status.slice(1).toLowerCase()} />}
            </li>
          ))}
        </ul>
      </section>

      <section className={card}>
        <h2 className="font-display text-lg font-semibold text-navy">Enquiries</h2>
        <p className="mt-1 text-xs text-muted">Replies from the platform arrive with the email integration. Until then, contact the person directly.</p>
        <ul className="mt-4 space-y-4 text-sm">
          {enquiries.length === 0 ? <li className="text-muted">None yet.</li> : enquiries.map((e) => (
            <li key={e.id}><p><span className="font-medium text-ink">{e.property.title}</span>: {e.user.fullName} ({e.user.email}), {formatDate(e.createdAt)}</p><p className="text-muted">{e.message}</p></li>
          ))}
        </ul>
      </section>
    </main>
  );
}
