"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const workspaceSchema = z.object({
  name: z
    .string()
    .min(1, "Workspace name is required")
    .max(50, "Name is too long"),
});

export type WorkspaceState = {
  errors?: {
    name?: string;
    general?: string;
  };
} | null;

export async function createWorkspace(
  prevState: WorkspaceState,
  formData: FormData,
): Promise<WorkspaceState> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const rawData = {
    name: formData.get("name"),
  };

  const validatedFields = workspaceSchema.safeParse(rawData);

  if (!validatedFields.success) {
    const fieldErrors = z.flattenError(validatedFields.error).fieldErrors;
    return {
      errors: {
        name: fieldErrors.name?.[0],
        general: undefined,
      },
    };
  }

  const { name } = validatedFields.data;

  try {
    await db.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: { name },
      });

      await tx.workspaceMember.create({
        data: {
          userId: session.userId,
          workspaceId: workspace.id,
          role: "ADMIN",
        },
      });

      const defaultBoards = [
        { name: "To Do", position: 0 },
        { name: "In Progress", position: 1 },
        { name: "Done", position: 2 },
      ];

      for (const board of defaultBoards) {
        await tx.board.create({
          data: {
            name: board.name,
            position: board.position,
            workspaceId: workspace.id,
          },
        });
      }
    });
  } catch (err) {
    return {
      errors: {
        general: `Failed to create workspace. Please try again. ${err}`,
      },
    };
  }

  revalidatePath("/dashboard");
  return null;
}
