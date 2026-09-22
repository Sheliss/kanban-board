"use client";

import { useActionState, useState } from "react";
import { loginUser, LoginState } from "@/actions/auth";
import Link from "next/link";
import Button from "@/components/ui/Button";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(
    loginUser,
    null,
  );
  const [dirtyFields, setDirtyFields] = useState<Record<string, boolean>>({});

  const handleInputChange = (field: string) => {
    setDirtyFields((prev) => ({ ...prev, [field]: true }));
  };

  const errors = {
    general: state?.errors?.general,
    email: dirtyFields.email ? undefined : state?.errors?.email,
    password: dirtyFields.password ? undefined : state?.errors?.password,
  };

  const activeErrorList = Object.values(errors).filter((val): val is string =>
    Boolean(val),
  );

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-surface rounded-2xl shadow-xl border border-border backdrop-blur-md">
        <h1 className="text-2xl font-bold text-center tracking-tight text-main">
          Welcome Back to Kanban Board
        </h1>

        {activeErrorList.length > 0 && (
          <div className="p-3 text-sm text-error bg-red-50 border border-red-200 rounded-lg space-y-1">
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
              Email
            </label>
            <input
              name="email"
              type="text"
              onChange={() => handleInputChange("email")}
              className={`w-full px-3 py-2 bg-background border rounded-lg text-text-main focus:outline-none focus:ring-2 ${
                errors?.email
                  ? "border-error focus:ring-error"
                  : "border-border focus:ring-main"
              }`}
              placeholder="john@example.com"
            />
            {errors?.email && (
              <p className="mt-1 text-xs text-error">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Password
            </label>
            <input
              name="password"
              type="password"
              onChange={() => handleInputChange("password")}
              className={`w-full px-3 py-2 bg-background border rounded-lg text-text-main focus:outline-none focus:ring-2 ${
                errors?.password
                  ? "border-error focus:ring-error"
                  : "border-border focus:ring-main"
              }`}
              placeholder="••••••••"
            />
            {errors?.password && (
              <p className="mt-1 text-xs text-error">{errors.password}</p>
            )}
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending ? "Logging in..." : "Log In"}
          </Button>
        </form>

        <p className="text-sm text-center text-text-muted">
          {"Don't have an account? "}
          <Link
            href="/register"
            className="text-main hover:underline font-medium"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
