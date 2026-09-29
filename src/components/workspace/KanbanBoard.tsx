"use client";

import { useState, useEffect, useOptimistic, startTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { moveTask } from "@/actions/task";
import { pusherClient } from "@/lib/pusher-client";
import CreateTaskForm from "./CreateTaskForm";
import KanbanCard, { Task, Comment } from "./KanbanCard";
import TaskDetailModal from "./TaskDetailModal";

interface Board {
  id: string;
  name: string;
  tasks: Task[];
}

export interface WorkspaceMemberWithUser {
  id: string;
  role: "ADMIN" | "MEMBER";
  userId: string;
  workspaceId: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface KanbanBoardProps {
  boards: Board[];
  workspaceId: string;
  currentUserId: string;
  members: WorkspaceMemberWithUser[];
  isAdmin: boolean;
}

export default function KanbanBoard({
  boards,
  workspaceId,
  currentUserId,
  members,
  isAdmin,
}: KanbanBoardProps) {
  const router = useRouter();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [optimisticBoards, setOptimisticBoards] = useOptimistic(
    boards,
    (
      state,
      update: {
        sourceId: string;
        destId: string;
        sourceIndex: number;
        destIndex: number;
        taskId: string;
      },
    ) => {
      const newBoards = JSON.parse(JSON.stringify(state)) as Board[];
      const sourceBoard = newBoards.find(
        (board) => board.id === update.sourceId,
      );
      const destBoard = newBoards.find((board) => board.id === update.destId);

      if (!sourceBoard || !destBoard) return state;

      const [movedTask] = sourceBoard.tasks.splice(update.sourceIndex, 1);
      if (movedTask) {
        movedTask.boardId = update.destId;
        destBoard.tasks.splice(update.destIndex, 0, movedTask);

        sourceBoard.tasks.forEach((task, index) => {
          task.position = index;
        });
        destBoard.tasks.forEach((task, index) => {
          task.position = index;
        });
      }

      return newBoards;
    },
  );

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

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    startTransition(() => {
      setOptimisticBoards({
        sourceId: source.droppableId,
        destId: destination.droppableId,
        sourceIndex: source.index,
        destIndex: destination.index,
        taskId: draggableId,
      });
    });

    try {
      await moveTask({
        taskId: draggableId,
        sourceBoardId: source.droppableId,
        sourceIndex: source.index,
        destBoardId: destination.droppableId,
        destIndex: destination.index,
        workspaceId,
      });
    } catch (err) {
      console.error("Failed to move task:", err);
    }
  };

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          {optimisticBoards.map((board) => (
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
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <KanbanCard
                              task={task}
                              onClick={() => setSelectedTask(task)}
                            />
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
                      members={members}
                    />
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          workspaceId={workspaceId}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          onClose={() => setSelectedTask(null)}
          onCommentAdded={(newComment) => {
            setSelectedTask({
              ...selectedTask,
              comments: [...selectedTask.comments, newComment],
            });
          }}
        />
      )}
    </>
  );
}
