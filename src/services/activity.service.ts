import { createClient } from "@/lib/supabase/server";
import type { ActivityLog } from "@/lib/types";

/**
 * Log an activity
 */
export async function logActivity(
  workspaceId: string,
  userId: string,
  action: string,
  targetType: string,
  targetId?: string | null,
  metadata?: Record<string, unknown>
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("activity_logs").insert({
    workspace_id: workspaceId,
    user_id: userId,
    action,
    target_type: targetType,
    target_id: targetId || null,
    metadata: metadata || {},
  });

  if (error) {
    // Log errors but don't throw — activity logging shouldn't block operations
    console.error("Activity log error:", error);
  }
}

/**
 * Get recent activity for a workspace
 */
export async function getRecentActivity(
  workspaceId: string,
  limit: number = 20
): Promise<ActivityLog[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_logs")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data as ActivityLog[]) || [];
}

/**
 * Get all activity logs (admin only)
 */
export async function getAllActivity(
  limit: number = 50,
  offset: number = 0
): Promise<ActivityLog[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(error.message);
  return (data as ActivityLog[]) || [];
}
