import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-card">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-display text-lg font-bold text-navy">Housing Platform</p>
          <p className="mt-3 max-w-md text-sm text-muted">
            Property discovery and structured rent savings for Nigeria. We are a technology
            platform. Any regulated financial services are provided by authorised partners.
          </p>
        </div>
        <FooterColumn
          title="Platform"
          links={[
            ["Explore Properties", "/properties"],
            ["How It Works", "/#how-it-works"],
            ["Rent Savings", "/#rent-savings"],
          ]}
        />
        <FooterColumn
          title="Company"
          links={[
            ["About Us", "/about"],
            ["Contact", "/contact"],
            ["Legal & Compliance", "/legal"],
          ]}
        />
      </div>
      <div className="border-t border-line px-6 py-6 text-center text-xs text-muted">
        Rent savings deposits, financing and mortgage services are not yet available. Figures and
        listings marked as demonstration data are illustrative only.
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="text-sm font-semibold text-ink">{title}</p>
      <ul className="mt-3 space-y-2 text-sm text-muted">
        {links.map(([label, href]) => (
          <li key={href}>
            <Link href={href} className="transition hover:text-navy">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
