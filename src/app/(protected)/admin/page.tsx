import { requireAdmin } from "@/services/auth.service";
import { getAllUsersAction, getAllActivityAction, getAllUploadedFilesAction } from "@/actions/admin.actions";
import { getStorageUsageByUser } from "@/services/file.service";
import type { Profile, ActivityLog } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, FolderOpen, Activity, ExternalLink, GraduationCap, BarChart3 } from "lucide-react";
import { ToggleActiveButton } from "@/components/admin/toggle-active-button";
import { DeleteUserButton } from "@/components/admin/delete-user-button";
import { GradeCsvImport } from "@/components/admin/grade-import";
import { DeleteSubjectButton } from "@/components/admin/delete-subject-button";
import { getAllSubjectsAction } from "@/actions/grade.actions";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { UsersTable } from "@/components/admin/users-table";
import { SystemSettingToggle } from "@/components/admin/system-setting-toggle";
import { cn } from "@/lib/utils";

import { getSystemSetting } from "@/services/admin.service";

function formatSize(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatAction(action: string) {
  const map: Record<string, string> = {
    "file.upload": "Uploaded file", "file.delete": "Deleted file",
    "file.rename": "Renamed file", "file.move": "Moved file",
    "folder.create": "Created folder", "folder.delete": "Deleted folder",
    "folder.rename": "Renamed folder", "folder.move": "Moved folder",
  };
  return map[action] || action;
}

export default async function AdminPage() {
  await requireAdmin();

  const [usersResult, activityResult, storageUsage, subjectsResult, filesResult, showClassAveragesSetting] = await Promise.all([
    getAllUsersAction(),
    getAllActivityAction(50),
    getStorageUsageByUser(),
    getAllSubjectsAction(),
    getAllUploadedFilesAction(),
    getSystemSetting("show_class_averages").catch(() => false), // graceful fallback
  ]);

  const users = usersResult.users || [];
  const activities = activityResult.activities || [];
  const subjects = subjectsResult.subjects || [];
  const storageMap = new Map(storageUsage.map((s) => [s.user_id, s]));
  const allFiles = filesResult.files || [];
  const showClassAverages = showClassAveragesSetting === "true" || showClassAveragesSetting === true;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <p className="text-zinc-400 text-sm mt-1">Manage users, workspaces, and view activity</p>
        </div>
        <Link
          href="/admin/analytics"
          className={cn(
            buttonVariants({ variant: "default" }),
            "bg-violet-600 hover:bg-violet-700 text-white shrink-0 shadow-lg shadow-violet-600/10"
          )}
        >
          <BarChart3 className="h-4 w-4" />
          Analytics Dashboard
        </Link>
      </div>


      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <Users className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{users.length}</p>
              <p className="text-xs text-zinc-500">Total Users</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <FolderOpen className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{users.length}</p>
              <p className="text-xs text-zinc-500">Workspaces</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Activity className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{activities.length}</p>
              <p className="text-xs text-zinc-500">Recent Actions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="bg-zinc-800/50 border border-zinc-700">
          <TabsTrigger value="users" className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white">Users</TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white">Activity Log</TabsTrigger>
          <TabsTrigger value="grades" className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white">Grades</TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UsersTable users={users} storageUsage={storageUsage} allFiles={allFiles} />
        </TabsContent>

        <TabsContent value="activity">
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-400">User</TableHead>
                    <TableHead className="text-zinc-400">Action</TableHead>
                    <TableHead className="text-zinc-400">Details</TableHead>
                    <TableHead className="text-zinc-400">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((log: ActivityLog & { profiles?: { full_name: string } }) => (
                    <TableRow key={log.id} className="border-zinc-800">
                      <TableCell className="text-zinc-200">{log.profiles?.full_name || "—"}</TableCell>
                      <TableCell className="text-zinc-300 text-sm">{formatAction(log.action)}</TableCell>
                      <TableCell className="text-zinc-500 text-sm truncate max-w-[200px]">
                        {log.metadata?.name ? String(log.metadata.name) : "—"}
                      </TableCell>
                      <TableCell className="text-zinc-500 text-sm">{new Date(log.created_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grades">
          <div className="space-y-6">
            <GradeCsvImport />
            
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800 hover:bg-transparent">
                      <TableHead className="text-zinc-400">Subject Name</TableHead>
                      <TableHead className="text-zinc-400">Subject Slug</TableHead>
                      <TableHead className="text-zinc-400 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subjects.length === 0 ? (
                      <TableRow className="border-zinc-800">
                        <TableCell colSpan={3} className="text-center text-zinc-500 py-6">
                          No subjects imported yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      subjects.map((subject: any) => (
                        <TableRow key={subject.id} className="border-zinc-800">
                          <TableCell className="text-zinc-200 font-medium">
                            <div className="flex items-center gap-2">
                              <GraduationCap className="h-4 w-4 text-amber-500" />
                              {subject.name}
                            </div>
                          </TableCell>
                          <TableCell className="text-zinc-400 text-sm">{subject.slug}</TableCell>
                          <TableCell className="text-right">
                            <DeleteSubjectButton subjectId={subject.id} subjectName={subject.name} />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <div className="space-y-6 max-w-2xl">
            <div>
              <h2 className="text-lg font-semibold text-white">System Settings</h2>
              <p className="text-sm text-zinc-400">Manage global features and configurations.</p>
            </div>
            <div className="grid gap-4">
              <SystemSettingToggle
                settingKey="show_class_averages"
                initialValue={showClassAverages}
                title="Show Class Averages to Students"
                description="When enabled, students will see the cohort average next to their score in each assessment."
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
