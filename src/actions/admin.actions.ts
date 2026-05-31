"use server";

import { requireAdmin } from "@/services/auth.service";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function getAllUsersAction() {
  await requireAdmin();
  const supabase = await createClient();
  
  const { data: users, error } = await supabase
    .from("profiles")
    .select("*, workspaces(id, name)")
    .order("created_at", { ascending: false });
    
  if (error) return { error: error.message };

  const { data: links, error: linksError } = await supabase
    .from("user_grade_links")
    .select("user_id, student_code");

  const linksMap = new Map((links || []).map((link) => [link.user_id, link.student_code]));

  const usersWithCode = (users || []).map((user) => ({
    ...user,
    student_code: linksMap.get(user.id) || null,
  }));

  return { users: usersWithCode };
}

export async function toggleUserActiveAction(formData: FormData) {
  await requireAdmin();
  const userId = formData.get("user_id") as string;
  const isActive = formData.get("is_active") === "true";
  const adminClient = createAdminClient();
  const { error } = await adminClient.from("profiles").update({ is_active: !isActive }).eq("id", userId);
  if (error) return { error: error.message };
  revalidatePath("/admin");
  return { success: true };
}

export async function getAllActivityAction(limit = 50) {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.from("activity_logs").select("*, profiles(full_name)").order("created_at", { ascending: false }).limit(limit);
  if (error) return { error: error.message };
  return { activities: data };
}

export async function deleteUserAction(formData: FormData) {
  const { user } = await requireAdmin();
  const targetUserId = formData.get("user_id") as string;
  
  if (!targetUserId) return { error: "User ID is required" };
  if (user.id === targetUserId) return { error: "You cannot delete your own account" };
  
  try {
    const { deleteUserAccount } = await import("@/services/admin.service");
    await deleteUserAccount(targetUserId);
    revalidatePath("/admin");
    return { success: true };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Failed to delete user" };
  }
}

export async function getAllUploadedFilesAction() {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("files")
    .select("owner_id, name, size_bytes, created_at")
    .order("created_at", { ascending: false });
  if (error) return { error: error.message };
  return { files: data };
}

export async function toggleSystemSettingAction(formData: FormData) {
  await requireAdmin();
  const key = formData.get("key") as string;
  const value = formData.get("value") === "true";
  
  try {
    const { updateSystemSetting } = await import("@/services/admin.service");
    await updateSystemSetting(key, value);
    revalidatePath("/admin");
    revalidatePath("/grades"); // Revalidate grades page so students see changes immediately
    return { success: true };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Failed to update setting" };
  }
}
