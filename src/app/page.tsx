import { ShieldCheckIcon } from "@/components/icons";

// Phase 1 placeholder. The full public website is built in Phase 2.
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-6 px-6">
      <span className="inline-flex w-fit items-center gap-2 rounded-control border border-line bg-card px-3 py-1.5 text-sm text-muted shadow-soft">
        <ShieldCheckIcon className="h-4 w-4 text-emerald" />
        Foundation build
      </span>
      <h1 className="font-display text-5xl font-bold tracking-tight text-navy">
        Your Next Home Starts Here.
      </h1>
      <p className="text-lg text-muted">
        Discover verified properties, save towards your rent and make your journey to home ownership
        easier.
      </p>
    </main>
  );
}
