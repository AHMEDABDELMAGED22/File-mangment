import { requireAuthWithProfile } from "@/services/auth.service";
import { getUserWorkspace } from "@/services/workspace.service";
import { getRecentFiles, getStorageUsage } from "@/services/file.service";
import { getRecentActivity } from "@/services/activity.service";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FolderOpen, Upload, FileText, Activity, HardDrive, ArrowRight, Clock, Image, Film, Music, FileCode, Archive } from "lucide-react";

function formatSize(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getIcon(mime: string) {
  if (mime.startsWith("image/")) return Image;
  if (mime.startsWith("video/")) return Film;
  if (mime.startsWith("audio/")) return Music;
  if (mime.includes("zip") || mime.includes("tar")) return Archive;
  if (mime.includes("javascript") || mime.includes("json") || mime.includes("html")) return FileCode;
  return FileText;
}

function formatAction(action: string) {
  const map: Record<string, string> = {
    "file.upload": "Uploaded a file",
    "file.delete": "Deleted a file",
    "file.rename": "Renamed a file",
    "file.move": "Moved a file",
    "folder.create": "Created a folder",
    "folder.delete": "Deleted a folder",
    "folder.rename": "Renamed a folder",
    "folder.move": "Moved a folder",
  };
  return map[action] || action;
}

export default async function DashboardPage() {
  const { profile } = await requireAuthWithProfile();
  const workspace = await getUserWorkspace(profile.id);
  if (!workspace) redirect("/login");

  const [recentFiles, storage, activity] = await Promise.all([
    getRecentFiles(workspace.id, 5),
    getStorageUsage(workspace.id),
    getRecentActivity(workspace.id, 8),
  ]);

  const maxStorage = 1024 * 1024 * 1024; // 1 GB visual cap
  const usagePercent = Math.min((storage.total_bytes / maxStorage) * 100, 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Welcome back, {profile.full_name || "there"}
        </h1>
        <p className="text-zinc-400 text-sm mt-1">
          Here&apos;s an overview of your workspace
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link href={`/workspace/${workspace.id}`}>
          <Card className="border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/50 hover:border-zinc-700 transition-all cursor-pointer group">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/20 flex items-center justify-center">
                <FolderOpen className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-200 group-hover:text-white">My Files</p>
                <p className="text-xs text-zinc-500">Browse workspace</p>
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-600 ml-auto group-hover:text-zinc-400 transition-colors" />
            </CardContent>
          </Card>
        </Link>
        <Link href={`/workspace/${workspace.id}`}>
          <Card className="border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/50 hover:border-zinc-700 transition-all cursor-pointer group">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/20 flex items-center justify-center">
                <Upload className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-200 group-hover:text-white">Upload Files</p>
                <p className="text-xs text-zinc-500">Add new files</p>
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-600 ml-auto group-hover:text-zinc-400 transition-colors" />
            </CardContent>
          </Card>
        </Link>
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-sky-500/20 border border-cyan-500/20 flex items-center justify-center">
              <HardDrive className="h-5 w-5 text-cyan-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-zinc-200">Storage</p>
              <p className="text-xs text-zinc-500">{formatSize(storage.total_bytes)} · {storage.file_count} files</p>
              <Progress value={usagePercent} className="mt-1.5 h-1.5 bg-zinc-800" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent files */}
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-zinc-200 flex items-center gap-2">
              <Clock className="h-4 w-4 text-zinc-500" /> Recent Files
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {recentFiles.length === 0 ? (
              <p className="text-sm text-zinc-500 py-4 text-center">No files yet</p>
            ) : (
              recentFiles.map((file) => {
                const Icon = getIcon(file.mime_type);
                return (
                  <div key={file.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800/50 transition-colors">
                    <Icon className="h-4 w-4 text-zinc-400 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-zinc-300 truncate">{file.name}</p>
                      <p className="text-xs text-zinc-600">{formatSize(file.size_bytes)}</p>
                    </div>
                    <span className="text-xs text-zinc-600 shrink-0">{new Date(file.created_at).toLocaleDateString()}</span>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-zinc-200 flex items-center gap-2">
              <Activity className="h-4 w-4 text-zinc-500" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {activity.length === 0 ? (
              <p className="text-sm text-zinc-500 py-4 text-center">No activity yet</p>
            ) : (
              activity.map((log) => (
                <div key={log.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800/50 transition-colors">
                  <div className="h-2 w-2 rounded-full bg-violet-500 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-zinc-300">{formatAction(log.action)}</p>
                    {log.metadata && typeof log.metadata === "object" && "name" in log.metadata && (
                      <p className="text-xs text-zinc-600 truncate">{String(log.metadata.name)}</p>
                    )}
                  </div>
                  <span className="text-xs text-zinc-600 shrink-0">{new Date(log.created_at).toLocaleDateString()}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
