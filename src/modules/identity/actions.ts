"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { hashPassword, verifyAgainstDummy, verifyPassword } from "./password";
import { RateLimiter } from "./rate-limit";
import { createSession, destroySession, getCurrentUser } from "./session";
import { loginSchema, registerSchema } from "./validation";

export type FormState =
  { error?: string; fieldErrors?: Record<string, string[] | undefined> } | undefined;

const registerLimiter = new RateLimiter(5, 60 * 60 * 1000);
const loginLimiter = new RateLimiter(5, 15 * 60 * 1000);

// Assumes the deployment sits behind a trusted proxy that sets x-forwarded-for. Verify per host.
async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

const REQUIRED_CONSENT_SLUGS = ["terms-and-conditions", "privacy-policy"] as const;

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    password: formData.get("password"),
    role: formData.get("role"),
    acceptTerms: formData.get("acceptTerms") === "on",
    acceptPrivacy: formData.get("acceptPrivacy") === "on",
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const ip = await clientIp();
  const limit = registerLimiter.check(`register:${ip}`);
  if (!limit.allowed) return { error: "Too many attempts. Please try again later." };

  // Consent must point at the exact published document versions the person accepted.
  const published = await db.legalDocumentVersion.findMany({
    where: { status: "PUBLISHED", document: { slug: { in: [...REQUIRED_CONSENT_SLUGS] } } },
    orderBy: { version: "desc" },
    include: { document: true },
  });
  const latest = new Map<string, string>();
  for (const v of published) if (!latest.has(v.document.slug)) latest.set(v.document.slug, v.id);

  const consentsAvailable = REQUIRED_CONSENT_SLUGS.every((s) => latest.has(s));
  if (!consentsAvailable && process.env.APP_ENV === "production") {
    return { error: "Registration is not available yet." };
  }

  const { fullName, email, phone, password, role } = parsed.data;
  const passwordHash = await hashPassword(password);

  try {
    await db.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { fullName, email, phone, passwordHash, role } });
      if (consentsAvailable) {
        await tx.consentRecord.createMany({
          data: [
            { userId: user.id, versionId: latest.get("terms-and-conditions")!, kind: "TERMS" },
            { userId: user.id, versionId: latest.get("privacy-policy")!, kind: "PRIVACY_NOTICE" },
          ],
        });
      }
      await tx.auditLog.create({
        data: { actorId: user.id, action: "auth.register", entity: "User", entityId: user.id },
      });
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "We could not create an account with those details." };
    }
    throw e;
  }

  const created = await db.user.findUniqueOrThrow({ where: { email } });
  await createSession(created.id);
  redirect("/dashboard");
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  const generic = { error: "Incorrect email or password." };
  if (!parsed.success) return generic;

  const { email, password } = parsed.data;
  const ip = await clientIp();
  const limit = loginLimiter.check(`login:${ip}:${email}`);
  if (!limit.allowed) return { error: "Too many attempts. Please try again later." };

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    await verifyAgainstDummy(password);
    return generic;
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok || user.status === "SUSPENDED") return generic;

  await createSession(user.id);
  await db.auditLog.create({
    data: { actorId: user.id, action: "auth.login", entity: "User", entityId: user.id },
  });
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  const user = await getCurrentUser();
  await destroySession();
  if (user) {
    await db.auditLog.create({
      data: { actorId: user.id, action: "auth.logout", entity: "User", entityId: user.id },
    });
  }
  redirect("/login");
}
