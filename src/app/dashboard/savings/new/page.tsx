import { CreateGoalForm } from "@/components/dashboard/SavingsForms";
import { requireUserWithPermission } from "@/modules/identity/guards";

export const metadata = { title: "New savings goal" };

export default async function NewGoalPage() {
  await requireUserWithPermission("savings:manage_own");
  return (
    <main className="mx-auto max-w-md space-y-6 px-6 py-12">
      <h1 className="font-display text-3xl font-bold text-navy">New rent savings goal</h1>
      <p className="text-sm text-muted">
        A goal helps you plan. It does not reserve any property, and nothing is deposited until the goal is
        activated and deposits are available.
      </p>
      <CreateGoalForm />
    </main>
  );
}
