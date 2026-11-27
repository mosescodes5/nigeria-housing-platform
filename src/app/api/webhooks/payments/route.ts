import { NextResponse } from "next/server";
import { REGULATED_FEATURES } from "@/lib/feature-flags";
import {
  PaymentError,
  confirmContribution,
  failContribution,
  reverseContribution,
} from "@/modules/payments/service";
import { verifySignature, webhookEventSchema } from "@/modules/payments/webhook";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // Real-money processing stays off in production until approvals are recorded.
  if (process.env.APP_ENV === "production" && !REGULATED_FEATURES.realMoneyDeposits) {
    return NextResponse.json({ error: "Not available" }, { status: 503 });
  }
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  // The signature covers the exact raw body, so read it as text before parsing.
  const raw = await req.text();
  if (!verifySignature(raw, req.headers.get("x-signature"), secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let parsed;
  try {
    parsed = webhookEventSchema.safeParse(JSON.parse(raw));
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const { event, reference } = parsed.data;
  try {
    const result =
      event === "charge.success"
        ? await confirmContribution(reference)
        : event === "charge.failed"
          ? await failContribution(reference)
          : await reverseContribution(reference);
    return NextResponse.json({ status: result });
  } catch (e) {
    if (e instanceof PaymentError) {
      const status = e.code === "NOT_FOUND" ? 404 : 409;
      return NextResponse.json({ error: e.message }, { status });
    }
    console.error("payment webhook failed"); // no payload or customer data in logs
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
