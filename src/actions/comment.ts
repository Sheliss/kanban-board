"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { pusherServer } from "@/lib/pusher";

const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty"),
  taskId: z.string(),
  workspaceId: z.string(),
});

export async function addComment(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const rawData = {
    content: formData.get("content"),
    taskId: formData.get("taskId"),
    workspaceId: formData.get("workspaceId"),
  };

  const validatedFields = commentSchema.safeParse(rawData);
  if (!validatedFields.success) throw new Error("Invalid comment data");

  const { content, taskId, workspaceId } = validatedFields.data;

  const membership = await db.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: session.userId, workspaceId } },
  });
  if (!membership) throw new Error("Unauthorized");

  const newComment = await db.comment.create({
    data: {
      content,
      taskId,
      userId: session.userId,
    },
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
  });

  await pusherServer.trigger(`workspace-${workspaceId}`, "new-comment", {
    taskId,
    comment: newComment,
  });

  revalidatePath(`/workspace/${workspaceId}`);

  return { success: true, comment: newComment };
}
