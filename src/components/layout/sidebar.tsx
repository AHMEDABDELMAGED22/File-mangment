"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types";
import { Shield, LayoutDashboard, FolderOpen, Settings, Users, ChevronLeft, ChevronRight, GraduationCap, BrainCircuit } from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  profile: Profile;
  workspaceId: string;
}

const getNavItems = (workspaceId: string, isAdmin: boolean) => {
  const items = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: `/workspace/${workspaceId}`, label: "My Files", icon: FolderOpen },
    { href: "/grades", label: "Your Grades", icon: GraduationCap },
    { href: "/quiz", label: "AI Quiz", icon: BrainCircuit },
    { href: "/settings", label: "Settings", icon: Settings },
  ];
  if (isAdmin) {
    items.splice(4, 0, { href: "/admin", label: "Admin", icon: Users });
  }
  return items;
};

export function Sidebar({ profile, workspaceId }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const navItems = getNavItems(workspaceId, profile.role === "admin");

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col fixed inset-y-0 left-0 z-30 border-r border-zinc-800 bg-zinc-950/95 backdrop-blur-xl transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}>
        {/* Logo */}
        <div className="h-16 flex items-center gap-2 px-4 border-b border-zinc-800">
          <div className="h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-zinc-800">
            <img src="/logo.png" alt="AntiDrive Logo" className="h-full w-full object-cover" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              AntiDrive
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-violet-500/10 text-violet-400 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                )}
              >
                <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-violet-400")} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="p-2 border-t border-zinc-800">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center py-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </aside>
    </>
  );
}
