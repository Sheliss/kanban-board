"use client";

export interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  user: {
    name: string | null;
    email: string;
  };
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  estimatedHours: number | null;
  position: number;
  progress: number;
  comments: Comment[];
}

interface KanbanCardProps {
  task: Task;
  onClick: () => void;
}

export default function KanbanCard({ task, onClick }: KanbanCardProps) {
  return (
    <div
      onClick={onClick}
      className="p-3 bg-surface border border-border rounded-lg shadow-sm space-y-2 cursor-pointer hover:border-main transition-all"
    >
      <p className="text-sm font-medium text-text-main">{task.title}</p>

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

      <div className="flex justify-between items-center pt-1 text-[10px] text-text-muted font-mono">
        <span>⏱ {task.estimatedHours ?? 0}h</span>
        <span>💬 {task.comments?.length ?? 0}</span>
      </div>
    </div>
  );
}
