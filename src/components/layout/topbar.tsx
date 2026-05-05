"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import type { Profile } from "@/lib/types";
import { signOut } from "@/actions/auth.actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LogOut, Settings, Menu, Shield, LayoutDashboard, FolderOpen, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopbarProps {
  profile: Profile;
}

export function Topbar({ profile }: TopbarProps) {
  const pathname = usePathname();
  const initials = profile.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const pageTitle = pathname.startsWith("/admin") ? "Admin" : pathname.startsWith("/settings") ? "Settings" : pathname.startsWith("/workspace") ? "My Files" : "Dashboard";

  return (
    <header className="h-16 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl flex items-center justify-between px-4 md:px-6 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger
            render={<Button variant="ghost" size="icon" className="lg:hidden text-zinc-400 hover:text-white" />}
          >
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-64 bg-zinc-950 border-zinc-800 p-0">
            <div className="h-16 flex items-center gap-2 px-4 border-b border-zinc-800">
              <div className="h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-zinc-800">
                <img src="/logo.png" alt="AntiDrive Logo" className="h-full w-full object-cover" />
              </div>
              <span className="text-lg font-bold text-white">AntiDrive</span>
            </div>
            <nav className="py-4 px-2 space-y-1">
              {[
                { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
                { href: "/workspace", label: "My Files", icon: FolderOpen },
                ...(profile.role === "admin" ? [{ href: "/admin", label: "Admin", icon: Users }] : []),
                { href: "/settings", label: "Settings", icon: Settings },
              ].map((item) => (
                <Link key={item.href} href={item.href} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors", pathname.startsWith(item.href) ? "bg-violet-500/10 text-violet-400" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50")}>
                  <item.icon className="h-5 w-5" /><span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
        <h2 className="text-lg font-semibold text-white">{pageTitle}</h2>
      </div>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 hover:opacity-80 transition-opacity outline-none">
          <Avatar className="h-8 w-8 border border-zinc-700">
            <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-xs font-medium">{initials}</AvatarFallback>
          </Avatar>
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium text-zinc-200">{profile.full_name || "User"}</p>
            <p className="text-xs text-zinc-500 capitalize">{profile.role}</p>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-zinc-900 border-zinc-800">
          <DropdownMenuItem className="cursor-pointer" onClick={() => window.location.href = "/settings"}>
            <Settings className="h-4 w-4 mr-2" />Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-zinc-800" />
          <DropdownMenuItem onClick={() => signOut()} className="text-red-400 focus:text-red-400 cursor-pointer">
            <LogOut className="h-4 w-4 mr-2" />Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
