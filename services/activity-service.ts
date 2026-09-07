import { createClient } from "@/lib/supabase/server";
import { ActivityEvent } from "@/types";
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
    "research_completed",
    "email_generated",
    "qa_completed",
    "human_edited",
    "email_approved",
    "email_rejected",
    "email_queued",
    "email_sent",
    "reply_detected",
    "sequence_stopped",
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
