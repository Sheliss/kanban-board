"use server";

import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function registerUser(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;

  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error("User already exists with this email");
  }

  const hashedPassword = await hashPassword(password);

  await db.user.create({
    data: {
      email,
      name,
      passwordHash: hashedPassword,
    },
  });

  redirect("/login");
}
