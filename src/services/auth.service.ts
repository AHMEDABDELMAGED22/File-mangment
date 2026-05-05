import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/**
 * Get the current authenticated user. Returns null if not logged in.
 */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Require authentication. Redirects to login if not authenticated.
 */
export async function requireAuth() {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

/**
 * Get user profile from database
 */
export async function getUserProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return data as Profile;
}

/**
 * Require authentication and return profile
 */
export async function requireAuthWithProfile() {
  const user = await requireAuth();
  const profile = await getUserProfile(user.id);
  if (!profile) {
    redirect("/login");
  }
  return { user, profile };
}

/**
 * Require admin role. Redirects to dashboard if not admin.
 */
export async function requireAdmin() {
  const { user, profile } = await requireAuthWithProfile();
  if (profile.role !== "admin") {
    redirect("/dashboard");
  }
  return { user, profile };
}

/**
 * Check if user is admin (non-redirecting)
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const profile = await getUserProfile(userId);
  return profile?.role === "admin";
}
