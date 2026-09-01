import { Header } from "@/components/layout/header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MOCK_CAMPAIGNS } from "@/lib/mock-data";
import { Plus } from "lucide-react";

export default function CampaignsPage() {
  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header
        title="Outbound Campaigns"
        description="Organize lead batches by ICP, core value proposition, target geography, and strategic objective."
      />

      <div className="p-8 space-y-6 max-w-7xl w-full mx-auto">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs bg-white">
            {MOCK_CAMPAIGNS.length} Campaigns Configured (Demo)
          </Badge>
          <Button size="sm" className="text-xs">
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Create Campaign
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_CAMPAIGNS.map((campaign) => (
            <Card key={campaign.id} className="flex flex-col justify-between">
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between">
                  <Badge
                    variant={campaign.status === "active" ? "success" : "secondary"}
                    className="capitalize text-[10px]"
                  >
                    {campaign.status}
                  </Badge>
                  <span className="text-[11px] text-zinc-400">
                    {campaign.target_region}
                  </span>
                </div>
                <div>
                  <CardTitle className="text-base">{campaign.name}</CardTitle>
                  <CardDescription className="text-xs mt-1 line-clamp-2">
                    {campaign.description}
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200/60 space-y-2 text-xs">
                  <div>
                    <span className="text-zinc-500 font-medium">ICP Profile: </span>
                    <span className="text-zinc-800">{campaign.icp_description}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 font-medium">Strategic Objective: </span>
                    <span className="text-zinc-800">{campaign.campaign_objective}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 font-medium">Core Offer: </span>
                    <span className="text-zinc-800">{campaign.offer_description}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 border-t border-zinc-100 text-center">
                  <div>
                    <div className="text-base font-bold text-zinc-900">
                      {campaign.lead_count}
                    </div>
                    <div className="text-[10px] text-zinc-500">Enrolled Leads</div>
                  </div>
                  <div>
                    <div className="text-base font-bold text-zinc-900">
                      {campaign.active_sequences_count}
                    </div>
                    <div className="text-[10px] text-zinc-500">Active Seq</div>
                  </div>
                  <div>
                    <div className="text-base font-bold text-emerald-600">
                      {campaign.replies_count}
                    </div>
                    <div className="text-[10px] text-zinc-500">Replies</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    Manage Campaign
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
