"use client";

import { FileText, Image, Film, Music, Archive, FileCode, MoreVertical, Pencil, Move, Trash2, Download, Eye } from "lucide-react";
import type { FileRecord } from "@/lib/types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Props {
  file: FileRecord;
  onRename: (file: FileRecord) => void;
  onMove: (file: FileRecord) => void;
  onDelete: (file: FileRecord) => void;
  onDownload: (file: FileRecord) => void;
  onPreview: (file: FileRecord) => void;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return { icon: Image, color: "text-emerald-400", bg: "from-emerald-500/20 to-green-500/20 border-emerald-500/20" };
  if (mimeType.startsWith("video/")) return { icon: Film, color: "text-purple-400", bg: "from-purple-500/20 to-fuchsia-500/20 border-purple-500/20" };
  if (mimeType.startsWith("audio/")) return { icon: Music, color: "text-pink-400", bg: "from-pink-500/20 to-rose-500/20 border-pink-500/20" };
  if (mimeType.includes("zip") || mimeType.includes("tar") || mimeType.includes("rar")) return { icon: Archive, color: "text-yellow-400", bg: "from-yellow-500/20 to-amber-500/20 border-yellow-500/20" };
  if (mimeType.includes("javascript") || mimeType.includes("json") || mimeType.includes("html") || mimeType.includes("css") || mimeType.includes("xml")) return { icon: FileCode, color: "text-cyan-400", bg: "from-cyan-500/20 to-sky-500/20 border-cyan-500/20" };
  return { icon: FileText, color: "text-blue-400", bg: "from-blue-500/20 to-indigo-500/20 border-blue-500/20" };
}

function formatSize(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function FileCard({ file, onRename, onMove, onDelete, onDownload, onPreview }: Props) {
  const { icon: Icon, color, bg } = getFileIcon(file.mime_type);

  return (
    <div 
      onClick={() => onPreview(file)}
      className="group relative flex items-center gap-3 p-3 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/50 hover:border-zinc-700 transition-all duration-200 cursor-pointer"
    >
      <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${bg} border flex items-center justify-center shrink-0`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-200 truncate">{file.name}</p>
        <p className="text-xs text-zinc-500">{formatSize(file.size_bytes)} · {new Date(file.created_at).toLocaleDateString()}</p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="p-1.5 rounded-md hover:bg-zinc-700 transition-all text-zinc-400 hover:text-white outline-none"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onPreview(file); }} className="cursor-pointer"><Eye className="h-4 w-4 mr-2" />Preview</DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDownload(file); }} className="cursor-pointer"><Download className="h-4 w-4 mr-2" />Download</DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRename(file); }} className="cursor-pointer"><Pencil className="h-4 w-4 mr-2" />Rename</DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMove(file); }} className="cursor-pointer"><Move className="h-4 w-4 mr-2" />Move</DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(file); }} className="text-red-400 focus:text-red-400 cursor-pointer"><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
