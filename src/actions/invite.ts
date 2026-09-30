"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createInvite(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const workspaceId = formData.get("workspaceId") as string;
  const maxUsesStr = formData.get("maxUses") as string;
  const maxUses = maxUsesStr ? parseInt(maxUsesStr, 10) : null;

  const membership = await db.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId: session.userId,
        workspaceId,
      },
    },
  });

  if (!membership || membership.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  await db.invite.create({
    data: {
      workspaceId,
      maxUses: isNaN(Number(maxUses)) ? null : maxUses,
    },
  });

  revalidatePath(`/workspace/${workspaceId}`);
}

export async function deleteInvite(inviteId: string, workspaceId: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const membership = await db.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId: session.userId,
        workspaceId,
      },
    },
  });

  if (!membership || membership.role !== "ADMIN") {
    throw new Error("Unauthorized: Only admins can delete invites");
  }

  await db.invite.delete({
    where: { id: inviteId },
  });

  revalidatePath(`/workspace/${workspaceId}`);
}
