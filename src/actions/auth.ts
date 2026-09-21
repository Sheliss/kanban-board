"use server";

import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { redirect } from "next/navigation";
import { z } from "zod";

export type RegisterState = {
  errors?: {
    name?: string;
    email?: string;
    password?: string;
    general?: string;
  };
} | null;

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export async function registerUser(
  prevState: RegisterState,
  formData: FormData,
) {
  const rawData = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const validatedFields = registerSchema.safeParse(rawData);

  if (!validatedFields.success) {
    const fieldErrors = z.flattenError(validatedFields.error).fieldErrors;

    return {
      errors: {
        name: fieldErrors.name?.[0],
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
      },
    };
  }

  const { name, email, password } = validatedFields.data;

  try {
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
  } catch (err) {
    console.log(err);
    return { error: `${err}` };
  }

  redirect("/login");
}
