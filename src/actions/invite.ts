"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

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

  redirect(`/workspace/${workspaceId}`);
}
