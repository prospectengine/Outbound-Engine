"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getSafeRedirectUrl } from "@/lib/utils";

export type AuthActionResult = {
  error?: string;
  success?: boolean;
  message?: string;
};

export async function signIn(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const next = formData.get("next") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    return { error: error.message };
  }

  const safeNext = getSafeRedirectUrl(next, "/");
  redirect(safeNext);
}

export async function signUp(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;
  const next = formData.get("next") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters long." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        full_name: fullName?.trim() || "",
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // If Supabase is configured for email confirmation, session is null
  if (data.user && !data.session) {
    return {
      success: true,
      message:
        "Account created! Please check your email to confirm your account before logging in.",
    };
  }

  const safeNext = getSafeRedirectUrl(next, "/");
  redirect(safeNext);
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
