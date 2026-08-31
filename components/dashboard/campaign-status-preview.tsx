import { Campaign } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface CampaignStatusPreviewProps {
  campaigns: Campaign[];
}

export function CampaignStatusPreview({ campaigns }: CampaignStatusPreviewProps) {
  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base">Active Campaigns</CardTitle>
        </div>
        <Link
          href="/campaigns"
          className="text-xs text-zinc-600 hover:text-zinc-900 flex items-center font-medium"
        >
          <span>View Campaigns</span>
          <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
        </Link>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {campaigns.map((camp) => (
            <div
              key={camp.id}
              className="p-4 rounded-lg border border-zinc-200 bg-white hover:border-zinc-300 transition-colors space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm text-zinc-900 leading-snug line-clamp-1">
                    {camp.name}
                  </h4>
                  <p className="text-[11px] text-zinc-500 line-clamp-2">
                    {camp.icp_description}
                  </p>
                </div>
                <Badge
                  variant={camp.status === "active" ? "success" : "secondary"}
                  className="capitalize text-[10px]"
                >
                  {camp.status}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-100 text-center">
                <div>
                  <div className="text-xs font-bold text-zinc-900">
                    {camp.lead_count ?? 0}
                  </div>
                  <div className="text-[10px] text-zinc-400">Leads</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-900">
                    {camp.active_sequences_count ?? 0}
                  </div>
                  <div className="text-[10px] text-zinc-400">Active Seq</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-600">
                    {camp.replies_count ?? 0}
                  </div>
                  <div className="text-[10px] text-zinc-400">Replies</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
