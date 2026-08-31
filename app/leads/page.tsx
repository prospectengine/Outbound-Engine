import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MOCK_LEADS } from "@/lib/mock-data";
import { Plus, Upload } from "lucide-react";

export default function LeadsPage() {
  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header
        title="Lead Management"
        description="View enrolled prospect profiles, individual lead objectives, and sequence progression."
      />

      <div className="p-8 space-y-6 max-w-7xl w-full mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs bg-white">
              {MOCK_LEADS.length} Leads Displayed (Demo)
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="text-xs">
              <Upload className="w-3.5 h-3.5 mr-1.5" />
              Import CSV / Sheets
            </Button>
            <Button size="sm" className="text-xs">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add Lead
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">Prospect</th>
                    <th className="py-3.5 px-4">Company & Industry</th>
                    <th className="py-3.5 px-4">Lead Objective</th>
                    <th className="py-3.5 px-4">Step</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Approval</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {MOCK_LEADS.map((lead) => (
                    <tr key={lead.id} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-zinc-900">
                          {lead.first_name} {lead.last_name}
                        </div>
                        <div className="text-zinc-500 text-[11px]">
                          {lead.job_title}
                        </div>
                        <div className="text-zinc-400 text-[10px]">
                          {lead.email}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-zinc-800">
                          {lead.company_name}
                        </div>
                        <div className="text-zinc-400 text-[11px]">
                          {lead.industry} • {lead.country}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-zinc-700 text-[11px] line-clamp-2">
                          {lead.lead_objective || "—"}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="outline" className="font-mono text-[10px]">
                          Touch {lead.current_step}/6
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            lead.outreach_status === "in_progress"
                              ? "success"
                              : lead.outreach_status === "stopped"
                              ? "warning"
                              : "secondary"
                          }
                          className="capitalize text-[10px]"
                        >
                          {lead.outreach_status.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            lead.approval_status === "approved"
                              ? "success"
                              : lead.approval_status === "pending"
                              ? "warning"
                              : "destructive"
                          }
                          className="capitalize text-[10px]"
                        >
                          {lead.approval_status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button variant="ghost" size="sm" className="h-7 text-xs">
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
