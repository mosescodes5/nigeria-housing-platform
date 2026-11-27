/**
 * Local/staging seed.
 *   Admin:  SEED_ADMIN_EMAIL=you@example.com SEED_ADMIN_PASSWORD='long-passphrase-1' npm run db:seed
 *   Demo:   SEED_DEMO_DATA=yes npm run db:seed
 * Refuses to run against production unless ALLOW_PRODUCTION_SEED=yes is set explicitly
 * (never do that for demo data).
 */
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEMO_PROPERTIES } from "../src/content/demo-properties";

const db = new PrismaClient();

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) return;
  if (password.length < 12) throw new Error("SEED_ADMIN_PASSWORD must be at least 12 characters.");
  if (await db.user.findUnique({ where: { email } })) {
    console.log("Admin seed skipped: a user with that email already exists.");
    return;
  }
  await db.user.create({
    data: {
      email,
      fullName: "Platform Administrator",
      passwordHash: await bcrypt.hash(password, 12),
      role: "ADMIN",
      status: "ACTIVE",
    },
  });
  console.log("Administrator created.");
}

async function seedDemo() {
  if (process.env.SEED_DEMO_DATA !== "yes") return;
  if (process.env.APP_ENV === "production")
    throw new Error("Demo data must never be seeded in production.");

  // Unusable random password: nobody can log in as the demo landlord.
  const owner = await db.user.upsert({
    where: { email: "demo-landlord@example.invalid" },
    update: {},
    create: {
      email: "demo-landlord@example.invalid",
      fullName: "Demo Landlord (seed data)",
      passwordHash: await bcrypt.hash(randomBytes(24).toString("hex"), 12),
      role: "LANDLORD",
      status: "ACTIVE",
    },
  });

  for (const p of DEMO_PROPERTIES) {
    const data = {
      title: p.title,
      description: p.description,
      state: p.state,
      city: p.city,
      neighbourhood: p.neighbourhood,
      type: p.type,
      annualRentKobo: p.annualRentKobo,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      available: p.available,
      features: p.features,
      listingStatus: "PUBLISHED" as const,
      verificationStatus: p.verified ? ("VERIFIED" as const) : ("UNVERIFIED" as const),
      verificationScope: p.verificationScope,
    };
    await db.property.upsert({
      where: { slug: p.slug },
      update: data,
      create: { slug: p.slug, ownerId: owner.id, ...data },
    });
  }

  // SANDBOX ONLY: placeholder legal versions so consent and goal activation can be exercised locally.
  // These are NOT legal text and never pass through the real approval workflow.
  const docs = [
    ["terms-and-conditions", "Terms and Conditions"],
    ["privacy-policy", "Privacy Policy"],
    ["rent-savings-agreement", "Rent Savings Agreement"],
  ] as const;
  for (const [slug, title] of docs) {
    const doc = await db.legalDocument.upsert({
      where: { slug },
      update: {},
      create: { slug, title },
    });
    await db.legalDocumentVersion.upsert({
      where: { documentId_version: { documentId: doc.id, version: 1 } },
      update: {},
      create: {
        documentId: doc.id,
        version: 1,
        status: "PUBLISHED",
        contentMd: "SANDBOX PLACEHOLDER. Not legal text. Replace via the legal approval workflow.",
        effectiveDate: new Date(),
        publishedAt: new Date(),
      },
    });
  }
  console.log("Demo data seeded.");
}

async function main() {
  if (process.env.APP_ENV === "production" && process.env.ALLOW_PRODUCTION_SEED !== "yes") {
    throw new Error(
      "Refusing to seed production. Set ALLOW_PRODUCTION_SEED=yes to override deliberately.",
    );
  }
  if (!process.env.SEED_ADMIN_EMAIL && process.env.SEED_DEMO_DATA !== "yes") {
    throw new Error(
      "Nothing to do. Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD, and/or SEED_DEMO_DATA=yes.",
    );
  }
  await seedAdmin();
  await seedDemo();
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
