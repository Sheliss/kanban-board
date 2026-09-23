"use client";

import { useActionState, useState } from "react";
import { createWorkspace, WorkspaceState } from "@/actions/workspace";
import Button from "../ui/Button";

export default function CreateWorkspaceForm() {
  const [state, formAction, isPending] = useActionState<
    WorkspaceState,
    FormData
  >(createWorkspace, null);
  const [dirty, setDirty] = useState(false);

  const error = dirty ? undefined : state?.errors?.name;

  return (
    <form
      action={formAction}
      noValidate
      onSubmit={() => setDirty(false)}
      className="space-y-3"
    >
      <div>
        <label className="block text-sm font-medium text-text-muted mb-1">
          New Workspace Name
        </label>
        <div className="flex gap-2">
          <input
            name="name"
            type="text"
            onChange={() => setDirty(true)}
            className={`flex-1 px-3 py-2 bg-background border rounded-lg text-text-main focus:outline-none focus:ring-2 ${
              error
                ? "border-error focus:ring-error"
                : "border-border focus:ring-main"
            }`}
            placeholder="e.g. Engineering Team"
          />
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating..." : "Create"}
          </Button>
        </div>
        {error && <p className="mt-1 text-xs text-error">{error}</p>}
        {state?.errors?.general && (
          <p className="mt-1 text-xs text-error">{state.errors.general}</p>
        )}
      </div>
    </form>
  );
}
