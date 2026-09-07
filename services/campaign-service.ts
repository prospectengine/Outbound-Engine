import { createClient } from "@/lib/supabase/server";
import { Campaign, CampaignStatus } from "@/types";
import { ServiceError } from "./errors";

type CampaignWithRelations = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  icp_description: string;
  offer_description: string;
  target_region: string | null;
  campaign_objective: string;
  status: string;
  created_at: string;
  updated_at: string;
  leads?: {
    id: string;
    outreach_status: string;
    reply_status: string;
  }[];
  sequences?: {
    id: string;
    status: string;
  }[];
};

function mapRowToCampaign(row: CampaignWithRelations): Campaign {
  const validStatuses: CampaignStatus[] = [
    "draft",
    "active",
    "paused",
    "completed",
    "archived",
  ];
  const status: CampaignStatus = validStatuses.includes(
    row.status as CampaignStatus
  )
    ? (row.status as CampaignStatus)
    : "draft";

  const leadCount = row.leads?.length ?? 0;
  const activeSequencesCount =
    row.sequences?.filter((s) => s.status === "active").length ?? 0;
  const repliesCount =
    row.leads?.filter(
      (l) => l.reply_status && l.reply_status !== "none"
    ).length ?? 0;

  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    description: row.description,
    icp_description: row.icp_description,
    offer_description: row.offer_description,
    target_region: row.target_region,
    campaign_objective: row.campaign_objective,
    status,
    lead_count: leadCount,
    active_sequences_count: activeSequencesCount,
    replies_count: repliesCount,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function getCampaigns(): Promise<Campaign[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("campaigns")
    .select(`
      id,
      user_id,
      name,
      description,
      icp_description,
      offer_description,
      target_region,
      campaign_objective,
      status,
      created_at,
      updated_at,
      leads (
        id,
        outreach_status,
        reply_status
      ),
      sequences (
        id,
        status
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    throw new ServiceError(
      "campaign-service",
      `Failed to retrieve campaigns: ${error.message}`,
      error.code,
      error.details
    );
  }

  if (!data || data.length === 0) {
    return [];
  }

  return (data as unknown as CampaignWithRelations[]).map(mapRowToCampaign);
}

export async function getCampaignById(id: string): Promise<Campaign | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("campaigns")
    .select(`
      id,
      user_id,
      name,
      description,
      icp_description,
      offer_description,
      target_region,
      campaign_objective,
      status,
      created_at,
      updated_at,
      leads (
        id,
        outreach_status,
        reply_status
      ),
      sequences (
        id,
        status
      )
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new ServiceError(
      "campaign-service",
      `Failed to retrieve campaign ${id}: ${error.message}`,
      error.code,
      error.details
    );
  }

  if (!data) {
    return null;
  }

  return mapRowToCampaign(data as unknown as CampaignWithRelations);
}
