import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import CreateInviteForm from "@/components/workspace/CreateInviteForm";
import CreateTaskForm from "@/components/workspace/CreateTaskForm";

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
            <div className="space-y-2">
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
              <div className="space-y-4">
                <p className="text-sm text-text-muted">
                  Create invite links for team members to join this workspace.
                </p>

                <div className="space-y-2">
                  {workspace.invites.map((inv) => {
                    const isExpired =
                      inv.maxUses !== null && inv.useCount >= inv.maxUses;
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
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-border pt-3">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            {workspace.boards.map((board) => (
              <div
                key={board.id}
                className="bg-background border border-border rounded-xl p-4 space-y-3"
              >
                <div className="flex justify-between items-center pb-2 border-b border-border">
                  <h3 className="font-semibold text-text-main text-sm">
                    {board.name}
                  </h3>
                  <span className="text-xs px-2 py-0.5 bg-surface text-text-muted rounded-full font-medium border border-border">
                    {board.tasks.length}
                  </span>
                </div>

                <div className="space-y-2 min-h-[150px]">
                  {board.tasks.length === 0 ? (
                    <div className="flex items-center justify-center h-20 border border-dashed border-border rounded-lg">
                      <p className="text-xs text-text-muted italic">
                        No tasks yet
                      </p>
                    </div>
                  ) : (
                    board.tasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-3 bg-surface border border-border rounded-lg shadow-sm space-y-1.5"
                      >
                        <p className="text-sm font-medium text-text-main">
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-xs text-text-muted line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        {task.estimatedHours !== null && (
                          <div className="flex justify-end">
                            <span className="text-[10px] px-1.5 py-0.5 bg-background text-text-muted rounded border border-border font-mono">
                              ⏱ {task.estimatedHours}h
                            </span>
                          </div>
                        )}
                      </div>
                    ))
                  )}

                  <div className="pt-1">
                    <CreateTaskForm
                      boardId={board.id}
                      workspaceId={workspaceId}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
