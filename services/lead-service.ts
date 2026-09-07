import { createClient } from "@/lib/supabase/server";
import {
  Lead,
  EmailStatus,
  OutreachStatus,
  ApprovalStatus,
  ReplyStatus,
} from "@/types";
import { ServiceError } from "./errors";

type LeadWithAccount = {
  id: string;
  user_id: string;
  account_id: string | null;
  campaign_id: string;
  first_name: string;
  last_name: string;
  email: string;
  job_title: string | null;
  linkedin_url: string | null;
  country: string | null;
  industry: string | null;
  lead_objective: string | null;
  email_status: string;
  outreach_status: string;
  approval_status: string;
  reply_status: string;
  stop_sequence: boolean;
  current_step: number;
  next_action: string | null;
  next_action_date: string | null;
  created_at: string;
  updated_at: string;
  accounts: {
    id: string;
    company_name: string;
    domain: string | null;
    website: string | null;
    industry: string | null;
    company_size: string | null;
    country: string | null;
    region: string | null;
  } | null;
};

function mapRowToLead(row: LeadWithAccount): Lead {
  const validEmailStatuses: EmailStatus[] = [
    "unverified",
    "valid",
    "catch_all",
    "invalid",
  ];
  const email_status: EmailStatus = validEmailStatuses.includes(
    row.email_status as EmailStatus
  )
    ? (row.email_status as EmailStatus)
    : "unverified";

  const validOutreachStatuses: OutreachStatus[] = [
    "not_started",
    "in_progress",
    "paused",
    "completed",
    "stopped",
  ];
  const outreach_status: OutreachStatus = validOutreachStatuses.includes(
    row.outreach_status as OutreachStatus
  )
    ? (row.outreach_status as OutreachStatus)
    : "not_started";

  const validApprovalStatuses: ApprovalStatus[] = [
    "pending",
    "approved",
    "rejected",
  ];
  const approval_status: ApprovalStatus = validApprovalStatuses.includes(
    row.approval_status as ApprovalStatus
  )
    ? (row.approval_status as ApprovalStatus)
    : "pending";

  const validReplyStatuses: ReplyStatus[] = [
    "none",
    "replied_interested",
    "replied_not_interested",
    "replied_wrong_person",
    "replied_ooo",
  ];
  const reply_status: ReplyStatus = validReplyStatuses.includes(
    row.reply_status as ReplyStatus
  )
    ? (row.reply_status as ReplyStatus)
    : "none";

  const company_name = row.accounts?.company_name || "—";
  const industry = row.industry || row.accounts?.industry || "—";
  const country = row.country || row.accounts?.country || "—";

  return {
    id: row.id,
    user_id: row.user_id,
    account_id: row.account_id,
    campaign_id: row.campaign_id,
    first_name: row.first_name,
    last_name: row.last_name,
    email: row.email,
    job_title: row.job_title,
    company_name,
    linkedin_url: row.linkedin_url,
    country,
    industry,
    lead_objective: row.lead_objective,
    email_status,
    outreach_status,
    approval_status,
    reply_status,
    stop_sequence: row.stop_sequence,
    current_step: row.current_step,
    next_action: row.next_action,
    next_action_date: row.next_action_date,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function getLeads(): Promise<Lead[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("leads")
    .select(`
      id,
      user_id,
      account_id,
      campaign_id,
      first_name,
      last_name,
      email,
      job_title,
      linkedin_url,
      country,
      industry,
      lead_objective,
      email_status,
      outreach_status,
      approval_status,
      reply_status,
      stop_sequence,
      current_step,
      next_action,
      next_action_date,
      created_at,
      updated_at,
      accounts (
        id,
        company_name,
        domain,
        website,
        industry,
        company_size,
        country,
        region
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    throw new ServiceError(
      "lead-service",
      `Failed to retrieve leads: ${error.message}`,
      error.code,
      error.details
    );
  }

  if (!data || data.length === 0) {
    return [];
  }

  return (data as unknown as LeadWithAccount[]).map(mapRowToLead);
}

export async function getLeadById(id: string): Promise<Lead | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("leads")
    .select(`
      id,
      user_id,
      account_id,
      campaign_id,
      first_name,
      last_name,
      email,
      job_title,
      linkedin_url,
      country,
      industry,
      lead_objective,
      email_status,
      outreach_status,
      approval_status,
      reply_status,
      stop_sequence,
      current_step,
      next_action,
      next_action_date,
      created_at,
      updated_at,
      accounts (
        id,
        company_name,
        domain,
        website,
        industry,
        company_size,
        country,
        region
      )
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new ServiceError(
      "lead-service",
      `Failed to retrieve lead ${id}: ${error.message}`,
      error.code,
      error.details
    );
  }

  if (!data) {
    return null;
  }

  return mapRowToLead(data as unknown as LeadWithAccount);
}
