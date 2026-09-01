import { Header } from "@/components/layout/header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Cpu, Database, Mail, FileSpreadsheet } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header
        title="Settings & System Configuration"
        description="View architectural parameters, integration boundaries, and QA threshold controls."
      />

      <div className="p-8 space-y-6 max-w-5xl w-full mx-auto">
        {/* Architectural Overview Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-zinc-700" />
              <CardTitle className="text-base">System Architecture Profile (V1)</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Outbound Engine V1 configuration status and environment boundary definition
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs divide-y divide-zinc-100">
            <div className="flex items-center justify-between pt-2">
              <div className="space-y-0.5">
                <div className="font-semibold text-zinc-900 flex items-center">
                  <Cpu className="w-4 h-4 mr-2 text-zinc-500" />
                  AI Inference Target
                </div>
                <div className="text-zinc-500 text-[11px]">
                  Vercel AI SDK configured against NVIDIA NIM
                </div>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                Nemotron 3.5 Lightning 30B A3B
              </Badge>
            </div>

            <div className="flex items-center justify-between pt-3">
              <div className="space-y-0.5">
                <div className="font-semibold text-zinc-900 flex items-center">
                  <Database className="w-4 h-4 mr-2 text-zinc-500" />
                  Database Engine
                </div>
                <div className="text-zinc-500 text-[11px]">
                  PostgreSQL with Row Level Security (RLS) & Supabase JS client
                </div>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                Supabase / PostgreSQL
              </Badge>
            </div>

            <div className="flex items-center justify-between pt-3">
              <div className="space-y-0.5">
                <div className="font-semibold text-zinc-900 flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-zinc-500" />
                  Email Dispatch Transport
                </div>
                <div className="text-zinc-500 text-[11px]">
                  Google Workspace OAuth 2.0 with thread tracking & reply detection
                </div>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                Gmail API
              </Badge>
            </div>

            <div className="flex items-center justify-between pt-3">
              <div className="space-y-0.5">
                <div className="font-semibold text-zinc-900 flex items-center">
                  <FileSpreadsheet className="w-4 h-4 mr-2 text-zinc-500" />
                  Import / Export Transit
                </div>
                <div className="text-zinc-500 text-[11px]">
                  External lead ingestion and campaign status synchronization
                </div>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                Google Sheets API / CSV
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* QA Threshold Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">50-Point QA Threshold</CardTitle>
            <CardDescription className="text-xs">
              Quality gate parameters governing automatic approval routing vs. regeneration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg border border-zinc-200">
              <div>
                <span className="font-semibold text-zinc-900">Passing Score Threshold: </span>
                <span className="text-zinc-700">40 / 50 points</span>
              </div>
              <Badge variant="success" className="text-xs">
                Target: 40/50 Minimum
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg border border-zinc-200">
              <div>
                <span className="font-semibold text-zinc-900">Max Auto-Regeneration Attempts: </span>
                <span className="text-zinc-700">3 retries before flagging for manual review</span>
              </div>
              <Badge variant="outline" className="text-xs">
                3 Attempts Max
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
