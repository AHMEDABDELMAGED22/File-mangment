"use client";

import { AlertCircle, HardDrive, Info } from "lucide-react";

interface Props {
  usedBytes: number;
  totalBytes?: number; // Default to 1GB
}

export function StorageWarning({ usedBytes, totalBytes = 1024 * 1024 * 1024 }: Props) {
  const usedMB = (usedBytes / (1024 * 1024)).toFixed(1);
  const totalMB = (totalBytes / (1024 * 1024)).toFixed(0);
  const percentage = Math.min(100, (usedBytes / totalBytes) * 100);

  const isCritical = percentage > 85;
  const isWarning = percentage > 60;

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-zinc-400">
          <HardDrive className="h-4 w-4" />
          <span className="text-sm font-medium">مساحة التخزين (Storage)</span>
        </div>
        <span className={`text-xs font-mono ${isCritical ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-zinc-500'}`}>
          {usedMB}MB / {totalMB}MB ({percentage.toFixed(1)}%)
        </span>
      </div>
      
      {/* Custom Progress Bar */}
      <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ${
            isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-violet-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {isCritical ? (
        <div className="flex items-start gap-2 text-[11px] text-red-400 bg-red-400/5 p-2 rounded-lg border border-red-400/10">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <p>
            المساحة ممتلئة تقريباً! قد يفشل الطلاب في رفع ملفات جديدة. يرجى مسح بعض الملفات.
          </p>
        </div>
      ) : (
        <div className="flex items-start gap-2 text-[11px] text-zinc-500 bg-zinc-800/20 p-2 rounded-lg">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-zinc-600" />
          <p>
            تنبيه: سعة التخزين الكلية 1GB. يفضل ألا يتجاوز كل طالب 5MB لضمان مساحة للجميع.
          </p>
        </div>
      )}
    </div>
  );
}
