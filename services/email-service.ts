import { createClient } from "@/lib/supabase/server";
import {
  EmailDraft,
  StrategicPurpose,
  EmailApprovalStatus,
  EmailSendingStatus,
  QAEvaluation,
  QAScoreBreakdown,
} from "@/types";
import { Json } from "@/types/database.types";
import { ServiceError } from "./errors";
import { getResearchProfileByLeadId } from "./research-service";
import { logActivity } from "./activity-service";
import {
  callAIProvider,
  AIGeneratedDraft,
  buildCopywriterPrompt,
  evaluateDeterministicQA,
  DeterministicQAResult,
} from "@/lib/ai";

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

function mapStepToStrategicPurpose(step: number): StrategicPurpose {
  switch (step) {
    case 1:
      return "relevance";
    case 2:
      return "reframe";
    case 3:
      return "proof";
    case 4:
      return "insight";
    case 5:
      return "objection_removal";
    case 6:
      return "decision";
    default:
      return "relevance";
  }
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

export interface GenerateEmailDraftOptions {
  stepNumber?: number;
  strategicPurpose?: StrategicPurpose;
}

/**
 * Generates an email draft for a given lead adhering strictly to:
 * 1. Authenticated session and lead ownership check.
 * 2. Grounding in the lead's verified research profile.
 * 3. AI provider copy generation (NVIDIA NIM / Nemotron).
 * 4. Deterministic 50-point QA evaluation.
 * 5. Maximum 3 retry attempts for failed drafts (intermediate candidates are NOT persisted).
 * 6. Persists ONLY the final evaluated draft:
 *    - QA passed -> approval_status = 'pending_approval', sending_status = 'unapproved'
 *    - QA failed after 3 attempts -> approval_status = 'needs_manual_review', sending_status = 'unapproved'
 * 7. Persists the QA evaluation record.
 * 8. Logs activity events ('email_generated' and 'qa_completed' / 'qa_regenerated').
 *
 * Under no circumstances does this function send emails, bypass RLS, or use synthetic templates on failure.
 */
export async function generateEmailDraftForLead(
  leadId: string,
  options?: GenerateEmailDraftOptions
): Promise<EmailDraft> {
  const supabase = await createClient();

  // 1. Authenticate user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new ServiceError(
      "email-service",
      "Authentication required to generate email draft",
      "UNAUTHENTICATED"
    );
  }

  // 2. Fetch lead with campaign and account relations
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select(`
      id,
      user_id,
      campaign_id,
      account_id,
      first_name,
      last_name,
      email,
      job_title,
      industry,
      country,
      campaigns (
        id,
        name,
        campaign_objective,
        icp_description,
        offer_description,
        target_region
      ),
      accounts (
        id,
        company_name,
        domain,
        industry,
        company_size
      )
    `)
    .eq("id", leadId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (leadError || !lead) {
    throw new ServiceError(
      "email-service",
      `Lead ${leadId} not found or not owned by user`,
      "LEAD_NOT_FOUND"
    );
  }

  if (!lead.campaigns) {
    throw new ServiceError(
      "email-service",
      `Campaign context missing for lead ${leadId}`,
      "CAMPAIGN_NOT_FOUND"
    );
  }

  // 3. Load verified research profile
  const researchProfile = await getResearchProfileByLeadId(leadId);
  if (!researchProfile) {
    throw new ServiceError(
      "email-service",
      `Research profile is required before generating email draft for lead ${leadId}.`,
      "RESEARCH_REQUIRED"
    );
  }

  // 4. Fetch or initialize active sequence
  const { data: existingSeq, error: seqError } = await supabase
    .from("sequences")
    .select("id, current_step, status")
    .eq("lead_id", leadId)
    .maybeSingle();

  if (seqError) {
    throw new ServiceError(
      "email-service",
      `Failed to query sequence for lead ${leadId}: ${seqError.message}`,
      seqError.code,
      seqError.details
    );
  }

  let sequenceId: string;
  let currentStep = 1;

  if (existingSeq) {
    sequenceId = existingSeq.id;
    currentStep = existingSeq.current_step;
  } else {
    // Create sequence if missing
    const { data: newSeq, error: createSeqErr } = await supabase
      .from("sequences")
      .insert({
        campaign_id: lead.campaign_id,
        lead_id: leadId,
        current_step: 1,
        status: "pending",
      })
      .select("id, current_step, status")
      .single();

    if (createSeqErr || !newSeq) {
      throw new ServiceError(
        "email-service",
        `Failed to initialize sequence for lead ${leadId}: ${createSeqErr?.message}`,
        createSeqErr?.code,
        createSeqErr?.details
      );
    }
    sequenceId = newSeq.id;
    currentStep = newSeq.current_step;
  }

  const rawStepNumber = options?.stepNumber ?? currentStep;
  const stepNumber = Math.max(1, Math.min(6, rawStepNumber));
  const strategicPurpose =
    options?.strategicPurpose ?? mapStepToStrategicPurpose(stepNumber);

  // 5. Generation & QA retry loop (Max 3 attempts)
  let attemptsCount = 0;
  let lastCandidate: AIGeneratedDraft | null = null;
  let lastQaResult: DeterministicQAResult | null = null;
  let previousFeedback: string | null = null;

  while (attemptsCount < 3) {
    attemptsCount++;

    const promptPayload = buildCopywriterPrompt({
      lead: {
        first_name: lead.first_name,
        last_name: lead.last_name,
        job_title: lead.job_title,
        industry: lead.industry,
        country: lead.country,
      },
      account: lead.accounts,
      campaign: {
        name: lead.campaigns.name,
        campaign_objective: lead.campaigns.campaign_objective,
        icp_description: lead.campaigns.icp_description,
        offer_description: lead.campaigns.offer_description,
        target_region: lead.campaigns.target_region,
      },
      research: researchProfile,
      stepNumber,
      strategicPurpose,
      previousFeedbackNotes: previousFeedback,
    });

    // Call AI provider. If unavailable, will throw ServiceError(GENERATION_UNAVAILABLE).
    // Intermediate candidates are NEVER persisted on failure.
    const candidate = await callAIProvider(promptPayload);

    // Run deterministic QA
    const qaResult = evaluateDeterministicQA({
      subject_line: candidate.subject_line,
      preview_text: candidate.preview_text,
      body_generated: candidate.body_generated,
      ps_text: candidate.ps_text,
      research: researchProfile,
      campaign_offer: lead.campaigns.offer_description,
    });

    lastCandidate = candidate;
    lastQaResult = qaResult;

    if (qaResult.passed) {
      break; // High-quality draft passed QA!
    } else {
      previousFeedback = qaResult.feedback_notes;
    }
  }

  if (!lastCandidate || !lastQaResult) {
    throw new ServiceError(
      "email-service",
      "No email candidate was generated.",
      "GENERATION_UNAVAILABLE"
    );
  }

  // 6. Determine final approval and sending statuses
  const approval_status: EmailApprovalStatus = lastQaResult.passed
    ? "pending_approval"
    : "needs_manual_review";
  const sending_status: EmailSendingStatus = "unapproved";

  // 7. Persist ONLY the final evaluated draft into emails table
  const { data: existingEmailRow } = await supabase
    .from("emails")
    .select("id")
    .eq("sequence_id", sequenceId)
    .eq("step_number", stepNumber)
    .maybeSingle();

  let savedEmailId: string;

  if (existingEmailRow) {
    const { data: updatedEmail, error: updateError } = await supabase
      .from("emails")
      .update({
        strategic_purpose: strategicPurpose,
        subject_line: lastCandidate.subject_line,
        preview_text: lastCandidate.preview_text,
        body_generated: lastCandidate.body_generated,
        ps_text: lastCandidate.ps_text,
        qa_score: lastQaResult.total_score,
        approval_status,
        sending_status,
        generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingEmailRow.id)
      .select("id")
      .single();

    if (updateError || !updatedEmail) {
      throw new ServiceError(
        "email-service",
        `Failed to update email draft: ${updateError?.message}`,
        updateError?.code,
        updateError?.details
      );
    }
    savedEmailId = updatedEmail.id;
  } else {
    const { data: insertedEmail, error: insertError } = await supabase
      .from("emails")
      .insert({
        sequence_id: sequenceId,
        lead_id: leadId,
        step_number: stepNumber,
        strategic_purpose: strategicPurpose,
        subject_line: lastCandidate.subject_line,
        preview_text: lastCandidate.preview_text,
        body_generated: lastCandidate.body_generated,
        ps_text: lastCandidate.ps_text,
        qa_score: lastQaResult.total_score,
        approval_status,
        sending_status,
        generated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (insertError || !insertedEmail) {
      throw new ServiceError(
        "email-service",
        `Failed to insert email draft: ${insertError?.message}`,
        insertError?.code,
        insertError?.details
      );
    }
    savedEmailId = insertedEmail.id;
  }

  // 8. Persist QA evaluation
  const { error: qaInsertError } = await supabase
    .from("qa_evaluations")
    .insert({
      email_id: savedEmailId,
      attempt_number: attemptsCount,
      total_score: lastQaResult.total_score,
      dimension_scores: lastQaResult.dimension_scores as unknown as Json,
      passed: lastQaResult.passed,
      mandatory_failures: lastQaResult.mandatory_failures as unknown as Json,
      feedback_notes: lastQaResult.feedback_notes,
      evaluator_model: "deterministic-qa-v1",
    });

  if (qaInsertError) {
    throw new ServiceError(
      "email-service",
      `Email draft was persisted (id: ${savedEmailId}), but QA evaluation record failed to save: ${qaInsertError.message}`,
      qaInsertError.code,
      { email_id: savedEmailId, qaError: qaInsertError }
    );
  }

  // 9. Log activity events
  try {
    await logActivity({
      lead_id: leadId,
      campaign_id: lead.campaign_id,
      email_id: savedEmailId,
      activity_type: "email_generated",
      metadata: {
        step_number: stepNumber,
        strategic_purpose: strategicPurpose,
        approval_status,
        qa_score: lastQaResult.total_score,
        attempts_count: attemptsCount,
        passed: lastQaResult.passed,
      },
    });

    await logActivity({
      lead_id: leadId,
      campaign_id: lead.campaign_id,
      email_id: savedEmailId,
      activity_type: attemptsCount > 1 ? "qa_regenerated" : "qa_completed",
      metadata: {
        passed: lastQaResult.passed,
        total_score: lastQaResult.total_score,
        attempts_count: attemptsCount,
        mandatory_failures_count: lastQaResult.mandatory_failures.length,
      },
    });
  } catch (logErr) {
    console.error("Failed to log activity after email generation:", logErr);
  }

  // 10. Return full EmailDraft object
  const fullEmail = await getEmailById(savedEmailId);
  if (!fullEmail) {
    throw new ServiceError(
      "email-service",
      `Failed to reload persisted email draft ${savedEmailId}`,
      "INTERNAL_ERROR"
    );
  }

  return fullEmail;
}

/**
 * Human approval mutation for an email draft.
 * Requirements:
 * 1. Authenticated user and lead ownership verification.
 * 2. Only drafts in 'pending_approval' or 'edited' with sending_status='unapproved' may be approved.
 * 3. Populates body_approved with existing body_approved if present, else body_generated.
 * 4. Sets approved_at = now().
 * 5. Sets approval_status = 'approved'.
 * 6. Strictly preserves sending_status = 'unapproved' (never auto-sends or queues).
 * 7. Logs 'email_approved' activity.
 */
export async function approveEmailDraft(emailId: string): Promise<EmailDraft> {
  const supabase = await createClient();

  // 1. Authenticate user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new ServiceError(
      "email-service",
      "Authentication required to approve email draft",
      "UNAUTHENTICATED"
    );
  }

  // 2. Fetch email with tenant ownership validation
  const { data: email, error: fetchErr } = await supabase
    .from("emails")
    .select(`
      id,
      lead_id,
      sequence_id,
      step_number,
      approval_status,
      sending_status,
      body_generated,
      body_approved,
      leads!inner (
        id,
        user_id,
        campaign_id
      )
    `)
    .eq("id", emailId)
    .maybeSingle();

  if (fetchErr || !email || email.leads.user_id !== user.id) {
    throw new ServiceError(
      "email-service",
      `Email draft ${emailId} not found or not owned by user`,
      "EMAIL_NOT_FOUND"
    );
  }

  // 3. State guard: must be in approvable state and unapproved sending status
  const isApprovable =
    (email.approval_status === "pending_approval" ||
      email.approval_status === "edited") &&
    email.sending_status === "unapproved";

  if (!isApprovable) {
    throw new ServiceError(
      "email-service",
      `Cannot approve email draft from status '${email.approval_status}' with sending status '${email.sending_status}'`,
      "INVALID_APPROVAL_STATE"
    );
  }

  const effectiveBodyApproved =
    email.body_approved && email.body_approved.trim().length > 0
      ? email.body_approved.trim()
      : email.body_generated.trim();

  if (effectiveBodyApproved.length === 0) {
    throw new ServiceError(
      "email-service",
      "Cannot approve email draft with empty body content",
      "INVALID_APPROVAL_STATE"
    );
  }

  const now = new Date().toISOString();

  // 4. Conditional update under state guard
  const { data: updated, error: updateErr } = await supabase
    .from("emails")
    .update({
      approval_status: "approved",
      approved_at: now,
      body_approved: effectiveBodyApproved,
      sending_status: "unapproved", // STRICT: remains unapproved
      updated_at: now,
    })
    .eq("id", emailId)
    .in("approval_status", ["pending_approval", "edited"])
    .eq("sending_status", "unapproved")
    .select("id")
    .single();

  if (updateErr || !updated) {
    throw new ServiceError(
      "email-service",
      `Failed to approve email draft: ${updateErr?.message || "State conflict or already updated"}`,
      "INVALID_APPROVAL_STATE",
      updateErr
    );
  }

  // 5. Log activity
  try {
    await logActivity({
      lead_id: email.lead_id,
      campaign_id: email.leads.campaign_id,
      email_id: emailId,
      activity_type: "email_approved",
      metadata: {
        step_number: email.step_number,
        approval_status: "approved",
        sending_status: "unapproved",
      },
    });
  } catch (logErr) {
    console.error("Failed to log email_approved activity:", logErr);
  }

  const fullDraft = await getEmailById(emailId);
  if (!fullDraft) {
    throw new ServiceError(
      "email-service",
      `Failed to reload approved email ${emailId}`,
      "INTERNAL_ERROR"
    );
  }

  return fullDraft;
}

/**
 * Human rejection mutation for an email draft.
 * Requirements:
 * 1. Authenticated user and lead ownership verification.
 * 2. Sets approval_status = 'rejected'.
 * 3. Preserves sending_status = 'unapproved'.
 * 4. Logs 'email_rejected' activity with optional rejection reason.
 */
export async function rejectEmailDraft(
  emailId: string,
  reason?: string
): Promise<EmailDraft> {
  const supabase = await createClient();

  // 1. Authenticate user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new ServiceError(
      "email-service",
      "Authentication required to reject email draft",
      "UNAUTHENTICATED"
    );
  }

  // 2. Fetch email with tenant ownership validation
  const { data: email, error: fetchErr } = await supabase
    .from("emails")
    .select(`
      id,
      lead_id,
      sequence_id,
      step_number,
      approval_status,
      sending_status,
      leads!inner (
        id,
        user_id,
        campaign_id
      )
    `)
    .eq("id", emailId)
    .maybeSingle();

  if (fetchErr || !email || email.leads.user_id !== user.id) {
    throw new ServiceError(
      "email-service",
      `Email draft ${emailId} not found or not owned by user`,
      "EMAIL_NOT_FOUND"
    );
  }

  if (email.sending_status !== "unapproved") {
    throw new ServiceError(
      "email-service",
      `Cannot reject email with sending status '${email.sending_status}'`,
      "INVALID_REJECTION_STATE"
    );
  }

  const now = new Date().toISOString();

  // 3. Update status to rejected
  const { data: updated, error: updateErr } = await supabase
    .from("emails")
    .update({
      approval_status: "rejected",
      sending_status: "unapproved", // STRICT: remains unapproved
      updated_at: now,
    })
    .eq("id", emailId)
    .eq("sending_status", "unapproved")
    .select("id")
    .single();

  if (updateErr || !updated) {
    throw new ServiceError(
      "email-service",
      `Failed to reject email draft: ${updateErr?.message}`,
      "INVALID_REJECTION_STATE",
      updateErr
    );
  }

  // 4. Log activity
  try {
    await logActivity({
      lead_id: email.lead_id,
      campaign_id: email.leads.campaign_id,
      email_id: emailId,
      activity_type: "email_rejected",
      metadata: {
        step_number: email.step_number,
        rejection_reason: reason && reason.trim().length > 0 ? reason.trim() : null,
      },
    });
  } catch (logErr) {
    console.error("Failed to log email_rejected activity:", logErr);
  }

  const fullDraft = await getEmailById(emailId);
  if (!fullDraft) {
    throw new ServiceError(
      "email-service",
      `Failed to reload rejected email ${emailId}`,
      "INTERNAL_ERROR"
    );
  }

  return fullDraft;
}

export interface EditEmailInputPayload {
  subject_line: string;
  preview_text?: string | null;
  body_approved: string;
  ps_text?: string | null;
}

/**
 * Human edit mutation for an email draft.
 * Requirements:
 * 1. Authenticated user and lead ownership validation.
 * 2. Only permits editing content fields (subject_line, preview_text, body_approved, ps_text).
 * 3. Sets approval_status = 'edited' (does NOT implicitly approve).
 * 4. Preserves sending_status = 'unapproved'.
 * 5. Logs 'human_edited' activity.
 */
export async function editEmailDraft(
  emailId: string,
  input: EditEmailInputPayload
): Promise<EmailDraft> {
  const supabase = await createClient();

  // 1. Authenticate user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new ServiceError(
      "email-service",
      "Authentication required to edit email draft",
      "UNAUTHENTICATED"
    );
  }

  // 2. Validate input fields
  const subject = input.subject_line?.trim();
  const body = input.body_approved?.trim();

  if (!subject || subject.length === 0) {
    throw new ServiceError(
      "email-service",
      "Subject line is required",
      "VALIDATION_ERROR"
    );
  }

  if (subject.length > 255) {
    throw new ServiceError(
      "email-service",
      "Subject line must be 255 characters or less",
      "VALIDATION_ERROR"
    );
  }

  if (!body || body.length === 0) {
    throw new ServiceError(
      "email-service",
      "Email body is required",
      "VALIDATION_ERROR"
    );
  }

  const preview =
    input.preview_text && input.preview_text.trim().length > 0
      ? input.preview_text.trim()
      : null;

  const ps =
    input.ps_text && input.ps_text.trim().length > 0
      ? input.ps_text.trim()
      : null;

  // 3. Fetch email with tenant ownership validation
  const { data: email, error: fetchErr } = await supabase
    .from("emails")
    .select(`
      id,
      lead_id,
      sequence_id,
      step_number,
      approval_status,
      sending_status,
      leads!inner (
        id,
        user_id,
        campaign_id
      )
    `)
    .eq("id", emailId)
    .maybeSingle();

  if (fetchErr || !email || email.leads.user_id !== user.id) {
    throw new ServiceError(
      "email-service",
      `Email draft ${emailId} not found or not owned by user`,
      "EMAIL_NOT_FOUND"
    );
  }

  if (email.sending_status !== "unapproved") {
    throw new ServiceError(
      "email-service",
      `Cannot edit email with sending status '${email.sending_status}'`,
      "INVALID_EDIT_STATE"
    );
  }

  const now = new Date().toISOString();

  // 4. Update content and mark approval_status = 'edited'
  const { data: updated, error: updateErr } = await supabase
    .from("emails")
    .update({
      subject_line: subject,
      preview_text: preview,
      body_approved: body,
      ps_text: ps,
      approval_status: "edited", // Marked edited, requires explicit human approval
      sending_status: "unapproved", // STRICT: remains unapproved
      updated_at: now,
    })
    .eq("id", emailId)
    .eq("sending_status", "unapproved")
    .select("id")
    .single();

  if (updateErr || !updated) {
    throw new ServiceError(
      "email-service",
      `Failed to save edited email draft: ${updateErr?.message}`,
      "INVALID_EDIT_STATE",
      updateErr
    );
  }

  // 5. Log activity
  try {
    await logActivity({
      lead_id: email.lead_id,
      campaign_id: email.leads.campaign_id,
      email_id: emailId,
      activity_type: "human_edited",
      metadata: {
        step_number: email.step_number,
        subject_line: subject,
        has_ps: !!ps,
      },
    });
  } catch (logErr) {
    console.error("Failed to log human_edited activity:", logErr);
  }

  const fullDraft = await getEmailById(emailId);
  if (!fullDraft) {
    throw new ServiceError(
      "email-service",
      `Failed to reload edited email ${emailId}`,
      "INTERNAL_ERROR"
    );
  }

  return fullDraft;
}
