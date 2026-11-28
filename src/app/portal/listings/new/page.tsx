import Link from "next/link";
import { ListingForm } from "@/components/portal/PortalForms";
import { db } from "@/lib/db";
import { requireUserWithPermission } from "@/modules/identity/guards";
import { createListingAction } from "@/modules/listings/actions";

export const metadata = { title: "New listing" };

export default async function NewListingPage() {
  const user = await requireUserWithPermission("listing:manage_own");
  const business = await db.businessProfile.findUnique({ where: { userId: user.id }, select: { id: true } });
  return (
    <main className="space-y-6 py-8">
      <h1 className="font-display text-3xl font-bold text-navy">New listing</h1>
      {!business ? (
        <p className="rounded-panel border border-line bg-card p-4 text-sm text-muted shadow-soft">
          Complete your <Link href="/portal/onboarding" className="text-emerald underline-offset-4 hover:underline">business profile</Link> before creating listings.
        </p>
      ) : (
        <div className="max-w-2xl"><ListingForm action={createListingAction} submitLabel="Create draft" /></div>
      )}
    </main>
  );
}
