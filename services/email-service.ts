import { createClient } from "@/lib/supabase/server";
import {
  EmailDraft,
  StrategicPurpose,
  EmailApprovalStatus,
  EmailSendingStatus,
  QAEvaluation,
  QAScoreBreakdown,
} from "@/types";
import { ServiceError } from "./errors";

type EmailWithLead = {
  id: string;
  sequence_id: string;
  lead_id: string;
  step_number: number;
  strategic_purpose: string;
  subject_line: string;
  preview_text: string | null;
  body_generated: string;
  body_approved: string | null;
  ps_text: string | null;
  qa_score: number | null;
  approval_status: string;
  sending_status: string;
  generated_at: string;
  approved_at: string | null;
  scheduled_at: string | null;
  sent_at: string | null;
  message_id: string | null;
  thread_id: string | null;
  created_at: string;
  updated_at: string;
  leads: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    accounts: {
      company_name: string;
    } | null;
  } | null;
};

function mapRowToEmailDraft(row: EmailWithLead): EmailDraft {
  const validStrategicPurposes: StrategicPurpose[] = [
    "relevance",
    "reframe",
    "proof",
    "insight",
    "objection_removal",
    "decision",
  ];
  const strategic_purpose: StrategicPurpose = validStrategicPurposes.includes(
    row.strategic_purpose as StrategicPurpose
  )
    ? (row.strategic_purpose as StrategicPurpose)
    : "relevance";

  const validApprovalStatuses: EmailApprovalStatus[] = [
    "draft",
    "qa_passed",
    "qa_failed",
    "pending_approval",
    "approved",
    "rejected",
    "edited",
    "needs_manual_review",
  ];
  const approval_status: EmailApprovalStatus = validApprovalStatuses.includes(
    row.approval_status as EmailApprovalStatus
  )
    ? (row.approval_status as EmailApprovalStatus)
    : "pending_approval";

  const validSendingStatuses: EmailSendingStatus[] = [
    "unapproved",
    "queued",
    "sending",
    "sent",
    "failed",
    "cancelled",
  ];
  const sending_status: EmailSendingStatus = validSendingStatuses.includes(
    row.sending_status as EmailSendingStatus
  )
    ? (row.sending_status as EmailSendingStatus)
    : "unapproved";

  const lead_name = row.leads
    ? `${row.leads.first_name} ${row.leads.last_name}`.trim()
    : "—";
  const lead_email = row.leads?.email || "—";
  const lead_company = row.leads?.accounts?.company_name || "—";

  return {
    id: row.id,
    sequence_id: row.sequence_id,
    lead_id: row.lead_id,
    lead_name,
    lead_email,
    lead_company,
    step_number: row.step_number,
    strategic_purpose,
    subject_line: row.subject_line,
    preview_text: row.preview_text,
    body_generated: row.body_generated,
    body_approved: row.body_approved,
    ps_text: row.ps_text,
    qa_score: row.qa_score,
    approval_status,
    sending_status,
    generated_at: row.generated_at,
    approved_at: row.approved_at,
    scheduled_at: row.scheduled_at,
    sent_at: row.sent_at,
    message_id: row.message_id,
    thread_id: row.thread_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function parseDimensionScores(raw: unknown): QAScoreBreakdown {
  const defaultScores: QAScoreBreakdown = {
    trigger_relevance: 0,
    problem_specificity: 0,
    customer_centricity: 0,
    future_state_clarity: 0,
    proof_relevance: 0,
    personalization: 0,
    cta_quality: 0,
    brevity: 0,
    human_tone: 0,
    factual_confidence: 0,
  };
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return defaultScores;
  }
  const obj = raw as Record<string, unknown>;
  const getNum = (key: keyof QAScoreBreakdown) =>
    typeof obj[key] === "number" ? Number(obj[key]) : 0;

  return {
    trigger_relevance: getNum("trigger_relevance"),
    problem_specificity: getNum("problem_specificity"),
    customer_centricity: getNum("customer_centricity"),
    future_state_clarity: getNum("future_state_clarity"),
    proof_relevance: getNum("proof_relevance"),
    personalization: getNum("personalization"),
    cta_quality: getNum("cta_quality"),
    brevity: getNum("brevity"),
    human_tone: getNum("human_tone"),
    factual_confidence: getNum("factual_confidence"),
  };
}

function parseMandatoryFailures(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((item): item is string => typeof item === "string");
  }
  return [];
}

/**
 * Retrieves emails awaiting human approval.
 * Authoritative pending approval rule:
 * approval_status = 'pending_approval' AND sending_status = 'unapproved'
 */
export async function getPendingEmails(): Promise<EmailDraft[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("emails")
    .select(`
      id,
      sequence_id,
      lead_id,
      step_number,
      strategic_purpose,
      subject_line,
      preview_text,
      body_generated,
      body_approved,
      ps_text,
      qa_score,
      approval_status,
      sending_status,
      generated_at,
      approved_at,
      scheduled_at,
      sent_at,
      message_id,
      thread_id,
      created_at,
      updated_at,
      leads (
        id,
        first_name,
        last_name,
        email,
        accounts (
          company_name
        )
      )
    `)
    .eq("approval_status", "pending_approval")
    .eq("sending_status", "unapproved")
    .order("generated_at", { ascending: false });

  if (error) {
    throw new ServiceError(
      "email-service",
      `Failed to retrieve pending emails: ${error.message}`,
      error.code,
      error.details
    );
  }

  if (!data || data.length === 0) {
    return [];
  }

  return (data as unknown as EmailWithLead[]).map(mapRowToEmailDraft);
}

export async function getEmailById(id: string): Promise<EmailDraft | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("emails")
    .select(`
      id,
      sequence_id,
      lead_id,
      step_number,
      strategic_purpose,
      subject_line,
      preview_text,
      body_generated,
      body_approved,
      ps_text,
      qa_score,
      approval_status,
      sending_status,
      generated_at,
      approved_at,
      scheduled_at,
      sent_at,
      message_id,
      thread_id,
      created_at,
      updated_at,
      leads (
        id,
        first_name,
        last_name,
        email,
        accounts (
          company_name
        )
      )
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new ServiceError(
      "email-service",
      `Failed to retrieve email ${id}: ${error.message}`,
      error.code,
      error.details
    );
  }

  if (!data) {
    return null;
  }

  return mapRowToEmailDraft(data as unknown as EmailWithLead);
}

export async function getEmailsBySequenceId(
  sequenceId: string
): Promise<EmailDraft[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("emails")
    .select(`
      id,
      sequence_id,
      lead_id,
      step_number,
      strategic_purpose,
      subject_line,
      preview_text,
      body_generated,
      body_approved,
      ps_text,
      qa_score,
      approval_status,
      sending_status,
      generated_at,
      approved_at,
      scheduled_at,
      sent_at,
      message_id,
      thread_id,
      created_at,
      updated_at,
      leads (
        id,
        first_name,
        last_name,
        email,
        accounts (
          company_name
        )
      )
    `)
    .eq("sequence_id", sequenceId)
    .order("step_number", { ascending: true });

  if (error) {
    throw new ServiceError(
      "email-service",
      `Failed to retrieve emails for sequence ${sequenceId}: ${error.message}`,
      error.code,
      error.details
    );
  }

  if (!data || data.length === 0) {
    return [];
  }

  return (data as unknown as EmailWithLead[]).map(mapRowToEmailDraft);
}

export async function getEmailsByLeadId(leadId: string): Promise<EmailDraft[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("emails")
    .select(`
      id,
      sequence_id,
      lead_id,
      step_number,
      strategic_purpose,
      subject_line,
      preview_text,
      body_generated,
      body_approved,
      ps_text,
      qa_score,
      approval_status,
      sending_status,
      generated_at,
      approved_at,
      scheduled_at,
      sent_at,
      message_id,
      thread_id,
      created_at,
      updated_at,
      leads (
        id,
        first_name,
        last_name,
        email,
        accounts (
          company_name
        )
      )
    `)
    .eq("lead_id", leadId)
    .order("step_number", { ascending: true });

  if (error) {
    throw new ServiceError(
      "email-service",
      `Failed to retrieve emails for lead ${leadId}: ${error.message}`,
      error.code,
      error.details
    );
  }

  if (!data || data.length === 0) {
    return [];
  }

  return (data as unknown as EmailWithLead[]).map(mapRowToEmailDraft);
}

export async function getQAEvaluationByEmailId(
  emailId: string
): Promise<QAEvaluation | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("qa_evaluations")
    .select("*")
    .eq("email_id", emailId)
    .order("attempt_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new ServiceError(
      "email-service",
      `Failed to retrieve QA evaluation for email ${emailId}: ${error.message}`,
      error.code,
      error.details
    );
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    email_id: data.email_id,
    attempt_number: data.attempt_number,
    total_score: data.total_score,
    dimension_scores: parseDimensionScores(data.dimension_scores),
    passed: data.passed,
    mandatory_failures: parseMandatoryFailures(data.mandatory_failures),
    feedback_notes: data.feedback_notes,
    evaluator_model: data.evaluator_model,
    created_at: data.created_at,
  };
}
