import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { logoutUser } from "@/actions/auth";
import CreateWorkspaceForm from "@/components/workspace/CreateWorkspaceForm";
import Link from "next/link";
import Button from "@/components/ui/Button";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    include: {
      memberships: {
        include: {
          workspace: true,
        },
      },
    },
  });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-background">
      <div className="w-full max-w-xl p-8 bg-surface rounded-2xl shadow-xl border border-border space-y-6">
        <div className="flex justify-between items-center border-b border-border pb-4">
          <div>
            <h1 className="text-2xl font-bold text-main">Your Workspaces</h1>
            <p className="text-sm text-text-muted">
              Logged in as {user?.name || user?.email}
            </p>
          </div>
          <form action={logoutUser}>
            <Button type="submit" isCancel noShadow isSmall>
              Log Out
            </Button>
          </form>
        </div>

        <div className="space-y-3">
          {user?.memberships.length === 0 ? (
            <p className="text-sm text-text-muted italic">
              {`You don't belong to any workspaces yet. Create one below!`}
            </p>
          ) : (
            <div className="grid gap-2">
              {user?.memberships.map((membership) => (
                <div
                  key={membership.workspaceId}
                  className="flex justify-between items-center p-3 bg-background border border-border rounded-xl"
                >
                  <div>
                    <h2 className="font-semibold text-text-main">
                      {membership.workspace.name}
                    </h2>
                    <span className="text-xs px-2 py-0.5 bg-blue-50 text-main rounded-full font-medium">
                      {membership.role}
                    </span>
                  </div>
                  <Link
                    href={`/workspace/${membership.workspaceId}`}
                    className="px-3.5 py-1.5 bg-main text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Open
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border pt-4">
          <CreateWorkspaceForm />
        </div>
      </div>
    </div>
  );
}
