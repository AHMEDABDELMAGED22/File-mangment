"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { moveFolderAction } from "@/actions/workspace.actions";
import { moveFileAction } from "@/actions/file.actions";
import { toast } from "sonner";
import { Loader2, FolderOpen, Home } from "lucide-react";
import type { Folder } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  itemName: string;
  type: "folder" | "file";
  folders: Folder[];
  currentFolderId?: string | null;
}

export function MoveDialog({ open, onOpenChange, itemId, itemName, type, folders, currentFolderId }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);

  async function handleMove() {
    setMoving(true);
    const formData = new FormData();
    if (type === "folder") {
      formData.set("folder_id", itemId);
      formData.set("target_parent_folder_id", selected || "");
      const result = await moveFolderAction(formData);
      if (result.error) toast.error(result.error);
      else { toast.success("Folder moved"); onOpenChange(false); }
    } else {
      formData.set("file_id", itemId);
      formData.set("target_folder_id", selected || "");
      const result = await moveFileAction(formData);
      if (result.error) toast.error(result.error);
      else { toast.success("File moved"); onOpenChange(false); }
    }
    setMoving(false);
  }

  const available = folders.filter((f) => f.id !== itemId && f.id !== currentFolderId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-white">Move &quot;{itemName}&quot;</DialogTitle>
        </DialogHeader>
        <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
          <button
            onClick={() => setSelected(null)}
            className={cn("w-full flex items-center gap-2 p-2.5 rounded-lg text-sm transition-colors", selected === null ? "bg-violet-500/10 text-violet-400 border border-violet-500/30" : "text-zinc-400 hover:bg-zinc-800")}
          >
            <Home className="h-4 w-4" /> Workspace Root
          </button>
          {available.map((f) => (
            <button
              key={f.id}
              onClick={() => setSelected(f.id)}
              className={cn("w-full flex items-center gap-2 p-2.5 rounded-lg text-sm transition-colors", selected === f.id ? "bg-violet-500/10 text-violet-400 border border-violet-500/30" : "text-zinc-400 hover:bg-zinc-800")}
            >
              <FolderOpen className="h-4 w-4" /> {f.name}
            </button>
          ))}
          {available.length === 0 && (
            <p className="text-sm text-zinc-500 text-center py-4">No other folders available</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-zinc-400">Cancel</Button>
          <Button onClick={handleMove} disabled={moving} className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
            {moving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {moving ? "Moving..." : "Move Here"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
