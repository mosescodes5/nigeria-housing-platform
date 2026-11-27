"use client";

import { motion, useReducedMotion } from "framer-motion";

export function ProgressBar({ percent, label }: { percent: number; label: string }) {
  const reduce = useReducedMotion();
  const pct = Math.max(0, Math.min(100, percent));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      className="h-2.5 w-full overflow-hidden rounded-full bg-line"
    >
      <motion.div
        className="h-full rounded-full bg-emerald"
        initial={reduce ? false : { width: 0 }}
        whileInView={{ width: `${pct}%` }}
        animate={reduce ? { width: `${pct}%` } : undefined}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
    </div>
  );
}
