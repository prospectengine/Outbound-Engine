import { createClient } from "@/lib/supabase/server";
import { ServiceError } from "./errors";

export interface DashboardMetrics {
  totalLeads: number;
  activeCampaigns: number;
  emailsAwaitingApproval: number;
  emailsSent: number;
  replies: number;
  sequencesStopped: number;
}

/**
 * Derives aggregate operational metrics for the authenticated tenant.
 * Uses exact authoritative conditions for all counts.
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const supabase = await createClient();

  const [
    leadsResult,
    campaignsResult,
    pendingEmailsResult,
    sentEmailsResult,
    repliesResult,
    stoppedSequencesResult,
  ] = await Promise.all([
    supabase.from("leads").select("*", { count: "exact", head: true }),
    supabase
      .from("campaigns")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("emails")
      .select("*", { count: "exact", head: true })
      .eq("approval_status", "pending_approval")
      .eq("sending_status", "unapproved"),
    supabase
      .from("emails")
      .select("*", { count: "exact", head: true })
      .eq("sending_status", "sent"),
    supabase.from("replies").select("*", { count: "exact", head: true }),
    supabase
      .from("sequences")
      .select("*", { count: "exact", head: true })
      .in("status", ["stopped_replied", "stopped_manual"]),
  ]);

  if (leadsResult.error) {
    throw new ServiceError(
      "metrics-service",
      `Failed to count total leads: ${leadsResult.error.message}`,
      leadsResult.error.code,
      leadsResult.error.details
    );
  }

  if (campaignsResult.error) {
    throw new ServiceError(
      "metrics-service",
      `Failed to count active campaigns: ${campaignsResult.error.message}`,
      campaignsResult.error.code,
      campaignsResult.error.details
    );
  }

  if (pendingEmailsResult.error) {
    throw new ServiceError(
      "metrics-service",
      `Failed to count pending emails: ${pendingEmailsResult.error.message}`,
      pendingEmailsResult.error.code,
      pendingEmailsResult.error.details
    );
  }

  if (sentEmailsResult.error) {
    throw new ServiceError(
      "metrics-service",
      `Failed to count sent emails: ${sentEmailsResult.error.message}`,
      sentEmailsResult.error.code,
      sentEmailsResult.error.details
    );
  }

  if (repliesResult.error) {
    throw new ServiceError(
      "metrics-service",
      `Failed to count inbound replies: ${repliesResult.error.message}`,
      repliesResult.error.code,
      repliesResult.error.details
    );
  }

  if (stoppedSequencesResult.error) {
    throw new ServiceError(
      "metrics-service",
      `Failed to count stopped sequences: ${stoppedSequencesResult.error.message}`,
      stoppedSequencesResult.error.code,
      stoppedSequencesResult.error.details
    );
  }

  return {
    totalLeads: leadsResult.count ?? 0,
    activeCampaigns: campaignsResult.count ?? 0,
    emailsAwaitingApproval: pendingEmailsResult.count ?? 0,
    emailsSent: sentEmailsResult.count ?? 0,
    replies: repliesResult.count ?? 0,
    sequencesStopped: stoppedSequencesResult.count ?? 0,
  };
}
