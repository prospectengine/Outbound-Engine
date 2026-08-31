import { EmailDraft } from "@/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

interface ApprovalQueuePreviewProps {
  emails: EmailDraft[];
}

export function ApprovalQueuePreview({ emails }: ApprovalQueuePreviewProps) {
  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <div className="flex items-center space-x-2">
            <CardTitle className="text-base">Approval Queue</CardTitle>
            <Badge variant="warning" className="text-[11px]">
              {emails.length} Pending
            </Badge>
          </div>
          <CardDescription className="text-xs mt-1">
            Generated drafts evaluated $\ge 40/50$ by 50-point QA, awaiting human review
          </CardDescription>
        </div>
        <Link href="/leads">
          <Button variant="outline" size="sm" className="text-xs flex items-center">
            <span>View All</span>
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {emails.map((email) => (
          <div
            key={email.id}
            className="p-4 rounded-lg border border-zinc-200 bg-zinc-50/50 hover:bg-zinc-50 transition-colors space-y-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-sm text-zinc-900">
                  {email.lead_name}
                </span>
                <span className="text-xs text-zinc-500 ml-2">
                  ({email.lead_company})
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="success" className="text-[10px]">
                  QA Score: {email.qa_score}/50
                </Badge>
                <Badge variant="outline" className="text-[10px] capitalize">
                  Touch {email.step_number} • {email.strategic_purpose}
                </Badge>
              </div>
            </div>

            <div className="bg-white p-3 rounded border border-zinc-200/80 text-xs text-zinc-800 font-mono space-y-1">
              <div className="text-zinc-500 font-sans font-medium text-[11px]">
                Subject: <span className="text-zinc-900">{email.subject_line}</span>
              </div>
              <div className="whitespace-pre-line text-zinc-700 font-sans text-xs pt-1">
                {email.body_generated}
              </div>
              {email.ps_text && (
                <div className="text-zinc-500 font-sans text-[11px] pt-1 italic">
                  {email.ps_text}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-zinc-400">
                Generated: {new Date(email.generated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
              <div className="flex items-center space-x-2">
                <Button size="sm" variant="outline" className="h-7 text-xs text-zinc-600">
                  Edit Copy
                </Button>
                <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Approve Draft
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
