"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { z } from "zod";
import { pusherServer } from "@/lib/pusher";

const taskSchema = z.object({
  title: z
    .string()
    .min(1, "Task title is required")
    .max(100, "Title is too long"),
  description: z.string().optional(),
  estimatedHours: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : null)),
  boardId: z.string(),
  workspaceId: z.string(),
});

export async function createTask(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const rawData = {
    title: formData.get("title"),
    description: formData.get("description"),
    estimatedHours: formData.get("estimatedHours"),
    boardId: formData.get("boardId"),
    workspaceId: formData.get("workspaceId"),
  };

  const validatedFields = taskSchema.safeParse(rawData);
  if (!validatedFields.success) {
    throw new Error("Invalid task data");
  }

  const { title, description, estimatedHours, boardId, workspaceId } =
    validatedFields.data;

  const membership = await db.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId: session.userId,
        workspaceId,
      },
    },
  });

  if (!membership) throw new Error("Unauthorized");

  const lastTask = await db.task.findFirst({
    where: { boardId },
    orderBy: { position: "desc" },
  });
  const position = lastTask ? lastTask.position + 1 : 0;

  await db.task.create({
    data: {
      title,
      description: description || null,
      estimatedHours: isNaN(Number(estimatedHours)) ? null : estimatedHours,
      boardId,
      position,
    },
  });

  redirect(`/workspace/${workspaceId}`);
}

export async function moveTask(
  taskId: string,
  newBoardId: string,
  newPosition: number,
  workspaceId: string,
) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const membership = await db.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: session.userId, workspaceId } },
  });
  if (!membership) throw new Error("Unauthorized");

  await db.task.update({
    where: { id: taskId },
    data: {
      boardId: newBoardId,
      position: newPosition,
    },
  });

  await pusherServer.trigger(`workspace-${workspaceId}`, "task-moved", {
    taskId,
    newBoardId,
  });

  redirect(`/workspace/${workspaceId}`);
}

export async function updateTaskProgress(
  taskId: string,
  progress: number,
  workspaceId: string,
) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const membership = await db.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: session.userId, workspaceId } },
  });
  if (!membership) throw new Error("Unauthorized");

  await db.task.update({
    where: { id: taskId },
    data: { progress: Math.min(100, Math.max(0, progress)) },
  });

  redirect(`/workspace/${workspaceId}`);
}
