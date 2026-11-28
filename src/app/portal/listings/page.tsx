import Link from "next/link";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { db } from "@/lib/db";
import { formatDate, formatNairaShort } from "@/lib/format";
import { requireUserWithPermission } from "@/modules/identity/guards";

export const metadata = { title: "My listings" };

const LABEL: Record<string, string> = { DRAFT: "Draft", SUBMITTED: "Awaiting review", PUBLISHED: "Published", REJECTED: "Rejected", ARCHIVED: "Archived" };

export default async function ListingsPage() {
  const user = await requireUserWithPermission("listing:manage_own");
  const listings = await db.property.findMany({ where: { ownerId: user.id }, orderBy: { updatedAt: "desc" } });
  return (
    <main className="space-y-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-navy">My listings</h1>
        <Link href="/portal/listings/new" className="rounded-control bg-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy/90">New listing</Link>
      </div>
      {listings.length === 0 ? (
        <p className="text-muted">You have no listings yet.</p>
      ) : (
        <ul className="divide-y divide-line rounded-card border border-line bg-card shadow-soft">
          {listings.map((l) => (
            <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div>
                <Link href={`/portal/listings/${l.id}`} className="font-medium text-navy underline-offset-4 hover:underline">{l.title}</Link>
                <p className="text-xs text-muted">{l.city} · {formatNairaShort(l.annualRentKobo)} / year · updated {formatDate(l.updatedAt)}</p>
              </div>
              <StatusBadge status={l.listingStatus === "PUBLISHED" ? "ACTIVE" : l.listingStatus === "REJECTED" ? "FAILED" : "PENDING"} label={LABEL[l.listingStatus]} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
