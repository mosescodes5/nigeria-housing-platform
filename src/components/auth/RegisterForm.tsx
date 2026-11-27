"use client";

import { useActionState } from "react";
import { registerAction } from "@/modules/identity/actions";
import { Field, SubmitButton } from "./Field";

const ROLE_OPTIONS = [
  { value: "TENANT", label: "Tenant looking to rent" },
  { value: "BUYER", label: "Prospective homebuyer" },
  { value: "LANDLORD", label: "Landlord" },
  { value: "AGENT", label: "Estate agent" },
];

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, undefined);
  const fe = state?.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      <Field label="Full name" name="fullName" autoComplete="name" required errors={fe.fullName} />
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        errors={fe.email}
      />
      <Field
        label="Phone (optional)"
        name="phone"
        type="tel"
        autoComplete="tel"
        placeholder="0803 000 0000"
        errors={fe.phone}
      />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        errors={fe.password}
      />
      <div className="space-y-1.5">
        <label htmlFor="role" className="text-sm font-medium text-ink">
          I am a
        </label>
        <select
          id="role"
          name="role"
          defaultValue="TENANT"
          className="w-full rounded-control border border-line bg-card px-4 py-3 text-ink shadow-soft focus:border-emerald focus:outline-none"
        >
          {ROLE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {fe.role?.[0] ? <p className="text-sm text-red-600">{fe.role[0]}</p> : null}
      </div>

      {/* Consent boxes are never pre-ticked. */}
      <label className="flex items-start gap-3 text-sm text-muted">
        <input type="checkbox" name="acceptTerms" className="mt-1 h-4 w-4 accent-emerald" />
        <span>I accept the Terms and Conditions.</span>
      </label>
      {fe.acceptTerms?.[0] ? <p className="text-sm text-red-600">{fe.acceptTerms[0]}</p> : null}
      <label className="flex items-start gap-3 text-sm text-muted">
        <input type="checkbox" name="acceptPrivacy" className="mt-1 h-4 w-4 accent-emerald" />
        <span>I have read the Privacy Notice.</span>
      </label>
      {fe.acceptPrivacy?.[0] ? <p className="text-sm text-red-600">{fe.acceptPrivacy[0]}</p> : null}

      {state?.error ? (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      ) : null}
      <SubmitButton pending={pending}>Create account</SubmitButton>
    </form>
  );
}
