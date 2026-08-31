export type EmailStatus = "unverified" | "valid" | "catch_all" | "invalid";

export type OutreachStatus =
  | "not_started"
  | "in_progress"
  | "paused"
  | "completed"
  | "stopped";

export type ApprovalStatus = "pending" | "approved" | "rejected";

export type ReplyStatus =
  | "none"
  | "replied_interested"
  | "replied_not_interested"
  | "replied_wrong_person"
  | "replied_ooo";

export interface Lead {
  id: string;
  user_id: string;
  account_id?: string | null;
  campaign_id: string;
  first_name: string;
  last_name: string;
  email: string;
  job_title?: string | null;
  company_name?: string; // Resolved from account or lead
  linkedin_url?: string | null;
  country?: string | null;
  industry?: string | null;
  lead_objective?: string | null;
  email_status: EmailStatus;
  outreach_status: OutreachStatus;
  approval_status: ApprovalStatus;
  reply_status: ReplyStatus;
  stop_sequence: boolean;
  current_step: number;
  next_action?: string | null;
  next_action_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  company_name: string;
  domain?: string | null;
  website?: string | null;
  industry?: string | null;
  company_size?: string | null;
  country?: string | null;
  region?: string | null;
  linkedin_url?: string | null;
  company_context?: Record<string, unknown>;
  account_status: "target" | "active" | "customer" | "disqualified";
  created_at: string;
  updated_at: string;
}
