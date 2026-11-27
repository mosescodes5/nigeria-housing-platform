"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { LIMITS, calculateSavingsPlan, type Frequency } from "@/modules/savings/calculator";
import { formatNaira } from "@/modules/ledger/ledger";
import { ProgressBar } from "./ProgressBar";

export function SavingsCalculator() {
  const [target, setTarget] = useState("3000000");
  const [months, setMonths] = useState("12");
  const [frequency, setFrequency] = useState<Frequency>("MONTHLY");

  const result = useMemo(() => {
    try {
      return {
        plan: calculateSavingsPlan({
          targetNaira: Number(target),
          months: Number(months),
          frequency,
        }),
      };
    } catch (e) {
      return { error: e instanceof RangeError ? e.message : "Check your inputs" };
    }
  }, [target, months, frequency]);

  const inputClass =
    "w-full rounded-control border border-line bg-card px-4 py-3 text-ink focus:border-emerald focus:outline-none";

  return (
    <div className="grid gap-8 rounded-card border border-line bg-card p-6 shadow-soft md:grid-cols-2 md:p-8">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="calc-target" className="text-sm font-medium">
            Target rent (₦)
          </label>
          <input
            id="calc-target"
            inputMode="numeric"
            value={target}
            onChange={(e) => setTarget(e.target.value.replace(/\D/g, ""))}
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="calc-months" className="text-sm font-medium">
            Savings duration (months)
          </label>
          <input
            id="calc-months"
            inputMode="numeric"
            value={months}
            onChange={(e) => setMonths(e.target.value.replace(/\D/g, ""))}
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="calc-frequency" className="text-sm font-medium">
            Contribution frequency
          </label>
          <select
            id="calc-frequency"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as Frequency)}
            className={inputClass}
          >
            <option value="MONTHLY">Monthly</option>
            <option value="WEEKLY">Weekly</option>
          </select>
        </div>
        <p className="text-xs text-muted">
          Supported: ₦{LIMITS.minTargetNaira.toLocaleString("en-NG")} to ₦
          {LIMITS.maxTargetNaira.toLocaleString("en-NG")}, up to {LIMITS.maxMonths} months.
        </p>
      </div>

      <div
        className="flex flex-col justify-between gap-6 rounded-panel bg-surface p-6"
        aria-live="polite"
      >
        {"plan" in result && result.plan ? (
          <>
            <div>
              <p className="text-sm text-muted">You would set aside about</p>
              <p className="font-display text-4xl font-bold text-navy">
                {formatNaira(result.plan.contributionKobo).replace(/\.00$/, "")}
              </p>
              <p className="text-sm text-muted">
                {frequency === "MONTHLY" ? "each month" : "each week"} for {result.plan.periods}{" "}
                {frequency === "MONTHLY" ? "months" : "weeks"}
              </p>
            </div>
            <div className="space-y-2">
              <ProgressBar
                percent={100 / result.plan.periods}
                label="Progress after the first contribution"
              />
              <p className="text-xs text-muted">
                Illustration: progress after your first contribution is confirmed.
              </p>
            </div>
          </>
        ) : (
          <p className="text-sm text-red-600">{"error" in result ? result.error : ""}</p>
        )}
        <Link
          href="/register"
          className="rounded-control bg-emerald px-5 py-3 text-center font-semibold text-white transition hover:-translate-y-0.5 hover:brightness-95"
        >
          Start saving
        </Link>
      </div>
    </div>
  );
}
