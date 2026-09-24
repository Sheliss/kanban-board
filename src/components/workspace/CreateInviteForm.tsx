"use client";

import { createInvite } from "@/actions/invite";
import Button from "@/components/ui/Button";

interface CreateInviteFormProps {
  workspaceId: string;
}

export default function CreateInviteForm({
  workspaceId,
}: CreateInviteFormProps) {
  return (
    <form action={createInvite} className="space-y-3 pt-2">
      <input type="hidden" name="workspaceId" value={workspaceId} />

      <div>
        <label className="block text-xs font-medium text-text-muted mb-1">
          Max Uses (Leave blank for unlimited)
        </label>
        <input
          name="maxUses"
          type="number"
          min="1"
          placeholder="e.g. 1 (Single use)"
          className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-main"
        />
      </div>

      <Button type="submit" isSmall fullWidth>
        Generate Invite Link
      </Button>
    </form>
  );
}
