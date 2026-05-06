"use client";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { deleteUserAction } from "@/actions/admin.actions";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
}

export function DeleteUserDialog({ open, onOpenChange, userId, userName }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const formData = new FormData();
    formData.set("user_id", userId);
    
    const result = await deleteUserAction(formData);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("User account deleted permanently");
      onOpenChange(false);
      router.refresh();
    }
    
    setDeleting(false);
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-zinc-900 border-zinc-800">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-red-500">Delete Account: {userName}?</AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-400">
            Are you absolutely sure you want to permanently delete this user?
            <br /><br />
            <span className="text-red-400 font-semibold">Warning:</span> This will permanently delete their account, their workspace, and all their physical files. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-zinc-300">Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }} 
            disabled={deleting} 
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {deleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {deleting ? "Deleting..." : "Permanently Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
