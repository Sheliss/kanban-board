"use client";

import { useState } from "react";

interface CopyInviteBoxProps {
  baseUrl: string;
  invCode: string;
  useCount: number;
  maxUses: number | null;
  isExpired: boolean;
  deleteAction: () => Promise<void>;
}

export default function CopyInviteBox({
  baseUrl,
  invCode,
  useCount,
  maxUses,
  isExpired,
  deleteAction,
}: CopyInviteBoxProps) {
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);

  const inviteUrl = `${baseUrl}/invite/${invCode}`;

  const handleCopy = (e: React.MouseEvent<HTMLDivElement>) => {
    navigator.clipboard.writeText(inviteUrl);

    const rect = e.currentTarget.getBoundingClientRect();
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });

    setTimeout(() => {
      setCoords(null);
    }, 1200);
  };

  return (
    <div
      onClick={handleCopy}
      className="relative p-3 bg-background border border-border rounded-xl flex gap-2 justify-between items-center cursor-pointer hover:border-main transition-all group overflow-hidden select-none"
    >
      <div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-main bg-blue-50 px-2 py-1 rounded border border-border group-hover:bg-blue-100 transition-colors">
            📋 {`/invite/${invCode}`}
          </span>
        </div>
        <p className="text-xs text-text-muted mt-1">
          Uses: {useCount} {maxUses ? `/ ${maxUses}` : ""}{" "}
          {isExpired && "• (Expired)"}
        </p>
      </div>

      <div onClick={(e) => e.stopPropagation()}>
        <form action={deleteAction}>
          <button
            type="submit"
            className="px-2.5 py-1 text-xs text-error hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors rounded-lg font-medium cursor-pointer"
          >
            Delete
          </button>
        </form>
      </div>

      {coords && (
        <span
          style={{ left: coords.x, top: coords.y }}
          className="absolute pointer-events-none text-xs font-bold text-accent bg-surface px-2 py-0.5 rounded shadow-md border border-border animate-float-fade transition-all"
        >
          Copied! ✨
        </span>
      )}
    </div>
  );
}
