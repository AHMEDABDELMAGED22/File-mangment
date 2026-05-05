"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Loader2 } from "lucide-react";
import { registerFileAction } from "@/actions/file.actions";
import { toast } from "sonner";
import { MAX_FILE_SIZE } from "@/lib/constants";

interface Props {
  workspaceId: string;
  folderId?: string | null;
  onUploadComplete?: () => void;
}

export function UploadDropzone({ workspaceId, folderId, onUploadComplete }: Props) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    setUploading(true);
    setProgress([]);

    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("You must be logged in to upload files");
      setUploading(false);
      return;
    }

    for (const file of acceptedFiles) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
        continue;
      }
      
      setProgress((p) => [...p, `Uploading ${file.name}...`]);
      
      try {
        const fileId = crypto.randomUUID();
        const ext = file.name.split('.').pop();
        // Sanitize name for storage (ASCII only)
        const storageSafeName = file.name.replace(/[^\x00-\x7F]/g, "").replace(/\s+/g, "_");
        const storagePath = `${user.id}/${fileId}_${storageSafeName}`;

        // 1. Direct upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from("files")
          .upload(storagePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // 2. Register metadata in DB via Server Action
        const result = await registerFileAction(workspaceId, folderId || null, {
          id: fileId,
          name: file.name,
          storage_path: storagePath,
          mime_type: file.type || "application/octet-stream",
          size_bytes: file.size,
        });

        if (result.error) throw new Error(result.error);
        
        toast.success(`${file.name} uploaded successfully`);
      } catch (err: any) {
        toast.error(`Failed to upload ${file.name}: ${err.message}`);
      }
    }

    setUploading(false);
    setProgress([]);
    onUploadComplete?.();
  }, [workspaceId, folderId, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: uploading,
    multiple: true,
  });

  return (
    <div
      {...getRootProps()}
      className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
        isDragActive
          ? "border-violet-500 bg-violet-500/10"
          : "border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/30"
      } ${uploading ? "pointer-events-none opacity-60" : ""}`}
    >
      <input {...getInputProps()} />
      {uploading ? (
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 text-violet-400 animate-spin" />
          <p className="text-sm text-zinc-400">{progress[progress.length - 1] || "Uploading..."}</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div className="h-12 w-12 rounded-xl bg-zinc-800 flex items-center justify-center">
            <Upload className="h-6 w-6 text-zinc-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-300">
              {isDragActive ? "Drop files here" : "Drag & drop files here"}
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              or click to browse · Max {MAX_FILE_SIZE / 1024 / 1024}MB per file
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
