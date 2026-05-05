"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";

interface Props { basePath: string; }

export function SortControls({ basePath }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sortBy = searchParams.get("sort") || "name";
  const sortOrder = searchParams.get("order") || "asc";

  function update(key: string, val: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, val);
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={sortBy} onValueChange={(v) => v && update("sort", v)}>
        <SelectTrigger className="w-32 h-9 bg-zinc-800/50 border-zinc-700 text-zinc-300 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-zinc-900 border-zinc-800">
          <SelectItem value="name">Name</SelectItem>
          <SelectItem value="created_at">Date</SelectItem>
          <SelectItem value="size">Size</SelectItem>
        </SelectContent>
      </Select>
      <Select value={sortOrder} onValueChange={(v) => v && update("order", v)}>
        <SelectTrigger className="w-24 h-9 bg-zinc-800/50 border-zinc-700 text-zinc-300 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-zinc-900 border-zinc-800">
          <SelectItem value="asc">Asc</SelectItem>
          <SelectItem value="desc">Desc</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
