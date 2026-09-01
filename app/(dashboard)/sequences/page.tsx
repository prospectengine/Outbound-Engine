import { Header } from "@/components/layout/header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MOCK_SEQUENCES } from "@/lib/mock-data";
import { Layers, Clock } from "lucide-react";

const TOUCH_FRAMEWORK = [
  { step: 1, name: "Relevance", purpose: "Trigger + Friction + Desired Outcome + Low-friction CTA" },
  { step: 2, name: "Reframe", purpose: "Alternative problem perspective and consequence exploration" },
  { step: 3, name: "Proof", purpose: "Verified customer metric and mechanism validation" },
  { step: 4, name: "Insight", purpose: "Stand-alone valuable observation without asking for purchase" },
  { step: 5, name: "Objection Removal", purpose: "Directly addressing common reasons for timing or bandwidth inaction" },
  { step: 6, name: "Decision Point", purpose: "Easy-exit fork (Yes / No / Later / Wrong Person)" },
];

export default function SequencesPage() {
  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header
        title="Sequence Execution"
        description="Monitor the 6-touch progression architecture and active cadence states."
      />

      <div className="p-8 space-y-6 max-w-7xl w-full mx-auto">
        {/* Sequence Framework Overview Card */}
        <Card className="bg-zinc-900 text-white border-zinc-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-zinc-300" />
                <CardTitle className="text-base text-white">
                  The 6-Touch Progressive Sequence Model
                </CardTitle>
              </div>
              <Badge variant="outline" className="text-zinc-300 border-zinc-700 text-xs">
                No &ldquo;Just Following Up&rdquo; Rule
              </Badge>
            </div>
            <CardDescription className="text-xs text-zinc-400">
              Each follow-up touch introduces new business value, evidence, or reframed insights.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3 pt-2">
              {TOUCH_FRAMEWORK.map((touch) => (
                <div
                  key={touch.step}
                  className="p-3 rounded bg-zinc-800/80 border border-zinc-700/60 space-y-1"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-200">
                    <span>Touch {touch.step}</span>
                  </div>
                  <div className="text-xs font-bold text-white">{touch.name}</div>
                  <p className="text-[11px] text-zinc-400 leading-snug">
                    {touch.purpose}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active Sequences List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Active Enrolled Sequences</CardTitle>
            <CardDescription className="text-xs">
              Live tracking of lead sequence cadences and reply detection halts
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Prospect</th>
                    <th className="py-3 px-4">Campaign</th>
                    <th className="py-3 px-4">Current Step</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Next Action</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {MOCK_SEQUENCES.map((seq) => (
                    <tr key={seq.id} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-zinc-900">
                        {seq.lead_name}
                        <div className="text-zinc-500 font-normal text-[11px]">
                          {seq.lead_company}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-zinc-700">
                        {seq.campaign_name}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="outline" className="font-mono text-[10px]">
                          Touch {seq.current_step} of 6
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            seq.status === "active"
                              ? "success"
                              : seq.status === "stopped_replied"
                              ? "info"
                              : "secondary"
                          }
                          className="capitalize text-[10px]"
                        >
                          {seq.status.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-zinc-600">
                        {seq.next_action ? (
                          <div className="flex items-center space-x-1 text-zinc-700 font-medium">
                            <Clock className="w-3 h-3 text-zinc-400" />
                            <span>{seq.next_action.replace("_", " ")}</span>
                          </div>
                        ) : (
                          <span className="text-zinc-400 italic">None (Halted)</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button variant="ghost" size="sm" className="h-7 text-xs">
                          Inspect
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
