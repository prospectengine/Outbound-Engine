import { Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  title: string;
  description?: string;
}

export function Header({ title, description }: HeaderProps) {
  return (
    <header className="h-16 border-b border-zinc-200 bg-white px-8 flex items-center justify-between shrink-0">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 leading-tight">
          {title}
        </h2>
        {description && (
          <p className="text-xs text-zinc-500">{description}</p>
        )}
      </div>

      <div className="flex items-center space-x-3">
        <Badge variant="outline" className="bg-zinc-50 text-zinc-600 border-zinc-200 text-xs py-1">
          <Database className="w-3 h-3 mr-1.5 text-zinc-400" />
          <span>V1 UI Shell (Demo Mode)</span>
        </Badge>
        <div className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-xs font-semibold text-zinc-700">
          OE
        </div>
      </div>
    </header>
  );
}
