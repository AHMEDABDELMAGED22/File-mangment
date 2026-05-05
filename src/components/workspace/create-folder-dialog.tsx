"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createFolderAction } from "@/actions/workspace.actions";
import { toast } from "sonner";
import { Loader2, FolderPlus } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  parentFolderId?: string | null;
}

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white">
      {pending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FolderPlus className="h-4 w-4 mr-2" />}
      {pending ? "Creating..." : "Create Folder"}
    </Button>
  );
}

export function CreateFolderDialog({ open, onOpenChange, workspaceId, parentFolderId }: Props) {
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    formData.set("workspace_id", workspaceId);
    if (parentFolderId) formData.set("parent_folder_id", parentFolderId);
    const result = await createFolderAction(formData);
    if (result.error) {
      setError(result.error);
      toast.error(result.error);
    } else {
      toast.success("Folder created");
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-white">Create New Folder</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
          <div className="space-y-2">
            <Label htmlFor="folder-name" className="text-zinc-300">Folder Name</Label>
            <Input id="folder-name" name="name" placeholder="My Folder" required autoFocus className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-violet-500" />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-zinc-400">Cancel</Button>
            <SubmitBtn />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
