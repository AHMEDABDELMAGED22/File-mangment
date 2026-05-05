"use server";

import { requireAdmin } from "@/services/auth.service";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function getAllUsersAction() {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("*, workspaces(id, name)").order("created_at", { ascending: false });
  if (error) return { error: error.message };
  return { users: data };
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
