import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function deleteUserAccount(targetUserId: string): Promise<void> {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  // 1. Get all file storage paths for this user to avoid orphaning physical files
  // We check files where the user is the owner OR files in a workspace owned by the user.
  // Actually, since 1 user = 1 workspace, and `workspaces.owner_id` cascades, 
  // getting files where `owner_id = targetUserId` is sufficient, but we can also get all files in their workspace.
  const { data: workspace } = await adminClient
    .from("workspaces")
    .select("id")
    .eq("owner_id", targetUserId)
    .single();

  if (workspace) {
    const { data: files } = await adminClient
      .from("files")
      .select("storage_path")
      .eq("workspace_id", workspace.id);

    if (files && files.length > 0) {
      const paths = files.map((f) => f.storage_path);
      // Delete from storage in batches of 100 to be safe
      const chunkSize = 100;
      for (let i = 0; i < paths.length; i += chunkSize) {
        const chunk = paths.slice(i, i + chunkSize);
        const { error: storageError } = await adminClient.storage
          .from("files")
          .remove(chunk);
        
        if (storageError) {
          console.error("Failed to clean up some storage files:", storageError);
          // We continue anyway so we don't leave the account undeletable
        }
      }
    }
  }

  // 2. Delete user from auth.users using Admin API
  // This will cascade and delete profiles, workspaces, folders, files, and activity logs
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(targetUserId);

  if (deleteError) {
    throw new Error(`Failed to delete user account: ${deleteError.message}`);
  }
}
