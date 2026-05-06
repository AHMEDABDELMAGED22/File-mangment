"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { renameFolderAction } from "@/actions/workspace.actions";
import { renameFileAction } from "@/actions/file.actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  currentName: string;
  type: "folder" | "file";
}

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white">
      {pending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
      {pending ? "Renaming..." : "Rename"}
    </Button>
  );
}

export function RenameDialog({ open, onOpenChange, itemId, currentName, type }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    if (type === "folder") {
      formData.set("folder_id", itemId);
      const result = await renameFolderAction(formData);
      if (result.error) { setError(result.error); toast.error(result.error); }
      else { toast.success("Folder renamed"); onOpenChange(false); router.refresh(); }
    } else {
      formData.set("file_id", itemId);
      const result = await renameFileAction(formData);
      if (result.error) { setError(result.error); toast.error(result.error); }
      else { toast.success("File renamed"); onOpenChange(false); router.refresh(); }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800">
        <DialogHeader><DialogTitle className="text-white">Rename {type}</DialogTitle></DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
          <div className="space-y-2">
            <Label htmlFor="rename-input" className="text-zinc-300">New Name</Label>
            <Input id="rename-input" name="name" defaultValue={currentName} required autoFocus className="bg-zinc-800/50 border-zinc-700 text-white focus:border-violet-500" />
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
