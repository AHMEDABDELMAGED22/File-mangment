"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import type { BreadcrumbItem } from "@/lib/types";
import { Breadcrumb, BreadcrumbItem as BItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

interface Props {
  workspaceId: string;
  workspaceName: string;
  items: BreadcrumbItem[];
}

export function WorkspaceBreadcrumbs({ workspaceId, workspaceName, items }: Props) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BItem>
          <BreadcrumbLink render={<Link href={`/workspace/${workspaceId}`} />} className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors">
            <Home className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{workspaceName}</span>
          </BreadcrumbLink>
        </BItem>
        {items.map((item, i) => (
          <span key={item.id} className="contents">
            <BreadcrumbSeparator><ChevronRight className="h-3.5 w-3.5 text-zinc-600" /></BreadcrumbSeparator>
            <BItem>
              {i === items.length - 1 ? (
                <BreadcrumbPage className="text-zinc-200 font-medium">{item.name}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink render={<Link href={item.href} />} className="text-zinc-400 hover:text-white transition-colors">
                  {item.name}
                </BreadcrumbLink>
              )}
            </BItem>
          </span>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
