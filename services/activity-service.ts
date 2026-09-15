import { createClient } from "@/lib/supabase/server";
import { ActivityEvent } from "@/types";
import { Json } from "@/types/database.types";
import { ServiceError } from "./errors";

type ActivityWithRelations = {
  id: string;
  user_id: string;
  lead_id: string;
  campaign_id: string | null;
  email_id: string | null;
  activity_type: string;
  metadata: unknown;
  created_at: string;
  leads: {
    first_name: string;
    last_name: string;
    accounts: {
      company_name: string;
    } | null;
  } | null;
};

function parseMetadata(raw: unknown): Record<string, unknown> {
  if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return {};
}

function mapRowToActivityEvent(row: ActivityWithRelations): ActivityEvent {
  const validActivityTypes: Array<ActivityEvent["activity_type"]> = [
    "lead_created",
    "lead_imported",
    "research_started",
    "research_completed",
    "research_failed",
    "email_generated",
    "qa_completed",
    "qa_regenerated",
    "human_edited",
    "email_approved",
    "email_rejected",
    "email_queued",
    "email_sent",
    "email_send_failed",
    "reply_detected",
    "sequence_stopped",
    "sequence_resumed",
    "sequence_completed",
  ];

  const activity_type: ActivityEvent["activity_type"] = validActivityTypes.includes(
    row.activity_type as ActivityEvent["activity_type"]
  )
    ? (row.activity_type as ActivityEvent["activity_type"])
    : "lead_created";

  let lead_name = "—";
  if (row.leads) {
    const fullName = `${row.leads.first_name} ${row.leads.last_name}`.trim();
    const company = row.leads.accounts?.company_name;
    lead_name = company ? `${fullName} (${company})` : fullName;
  }

  return {
    id: row.id,
    user_id: row.user_id,
    lead_id: row.lead_id,
    lead_name,
    email_id: row.email_id,
    campaign_id: row.campaign_id,
    activity_type,
    metadata: parseMetadata(row.metadata),
    created_at: row.created_at,
  };
}

export async function getRecentActivities(
  limit = 10
): Promise<ActivityEvent[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("activities")
    .select(`
      id,
      user_id,
      lead_id,
      campaign_id,
      email_id,
      activity_type,
      metadata,
      created_at,
      leads (
        first_name,
        last_name,
        accounts (
          company_name
        )
      )
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new ServiceError(
      "activity-service",
      `Failed to retrieve recent activities: ${error.message}`,
      error.code,
      error.details
    );
  }

  if (!data || data.length === 0) {
    return [];
  }

  return (data as unknown as ActivityWithRelations[]).map(
    mapRowToActivityEvent
  );
}

export async function getActivitiesByLeadId(
  leadId: string
): Promise<ActivityEvent[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("activities")
    .select(`
      id,
      user_id,
      lead_id,
      campaign_id,
      email_id,
      activity_type,
      metadata,
      created_at,
      leads (
        first_name,
        last_name,
        accounts (
          company_name
        )
      )
    `)
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new ServiceError(
      "activity-service",
      `Failed to retrieve activities for lead ${leadId}: ${error.message}`,
      error.code,
      error.details
    );
  }

  if (!data || data.length === 0) {
    return [];
  }

  return (data as unknown as ActivityWithRelations[]).map(
    mapRowToActivityEvent
  );
}

export interface LogActivityInput {
  lead_id: string;
  activity_type: ActivityEvent["activity_type"];
  campaign_id?: string | null;
  email_id?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Appends an activity event record for a lead.
 * Derives user_id directly from the authenticated session.
 * Enforces lead_id presence per database NOT NULL constraint.
 */
export async function logActivity(
  input: LogActivityInput
): Promise<ActivityEvent> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new ServiceError(
      "activity-service",
      "Authentication required to log activity",
      authError?.code,
      authError
    );
  }

  if (!input.lead_id || input.lead_id.trim().length === 0) {
    throw new ServiceError(
      "activity-service",
      "lead_id is strictly required to log activity",
      "VALIDATION_ERROR"
    );
  }

  const { data, error } = await supabase
    .from("activities")
    .insert({
      user_id: user.id,
      lead_id: input.lead_id,
      campaign_id: input.campaign_id ?? null,
      email_id: input.email_id ?? null,
      activity_type: input.activity_type,
      metadata: (input.metadata ?? {}) as Json,
    })
    .select(`
      id,
      user_id,
      lead_id,
      campaign_id,
      email_id,
      activity_type,
      metadata,
      created_at,
      leads (
        first_name,
        last_name,
        accounts (
          company_name
        )
      )
    `)
    .single();

  if (error) {
    throw new ServiceError(
      "activity-service",
      `Failed to log activity event: ${error.message}`,
      error.code,
      error.details
    );
  }

  return mapRowToActivityEvent(data as unknown as ActivityWithRelations);
}
