"use client";

import { useState } from "react";
import { deleteTask, updateTaskProgress } from "@/actions/task";
import { addComment } from "@/actions/comment";
import Button from "@/components/ui/Button";
import { Task, Comment } from "./KanbanCard";

interface TaskDetailModalProps {
  task: Task;
  workspaceId: string;
  onClose: () => void;
  onCommentAdded: (newComment: Comment) => void;
  currentUserId: string;
  isAdmin: boolean;
}

export default function TaskDetailModal({
  task,
  workspaceId,
  onClose,
  onCommentAdded,
  isAdmin,
  currentUserId,
}: TaskDetailModalProps) {
  const [currentProgress, setCurrentProgress] = useState(task.progress);
  const canDelete =
    isAdmin ||
    task.creatorId === currentUserId ||
    task.assigneeId === currentUserId;

  const handlePostComment = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const res = await addComment(formData);
    if (res.success && res.comment) {
      onCommentAdded(res.comment);
      form.reset();
    }
  };

  const handleDeleteTask = async () => {
    if (confirm("Are you sure you want to delete this task?")) {
      await deleteTask(task.id, workspaceId);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-start p-6 border-b border-border">
          <h2 className="text-xl font-bold text-text-main">{task.title}</h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-main text-lg font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          <div className="flex items-center justify-between bg-surface p-3 rounded-xl border border-border">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Assignee
            </span>
            <span className="text-sm font-medium text-text-main">
              {task.assignee
                ? task.assignee.name || task.assignee.email
                : "Unassigned"}
            </span>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
              Description
            </h4>
            <p className="text-sm text-text-main bg-surface p-3 rounded-xl border border-border whitespace-pre-wrap">
              {task.description || "No description provided."}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Update Progress: {currentProgress}%
            </h4>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={currentProgress}
              onChange={(e) => setCurrentProgress(parseInt(e.target.value, 10))}
              onMouseUp={async () => {
                await updateTaskProgress(task.id, currentProgress, workspaceId);
              }}
              onTouchEnd={async () => {
                await updateTaskProgress(task.id, currentProgress, workspaceId);
              }}
              className="w-full accent-main cursor-pointer"
            />
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Comments ({task.comments?.length ?? 0})
            </h4>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {task.comments?.length === 0 ? (
                <p className="text-xs text-text-muted italic">
                  No comments yet. Start the conversation!
                </p>
              ) : (
                task.comments?.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 bg-surface border border-border rounded-xl space-y-1"
                  >
                    <div className="flex justify-between text-xs text-text-muted">
                      <span className="font-semibold text-text-main">
                        {c.user.name || c.user.email}
                      </span>
                    </div>
                    <p className="text-sm text-text-main">{c.content}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handlePostComment} className="space-y-2 pt-2">
              <input type="hidden" name="taskId" value={task.id} />
              <input type="hidden" name="workspaceId" value={workspaceId} />
              <textarea
                name="content"
                rows={2}
                required
                placeholder="Write a comment..."
                className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-xl text-text-main focus:outline-none focus:ring-2 focus:ring-main resize-none"
              />
              <div className="flex justify-end">
                <Button type="submit" isSmall>
                  Post Comment
                </Button>
              </div>
            </form>
            {canDelete && (
              <div className="pt-4 border-t border-border flex justify-between items-center">
                <button
                  onClick={handleDeleteTask}
                  className="px-3 py-1.5 text-xs bg-red-50 text-error border border-red-200 hover:bg-red-100 transition-colors rounded-lg font-medium cursor-pointer"
                >
                  Delete Task
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
