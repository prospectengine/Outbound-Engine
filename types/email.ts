export type StrategicPurpose =
  | "relevance"
  | "reframe"
  | "proof"
  | "insight"
  | "objection_removal"
  | "decision";

export type EmailApprovalStatus =
  | "draft"
  | "qa_passed"
  | "qa_failed"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "edited"
  | "needs_manual_review";

export type EmailSendingStatus =
  | "unapproved"
  | "queued"
  | "sending"
  | "sent"
  | "failed"
  | "cancelled";

export interface QAScoreBreakdown {
  trigger_relevance: number;
  problem_specificity: number;
  customer_centricity: number;
  future_state_clarity: number;
  proof_relevance: number;
  personalization: number;
  cta_quality: number;
  brevity: number;
  human_tone: number;
  factual_confidence: number;
}

export interface QAEvaluation {
  id: string;
  email_id: string;
  attempt_number: number;
  total_score: number;
  dimension_scores: QAScoreBreakdown;
  passed: boolean;
  mandatory_failures: string[];
  feedback_notes?: string | null;
  evaluator_model: string;
  created_at: string;
}

export interface EmailDraft {
  id: string;
  sequence_id: string;
  lead_id: string;
  lead_name?: string;
  lead_email?: string;
  lead_company?: string;
  step_number: number;
  strategic_purpose: StrategicPurpose;
  subject_line: string;
  preview_text?: string | null;
  body_generated: string;
  body_approved?: string | null;
  ps_text?: string | null;
  qa_score?: number | null;
  approval_status: EmailApprovalStatus;
  sending_status: EmailSendingStatus;
  generated_at: string;
  approved_at?: string | null;
  scheduled_at?: string | null;
  sent_at?: string | null;
  message_id?: string | null;
  thread_id?: string | null;
  created_at: string;
  updated_at: string;
}
