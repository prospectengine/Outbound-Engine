export interface ObservedFact {
  fact: string;
  source_type: string;
  source_title: string;
  source_url?: string | null;
  source_date?: string | null;
  notes?: string | null;
  confidence: number;
}

export interface ReasonableInference {
  inference: string;
  premise: string;
  source_type: string;
  source_title: string;
  source_url?: string | null;
  source_date?: string | null;
  notes?: string | null;
}

export interface UnknownAssumption {
  topic: string;
  notes: string;
}

export interface ResearchProfile {
  id: string;
  lead_id: string;
  account_id?: string | null;
  lead_name?: string;
  company_name?: string;
  observed_facts: ObservedFact[];
  reasonable_inferences: ReasonableInference[];
  unknowns: UnknownAssumption[];
  business_trigger?: string | null;
  trigger_source_type?: string | null;
  trigger_source_title?: string | null;
  trigger_source_url?: string | null;
  trigger_source_date?: string | null;
  trigger_notes?: string | null;
  problem_hypothesis?: string | null;
  business_consequence?: string | null;
  future_state?: string | null;
  personalization_angle?: string | null;
  research_status: "pending" | "completed" | "failed";
  created_at: string;
  updated_at: string;
}
