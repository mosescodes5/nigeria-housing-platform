import { LEGAL_DOCUMENTS } from "@/content/legal-documents";

export const metadata = { title: "Legal & Compliance" };

export default function LegalPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-4xl font-bold text-navy">Legal &amp; Compliance Centre</h1>
      <p className="mt-3 text-muted">
        The documents below are in preparation. None has been reviewed or approved by qualified Nigerian
        legal counsel yet, and none is published. We will list each document here, with its version and
        effective date, only after approval.
      </p>
      <ul className="mt-8 divide-y divide-line rounded-card border border-line bg-card shadow-soft">
        {LEGAL_DOCUMENTS.map((d) => (
          <li key={d.slug} className="flex items-center justify-between gap-4 px-5 py-4 text-sm">
            <span className="font-medium text-ink">{d.title}</span>
            <span className="rounded-full bg-surface px-3 py-1 text-xs text-muted">Draft, pending legal review</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
