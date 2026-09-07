import { createClient } from "@/lib/supabase/server";
import { Sequence, SequenceStatus } from "@/types";
import { ServiceError } from "./errors";

type SequenceWithRelations = {
  id: string;
  campaign_id: string;
  lead_id: string;
  current_step: number;
  status: string;
  next_action: string | null;
  next_action_date: string | null;
  started_at: string | null;
  stopped_at: string | null;
  stop_reason: string | null;
  created_at: string;
  updated_at: string;
  leads: {
    first_name: string;
    last_name: string;
    accounts: {
      company_name: string;
    } | null;
  } | null;
  campaigns: {
    name: string;
  } | null;
};

function mapRowToSequence(row: SequenceWithRelations): Sequence {
  const validStatuses: SequenceStatus[] = [
    "pending",
    "active",
    "paused",
    "completed",
    "stopped_replied",
    "stopped_manual",
  ];
  const status: SequenceStatus = validStatuses.includes(
    row.status as SequenceStatus
  )
    ? (row.status as SequenceStatus)
    : "pending";

  const lead_name = row.leads
    ? `${row.leads.first_name} ${row.leads.last_name}`.trim()
    : "—";
  const lead_company = row.leads?.accounts?.company_name || "—";
  const campaign_name = row.campaigns?.name || "—";

  return {
    id: row.id,
    campaign_id: row.campaign_id,
    lead_id: row.lead_id,
    lead_name,
    lead_company,
    campaign_name,
    current_step: row.current_step,
    status,
    next_action: row.next_action,
    next_action_date: row.next_action_date,
    started_at: row.started_at,
    stopped_at: row.stopped_at,
    stop_reason: row.stop_reason,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function getSequences(): Promise<Sequence[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sequences")
    .select(`
      id,
      campaign_id,
      lead_id,
      current_step,
      status,
      next_action,
      next_action_date,
      started_at,
      stopped_at,
      stop_reason,
      created_at,
      updated_at,
      leads (
        first_name,
        last_name,
        accounts (
          company_name
        )
      ),
      campaigns (
        name
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    throw new ServiceError(
      "sequence-service",
      `Failed to retrieve sequences: ${error.message}`,
      error.code,
      error.details
    );
  }

  if (!data || data.length === 0) {
    return [];
  }

  return (data as unknown as SequenceWithRelations[]).map(mapRowToSequence);
}

export async function getSequenceById(id: string): Promise<Sequence | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sequences")
    .select(`
      id,
      campaign_id,
      lead_id,
      current_step,
      status,
      next_action,
      next_action_date,
      started_at,
      stopped_at,
      stop_reason,
      created_at,
      updated_at,
      leads (
        first_name,
        last_name,
        accounts (
          company_name
        )
      ),
      campaigns (
        name
      )
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new ServiceError(
      "sequence-service",
      `Failed to retrieve sequence ${id}: ${error.message}`,
      error.code,
      error.details
    );
  }

  if (!data) {
    return null;
  }

  return mapRowToSequence(data as unknown as SequenceWithRelations);
}

export async function getSequencesByCampaignId(
  campaignId: string
): Promise<Sequence[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sequences")
    .select(`
      id,
      campaign_id,
      lead_id,
      current_step,
      status,
      next_action,
      next_action_date,
      started_at,
      stopped_at,
      stop_reason,
      created_at,
      updated_at,
      leads (
        first_name,
        last_name,
        accounts (
          company_name
        )
      ),
      campaigns (
        name
      )
    `)
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new ServiceError(
      "sequence-service",
      `Failed to retrieve sequences for campaign ${campaignId}: ${error.message}`,
      error.code,
      error.details
    );
  }

  if (!data || data.length === 0) {
    return [];
  }

  return (data as unknown as SequenceWithRelations[]).map(mapRowToSequence);
}

export async function getSequenceByLeadId(
  leadId: string
): Promise<Sequence | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sequences")
    .select(`
      id,
      campaign_id,
      lead_id,
      current_step,
      status,
      next_action,
      next_action_date,
      started_at,
      stopped_at,
      stop_reason,
      created_at,
      updated_at,
      leads (
        first_name,
        last_name,
        accounts (
          company_name
        )
      ),
      campaigns (
        name
      )
    `)
    .eq("lead_id", leadId)
    .maybeSingle();

  if (error) {
    throw new ServiceError(
      "sequence-service",
      `Failed to retrieve sequence for lead ${leadId}: ${error.message}`,
      error.code,
      error.details
    );
  }

  if (!data) {
    return null;
  }

  return mapRowToSequence(data as unknown as SequenceWithRelations);
}
