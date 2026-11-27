import Link from "next/link";
import { notFound } from "next/navigation";
import { BathIcon, BedIcon, CheckIcon, PinIcon, ShieldCheckIcon } from "@/components/icons";
import { EnquiryForm, ViewingForm } from "@/components/dashboard/EngagementForms";
import { PropertyArt, slugSeed } from "@/components/site/PropertyArt";
import { formatNairaShort } from "@/lib/format";
import { hasPermission } from "@/modules/identity/rbac";
import { getCurrentUser } from "@/modules/identity/session";
import { getPublishedPropertyBySlug, similarProperties } from "@/modules/properties/queries";

export const dynamic = "force-dynamic";

export default async function PropertyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getPublishedPropertyBySlug(slug);
  if (!p) notFound();
  const [user, similar] = await Promise.all([getCurrentUser(), similarProperties(p)]);
  const canEngage = user ? hasPermission(user.role, "property:enquire") : false;

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <p className="mb-4 text-xs font-medium uppercase tracking-wide text-muted">Sample listing</p>
      <div className="aspect-[16/7] overflow-hidden rounded-card">
        <PropertyArt seed={slugSeed(p.slug)} />
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <div>
            <h1 className="font-display text-3xl font-bold text-navy">{p.title}</h1>
            <p className="mt-2 flex items-center gap-1.5 text-muted">
              <PinIcon className="h-4 w-4" />
              {[p.neighbourhood, p.city, p.state].filter(Boolean).join(", ")}
            </p>
            <p className="mt-3 flex gap-5 text-sm text-muted">
              <span className="inline-flex items-center gap-1.5">
                <BedIcon className="h-4 w-4" />
                {p.bedrooms} bedrooms
              </span>
              <span className="inline-flex items-center gap-1.5">
                <BathIcon className="h-4 w-4" />
                {p.bathrooms} bathrooms
              </span>
              <span>{p.available ? "Available" : "Not currently available"}</span>
            </p>
          </div>

          <section className="rounded-panel border border-line bg-card p-5 shadow-soft">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-navy">
              <ShieldCheckIcon className="h-5 w-5 text-emerald" />
              Verification
            </h2>
            <p className="mt-2 text-sm text-muted">
              {p.verified && p.verificationScope
                ? `Checked by the platform: ${p.verificationScope}.`
                : "This listing has not been verified by the platform."}
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-navy">About this property</h2>
            <p className="mt-2 text-muted">{p.description}</p>
            <p className="mt-1 text-xs text-muted">
              Description and features are supplied by the owner or agent and are not verified by
              the platform.
            </p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {p.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <CheckIcon className="h-4 w-4 text-emerald" />
                  {f}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="h-fit space-y-5 rounded-card border border-line bg-card p-6 shadow-soft">
          <p className="font-display text-2xl font-bold text-ink">
            {formatNairaShort(p.annualRentKobo)}
            <span className="text-sm font-normal text-muted"> / year</span>
          </p>
          <p className="text-xs text-muted">
            Applicable fees will be itemised on the live listing before any payment.
          </p>
          {!user ? (
            <>
              <Link
                href="/login"
                className="block rounded-control bg-navy px-5 py-3 text-center font-semibold text-white transition hover:bg-navy/90"
              >
                Sign in to enquire
              </Link>
              <Link
                href="/register"
                className="block rounded-control border border-line px-5 py-3 text-center font-semibold text-navy transition hover:border-navy"
              >
                Create an account
              </Link>
            </>
          ) : canEngage && p.available ? (
            <>
              <EnquiryForm propertyId={p.id} />
              <hr className="border-line" />
              <ViewingForm propertyId={p.id} />
            </>
          ) : canEngage ? (
            <p className="text-sm text-muted">
              This property is not currently available for enquiries.
            </p>
          ) : (
            <p className="text-sm text-muted">
              Enquiries are available to tenant and buyer accounts.
            </p>
          )}
        </aside>
      </div>

      {similar.length ? (
        <section className="mt-12">
          <h2 className="font-display text-xl font-semibold text-navy">Similar properties</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {similar.map((s) => (
              <li key={s.id}>
                <Link
                  className="text-emerald underline-offset-4 hover:underline"
                  href={`/properties/${s.slug}`}
                >
                  {s.title}, {s.neighbourhood}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
