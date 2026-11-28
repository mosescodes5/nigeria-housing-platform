"use client";

import { useActionState } from "react";
import { Field, SubmitButton } from "@/components/auth/Field";
import { FormMessage } from "@/components/dashboard/FormMessage";
import type { FormState } from "@/lib/form-state";
import { NIGERIAN_STATES } from "@/content/nigerian-states";
import { acceptPartnerAgreementAction, saveBusinessProfileAction } from "@/modules/business/actions";
import { submitListingAction, uploadDocumentAction } from "@/modules/listings/actions";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

const selectClass =
  "w-full rounded-control border border-line bg-card px-4 py-3 text-ink shadow-soft focus:border-emerald focus:outline-none";

export function BusinessForm({
  types,
  defaults,
}: {
  types: { value: string; label: string }[];
  defaults?: { businessName: string; type: string; phone: string | null; address: string };
}) {
  const [state, action, pending] = useActionState(saveBusinessProfileAction, undefined);
  const fe = state?.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      <Field label="Business or trading name" name="businessName" defaultValue={defaults?.businessName} required errors={fe.businessName} />
      <div className="space-y-1.5">
        <label htmlFor="type" className="text-sm font-medium">Business type</label>
        <select id="type" name="type" defaultValue={defaults?.type ?? types[0]?.value} className={selectClass}>
          {types.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
        </select>
        {fe.type?.[0] ? <p className="text-sm text-red-600">{fe.type[0]}</p> : null}
      </div>
      <Field label="Phone (optional)" name="phone" type="tel" defaultValue={defaults?.phone ?? ""} errors={fe.phone} />
      <Field label="Business or contact address" name="address" defaultValue={defaults?.address} required errors={fe.address} />
      <FormMessage state={state} />
      <SubmitButton pending={pending}>Save business details</SubmitButton>
    </form>
  );
}

export function AgreementForm({ label }: { label: string }) {
  const [state, action, pending] = useActionState(acceptPartnerAgreementAction, undefined);
  return (
    <form action={action} className="space-y-3">
      {/* Never pre-ticked. */}
      <label className="flex items-start gap-3 text-sm text-muted">
        <input type="checkbox" name="acceptAgreement" className="mt-1 h-4 w-4 accent-emerald" />
        <span>I accept the {label}.</span>
      </label>
      <FormMessage state={state} />
      <SubmitButton pending={pending}>Accept agreement</SubmitButton>
    </form>
  );
}

export interface ListingDefaults {
  title: string; description: string; state: string; city: string; neighbourhood: string | null;
  type: string; annualRentNaira: string; bedrooms: number; bathrooms: number; features: string[]; available: boolean;
}

export function ListingForm({ action: serverAction, defaults, submitLabel }: { action: Action; defaults?: ListingDefaults; submitLabel: string }) {
  const [state, action, pending] = useActionState(serverAction, undefined);
  const fe = state?.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      <Field label="Listing title" name="title" defaultValue={defaults?.title} required errors={fe.title} />
      <div className="space-y-1.5">
        <label htmlFor="description" className="text-sm font-medium">Description</label>
        <textarea id="description" name="description" rows={5} defaultValue={defaults?.description} required className={selectClass} />
        {fe.description?.[0] ? <p className="text-sm text-red-600">{fe.description[0]}</p> : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="state" className="text-sm font-medium">State</label>
          <select id="state" name="state" defaultValue={defaults?.state ?? "Lagos"} className={selectClass}>
            {NIGERIAN_STATES.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
          {fe.state?.[0] ? <p className="text-sm text-red-600">{fe.state[0]}</p> : null}
        </div>
        <Field label="City" name="city" defaultValue={defaults?.city} required errors={fe.city} />
        <Field label="Neighbourhood (optional)" name="neighbourhood" defaultValue={defaults?.neighbourhood ?? ""} errors={fe.neighbourhood} />
        <div className="space-y-1.5">
          <label htmlFor="type" className="text-sm font-medium">Property type</label>
          <select id="type" name="type" defaultValue={defaults?.type ?? "APARTMENT"} className={selectClass}>
            {["APARTMENT", "HOUSE", "DUPLEX", "BUNGALOW", "STUDIO", "OTHER"].map((t) => (<option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>))}
          </select>
        </div>
        <Field label="Annual rent (₦)" name="annualRentNaira" inputMode="numeric" defaultValue={defaults?.annualRentNaira} required errors={fe.annualRentNaira} />
        <Field label="Bedrooms" name="bedrooms" inputMode="numeric" defaultValue={defaults?.bedrooms ?? 1} required errors={fe.bedrooms} />
        <Field label="Bathrooms" name="bathrooms" inputMode="numeric" defaultValue={defaults?.bathrooms ?? 1} required errors={fe.bathrooms} />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="features" className="text-sm font-medium">Features (comma or line separated)</label>
        <textarea id="features" name="features" rows={3} defaultValue={defaults?.features.join(", ")} className={selectClass} />
      </div>
      <label className="flex items-center gap-3 text-sm">
        <input type="checkbox" name="available" defaultChecked={defaults?.available ?? true} className="h-4 w-4 accent-emerald" />
        Currently available
      </label>
      <FormMessage state={state} />
      <SubmitButton pending={pending}>{submitLabel}</SubmitButton>
    </form>
  );
}

export function DocumentUploadForm({ propertyId, kinds }: { propertyId: string; kinds: { value: string; label: string }[] }) {
  const [state, action, pending] = useActionState(uploadDocumentAction.bind(null, propertyId), undefined);
  return (
    <form action={action} className="space-y-3">
      <div className="space-y-1.5">
        <label htmlFor="kind" className="text-sm font-medium">Document type</label>
        <select id="kind" name="kind" className={selectClass}>{kinds.map((k) => (<option key={k.value} value={k.value}>{k.label}</option>))}</select>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="file" className="text-sm font-medium">File (PDF, JPEG or PNG, max 5 MB)</label>
        <input id="file" name="file" type="file" accept="application/pdf,image/jpeg,image/png" required className="block w-full text-sm" />
      </div>
      <FormMessage state={state} />
      <SubmitButton pending={pending}>Upload document</SubmitButton>
    </form>
  );
}

export function SubmitListingForm({ propertyId }: { propertyId: string }) {
  const [state, action, pending] = useActionState(submitListingAction.bind(null, propertyId), undefined);
  return (
    <form action={action} className="space-y-3">
      <FormMessage state={state} />
      <SubmitButton pending={pending}>Submit for moderation</SubmitButton>
    </form>
  );
}

/** One form, several decision buttons. The clicked button's value is sent as `decision`. */
export function DecisionForm({
  action: serverAction,
  buttons,
  noteLabel,
  scopeLabel,
}: {
  action: Action;
  buttons: { value: string; label: string; primary?: boolean }[];
  noteLabel?: string;
  scopeLabel?: string;
}) {
  const [state, action, pending] = useActionState(serverAction, undefined);
  return (
    <form action={action} className="space-y-2">
      {scopeLabel ? (
        <input name="verificationScope" placeholder={scopeLabel} aria-label={scopeLabel} className={`${selectClass} text-sm`} />
      ) : null}
      {noteLabel ? (
        <input name="note" placeholder={noteLabel} aria-label={noteLabel} className={`${selectClass} text-sm`} />
      ) : null}
      <div className="flex flex-wrap gap-2">
        {buttons.map((b) => (
          <button
            key={b.value}
            name="decision"
            value={b.value}
            disabled={pending}
            className={`rounded-control px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${b.primary ? "bg-navy text-white hover:bg-navy/90" : "border border-line bg-card text-ink hover:border-navy"}`}
          >
            {b.label}
          </button>
        ))}
      </div>
      <FormMessage state={state} />
    </form>
  );
}
