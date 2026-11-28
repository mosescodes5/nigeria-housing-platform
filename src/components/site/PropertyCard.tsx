import Link from "next/link";
import { BathIcon, BedIcon, HeartIcon, PinIcon, ShieldCheckIcon } from "@/components/icons";
import { formatNairaShort } from "@/lib/format";
import type { FavouriteState } from "@/modules/properties/favourite-state";
import type { PropertyView } from "@/modules/properties/queries";
import { toggleFavouriteAction } from "@/modules/engagement/actions";
import { PropertyArt, slugSeed } from "./PropertyArt";

const TYPE_LABEL: Record<string, string> = {
  APARTMENT: "Apartment",
  HOUSE: "House",
  DUPLEX: "Duplex",
  BUNGALOW: "Bungalow",
  STUDIO: "Studio",
  OTHER: "Property",
};

const favClass = "absolute right-3 top-3 rounded-full bg-white/90 p-2 text-navy transition hover:scale-110 hover:text-emerald";

export function PropertyCard({ property, favourite }: { property: PropertyView; favourite: FavouriteState }) {
  return (
    <article className="group overflow-hidden rounded-card border border-line bg-card shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="relative m-3 aspect-[3/2] overflow-hidden rounded-image">
        <div className="h-full w-full transition duration-500 group-hover:scale-105">
          <PropertyArt seed={slugSeed(property.slug)} />
        </div>

        {favourite === "anon" ? (
          <Link href="/login" aria-label={`Sign in to save ${property.title}`} className={favClass}>
            <HeartIcon className="h-5 w-5" />
          </Link>
        ) : null}
        {favourite === "saved" || favourite === "unsaved" ? (
          <form action={toggleFavouriteAction.bind(null, property.id)}>
            <button
              type="submit"
              aria-pressed={favourite === "saved"}
              aria-label={favourite === "saved" ? `Remove ${property.title} from saved` : `Save ${property.title}`}
              className={`${favClass} ${favourite === "saved" ? "text-emerald" : ""}`}
            >
              <HeartIcon className="h-5 w-5" fill={favourite === "saved" ? "currentColor" : "none"} />
            </button>
          </form>
        ) : null}

        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-navy">
          Sample listing
        </span>
      </div>
      <div className="space-y-3 px-5 pb-5">
        <div className="flex items-center justify-between text-xs">
          <span className="rounded-full bg-surface px-2.5 py-1 font-medium text-muted">{TYPE_LABEL[property.type] ?? "Property"}</span>
          {property.verified ? (
            <span className="inline-flex items-center gap-1 font-medium text-emerald">
              <ShieldCheckIcon className="h-4 w-4" /> Verified
            </span>
          ) : (
            <span className="text-muted">Not yet verified</span>
          )}
        </div>
        <h3 className="font-display text-lg font-semibold text-navy">{property.title}</h3>
        <p className="flex items-center gap-1.5 text-sm text-muted">
          <PinIcon className="h-4 w-4" />
          {[property.neighbourhood, property.city].filter(Boolean).join(", ")}
        </p>
        <div className="flex items-center gap-4 text-sm text-muted">
          <span className="inline-flex items-center gap-1.5"><BedIcon className="h-4 w-4" />{property.bedrooms} bed</span>
          <span className="inline-flex items-center gap-1.5"><BathIcon className="h-4 w-4" />{property.bathrooms} bath</span>
          {!property.available ? <span className="font-medium text-ink">Not available</span> : null}
        </div>
        <div className="flex items-end justify-between pt-1">
          <p className="font-display text-xl font-bold text-ink">
            {formatNairaShort(property.annualRentKobo)}
            <span className="text-sm font-normal text-muted"> / year</span>
          </p>
          <Link href={`/properties/${property.slug}`} className="rounded-control bg-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy/90">
            View property
          </Link>
        </div>
      </div>
    </article>
  );
}
