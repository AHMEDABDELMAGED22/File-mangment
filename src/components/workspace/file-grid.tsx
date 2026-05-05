"use client";

import { useState, useCallback } from "react";
import type { Folder, FileRecord } from "@/lib/types";
import { FolderCard } from "./folder-card";
import { FileCard } from "./file-card";
import { EmptyState } from "./empty-state";
import { RenameDialog } from "./rename-dialog";
import { DeleteDialog } from "./delete-dialog";
import { MoveDialog } from "./move-dialog";
import { downloadFileAction } from "@/actions/file.actions";
import { toast } from "sonner";

interface Props {
  folders: Folder[];
  files: FileRecord[];
  allFolders: Folder[];
  workspaceId: string;
  currentFolderId?: string | null;
  isEmpty: boolean;
  isSearch?: boolean;
}

export function FileGrid({ folders, files, allFolders, workspaceId, currentFolderId, isEmpty, isSearch }: Props) {
  const [renameItem, setRenameItem] = useState<{ id: string; name: string; type: "folder" | "file" } | null>(null);
  const [deleteItem, setDeleteItem] = useState<{ id: string; name: string; type: "folder" | "file" } | null>(null);
  const [moveItem, setMoveItem] = useState<{ id: string; name: string; type: "folder" | "file" } | null>(null);

  const handleDownload = useCallback(async (file: FileRecord) => {
    const result = await downloadFileAction(file.id);
    if (result.error) { toast.error(result.error); return; }
    if (result.url) window.open(result.url, "_blank");
  }, []);

  if (isEmpty) {
    return <EmptyState type={isSearch ? "search" : currentFolderId ? "folder" : "workspace"} />;
  }

  return (
    <>
      <div className="space-y-6">
        {folders.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Folders</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
              {folders.map((f) => (
                <FolderCard key={f.id} folder={f} workspaceId={workspaceId}
                  onRename={(f) => setRenameItem({ id: f.id, name: f.name, type: "folder" })}
                  onMove={(f) => setMoveItem({ id: f.id, name: f.name, type: "folder" })}
                  onDelete={(f) => setDeleteItem({ id: f.id, name: f.name, type: "folder" })}
                />
              ))}
            </div>
          </div>
        )}
        {files.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Files</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
              {files.map((f) => (
                <FileCard key={f.id} file={f}
                  onRename={(f) => setRenameItem({ id: f.id, name: f.name, type: "file" })}
                  onMove={(f) => setMoveItem({ id: f.id, name: f.name, type: "file" })}
                  onDelete={(f) => setDeleteItem({ id: f.id, name: f.name, type: "file" })}
                  onDownload={handleDownload}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {renameItem && (
        <RenameDialog open={!!renameItem} onOpenChange={(o) => !o && setRenameItem(null)}
          itemId={renameItem.id} currentName={renameItem.name} type={renameItem.type} />
      )}
      {deleteItem && (
        <DeleteDialog open={!!deleteItem} onOpenChange={(o) => !o && setDeleteItem(null)}
          itemId={deleteItem.id} itemName={deleteItem.name} type={deleteItem.type} />
      )}
      {moveItem && (
        <MoveDialog open={!!moveItem} onOpenChange={(o) => !o && setMoveItem(null)}
          itemId={moveItem.id} itemName={moveItem.name} type={moveItem.type}
          folders={allFolders} currentFolderId={currentFolderId} />
      )}
    </>
  );
}
