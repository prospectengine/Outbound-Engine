import * as React from "react";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  isPlaceholder?: boolean;
  highlight?: boolean;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  isPlaceholder = true,
  highlight = false,
}: StatCardProps) {
  return (
    <Card className={cn("transition-all", highlight && "border-amber-200 bg-amber-50/20")}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-500">{title}</span>
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              highlight ? "bg-amber-100 text-amber-700" : "bg-zinc-100 text-zinc-600"
            )}
          >
            <Icon className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <div className="text-2xl font-bold tracking-tight text-zinc-900">
            {value}
          </div>
          {isPlaceholder && (
            <span className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider bg-zinc-100 px-1.5 py-0.5 rounded">
              Demo
            </span>
          )}
        </div>

        {subtitle && (
          <p className="mt-1 text-xs text-zinc-500 flex items-center justify-between">
            <span>{subtitle}</span>
            {trend && <span className="font-medium text-zinc-700">{trend}</span>}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
