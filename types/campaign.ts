export type CampaignStatus =
  | "draft"
  | "active"
  | "paused"
  | "completed"
  | "archived";

export interface Campaign {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  icp_description: string;
  offer_description: string;
  target_region?: string | null;
  campaign_objective: string;
  status: CampaignStatus;
  lead_count?: number;
  active_sequences_count?: number;
  replies_count?: number;
  created_at: string;
  updated_at: string;
}
