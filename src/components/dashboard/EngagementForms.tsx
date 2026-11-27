"use client";

import { useActionState } from "react";
import { requestViewingAction, submitEnquiryAction } from "@/modules/engagement/actions";
import { Field, SubmitButton } from "@/components/auth/Field";
import { FormMessage } from "./FormMessage";

export function EnquiryForm({ propertyId }: { propertyId: string }) {
  const [state, action, pending] = useActionState(
    submitEnquiryAction.bind(null, propertyId),
    undefined,
  );
  return (
    <form action={action} className="space-y-3" noValidate>
      <label htmlFor="message" className="text-sm font-medium">
        Send an enquiry
      </label>
      <textarea
        id="message"
        name="message"
        rows={4}
        required
        aria-invalid={state?.fieldErrors?.message ? true : undefined}
        className="w-full rounded-control border border-line bg-card px-4 py-3 text-sm focus:border-emerald focus:outline-none"
      />
      {state?.fieldErrors?.message?.[0] ? (
        <p className="text-sm text-red-600">{state.fieldErrors.message[0]}</p>
      ) : null}
      <FormMessage state={state} />
      <SubmitButton pending={pending}>Send enquiry</SubmitButton>
    </form>
  );
}

export function ViewingForm({ propertyId }: { propertyId: string }) {
  const [state, action, pending] = useActionState(
    requestViewingAction.bind(null, propertyId),
    undefined,
  );
  return (
    <form action={action} className="space-y-3" noValidate>
      <Field
        label="Preferred viewing time (Nigerian time)"
        name="preferredAt"
        type="datetime-local"
        required
        errors={state?.fieldErrors?.preferredAt}
      />
      <Field label="Note (optional)" name="note" errors={state?.fieldErrors?.note} />
      <FormMessage state={state} />
      <SubmitButton pending={pending}>Request viewing</SubmitButton>
    </form>
  );
}
