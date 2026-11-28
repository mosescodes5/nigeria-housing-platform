import Link from "next/link";
import { AgreementForm, BusinessForm } from "@/components/portal/PortalForms";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { db } from "@/lib/db";
import { agreementFor, allowedBusinessTypes, type PartnerRole } from "@/modules/business/rules";
import { requireUserWithPermission } from "@/modules/identity/guards";

export const metadata = { title: "Business & agreement" };
const card = "rounded-card border border-line bg-card p-6 shadow-soft";
const TYPE_LABELS: Record<string, string> = {
  INDIVIDUAL_LANDLORD: "Individual landlord",
  ESTATE_AGENT: "Estate agent",
  REAL_ESTATE_COMPANY: "Real estate company",
};

export default async function OnboardingPage() {
  const user = await requireUserWithPermission("listing:manage_own");
  const role = user.role as PartnerRole;
  const { slug, kind } = agreementFor(role);
  const [business, version] = await Promise.all([
    db.businessProfile.findUnique({ where: { userId: user.id } }),
    db.legalDocumentVersion.findFirst({ where: { status: "PUBLISHED", document: { slug } }, orderBy: { version: "desc" } }),
  ]);
  const accepted = version
    ? await db.consentRecord.findFirst({ where: { userId: user.id, versionId: version.id, kind, withdrawnAt: null } })
    : null;
  const agreementLabel = role === "LANDLORD" ? "Landlord Agreement" : "Agent Agreement";

  return (
    <main className="space-y-6 py-8">
      <h1 className="font-display text-3xl font-bold text-navy">Business &amp; agreement</h1>

      <section className={`${card} space-y-4`}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-navy">Business details</h2>
          {business ? <StatusBadge status={business.status === "VERIFIED" ? "ACTIVE" : business.status === "REJECTED" ? "FAILED" : "PENDING"} label={business.status === "VERIFIED" ? "Verified" : business.status === "REJECTED" ? "Rejected" : "Pending review"} /> : null}
        </div>
        <p className="text-sm text-muted">An administrator reviews these details before your listings can be published. Changing your name or type sends them for review again.</p>
        <BusinessForm
          types={allowedBusinessTypes(role).map((t) => ({ value: t, label: TYPE_LABELS[t]! }))}
          defaults={business ?? undefined}
        />
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className="font-display text-lg font-semibold text-navy">{agreementLabel}</h2>
        {!version ? (
          <p className="text-sm text-muted">This agreement has not been published yet. You can prepare listings, but you cannot submit them until you have accepted it.</p>
        ) : accepted ? (
          <p className="text-sm text-emerald">You have accepted the current agreement (version {version.version}).</p>
        ) : (
          <>
            <p className="text-sm text-muted">Read the agreement in the <Link href="/legal" className="text-emerald underline-offset-4 hover:underline">Legal &amp; Compliance Centre</Link>, then accept it below.</p>
            <AgreementForm label={agreementLabel} />
          </>
        )}
      </section>
    </main>
  );
}
