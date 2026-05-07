"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { loginSchema, signupSchema, resetPasswordSchema, updatePasswordSchema, updateProfileSchema } from "@/lib/validators/auth";

export async function signIn(formData: FormData) {
  const raw = { email: formData.get("email") as string, password: formData.get("password") as string };
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: error.message };
  redirect("/dashboard");
}

export async function signUp(formData: FormData) {
  const raw = {
    full_name: formData.get("full_name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirm_password: formData.get("confirm_password") as string,
    student_code: (formData.get("student_code") as string) || "",
  };
  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const studentCode = parsed.data.student_code?.trim() || "";

  // If a code was provided, validate it exists and is not claimed BEFORE creating the account
  if (studentCode) {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const adminClient = createAdminClient();

    // Check if code exists
    const { data: gradeRecord } = await adminClient
      .from("grade_records")
      .select("student_code")
      .eq("student_code", studentCode)
      .single();

    if (!gradeRecord) {
      return { error: "Invalid code" };
    }

    // Check if code is already claimed
    const { data: existingLink } = await adminClient
      .from("user_grade_links")
      .select("id")
      .eq("student_code", studentCode)
      .single();

    if (existingLink) {
      return { error: "This code has already been claimed" };
    }
  }

  const supabase = await createClient();
  const { data: authData, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { full_name: parsed.data.full_name } },
  });
  if (error) return { error: error.message };

  // If a student code was provided, claim it for the new user
  if (studentCode && authData.user) {
    const { claimStudentCode } = await import("@/services/grade.service");
    const claimResult = await claimStudentCode(authData.user.id, studentCode);
    if (!claimResult.success) {
      // The account was created but code claim failed — still allow login
      // but inform the user about the code issue
      return { error: claimResult.error || "Failed to link code to your account" };
    }
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function resetPassword(formData: FormData) {
  const raw = { email: formData.get("email") as string };
  const parsed = resetPasswordSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email);
  if (error) return { error: error.message };
  return { success: "Check your email for a password reset link." };
}

export async function updatePassword(formData: FormData) {
  const raw = { password: formData.get("password") as string, confirm_password: formData.get("confirm_password") as string };
  const parsed = updatePasswordSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: error.message };
  return { success: "Password updated successfully." };
}

export async function updateProfile(formData: FormData) {
  const raw = { full_name: formData.get("full_name") as string };
  const parsed = updateProfileSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const { error } = await supabase.from("profiles").update({ full_name: parsed.data.full_name }).eq("id", user.id);
  if (error) return { error: error.message };
  return { success: "Profile updated successfully." };
}
