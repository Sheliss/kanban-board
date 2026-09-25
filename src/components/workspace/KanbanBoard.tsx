"use client";

import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { moveTask } from "@/actions/task";
import CreateTaskForm from "./CreateTaskForm";
import { useState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { pusherClient } from "@/lib/pusher-client";
import TaskDetailModal from "./TaskDetailModal";
import KanbanCard from "./KanbanCard";

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
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => setSelectedTask(task)}
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
