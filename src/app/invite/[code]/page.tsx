import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

interface InvitePageProps {
  params: Promise<{ code: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { code } = await params;
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const invite = await db.invite.findUnique({
    where: { code },
    include: { workspace: true },
  });

  if (!invite) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-background">
        <div className="p-8 bg-surface rounded-2xl shadow-xl border border-border text-center space-y-4 max-w-md w-full">
          <h1 className="text-xl font-bold text-error">Invalid Invite Link</h1>
          <p className="text-sm text-text-muted">
            This invite link does not exist or has been deleted.
          </p>
          <Link
            href="/dashboard"
            className="inline-block w-full py-2 bg-main text-white rounded-lg text-sm font-medium"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (invite.maxUses !== null && invite.useCount >= invite.maxUses) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-background">
        <div className="p-8 bg-surface rounded-2xl shadow-xl border border-border text-center space-y-4 max-w-md w-full">
          <h1 className="text-xl font-bold text-error">Invite Expired</h1>
          <p className="text-sm text-text-muted">
            This invite link has reached its maximum number of uses and is no
            longer valid.
          </p>
          <Link
            href="/dashboard"
            className="inline-block w-full py-2 bg-main text-white rounded-lg text-sm font-medium"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const existingMember = await db.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId: session.userId,
        workspaceId: invite.workspaceId,
      },
    },
  });

  if (!existingMember) {
    await db.$transaction([
      db.workspaceMember.create({
        data: {
          userId: session.userId,
          workspaceId: invite.workspaceId,
          role: "MEMBER",
        },
      }),
      db.invite.update({
        where: { id: invite.id },
        data: { useCount: { increment: 1 } },
      }),
    ]);
  }

  redirect(`/workspace/${invite.workspaceId}`);
}
