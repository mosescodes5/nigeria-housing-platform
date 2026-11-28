import Link from "next/link";
import { db } from "@/lib/db";
import { hasPermission } from "@/modules/identity/rbac";
import { requireUserWithPermission } from "@/modules/identity/guards";

export const metadata = { title: "Admin" };
const card = "rounded-card border border-line bg-card p-6 shadow-soft transition hover:-translate-y-0.5 hover:border-navy";

export default async function AdminPage() {
  const admin = await requireUserWithPermission("users:manage");
  const [listings, businesses] = await Promise.all([
    db.property.count({ where: { listingStatus: "SUBMITTED" } }),
    db.businessProfile.count({ where: { status: "PENDING_REVIEW" } }),
  ]);
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-6 py-16">
      <h1 className="font-display text-3xl font-bold text-navy">Administration</h1>
      <p className="text-muted">Signed in as {admin.fullName}. User management, finance, compliance and reporting arrive in Phase 5.</p>
      <div className="grid gap-4 md:grid-cols-2">
        {hasPermission(admin.role, "property:moderate") ? (
          <Link href="/admin/listings" className={card}><p className="font-display text-lg font-semibold text-navy">Listing moderation</p><p className="mt-1 text-sm text-muted">{listings} awaiting review</p></Link>
        ) : null}
        {hasPermission(admin.role, "business:review") ? (
          <Link href="/admin/businesses" className={card}><p className="font-display text-lg font-semibold text-navy">Business verification</p><p className="mt-1 text-sm text-muted">{businesses} awaiting review</p></Link>
        ) : null}
      </div>
    </main>
  );
}
