import { Header } from "@/components/layout/header";
import { StatCard } from "@/components/dashboard/stat-card";
import { ApprovalQueuePreview } from "@/components/dashboard/approval-queue-preview";
import { RecentActivityList } from "@/components/dashboard/recent-activity-list";
import { CampaignStatusPreview } from "@/components/dashboard/campaign-status-preview";
import {
  Users,
  Target,
  Clock,
  Send,
  MessageSquare,
  StopCircle,
} from "lucide-react";
import {
  MOCK_METRICS,
  MOCK_EMAILS_FOR_APPROVAL,
  MOCK_ACTIVITIES,
  MOCK_CAMPAIGNS,
} from "@/lib/mock-data";

export default function DashboardPage() {
  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header
        title="Outbound Operations Dashboard"
        description="Monitor lead progression, review AI-generated drafts, and track campaign outcomes."
      />

      <div className="p-8 space-y-6 max-w-7xl w-full mx-auto">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            title="Total Leads"
            value={MOCK_METRICS.totalLeads}
            icon={Users}
            subtitle="Across all campaigns"
          />
          <StatCard
            title="Active Campaigns"
            value={MOCK_METRICS.activeCampaigns}
            icon={Target}
            subtitle="Currently enrolling"
          />
          <StatCard
            title="Awaiting Approval"
            value={MOCK_METRICS.emailsAwaitingApproval}
            icon={Clock}
            subtitle="Passed 50-pt QA"
            highlight={true}
          />
          <StatCard
            title="Emails Sent"
            value={MOCK_METRICS.emailsSent}
            icon={Send}
            subtitle="Dispatched via Gmail"
          />
          <StatCard
            title="Replies"
            value={MOCK_METRICS.replies}
            icon={MessageSquare}
            subtitle="Inbound responses"
          />
          <StatCard
            title="Sequences Stopped"
            value={MOCK_METRICS.sequencesStopped}
            icon={StopCircle}
            subtitle="Reply or manual stop"
          />
        </div>

        {/* Core Operational Section: Approval Queue & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ApprovalQueuePreview emails={MOCK_EMAILS_FOR_APPROVAL} />
          <RecentActivityList activities={MOCK_ACTIVITIES} />
        </div>

        {/* Campaign Status Preview */}
        <CampaignStatusPreview campaigns={MOCK_CAMPAIGNS} />
      </div>
    </div>
  );
}
