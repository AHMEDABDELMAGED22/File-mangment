"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileText, X } from "lucide-react";
import type { FileRecord } from "@/lib/types";

interface Props {
  file: FileRecord | null;
  url: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: (file: FileRecord) => void;
}

export function PreviewDialog({ file, url, open, onOpenChange, onDownload }: Props) {
  if (!file) return null;

  const isImage = file.mime_type.startsWith("image/");
  const isPDF = file.mime_type === "application/pdf";
  const isVideo = file.mime_type.startsWith("video/");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[70vw] w-full h-[85vh] bg-zinc-900 border-zinc-800 p-0 overflow-hidden flex flex-col gap-0 shadow-2xl">
        <DialogHeader className="p-4 border-b border-zinc-800 flex flex-row items-center justify-between shrink-0 space-y-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <FileText className="h-4 w-4 text-violet-400" />
            </div>
            <div>
              <DialogTitle className="text-sm font-medium text-white truncate max-w-[200px] sm:max-w-md">
                {file.name}
              </DialogTitle>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{file.mime_type}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-zinc-700 bg-zinc-800/50 hover:bg-zinc-700 text-zinc-300"
              onClick={() => onDownload(file)}
            >
              <Download className="h-3.5 w-3.5 mr-2" />
              Download
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 bg-zinc-950 flex items-center justify-center overflow-auto relative p-4">
          {!url ? (
            <div className="flex flex-col items-center gap-4 text-zinc-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
              <p className="text-sm">Loading preview...</p>
            </div>
          ) : isImage ? (
            <img 
              src={url} 
              alt={file.name} 
              className="max-w-full max-h-full object-contain shadow-2xl rounded-sm" 
            />
          ) : isPDF ? (
            <iframe 
              src={`${url}#toolbar=0`} 
              className="w-full h-full border-none rounded-sm bg-white"
              title={file.name}
            />
          ) : isVideo ? (
            <video 
              src={url} 
              controls 
              className="max-w-full max-h-full rounded-sm shadow-2xl" 
            />
          ) : (
            <div className="text-center space-y-4 max-w-sm px-6">
              <div className="h-16 w-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-zinc-600" />
              </div>
              <h3 className="text-lg font-semibold text-white">No Preview Available</h3>
              <p className="text-sm text-zinc-500">
                This file type doesn't support direct preview. Please download it to view the content.
              </p>
              <Button 
                onClick={() => onDownload(file)}
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                Download File
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
