import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
  });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 bg-background">
      <div className="w-full max-w-2xl p-8 bg-surface rounded-2xl shadow-xl border border-border">
        <h1 className="text-3xl font-bold text-main mb-2">Dashboard</h1>
        <p className="text-text-muted mb-6">
          Welcome back, {user?.name || user?.email}!
        </p>

        <div className="p-4 bg-background rounded-xl border border-border">
          <p className="text-sm text-text-muted">
            Session active. Your User ID is:{" "}
            <span className="font-mono text-text-main">{user?.id}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
