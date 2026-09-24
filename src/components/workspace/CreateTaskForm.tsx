"use client";

import { useState } from "react";
import { createTask } from "@/actions/task";
import Button from "@/components/ui/Button";

interface CreateTaskFormProps {
  boardId: string;
  workspaceId: string;
}

export default function CreateTaskForm({
  boardId,
  workspaceId,
}: CreateTaskFormProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full py-2 px-3 text-xs text-text-muted hover:text-text-main hover:bg-surface border border-dashed border-border rounded-lg transition-colors flex items-center justify-center gap-1 font-medium cursor-pointer"
      >
        + Add Task
      </button>
    );
  }

  return (
    <form
      action={createTask}
      onSubmit={() => setIsOpen(false)}
      className="p-3 bg-surface border border-border rounded-lg space-y-2.5 shadow-sm"
    >
      <input type="hidden" name="boardId" value={boardId} />
      <input type="hidden" name="workspaceId" value={workspaceId} />

      <input
        name="title"
        type="text"
        required
        placeholder="Task title..."
        className="w-full px-2.5 py-1.5 text-sm bg-background border border-border rounded-md text-text-main focus:outline-none focus:ring-1 focus:ring-main"
        autoFocus
      />

      <textarea
        name="description"
        placeholder="Description (optional)"
        rows={2}
        className="w-full px-2.5 py-1.5 text-xs bg-background border border-border rounded-md text-text-main focus:outline-none focus:ring-1 focus:ring-main resize-none"
      />

      <div className="flex gap-2 items-center">
        <input
          name="estimatedHours"
          type="number"
          step="0.5"
          placeholder="Est. hours"
          className="w-1/2 px-2.5 py-1 text-xs bg-background border border-border rounded-md text-text-main focus:outline-none focus:ring-1 focus:ring-main"
        />
        <div className="flex-1 flex gap-1 justify-end items-center">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="px-2 py-1 text-xs text-text-muted hover:text-text-main cursor-pointer"
          >
            Cancel
          </button>
          <Button type="submit" isSmall>
            Add
          </Button>
        </div>
      </div>
    </form>
  );
}
