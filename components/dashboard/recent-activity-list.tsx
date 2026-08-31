import { ActivityEvent } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  MessageSquare,
  CheckCircle,
  Mail,
  Search,
  Sparkles,
  StopCircle,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface RecentActivityListProps {
  activities: ActivityEvent[];
}

export function RecentActivityList({ activities }: RecentActivityListProps) {
  const getIcon = (type: ActivityEvent["activity_type"]) => {
    switch (type) {
      case "reply_detected":
        return <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />;
      case "sequence_stopped":
        return <StopCircle className="w-3.5 h-3.5 text-rose-600" />;
      case "email_approved":
        return <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />;
      case "qa_completed":
        return <Sparkles className="w-3.5 h-3.5 text-blue-600" />;
      case "email_sent":
        return <Mail className="w-3.5 h-3.5 text-zinc-600" />;
      default:
        return <Search className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  const getLabel = (type: ActivityEvent["activity_type"]) => {
    switch (type) {
      case "reply_detected":
        return "Inbound Reply Detected";
      case "sequence_stopped":
        return "Sequence Halted";
      case "email_approved":
        return "Email Approved";
      case "qa_completed":
        return "50-Pt QA Passed";
      case "email_sent":
        return "Dispatched via Gmail";
      default:
        return type.replace("_", " ");
    }
  };

  return (
    <Card className="col-span-full lg:col-span-1">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Recent Activity Log</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {activities.map((act) => (
          <div
            key={act.id}
            className="flex items-start space-x-3 text-xs pb-3 border-b border-zinc-100 last:border-0 last:pb-0"
          >
            <div className="mt-0.5 w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
              {getIcon(act.activity_type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-900">
                  {getLabel(act.activity_type)}
                </span>
                <span className="text-[10px] text-zinc-400">
                  {formatDate(act.created_at)}
                </span>
              </div>
              <p className="text-zinc-600 text-[11px] truncate mt-0.5">
                {act.lead_name}
              </p>
              {typeof act.metadata.snippet === "string" && (
                <p className="mt-1 text-[11px] text-zinc-700 bg-emerald-50/60 p-1.5 rounded border border-emerald-100 italic">
                  &ldquo;{act.metadata.snippet}&rdquo;
                </p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
