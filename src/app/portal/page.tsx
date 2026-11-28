import Link from "next/link";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { db } from "@/lib/db";
import { agreementFor, type PartnerRole } from "@/modules/business/rules";
import { requireUserWithPermission } from "@/modules/identity/guards";

export const metadata = { title: "Partner portal" };
const card = "rounded-card border border-line bg-card p-6 shadow-soft";

export default async function PortalHome() {
  const user = await requireUserWithPermission("listing:manage_own");
  const [business, consent, byStatus, pendingViewings, openApplications, enquiryCount] = await Promise.all([
    db.businessProfile.findUnique({ where: { userId: user.id } }),
    db.consentRecord.findFirst({ where: { userId: user.id, kind: agreementFor(user.role as PartnerRole).kind, withdrawnAt: null } }),
    db.property.groupBy({ by: ["listingStatus"], where: { ownerId: user.id }, _count: true }),
    db.viewingRequest.count({ where: { status: "REQUESTED", property: { ownerId: user.id } } }),
    db.rentalApplication.count({ where: { status: "SUBMITTED", property: { ownerId: user.id } } }),
    db.enquiry.count({ where: { property: { ownerId: user.id } } }),
  ]);
  const counts = Object.fromEntries(byStatus.map((g) => [g.listingStatus, g._count]));

  return (
    <main className="space-y-6 py-8">
      <h1 className="font-display text-3xl font-bold text-navy">Partner portal</h1>

      {!business || !consent || business.status !== "VERIFIED" ? (
        <section className={card}>
          <h2 className="font-display text-lg font-semibold text-navy">Finish onboarding</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>Business profile: {business ? <StatusBadge status={business.status === "VERIFIED" ? "ACTIVE" : business.status === "REJECTED" ? "FAILED" : "PENDING"} label={business.status === "VERIFIED" ? "Verified" : business.status === "REJECTED" ? "Rejected" : "Pending review"} /> : "not started"}</li>
            <li>Partner agreement: {consent ? "accepted" : "not accepted"}</li>
          </ul>
          {business?.status === "REJECTED" && business.reviewNote ? <p className="mt-2 text-sm text-muted">Reviewer note: {business.reviewNote}</p> : null}
          <Link href="/portal/onboarding" className="mt-4 inline-block rounded-control bg-navy px-4 py-2 text-sm font-semibold text-white">Open onboarding</Link>
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        {[
          ["Published", counts.PUBLISHED ?? 0], ["Awaiting review", counts.SUBMITTED ?? 0],
          ["Drafts", counts.DRAFT ?? 0], ["Rejected", counts.REJECTED ?? 0],
        ].map(([label, n]) => (
          <div key={label as string} className={card}><p className="text-sm text-muted">{label}</p><p className="font-display text-3xl font-bold text-navy">{n}</p></div>
        ))}
      </section>

      <section className={card}>
        <h2 className="font-display text-lg font-semibold text-navy">Needs your attention</h2>
        <p className="mt-2 text-sm text-muted">{pendingViewings} viewing requests, {openApplications} open applications, {enquiryCount} enquiries in total.</p>
        <Link href="/portal/requests" className="mt-3 inline-block text-sm font-semibold text-emerald underline-offset-4 hover:underline">Open requests</Link>
      </section>
    </main>
  );
}
