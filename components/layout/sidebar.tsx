"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Target,
  Layers,
  Search,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Leads",
    href: "/leads",
    icon: Users,
  },
  {
    name: "Campaigns",
    href: "/campaigns",
    icon: Target,
  },
  {
    name: "Sequences",
    href: "/sequences",
    icon: Layers,
  },
  {
    name: "Research",
    href: "/research",
    icon: Search,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-zinc-200 bg-zinc-900 text-zinc-300 flex flex-col h-screen shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-zinc-800">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-950 font-bold text-sm tracking-tight">
            OE
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white tracking-tight">
              Outbound Engine
            </h1>
            <p className="text-[11px] text-zinc-400 font-normal leading-tight">
              Research-driven B2B
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">
          Application
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors group",
                isActive
                  ? "bg-zinc-800 text-white font-semibold"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 mr-3 transition-colors",
                  isActive
                    ? "text-zinc-100"
                    : "text-zinc-400 group-hover:text-zinc-200"
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer Info Box */}
      <div className="p-4 border-t border-zinc-800">
        <div className="rounded-lg bg-zinc-800/50 p-3 border border-zinc-700/50 text-xs">
          <div className="flex items-center text-zinc-200 font-medium mb-1">
            <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
            <span>Human-in-the-Loop</span>
          </div>
          <p className="text-zinc-400 text-[11px] leading-relaxed">
            All messages require manual QA approval before dispatch.
          </p>
        </div>
      </div>
    </aside>
  );
}
