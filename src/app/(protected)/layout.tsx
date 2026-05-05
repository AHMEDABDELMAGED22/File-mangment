import { requireAuthWithProfile } from "@/services/auth.service";
import { getUserWorkspace } from "@/services/workspace.service";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAuthWithProfile();
  const workspace = await getUserWorkspace(profile.id);

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      <Sidebar profile={profile} workspaceId={workspace?.id || ""} />
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        <Topbar profile={profile} />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
