import type { InputHTMLAttributes } from "react";

export function Field({
  label,
  name,
  errors,
  ...props
}: { label: string; name: string; errors?: string[] } & InputHTMLAttributes<HTMLInputElement>) {
  const errId = `${name}-error`;
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={name}
        name={name}
        aria-invalid={errors?.length ? true : undefined}
        aria-describedby={errors?.length ? errId : undefined}
        className="w-full rounded-control border border-line bg-card px-4 py-3 text-ink shadow-soft transition focus:border-emerald focus:outline-none"
        {...props}
      />
      {errors?.length ? (
        <p id={errId} className="text-sm text-red-600">
          {errors[0]}
        </p>
      ) : null}
    </div>
  );
}

export function SubmitButton({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-control bg-navy px-5 py-3 font-semibold text-white transition hover:bg-navy/90 active:scale-[0.99] disabled:opacity-60"
    >
      {pending ? "Please wait…" : children}
    </button>
  );
}
