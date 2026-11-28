const STYLES: Record<string, string> = {
  CONFIRMED: "bg-emerald/10 text-emerald",
  ACTIVE: "bg-emerald/10 text-emerald",
  PENDING: "bg-amber-50 text-amber-700",
  FAILED: "bg-red-50 text-red-700",
  REVERSED: "bg-red-50 text-red-700",
  REFUNDED: "bg-slate-100 text-slate-700",
  DISPUTED: "bg-red-50 text-red-700",
};

const LABELS: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  FAILED: "Failed",
  REVERSED: "Reversed",
  REFUNDED: "Refunded",
  DISPUTED: "Disputed",
};

/** Always shows a text label, never colour alone. */
export function StatusBadge({ status, label }: { status: string; label?: string }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${STYLES[status] ?? "bg-surface text-muted"}`}>
      {label ?? LABELS[status] ?? status}
    </span>
  );
}
