import { z } from "zod";

// Server-side environment validation. Never import this from client components.
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_ENV: z.enum(["local", "test", "staging", "production"]).default("local"),
  APP_URL: z.string().url(),
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
  PAYMENT_PROVIDER_SECRET_KEY: z.string().optional(),
  PAYMENT_WEBHOOK_SECRET: z.string().optional(),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

export function getEnv(): Env {
  if (!cached) {
    const parsed = schema.safeParse(process.env);
    if (!parsed.success) {
      // Report variable names only, never values.
      const names = parsed.error.issues.map((i) => i.path.join("."));
      throw new Error(`Invalid environment configuration: ${names.join(", ")}`);
    }
    cached = parsed.data;
  }
  return cached;
}
