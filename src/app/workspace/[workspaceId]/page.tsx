import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import CreateInviteForm from "@/components/workspace/CreateInviteForm";
import KanbanBoard from "@/components/workspace/KanbanBoard";
import { deleteInvite } from "@/actions/invite";

interface WorkspacePageProps {
  params: Promise<{ workspaceId: string }>;
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { workspaceId } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const membership = await db.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId: session.userId,
        workspaceId,
      },
    },
    include: {
      workspace: {
        include: {
          members: { include: { user: true } },
          invites: true,
          boards: {
            orderBy: { position: "asc" },
            include: {
              tasks: {
                orderBy: { position: "asc" },
                include: {
                  assignee: {
                    select: { name: true, email: true },
                  },
                  comments: {
                    orderBy: { createdAt: "asc" },
                    include: {
                      user: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!membership) {
    redirect("/dashboard");
  }

  const { workspace } = membership;
  const isAdmin = membership.role === "ADMIN";

  return (
    <div className="flex min-h-screen flex-col items-center p-6 bg-background">
      <div className="w-full max-w-4xl space-y-6">
        <div className="flex justify-between items-center bg-surface p-6 rounded-2xl shadow-xl border border-border">
          <div>
            <Link
              href="/dashboard"
              className="text-xs text-main hover:underline font-medium mb-1 inline-block"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-main">{workspace.name}</h1>
          </div>
          <span className="px-3 py-1 bg-blue-50 text-main text-sm font-semibold rounded-full border border-border">
            Role: {membership.role}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface p-6 rounded-2xl shadow-xl border border-border space-y-4">
            <h2 className="text-xl font-bold text-text-main">
              Workspace Members
            </h2>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {workspace.members.map((m) => (
                <div
                  key={m.id}
                  className="flex justify-between items-center p-3 bg-background border border-border rounded-xl"
                >
                  <div>
                    <p className="font-semibold text-text-main">
                      {m.user.name || "Unnamed User"}
                    </p>
                    <p className="text-xs text-text-muted">{m.user.email}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-text-muted rounded-full font-medium">
                    {m.role}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface p-6 rounded-2xl shadow-xl border border-border space-y-4">
            <h2 className="text-xl font-bold text-text-main">Invite Links</h2>

            {isAdmin ? (
              <div className={`${workspace.invites.length > 0 && "space-y-4"}`}>
                <p className="text-sm text-text-muted">
                  Create invite links for team members to join this workspace.
                </p>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {workspace.invites.map((inv) => {
                    const isExpired =
                      inv.maxUses !== null && inv.useCount >= inv.maxUses;

                    const deleteInviteAction = deleteInvite.bind(
                      null,
                      inv.id,
                      workspace.id,
                    );

                    return (
                      <div
                        key={inv.id}
                        className="p-3 bg-background border border-border rounded-xl flex justify-between items-center"
                      >
                        <div>
                          <span className="font-mono text-xs text-main bg-blue-50 px-2 py-1 rounded border border-border">
                            /invite/{inv.code}
                          </span>
                          <p className="text-xs text-text-muted mt-1">
                            Uses: {inv.useCount}{" "}
                            {inv.maxUses ? `/ ${inv.maxUses}` : ""}{" "}
                            {isExpired && "• (Expired)"}
                          </p>
                        </div>
                        <form action={deleteInviteAction}>
                          <button
                            type="submit"
                            className="px-2.5 py-1 text-xs text-error hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors rounded-lg font-medium cursor-pointer"
                          >
                            Delete
                          </button>
                        </form>
                      </div>
                    );
                  })}
                </div>

                <div
                  className={`${workspace.invites.length > 0 && "border-t border-border pt-3"}`}
                >
                  <CreateInviteForm workspaceId={workspace.id} />
                </div>
              </div>
            ) : (
              <p className="text-sm text-text-muted italic">
                Only workspace admins can view and create invite links.
              </p>
            )}
          </div>
        </div>
        <div className="bg-surface p-6 rounded-2xl shadow-xl border border-border space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-text-main">Project Boards</h2>
          </div>
          <KanbanBoard
            boards={workspace.boards}
            workspaceId={workspaceId}
            members={workspace.members}
            currentUserId={session.userId}
            isAdmin={isAdmin}
          />
        </div>
      </div>
    </div>
  );
}
