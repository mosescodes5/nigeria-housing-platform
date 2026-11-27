import { formatNaira } from "@/modules/ledger/ledger";

/** ₦1,500,000 (drops ".00"), keeps kobo when present. */
export const formatNairaShort = (kobo: bigint) => formatNaira(kobo).replace(/\.00$/, "");

export const formatDate = (d: Date) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Lagos",
  }).format(d);

export const formatDateTime = (d: Date) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  }).format(d);
