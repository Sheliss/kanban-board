"use client";

import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { moveTask } from "@/actions/task";
import CreateTaskForm from "./CreateTaskForm";

interface Task {
  id: string;
  title: string;
  description: string | null;
  estimatedHours: number | null;
  position: number;
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

  return (
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
                          {task.estimatedHours !== null && (
                            <div className="flex justify-end">
                              <span className="text-[10px] px-1.5 py-0.5 bg-background text-text-muted rounded border border-border font-mono">
                                ⏱ {task.estimatedHours}h
                              </span>
                            </div>
                          )}
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
  );
}
