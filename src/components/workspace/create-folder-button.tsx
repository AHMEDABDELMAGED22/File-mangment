"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FolderPlus } from "lucide-react";
import { CreateFolderDialog } from "./create-folder-dialog";

interface Props {
  workspaceId: string;
  parentFolderId: string | null;
}

export function CreateFolderButton({ workspaceId, parentFolderId }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm" className="bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white h-9">
        <FolderPlus className="h-4 w-4 mr-2" /> New Folder
      </Button>
      <CreateFolderDialog open={open} onOpenChange={setOpen} workspaceId={workspaceId} parentFolderId={parentFolderId} />
    </>
  );
}
