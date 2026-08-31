import { Campaign } from "@/types";
import { MOCK_CAMPAIGNS } from "@/lib/mock-data";

export async function getCampaigns(): Promise<Campaign[]> {
  // UI Placeholder stub: returns mock campaigns.
  return Promise.resolve(MOCK_CAMPAIGNS);
}

export async function getCampaignById(id: string): Promise<Campaign | undefined> {
  return Promise.resolve(MOCK_CAMPAIGNS.find((c) => c.id === id));
}
