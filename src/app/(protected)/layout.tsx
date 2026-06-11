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
        <Topbar profile={profile} workspaceId={workspace?.id || ""} />
        <main className="flex-1 overflow-y-auto bg-zinc-950 p-4 sm:p-6 pb-20">
          {children}
        </main>
        <footer className="fixed bottom-0 right-0 left-0 sm:left-64 h-10 bg-zinc-950/80 backdrop-blur-md border-t border-zinc-900 flex items-center justify-center z-10">
          <p className="text-zinc-500 text-[10px] sm:text-xs font-medium tracking-wider uppercase">
            Made by <a href="https://www.linkedin.com/in/ahmed-mohamed-039278231/" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300 hover:underline transition-colors">Ahmed AbdElmaged</a>
          </p>
        </footer>
      </div>
    </div>
  );
}
