import { Skeleton } from "@/components/ui/skeleton";

export function WorkspaceSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-32 bg-zinc-800" />
        <Skeleton className="h-5 w-4 bg-zinc-800" />
        <Skeleton className="h-5 w-24 bg-zinc-800" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-64 bg-zinc-800" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32 bg-zinc-800" />
          <Skeleton className="h-9 w-32 bg-zinc-800" />
        </div>
      </div>
      <div>
        <Skeleton className="h-4 w-16 mb-3 bg-zinc-800" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl bg-zinc-800" />
          ))}
        </div>
      </div>
    </div>
  );
}
