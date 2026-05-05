"use client";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { deleteFolderAction } from "@/actions/workspace.actions";
import { deleteFileAction } from "@/actions/file.actions";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  itemName: string;
  type: "folder" | "file";
}

export function DeleteDialog({ open, onOpenChange, itemId, itemName, type }: Props) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const formData = new FormData();
    if (type === "folder") {
      formData.set("folder_id", itemId);
      const result = await deleteFolderAction(formData);
      if (result.error) toast.error(result.error);
      else toast.success("Folder deleted");
    } else {
      formData.set("file_id", itemId);
      const result = await deleteFileAction(formData);
      if (result.error) toast.error(result.error);
      else toast.success("File deleted");
    }
    setDeleting(false);
    onOpenChange(false);
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-zinc-900 border-zinc-800">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">Delete {type}?</AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-400">
            Are you sure you want to delete &quot;{itemName}&quot;?
            {type === "folder" && " All contents will be permanently deleted."}
            {" "}This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-zinc-300">Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white">
            {deleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {deleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
