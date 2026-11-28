import Link from "next/link";
import { requireUserWithPermission } from "@/modules/identity/guards";

const LINKS = [
  ["/portal", "Overview"],
  ["/portal/onboarding", "Business & agreement"],
  ["/portal/listings", "Listings"],
  ["/portal/requests", "Requests"],
];

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  await requireUserWithPermission("listing:manage_own");
  return (
    <div className="mx-auto max-w-5xl px-6 pt-8">
      <nav aria-label="Portal" className="flex flex-wrap gap-2 border-b border-line pb-4 text-sm font-medium">
        <Link href="/dashboard" className="rounded-control px-3 py-2 text-muted hover:text-navy">Account</Link>
        {LINKS.map(([href, label]) => (
          <Link key={href} href={href} className="rounded-control px-3 py-2 text-ink transition hover:bg-card">{label}</Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
