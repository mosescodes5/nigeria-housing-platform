import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { getCurrentUser } from "@/modules/identity/session";

export const metadata = { title: "Create account" };

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-10">
      <h1 className="font-display text-3xl font-bold text-navy">Create your account</h1>
      <RegisterForm />
      <p className="text-sm text-muted">
        Already registered?{" "}
        <Link href="/login" className="font-medium text-emerald underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}
