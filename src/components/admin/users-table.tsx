"use client";

import { useState } from "react";
import type { Profile } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleActiveButton } from "./toggle-active-button";
import { DeleteUserButton } from "./delete-user-button";
import { 
  Search, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  FileDown, 
  Check, 
  Users, 
  HardDriveUpload, 
  ExternalLink,
  FileX 
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Props {
  users: Profile[];
  storageUsage: { user_id: string; total_bytes: number; file_count: number }[];
  allFiles: { owner_id: string; name: string; size_bytes: number; created_at: string }[];
}

function formatSize(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function UsersTable({ users, storageUsage, allFiles }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | "none">("asc"); // Default to alphabetical A-Z
  const [onlyUploaders, setOnlyUploaders] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingNon, setExportingNon] = useState(false);

  const storageMap = new Map(storageUsage.map((s) => [s.user_id, s]));

  // Extract all active uploaders
  const uploaders = users.filter((user) => {
    const usage = storageMap.get(user.id);
    return usage && usage.file_count > 0;
  });

  // Extract all non-uploaders (users with zero files)
  const nonUploaders = users.filter((user) => {
    const usage = storageMap.get(user.id);
    return !usage || usage.file_count === 0;
  });

  // Build a map of userId -> user files
  const userFilesMap = new Map<string, typeof allFiles>();
  for (const file of allFiles) {
    const existing = userFilesMap.get(file.owner_id) || [];
    existing.push(file);
    userFilesMap.set(file.owner_id, existing);
  }

  // Helper to normalize Arabic names for sorting
  function normalizeForSort(text: string) {
    return text
      .trim()
      .toLowerCase()
      .replace(/[أإآ]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/ى/g, "ي");
  }

  // Handle Extract Uploaders as CSV
  function handleExtractUploaders() {
    if (uploaders.length === 0) {
      toast.error("No users have uploaded any files yet.");
      return;
    }
    setExporting(true);

    try {
      // CSV Header
      const csvRows: string[] = ["Student Code,User Name,File Name,File Size,Upload Date"];

      // Sort uploaders alphabetically using normalized text
      const sortedUploaders = [...uploaders].sort((a, b) =>
        normalizeForSort(a.full_name || "").localeCompare(normalizeForSort(b.full_name || ""), "ar")
      );

      for (const user of sortedUploaders) {
        const files = userFilesMap.get(user.id) || [];
        const userName = (user.full_name || "Unknown").replace(/,/g, " ");
        const studentCode = (user.student_code || "—").replace(/,/g, " ");

        if (files.length === 0) {
          csvRows.push(`"${studentCode}","${userName}","No files","",""`);
        } else {
          // Sort files by date (newest first)
          const sortedFiles = [...files].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          
          const fileNames = sortedFiles.map(f => f.name.replace(/"/g, '""')).join(",\n");
          const fileSizes = sortedFiles.map(f => formatSize(f.size_bytes)).join(",\n");
          const uploadDates = sortedFiles.map(f => new Date(f.created_at).toLocaleString()).join(",\n");
          
          csvRows.push(`"${studentCode}","${userName}","${fileNames}","${fileSizes}","${uploadDates}"`);
        }
      }

      // Add BOM for Excel Arabic support + generate CSV
      const bom = "\uFEFF";
      const csvContent = bom + csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `uploaders_report_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`CSV downloaded with ${uploaders.length} uploaders!`);
    } catch {
      toast.error("Failed to generate CSV file.");
    } finally {
      setExporting(false);
    }
  }

  // Handle Extract Non-Uploaders as CSV
  function handleExtractNonUploaders() {
    if (nonUploaders.length === 0) {
      toast.error("All users have uploaded files.");
      return;
    }
    setExportingNon(true);

    try {
      // CSV Header
      const csvRows: string[] = ["Student Code,User Name,Role,Status,Joined"];

      // Sort non-uploaders alphabetically using normalized text
      const sortedNonUploaders = [...nonUploaders].sort((a, b) =>
        normalizeForSort(a.full_name || "").localeCompare(normalizeForSort(b.full_name || ""), "ar")
      );

      for (const user of sortedNonUploaders) {
        const userName = (user.full_name || "Unknown").replace(/,/g, " ");
        const studentCode = (user.student_code || "—").replace(/,/g, " ");
        const role = user.role || "user";
        const status = user.is_active ? "Active" : "Inactive";
        const joined = new Date(user.created_at).toLocaleDateString();

        csvRows.push(`"${studentCode}","${userName}","${role}","${status}","${joined}"`);
      }

      // Add BOM for Excel Arabic support + generate CSV
      const bom = "\uFEFF";
      const csvContent = bom + csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `non_uploaders_report_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`CSV downloaded with ${nonUploaders.length} non-uploaders!`);
    } catch {
      toast.error("Failed to generate CSV file.");
    } finally {
      setExportingNon(false);
    }
  }

  // Filter and Sort users
  const filteredUsers = users
    .filter((user) => {
      // 1. Search Query filter
      const name = (user.full_name || "").toLowerCase();
      const code = (user.student_code || "").toLowerCase();
      const query = searchQuery.toLowerCase();
      const matchesSearch = name.includes(query) || code.includes(query);

      // 2. Uploaders filter
      const usage = storageMap.get(user.id);
      const isUploader = usage && usage.file_count > 0;
      const matchesUploader = !onlyUploaders || isUploader;

      return matchesSearch && matchesUploader;
    })
    .sort((a, b) => {
      // 3. Alphabetical Sort
      if (sortOrder === "none") return 0;
      const nameA = normalizeForSort(a.full_name || "");
      const nameB = normalizeForSort(b.full_name || "");
      
      if (sortOrder === "asc") {
        return nameA.localeCompare(nameB, "ar");
      } else {
        return nameB.localeCompare(nameA, "ar");
      }
    });

  // Toggle sort order
  function toggleSort() {
    if (sortOrder === "asc") setSortOrder("desc");
    else if (sortOrder === "desc") setSortOrder("none");
    else setSortOrder("asc");
  }

  return (
    <div className="space-y-4">
      {/* Action and Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-zinc-900/30 p-4 rounded-xl border border-zinc-800/80">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search users by name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-zinc-950/40 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-violet-500 focus:ring-violet-500/20"
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {/* Uploader Filter Button */}
          <Button
            variant={onlyUploaders ? "default" : "outline"}
            size="sm"
            onClick={() => setOnlyUploaders(!onlyUploaders)}
            className={onlyUploaders ? "bg-violet-600 hover:bg-violet-700 text-white border-transparent" : "border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800/50"}
          >
            <HardDriveUpload className="h-4 w-4 mr-2" />
            {onlyUploaders ? "Showing Uploaders Only" : "Show Uploaders Only"}
          </Button>

          {/* Extract Uploaders CSV Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExtractUploaders}
            disabled={exporting}
            className="border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800/50"
          >
            <FileDown className="h-4 w-4 mr-2 text-zinc-400" />
            {exporting ? "Exporting..." : `Extract Uploaders CSV (${uploaders.length})`}
          </Button>

          {/* Extract Non-Uploaders CSV Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExtractNonUploaders}
            disabled={exportingNon}
            className="border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800/50"
          >
            <FileX className="h-4 w-4 mr-2 text-rose-400" />
            {exportingNon ? "Exporting..." : `Non-Uploaders CSV (${nonUploaders.length})`}
          </Button>
        </div>
      </div>

      {/* Users Count Info */}
      <div className="text-zinc-500 text-xs flex justify-between px-1">
        <span>
          Showing {filteredUsers.length} of {users.length} users
        </span>
        {sortOrder !== "none" && (
          <span className="text-violet-400">
            Sorted alphabetically ({sortOrder === "asc" ? "A-Z" : "Z-A"})
          </span>
        )}
      </div>

      {/* Table */}
      <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/50">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent bg-zinc-900/20">
              <TableHead className="text-zinc-400">Code</TableHead>
              <TableHead 
                className="text-zinc-400 cursor-pointer select-none hover:text-white transition-colors"
                onClick={toggleSort}
              >
                <div className="flex items-center gap-1.5">
                  Name
                  {sortOrder === "asc" && <ArrowUp className="h-3.5 w-3.5 text-violet-400" />}
                  {sortOrder === "desc" && <ArrowDown className="h-3.5 w-3.5 text-violet-400" />}
                  {sortOrder === "none" && <ArrowUpDown className="h-3.5 w-3.5 text-zinc-500" />}
                </div>
              </TableHead>
              <TableHead className="text-zinc-400">Role</TableHead>
              <TableHead className="text-zinc-400">Status</TableHead>
              <TableHead className="text-zinc-400">Storage</TableHead>
              <TableHead className="text-zinc-400">Joined</TableHead>
              <TableHead className="text-zinc-400 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow className="border-zinc-800">
                <TableCell colSpan={7} className="text-center py-8 text-zinc-500">
                  No users found matching the filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user: Profile) => {
                const usage = storageMap.get(user.id);
                return (
                  <TableRow key={user.id} className="border-zinc-800 hover:bg-zinc-800/10">
                    <TableCell className="text-zinc-400 font-mono text-xs">
                      {user.student_code || "—"}
                    </TableCell>
                    <TableCell className="text-zinc-200 font-medium">
                      <span className="text-white">{user.full_name || "—"}</span>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={user.role === "admin" ? "default" : "secondary"} 
                        className={user.role === "admin" ? "bg-violet-500/20 text-violet-400 border-violet-500/30" : "bg-zinc-800 text-zinc-400"}
                      >
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={user.is_active ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}>
                        {user.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-zinc-400 text-sm">
                      {usage && usage.file_count > 0 ? (
                        <div>
                          <div className="text-zinc-300 font-medium">{formatSize(usage.total_bytes)}</div>
                          <div className="text-[10px] text-zinc-500">{usage.file_count} files</div>
                        </div>
                      ) : (
                        <span className="text-zinc-600">0 B</span>
                      )}
                    </TableCell>
                    <TableCell className="text-zinc-500 text-sm">
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {(() => {
                          const u = user as any;
                          const wsId = u.workspaces?.id || u.workspaces?.[0]?.id;
                          
                          if (wsId) {
                            return (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                                render={<Link href={`/workspace/${wsId}`} />}
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View Files
                              </Button>
                            );
                          }
                          return null;
                        })()}
                        <ToggleActiveButton userId={user.id} isActive={user.is_active} />
                        <DeleteUserButton userId={user.id} userName={user.full_name || "Unknown"} disabled={user.role === "admin"} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
