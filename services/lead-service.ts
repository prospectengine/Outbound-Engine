import { Lead } from "@/types";
import { MOCK_LEADS } from "@/lib/mock-data";

export async function getLeads(): Promise<Lead[]> {
  // UI Placeholder stub: returns mock leads. Supabase integration will be implemented in subsequent phases.
  return Promise.resolve(MOCK_LEADS);
}

export async function getLeadById(id: string): Promise<Lead | undefined> {
  return Promise.resolve(MOCK_LEADS.find((l) => l.id === id));
}
