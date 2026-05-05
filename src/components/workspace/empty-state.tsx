import { FolderOpen } from "lucide-react";

interface Props {
  type: "workspace" | "folder" | "search";
}

export function EmptyState({ type }: Props) {
  const messages = {
    workspace: { title: "Your workspace is empty", desc: "Create a folder or upload files to get started" },
    folder: { title: "This folder is empty", desc: "Upload files or create subfolders" },
    search: { title: "No results found", desc: "Try a different search term" },
  };
  const { title, desc } = messages[type];

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-16 w-16 rounded-2xl bg-zinc-800/50 border border-zinc-700 flex items-center justify-center mb-4">
        <FolderOpen className="h-8 w-8 text-zinc-500" />
      </div>
      <h3 className="text-lg font-medium text-zinc-300 mb-1">{title}</h3>
      <p className="text-sm text-zinc-500 max-w-sm">{desc}</p>
    </div>
  );
}
