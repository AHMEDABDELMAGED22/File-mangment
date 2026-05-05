"use client";

import { Folder as FolderIcon, MoreVertical } from "lucide-react";
import Link from "next/link";
import type { Folder } from "@/lib/types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Pencil, Move, Trash2 } from "lucide-react";

interface Props {
  folder: Folder;
  workspaceId: string;
  onRename: (folder: Folder) => void;
  onMove: (folder: Folder) => void;
  onDelete: (folder: Folder) => void;
}

export function FolderCard({ folder, workspaceId, onRename, onMove, onDelete }: Props) {
  return (
    <div className="group relative flex items-center gap-3 p-3 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/50 hover:border-zinc-700 transition-all duration-200 cursor-pointer">
      <Link href={`/workspace/${workspaceId}/folder/${folder.id}`} className="flex items-center gap-3 flex-1 min-w-0">
        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center shrink-0">
          <FolderIcon className="h-5 w-5 text-amber-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-200 truncate">{folder.name}</p>
          <p className="text-xs text-zinc-500">{new Date(folder.created_at).toLocaleDateString()}</p>
        </div>
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-zinc-700 transition-all text-zinc-400 hover:text-white outline-none"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
          <DropdownMenuItem onClick={() => onRename(folder)} className="cursor-pointer"><Pencil className="h-4 w-4 mr-2" />Rename</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onMove(folder)} className="cursor-pointer"><Move className="h-4 w-4 mr-2" />Move</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDelete(folder)} className="text-red-400 focus:text-red-400 cursor-pointer"><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
