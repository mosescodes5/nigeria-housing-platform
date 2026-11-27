import { describe, expect, it } from "vitest";
import { LedgerError, assertBalanced, formatNaira } from "./ledger";

describe("assertBalanced", () => {
  it("accepts a balanced transaction", () => {
    expect(() =>
      assertBalanced([
        { accountCode: "PARTNER_CLEARING", direction: "DEBIT", amountKobo: 5_000_000n },
        { accountCode: "CUSTOMER_SAVINGS", direction: "CREDIT", amountKobo: 5_000_000n },
      ]),
    ).not.toThrow();
  });

  it("rejects unbalanced transactions", () => {
    expect(() =>
      assertBalanced([
        { accountCode: "A", direction: "DEBIT", amountKobo: 100n },
        { accountCode: "B", direction: "CREDIT", amountKobo: 99n },
      ]),
    ).toThrow(LedgerError);
  });

  it("rejects single-entry and non-positive entries", () => {
    expect(() =>
      assertBalanced([{ accountCode: "A", direction: "DEBIT", amountKobo: 1n }]),
    ).toThrow(LedgerError);
    expect(() =>
      assertBalanced([
        { accountCode: "A", direction: "DEBIT", amountKobo: 0n },
        { accountCode: "B", direction: "CREDIT", amountKobo: 0n },
      ]),
    ).toThrow(LedgerError);
  });
});

describe("formatNaira", () => {
  it("formats kobo with grouping", () => {
    expect(formatNaira(150_000_000n)).toBe("₦1,500,000.00");
    expect(formatNaira(5n)).toBe("₦0.05");
    expect(formatNaira(-12_345n)).toBe("-₦123.45");
  });
});

import { customerSavingsCode, netBalanceKobo } from "./ledger";

describe("netBalanceKobo", () => {
  it("nets credits minus debits for a liability account", () => {
    const entries = [
      { direction: "CREDIT" as const, amountKobo: 500n },
      { direction: "CREDIT" as const, amountKobo: 300n },
      { direction: "DEBIT" as const, amountKobo: 200n },
    ];
    expect(netBalanceKobo(entries, "CREDIT")).toBe(600n);
    expect(netBalanceKobo([], "CREDIT")).toBe(0n);
  });
  it("builds per-customer account codes", () => {
    expect(customerSavingsCode("u1")).toBe("CUSTOMER_SAVINGS:u1");
  });
});
