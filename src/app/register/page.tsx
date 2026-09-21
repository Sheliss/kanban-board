"use client";

import { useActionState, useState } from "react";
import { registerUser } from "@/actions/auth";
import Link from "next/link";
import Button from "@/components/ui/Button";

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(registerUser, null);
  const [dirtyFields, setDirtyFields] = useState<Record<string, boolean>>({});

  const handleInputChange = (field: string) => {
    setDirtyFields((prev) => ({ ...prev, [field]: true }));
  };

  const errors = {
    general: state?.errors?.general,
    name: dirtyFields.name ? undefined : state?.errors?.name,
    email: dirtyFields.email ? undefined : state?.errors?.email,
    password: dirtyFields.password ? undefined : state?.errors?.password,
  };

  const activeErrorList = Object.values(errors).filter((val): val is string =>
    Boolean(val),
  );

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md p-8 space-y-6 bg-surface rounded-2xl shadow-xl border border-border backdrop-blur-md">
        <h1 className="text-2xl font-bold text-center tracking-tight text-main">
          Create a Kanban Board Account
        </h1>

        {activeErrorList.length > 0 && (
          <div className="p-3 text-sm text-error bg-red-50 border border-red-200 rounded-lg">
            {activeErrorList.map((err, index) => (
              <div key={index}>• {err}</div>
            ))}
          </div>
        )}

        <form
          action={formAction}
          noValidate
          onSubmit={() => setDirtyFields({})}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Name
            </label>
            <input
              name="name"
              type="text"
              required
              className={`w-full px-3 py-2 bg-background border border-border rounded-lg text-text-main focus:outline-none focus:ring-2 focus:ring-main
                ${errors?.name ? "border-error focus:ring-error" : "border-border focus:ring-main"}`}
              placeholder="John Doe"
              onChange={() => handleInputChange("name")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              className={`w-full px-3 py-2 bg-background border border-border rounded-lg text-text-main focus:outline-none focus:ring-2 focus:ring-main
                ${errors?.email ? "border-error focus:ring-error" : "border-border focus:ring-main"}`}
              placeholder="john@example.com"
              onChange={() => handleInputChange("email")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              className={`w-full px-3 py-2 bg-background border border-border rounded-lg text-text-main focus:outline-none focus:ring-2 focus:ring-main
                ${errors?.password ? "border-error focus:ring-error" : "border-border focus:ring-main"}`}
              placeholder="••••••••"
              onChange={() => handleInputChange("password")}
            />
          </div>

          <Button type="submit" disabled={isPending} fullWidth>
            {isPending ? "Creating Account..." : "Sign Up"}
          </Button>
        </form>

        <p className="text-sm text-center text-text-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-main hover:underline font-medium">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
