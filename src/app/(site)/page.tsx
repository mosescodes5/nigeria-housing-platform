import Link from "next/link";
import {
  ArrowRightIcon,
  CheckIcon,
  HomeIcon,
  SearchIcon,
  ShieldCheckIcon,
  WalletIcon,
} from "@/components/icons";
import { AnimatedCounter } from "@/components/site/AnimatedCounter";
import { ProgressBar } from "@/components/site/ProgressBar";
import { PropertyCard } from "@/components/site/PropertyCard";
import { Reveal } from "@/components/site/Reveal";
import { SavingsCalculator } from "@/components/site/SavingsCalculator";
import { getCurrentUser } from "@/modules/identity/session";
import { favouriteState } from "@/modules/properties/favourite-state";
import { favouriteIdsFor, featuredProperties } from "@/modules/properties/queries";

export const dynamic = "force-dynamic";

const STATS = [
  { label: "Verified properties", value: 120 },
  { label: "Registered users", value: 850 },
  { label: "Property partners", value: 12 },
  { label: "Completed rental transactions", value: 40 },
];

const STEPS = [
  {
    title: "Find your home",
    text: "Browse listings and see exactly what has been verified.",
    Icon: SearchIcon,
  },
  {
    title: "Set your rent savings goal",
    text: "Pick a target and a date, and see the contribution you need.",
    Icon: WalletIcon,
  },
  {
    title: "Save gradually",
    text: "Track confirmed contributions as you build towards your rent.",
    Icon: ShieldCheckIcon,
  },
  {
    title: "Complete your rent payment",
    text: "Settle through an authorised financial partner, once available.",
    Icon: HomeIcon,
  },
];

const FAQ = [
  [
    "Can I save for rent on the platform today?",
    "Not yet. Real-money savings deposits stay switched off until the required legal, regulatory and partner approvals are in place. The calculator is for planning only.",
  ],
  [
    "Who will hold my savings?",
    "Regulated services will be provided by authorised financial partners, and we will name them before you pay anything. We are a technology platform and do not hold customer funds ourselves.",
  ],
  [
    "Does a savings goal reserve a property?",
    "No. A reservation needs the landlord's explicit acceptance and documented reservation terms.",
  ],
  [
    'What does "verified" mean?',
    "Each verified listing states what was actually checked. Anything else on the listing is information supplied by the owner or agent.",
  ],
  [
    "Are the listings and figures real?",
    "Listings, statistics and testimonials marked as demonstration data are illustrative while the platform is being built.",
  ],
];

export default async function HomePage() {
  const user = await getCurrentUser();
  const [featured, saved] = await Promise.all([
    featuredProperties(3),
    user ? favouriteIdsFor(user.id) : Promise.resolve(new Set<string>()),
  ]);
  return (
    <main>
      {/* Hero */}
      <section className="hero-glow relative overflow-hidden">
        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-12 lg:grid-cols-2 lg:pt-20">
          <Reveal>
            <h1 className="font-display text-5xl font-bold leading-tight tracking-tight text-navy md:text-6xl">
              Your Next Home Starts Here.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted">
              Discover verified properties, save towards your rent and make your journey to home
              ownership easier.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/properties"
                className="inline-flex items-center gap-2 rounded-control bg-navy px-6 py-3.5 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-navy/90"
              >
                Explore Properties <ArrowRightIcon className="h-5 w-5" />
              </Link>
              <Link
                href="/#rent-savings"
                className="rounded-control border border-line bg-card px-6 py-3.5 font-semibold text-navy shadow-soft transition hover:-translate-y-0.5 hover:border-navy"
              >
                Start Saving
              </Link>
            </div>
          </Reveal>

          <Reveal delay={0.15} className="relative">
            <div className="space-y-4 rounded-card border border-line bg-card/90 p-6 shadow-soft backdrop-blur">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                Demonstration preview
              </p>
              <div className="flex items-center gap-3 rounded-panel bg-surface p-4">
                <ShieldCheckIcon className="h-6 w-6 text-emerald" />
                <div>
                  <p className="text-sm font-semibold text-navy">Verified property</p>
                  <p className="text-xs text-muted">Scope of checks shown on every listing</p>
                </div>
              </div>
              <div className="rounded-panel bg-surface p-4">
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-semibold text-navy">Rent savings goal</span>
                  <span className="text-muted">40%</span>
                </div>
                <ProgressBar percent={40} label="Example savings progress" />
              </div>
              <div className="flex items-center justify-between rounded-panel bg-surface p-4 text-sm">
                <span className="text-muted">Monthly contribution target</span>
                <span className="font-display font-bold text-navy">₦250,000</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-2 gap-4 rounded-card border border-line bg-card p-6 shadow-soft md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-display text-3xl font-bold text-navy">
                <AnimatedCounter value={s.value} suffix="+" />
              </p>
              <p className="mt-1 text-sm text-muted">{s.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-muted">
          Demonstration figures. Real statistics will replace them once available.
        </p>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-6xl px-6 pt-24">
        <Reveal>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-bold text-navy">Featured properties</h2>
              <p className="mt-2 text-muted">
                Sample listings while the marketplace is being built.
              </p>
            </div>
            <Link
              href="/properties"
              className="nav-link hidden text-sm font-semibold text-navy md:block"
            >
              View all
            </Link>
          </div>
        </Reveal>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featured.length === 0 ? (
            <p className="text-muted md:col-span-3">No properties have been published yet.</p>
          ) : (
            featured.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.08}>
                <PropertyCard property={p} favourite={favouriteState(user, saved, p.id)} />
              </Reveal>
            ))
          )}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto max-w-6xl scroll-mt-24 px-6 pt-24">
        <Reveal>
          <h2 className="font-display text-3xl font-bold text-navy">How it works</h2>
        </Reveal>
        <ol className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <Reveal delay={i * 0.08} className="h-full">
                <div className="h-full rounded-card border border-line bg-card p-6 shadow-soft">
                  <span className="flex h-12 w-12 items-center justify-center rounded-control bg-emerald/10 text-emerald">
                    <s.Icon className="h-6 w-6" />
                  </span>
                  <p className="mt-4 text-xs font-semibold text-muted">Step {i + 1}</p>
                  <h3 className="font-display text-lg font-semibold text-navy">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted">{s.text}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </section>

      {/* Rent savings */}
      <section id="rent-savings" className="mx-auto max-w-6xl scroll-mt-24 px-6 pt-24">
        <Reveal>
          <h2 className="font-display text-3xl font-bold text-navy">Plan your rent savings</h2>
          <p className="mt-2 max-w-2xl text-muted">
            Work out what you would need to set aside. Savings deposits will be handled by
            authorised financial partners once the service launches, and this calculator does not
            move any money.
          </p>
        </Reveal>
        <Reveal delay={0.1} className="mt-8">
          <SavingsCalculator />
        </Reveal>
      </section>

      {/* Why us */}
      <section className="mx-auto max-w-6xl px-6 pt-24">
        <Reveal>
          <h2 className="font-display text-3xl font-bold text-navy">Why choose us</h2>
        </Reveal>
        <ul className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            "Clear verification: every listing states what was checked.",
            "Transparent charges shown before you pay.",
            "Your data is handled under Nigerian data protection requirements.",
          ].map((t, i) => (
            <li key={t}>
              <Reveal delay={i * 0.08} className="h-full">
                <div className="flex h-full gap-3 rounded-card border border-line bg-card p-6 shadow-soft">
                  <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald" />
                  <p className="text-sm text-ink">{t}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      {/* Testimonials (no fabricated quotes) */}
      <section className="mx-auto max-w-6xl px-6 pt-24">
        <Reveal>
          <h2 className="font-display text-3xl font-bold text-navy">What customers say</h2>
          <p className="mt-4 rounded-card border border-dashed border-line bg-card p-6 text-muted">
            Placeholder: genuine customer testimonials will appear here once we have them. We will
            not publish invented reviews.
          </p>
        </Reveal>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-6 pt-24">
        <Reveal>
          <h2 className="font-display text-3xl font-bold text-navy">Frequently asked questions</h2>
        </Reveal>
        <div className="mt-8 space-y-3">
          {FAQ.map(([q, a]) => (
            <details
              key={q}
              className="group rounded-panel border border-line bg-card p-5 shadow-soft"
            >
              <summary className="cursor-pointer list-none font-medium text-navy marker:hidden">
                {q}
              </summary>
              <p className="mt-3 text-sm text-muted">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-6 pt-24">
        <Reveal>
          <div className="rounded-card bg-navy px-8 py-14 text-center text-white">
            <h2 className="font-display text-3xl font-bold">Ready to find your next home?</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/80">
              Create a free account to save properties and plan your rent.
            </p>
            <Link
              href="/register"
              className="mt-6 inline-block rounded-control bg-emerald px-6 py-3.5 font-semibold text-white transition hover:-translate-y-0.5"
            >
              Get Started
            </Link>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
