"use client";

import { useActionState } from "react";
import { loginAction } from "@/modules/identity/actions";
import { Field, SubmitButton } from "./Field";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, undefined);
  return (
    <form action={action} className="space-y-4" noValidate>
      <Field label="Email" name="email" type="email" autoComplete="email" required />
      <Field label="Password" name="password" type="password" autoComplete="current-password" required />
      {state?.error ? (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      ) : null}
      <SubmitButton pending={pending}>Sign in</SubmitButton>
    </form>
  );
}
