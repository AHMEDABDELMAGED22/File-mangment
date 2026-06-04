"use server";

import { requireAdmin } from "@/services/auth.service";
import { getAnalyticsDashboardData } from "@/services/analytics.service";

/**
 * Admin-protected server action to fetch analytics dashboard data.
 * Non-admin users will be redirected to /dashboard by requireAdmin().
 */
export async function getAnalyticsDashboardAction() {
  await requireAdmin();
  try {
    const data = await getAnalyticsDashboardData();
    return { data };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Failed to fetch analytics data" };
  }
}
