import { requireUserWithPermission } from "@/modules/identity/guards";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
  const admin = await requireUserWithPermission("users:manage");
  return (
    <main className="mx-auto max-w-3xl space-y-4 px-6 py-16">
      <h1 className="font-display text-3xl font-bold text-navy">Administration</h1>
      <p className="text-muted">Signed in as {admin.fullName}. Admin modules arrive in Phase 5.</p>
    </main>
  );
}
