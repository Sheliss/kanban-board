"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { z } from "zod";
import { pusherServer } from "@/lib/pusher";
import { revalidatePath } from "next/cache";

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
  assigneeId: z.string().optional(),
  boardId: z.string(),
  workspaceId: z.string(),
});

interface MoveTaskParams {
  taskId: string;
  sourceBoardId: string;
  sourceIndex: number;
  destBoardId: string;
  destIndex: number;
  workspaceId: string;
}

export async function createTask(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const rawData = {
    title: formData.get("title"),
    description: formData.get("description"),
    estimatedHours: formData.get("estimatedHours"),
    assigneeId: formData.get("assigneeId"),
    boardId: formData.get("boardId"),
    workspaceId: formData.get("workspaceId"),
  };

  const validatedFields = taskSchema.safeParse(rawData);
  if (!validatedFields.success) {
    throw new Error("Invalid task data");
  }

  const {
    title,
    description,
    estimatedHours,
    assigneeId,
    boardId,
    workspaceId,
  } = validatedFields.data;

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
      creatorId: session.userId,
      assigneeId: assigneeId || null,
    },
  });

  redirect(`/workspace/${workspaceId}`);
}

export async function moveTask({
  taskId,
  sourceBoardId,
  sourceIndex,
  destBoardId,
  destIndex,
  workspaceId,
}: MoveTaskParams) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const membership = await db.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: session.userId, workspaceId } },
  });
  if (!membership) throw new Error("Unauthorized");

  await db.$transaction(async (tx) => {
    if (sourceBoardId === destBoardId) {
      const tasks = await tx.task.findMany({
        where: { boardId: sourceBoardId },
        orderBy: { position: "asc" },
      });

      const [movedTask] = tasks.splice(sourceIndex, 1);
      tasks.splice(destIndex, 0, movedTask);

      for (let i = 0; i < tasks.length; i++) {
        await tx.task.update({
          where: { id: tasks[i].id },
          data: { position: i },
        });
      }
    } else {
      const sourceTasks = await tx.task.findMany({
        where: { boardId: sourceBoardId },
        orderBy: { position: "asc" },
      });

      const destTasks = await tx.task.findMany({
        where: { boardId: destBoardId },
        orderBy: { position: "asc" },
      });

      const [movedTask] = sourceTasks.splice(sourceIndex, 1);
      destTasks.splice(destIndex, 0, movedTask);

      for (let i = 0; i < sourceTasks.length; i++) {
        await tx.task.update({
          where: { id: sourceTasks[i].id },
          data: { position: i },
        });
      }

      for (let i = 0; i < destTasks.length; i++) {
        await tx.task.update({
          where: { id: destTasks[i].id },
          data: {
            position: i,
            boardId: destBoardId,
          },
        });
      }
    }
  });

  await pusherServer.trigger(`workspace-${workspaceId}`, "task-moved", {
    taskId,
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

export async function deleteTask(taskId: string, workspaceId: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const membership = await db.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: session.userId, workspaceId } },
  });
  if (!membership) throw new Error("Unauthorized");

  const task = await db.task.findUnique({ where: { id: taskId } });
  if (!task) throw new Error("Task not found");

  const isAdmin = membership.role === "ADMIN";
  const isCreator = task.creatorId === session.userId;
  const isAssignee = task.assigneeId === session.userId;

  if (!isAdmin && !isCreator && !isAssignee) {
    throw new Error(
      "Forbidden: You do not have permission to delete this task",
    );
  }

  await db.task.delete({ where: { id: taskId } });

  await pusherServer.trigger(`workspace-${workspaceId}`, "task-deleted", {
    taskId,
  });
  revalidatePath(`/workspace/${workspaceId}`);
}
