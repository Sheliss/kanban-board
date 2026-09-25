"use client";

import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { moveTask, updateTaskProgress } from "@/actions/task";
import CreateTaskForm from "./CreateTaskForm";
import { useState } from "react";
import Button from "../ui/Button";
import { addComment } from "@/actions/comment";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { pusherClient } from "@/lib/pusher-client";

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  user: {
    name: string | null;
    email: string;
  };
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  estimatedHours: number | null;
  position: number;
  progress: number;
  comments: Comment[];
}

interface Board {
  id: string;
  name: string;
  tasks: Task[];
}

interface KanbanBoardProps {
  boards: Board[];
  workspaceId: string;
}

export default function KanbanBoard({ boards, workspaceId }: KanbanBoardProps) {
  const router = useRouter();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const taskId = draggableId;
    const newBoardId = destination.droppableId;
    const newPosition = destination.index;

    await moveTask(taskId, newBoardId, newPosition, workspaceId);
  };

  const handlePostComment = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedTask) return;

    const form = e.currentTarget;
    const formData = new FormData(form);

    const res = await addComment(formData);
    if (res.success && res.comment) {
      setSelectedTask({
        ...selectedTask,
        comments: [...selectedTask.comments, res.comment],
      });
      form.reset();
    }
  };

  useEffect(() => {
    const channel = pusherClient.subscribe(`workspace-${workspaceId}`);

    channel.bind("task-moved", () => {
      router.refresh();
    });

    channel.bind(
      "new-comment",
      (data: { taskId: string; comment: Comment }) => {
        router.refresh();

        setSelectedTask((prev) => {
          if (prev && prev.id === data.taskId) {
            const alreadyExists = prev.comments.some(
              (c) => c.id === data.comment.id,
            );
            if (alreadyExists) return prev;

            return {
              ...prev,
              comments: [...prev.comments, data.comment],
            };
          }
          return prev;
        });
      },
    );

    return () => {
      pusherClient.unsubscribe(`workspace-${workspaceId}`);
    };
  }, [workspaceId, router]);

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          {boards.map((board) => (
            <Droppable key={board.id} droppableId={board.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`bg-background border rounded-xl p-4 space-y-3 transition-colors ${
                    snapshot.isDraggingOver
                      ? "border-main bg-blue-50/20"
                      : "border-border"
                  }`}
                >
                  <div className="flex justify-between items-center pb-2 border-b border-border">
                    <h3 className="font-semibold text-text-main text-sm">
                      {board.name}
                    </h3>
                    <span className="text-xs px-2 py-0.5 bg-surface text-text-muted rounded-full font-medium border border-border">
                      {board.tasks.length}
                    </span>
                  </div>

                  <div className="space-y-2 min-h-37.5">
                    {board.tasks.map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => setSelectedTask(task)}
                            className={`p-3 bg-surface border rounded-lg shadow-sm space-y-1.5 transition-shadow ${
                              snapshot.isDragging
                                ? "shadow-lg border-main rotate-1"
                                : "border-border"
                            }`}
                          >
                            <p className="text-sm font-medium text-text-main">
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="text-xs text-text-muted line-clamp-2">
                                {task.description}
                              </p>
                            )}
                            {task.progress >= 0 && (
                              <div className="space-y-1">
                                <div className="flex justify-between text-[10px] text-text-muted font-medium">
                                  <span>Progress</span>
                                  <span>{task.progress}%</span>
                                </div>
                                <div className="w-full bg-background h-1.5 rounded-full overflow-hidden border border-border">
                                  <div
                                    className="bg-accent h-full transition-all duration-300"
                                    style={{ width: `${task.progress}%` }}
                                  />
                                </div>
                              </div>
                            )}

                            <div className="flex justify-between items-center pt-1 text-[10px] text-text-muted font-mono">
                              <span>⏱ {task.estimatedHours ?? 0}h</span>
                              <span>💬 {task.comments?.length ?? 0}</span>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>

                  <div className="pt-1">
                    <CreateTaskForm
                      boardId={board.id}
                      workspaceId={workspaceId}
                    />
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-start p-6 border-b border-border">
              <h2 className="text-xl font-bold text-text-main">
                {selectedTask.title}
              </h2>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-text-muted hover:text-text-main text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              <div>
                <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
                  Description
                </h4>
                <p className="text-sm text-text-main bg-background p-3 rounded-xl border border-border whitespace-pre-wrap">
                  {selectedTask.description || "No description provided."}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                  Update Progress: {selectedTask.progress}%
                </h4>
                <div className="flex gap-2 items-center">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    defaultValue={selectedTask.progress}
                    onMouseUp={async (e) => {
                      const val = parseInt(
                        (e.target as HTMLInputElement).value,
                        10,
                      );
                      await updateTaskProgress(
                        selectedTask.id,
                        val,
                        workspaceId,
                      );
                      setSelectedTask({ ...selectedTask, progress: val });
                    }}
                    className="w-full accent-main cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Comments ({selectedTask.comments?.length ?? 0})
                </h4>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedTask.comments?.length === 0 ? (
                    <p className="text-xs text-text-muted italic">
                      No comments yet. Start the conversation!
                    </p>
                  ) : (
                    selectedTask.comments?.map((c) => (
                      <div
                        key={c.id}
                        className="p-3 bg-background border border-border rounded-xl space-y-1"
                      >
                        <div className="flex justify-between text-xs text-text-muted">
                          <span className="font-semibold text-text-main">
                            {c.user.name || c.user.email}
                          </span>
                          <span>
                            {new Date(c.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-text-main">{c.content}</p>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handlePostComment} className="space-y-2 pt-2">
                  <input type="hidden" name="taskId" value={selectedTask.id} />
                  <input type="hidden" name="workspaceId" value={workspaceId} />
                  <textarea
                    name="content"
                    rows={2}
                    required
                    placeholder="Write a comment..."
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl text-text-main focus:outline-none focus:ring-2 focus:ring-main resize-none"
                  />
                  <div className="flex justify-end">
                    <Button type="submit" isSmall>
                      Post Comment
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
