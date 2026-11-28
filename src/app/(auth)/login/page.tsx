import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { getCurrentUser } from "@/modules/identity/session";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6">
      <h1 className="font-display text-3xl font-bold text-navy">Sign in</h1>
      <LoginForm />
      <p className="text-sm text-muted">
        New here?{" "}
        <Link href="/register" className="font-medium text-emerald underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </main>
  );
}
