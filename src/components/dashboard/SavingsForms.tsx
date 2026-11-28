"use client";

import { useActionState } from "react";
import { Field, SubmitButton } from "@/components/auth/Field";
import { activateGoalAction, cancelGoalAction, createGoalAction, sandboxDepositAction } from "@/modules/savings/actions";
import { FormMessage } from "./FormMessage";

export function CreateGoalForm() {
  const [state, action, pending] = useActionState(createGoalAction, undefined);
  const fe = state?.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      <Field label="Rent target (₦)" name="targetNaira" inputMode="numeric" required errors={fe.targetNaira} />
      <Field label="Target date" name="targetDate" type="date" required errors={fe.targetDate} />
      <div className="space-y-1.5">
        <label htmlFor="frequency" className="text-sm font-medium">Contribution frequency</label>
        <select id="frequency" name="frequency" defaultValue="MONTHLY" className="w-full rounded-control border border-line bg-card px-4 py-3 shadow-soft focus:border-emerald focus:outline-none">
          <option value="MONTHLY">Monthly</option>
          <option value="WEEKLY">Weekly</option>
        </select>
      </div>
      <FormMessage state={state} />
      <SubmitButton pending={pending}>Create goal</SubmitButton>
    </form>
  );
}

export function ActivateGoalForm({ goalId }: { goalId: string }) {
  const [state, action, pending] = useActionState(activateGoalAction.bind(null, goalId), undefined);
  return (
    <form action={action} className="space-y-3">
      {/* Never pre-ticked. */}
      <label className="flex items-start gap-3 text-sm text-muted">
        <input type="checkbox" name="acceptAgreement" className="mt-1 h-4 w-4 accent-emerald" />
        <span>I accept the Rent Savings Agreement.</span>
      </label>
      <FormMessage state={state} />
      <SubmitButton pending={pending}>Activate goal</SubmitButton>
    </form>
  );
}

export function CancelGoalForm({ goalId }: { goalId: string }) {
  const [state, action, pending] = useActionState(cancelGoalAction.bind(null, goalId), undefined);
  return (
    <form action={action} className="space-y-2">
      <FormMessage state={state} />
      <button disabled={pending} className="rounded-control border border-line bg-card px-4 py-2 text-sm font-medium text-ink transition hover:border-red-400 disabled:opacity-60">
        Cancel goal
      </button>
    </form>
  );
}

export function SandboxDepositForm({ goalId, idempotencyKey }: { goalId: string; idempotencyKey: string }) {
  const [state, action, pending] = useActionState(sandboxDepositAction.bind(null, goalId), undefined);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <Field label="Sandbox deposit amount (₦)" name="amountNaira" inputMode="numeric" defaultValue="50000" errors={state?.fieldErrors?.amountNaira} />
      <FormMessage state={state} />
      <SubmitButton pending={pending}>Create sandbox deposit</SubmitButton>
    </form>
  );
}
