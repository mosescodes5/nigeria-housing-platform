import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { DocumentUploadForm, ListingForm, SubmitListingForm } from "@/components/portal/PortalForms";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { requireUserWithPermission } from "@/modules/identity/guards";
import { updateListingAction } from "@/modules/listings/actions";
import { canEditListing, canSubmitListing, requiredDocumentKind, type ListingStatus, type OwnerRole } from "@/modules/listings/rules";

export const metadata = { title: "Listing" };
const card = "rounded-card border border-line bg-card p-6 shadow-soft";
const STATUS_LABEL: Record<string, string> = { DRAFT: "Draft", SUBMITTED: "Awaiting review", PUBLISHED: "Published", REJECTED: "Rejected", ARCHIVED: "Archived" };
const KIND_LABEL: Record<string, string> = { OWNERSHIP_PROOF: "Proof of ownership", AUTHORITY_TO_LET: "Authority to let", ID_DOCUMENT: "Identity document", OTHER: "Other" };

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUserWithPermission("listing:manage_own");
  const listing = await db.property.findFirst({ where: { id, ownerId: user.id }, include: { documents: { orderBy: { createdAt: "desc" } } } });
  if (!listing) notFound();

  const status = listing.listingStatus as ListingStatus;
  const needed = requiredDocumentKind(user.role as OwnerRole);

  return (
    <main className="space-y-6 py-8">
      <Link href="/portal/listings" className="text-sm text-emerald underline-offset-4 hover:underline">All listings</Link>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold text-navy">{listing.title}</h1>
        <StatusBadge status={status === "PUBLISHED" ? "ACTIVE" : status === "REJECTED" ? "FAILED" : "PENDING"} label={STATUS_LABEL[status]} />
      </header>

      {listing.moderationNote ? (
        <p role="note" className="rounded-panel border border-line bg-card p-4 text-sm text-ink shadow-soft">Reviewer note: {listing.moderationNote}</p>
      ) : null}
      {status === "PUBLISHED" ? (
        <p className="text-sm text-muted">Live on the marketplace. Verification: {listing.verificationStatus === "VERIFIED" ? `verified (${listing.verificationScope})` : "not verified by the platform"}. Editing sends it back for review and hides it until approved.</p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className={`${card} lg:col-span-2`}>
          <h2 className="mb-4 font-display text-lg font-semibold text-navy">Details</h2>
          {canEditListing(status) ? (
            <ListingForm
              action={updateListingAction.bind(null, listing.id)}
              submitLabel="Save changes"
              defaults={{
                title: listing.title, description: listing.description, state: listing.state, city: listing.city,
                neighbourhood: listing.neighbourhood, type: listing.type, annualRentNaira: String(listing.annualRentKobo / 100n),
                bedrooms: listing.bedrooms, bathrooms: listing.bathrooms, features: listing.features, available: listing.available,
              }}
            />
          ) : (
            <p className="text-sm text-muted">This listing is {status === "SUBMITTED" ? "awaiting review and cannot be edited" : "archived"}.</p>
          )}
        </section>

        <div className="space-y-6">
          <section className={`${card} space-y-3`}>
            <h2 className="font-display text-lg font-semibold text-navy">Documents</h2>
            <p className="text-xs text-muted">Required: {KIND_LABEL[needed]?.toLowerCase()}. Files are private to you and the reviewing team.</p>
            <ul className="space-y-1 text-sm">
              {listing.documents.length === 0 ? <li className="text-muted">None uploaded.</li> : listing.documents.map((d) => (
                <li key={d.id} className="flex justify-between gap-2">
                  <a className="truncate text-emerald underline-offset-4 hover:underline" href={`/api/documents/${d.id}`}>{d.originalName}</a>
                  <span className="shrink-0 text-xs text-muted">{KIND_LABEL[d.kind]} · {formatDate(d.createdAt)}</span>
                </li>
              ))}
            </ul>
            <DocumentUploadForm propertyId={listing.id} kinds={Object.entries(KIND_LABEL).map(([value, label]) => ({ value, label }))} />
          </section>

          {canSubmitListing(status) ? (
            <section className={`${card} space-y-3`}>
              <h2 className="font-display text-lg font-semibold text-navy">Moderation</h2>
              <p className="text-xs text-muted">Requires a business profile, your accepted partner agreement and the required document. An administrator then reviews the listing.</p>
              <SubmitListingForm propertyId={listing.id} />
            </section>
          ) : null}
        </div>
      </div>
    </main>
  );
}
