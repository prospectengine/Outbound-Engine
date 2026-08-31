export type SequenceStatus =
  | "pending"
  | "active"
  | "paused"
  | "completed"
  | "stopped_replied"
  | "stopped_manual";

export interface Sequence {
  id: string;
  campaign_id: string;
  lead_id: string;
  lead_name?: string;
  lead_company?: string;
  campaign_name?: string;
  current_step: number;
  status: SequenceStatus;
  next_action?: string | null;
  next_action_date?: string | null;
  started_at?: string | null;
  stopped_at?: string | null;
  stop_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityEvent {
  id: string;
  user_id: string;
  lead_id: string;
  lead_name?: string;
  email_id?: string | null;
  campaign_id?: string | null;
  activity_type:
    | "lead_created"
    | "lead_imported"
    | "research_completed"
    | "email_generated"
    | "qa_completed"
    | "human_edited"
    | "email_approved"
    | "email_rejected"
    | "email_queued"
    | "email_sent"
    | "reply_detected"
    | "sequence_stopped"
    | "sequence_completed";
  metadata: Record<string, unknown>;
  created_at: string;
}
