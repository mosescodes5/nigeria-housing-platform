export const metadata = { title: "About Us" };

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-4xl font-bold text-navy">About us</h1>
      <p className="mt-4 text-muted">
        We are building a digital housing platform to make renting and, over time, home ownership
        more accessible in Nigeria: verified listings, transparent savings tools and landlord and
        agent tooling.
      </p>
      <p className="mt-4 text-muted">
        We are a technology platform. Regulated financial services will be provided only by licensed
        partners and only after the necessary approvals are in place. The platform is under
        development and the company story, team and registration details will be published here
        before launch.
      </p>
    </main>
  );
}
