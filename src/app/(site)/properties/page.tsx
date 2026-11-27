import { PropertyCard } from "@/components/site/PropertyCard";
import { getCurrentUser } from "@/modules/identity/session";
import { favouriteState } from "@/modules/properties/favourite-state";
import { parseFilters } from "@/modules/properties/filter";
import { favouriteIdsFor, listProperties } from "@/modules/properties/queries";

export const dynamic = "force-dynamic";

export const metadata = { title: "Explore Properties" };

const inputClass =
  "w-full rounded-control border border-line bg-card px-3 py-2.5 text-sm focus:border-emerald focus:outline-none";

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const user = await getCurrentUser();
  const [results, saved] = await Promise.all([
    listProperties(filters),
    user ? favouriteIdsFor(user.id) : Promise.resolve(new Set<string>()),
  ]);
  const val = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="font-display text-4xl font-bold text-navy">Explore properties</h1>
      <p className="mt-2 text-muted">Sample listings while the marketplace is being built.</p>

      <form
        method="get"
        className="mt-8 grid gap-3 rounded-card border border-line bg-card p-5 shadow-soft md:grid-cols-4"
      >
        <div className="md:col-span-2">
          <label htmlFor="q" className="text-xs font-medium text-muted">
            Location or neighbourhood
          </label>
          <input
            id="q"
            name="q"
            defaultValue={val("q")}
            placeholder="e.g. Lekki, Abuja"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="min" className="text-xs font-medium text-muted">
            Min annual rent (₦)
          </label>
          <input
            id="min"
            name="min"
            inputMode="numeric"
            defaultValue={val("min")}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="max" className="text-xs font-medium text-muted">
            Max annual rent (₦)
          </label>
          <input
            id="max"
            name="max"
            inputMode="numeric"
            defaultValue={val("max")}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="type" className="text-xs font-medium text-muted">
            Type
          </label>
          <select id="type" name="type" defaultValue={val("type")} className={inputClass}>
            <option value="">Any</option>
            {["APARTMENT", "HOUSE", "DUPLEX", "BUNGALOW", "STUDIO", "OTHER"].map((t) => (
              <option key={t} value={t}>
                {t.charAt(0) + t.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="beds" className="text-xs font-medium text-muted">
            Min bedrooms
          </label>
          <input
            id="beds"
            name="beds"
            inputMode="numeric"
            defaultValue={val("beds")}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="baths" className="text-xs font-medium text-muted">
            Min bathrooms
          </label>
          <input
            id="baths"
            name="baths"
            inputMode="numeric"
            defaultValue={val("baths")}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="sort" className="text-xs font-medium text-muted">
            Sort by
          </label>
          <select id="sort" name="sort" defaultValue={val("sort")} className={inputClass}>
            <option value="newest">Newest</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="verified"
            value="1"
            defaultChecked={val("verified") === "1"}
            className="h-4 w-4 accent-emerald"
          />{" "}
          Verified only
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="available"
            value="1"
            defaultChecked={val("available") === "1"}
            className="h-4 w-4 accent-emerald"
          />{" "}
          Available only
        </label>
        <button className="rounded-control bg-navy px-5 py-2.5 font-semibold text-white transition hover:bg-navy/90 md:col-start-4">
          Search
        </button>
      </form>

      <p className="mt-6 text-sm text-muted" aria-live="polite">
        {results.length} {results.length === 1 ? "property" : "properties"} found
      </p>
      <div className="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {results.map((p) => (
          <PropertyCard key={p.id} property={p} favourite={favouriteState(user, saved, p.id)} />
        ))}
      </div>
    </main>
  );
}
