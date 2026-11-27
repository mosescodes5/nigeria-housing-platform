/** Money is always integer kobo (bigint). Never use floating point for money. */
export type Direction = "DEBIT" | "CREDIT";

export interface EntryInput {
  accountCode: string;
  direction: Direction;
  amountKobo: bigint;
}

export class LedgerError extends Error {}

/** Validates a double-entry transaction before it is allowed anywhere near the database. */
export function assertBalanced(entries: readonly EntryInput[]): void {
  if (entries.length < 2) {
    throw new LedgerError("A ledger transaction needs at least two entries");
  }
  let debits = 0n;
  let credits = 0n;
  for (const e of entries) {
    if (e.amountKobo <= 0n) {
      throw new LedgerError("Entry amounts must be positive");
    }
    if (e.direction === "DEBIT") debits += e.amountKobo;
    else credits += e.amountKobo;
  }
  if (debits !== credits) {
    throw new LedgerError(`Unbalanced transaction: debits ${debits} != credits ${credits}`);
  }
}

/** Format kobo as Nigerian Naira for display. */
export function formatNaira(kobo: bigint): string {
  const negative = kobo < 0n;
  const abs = negative ? -kobo : kobo;
  const naira = abs / 100n;
  const rem = (abs % 100n).toString().padStart(2, "0");
  const grouped = naira.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${negative ? "-" : ""}₦${grouped}.${rem}`;
}

/** Net balance of an account: entries on its normal side minus entries on the opposite side. */
export function netBalanceKobo(
  entries: readonly { direction: Direction; amountKobo: bigint }[],
  normalSide: Direction,
): bigint {
  let net = 0n;
  for (const e of entries) net += e.direction === normalSide ? e.amountKobo : -e.amountKobo;
  return net;
}

export const PARTNER_CLEARING_CODE = "PARTNER_CLEARING";
export const customerSavingsCode = (userId: string) => `CUSTOMER_SAVINGS:${userId}`;
