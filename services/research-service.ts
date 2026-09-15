import { createClient } from "@/lib/supabase/server";
import {
  ResearchProfile,
  ObservedFact,
  ReasonableInference,
  UnknownAssumption,
} from "@/types";
import {
  saveResearchProfileSchema,
  SaveResearchProfileInput,
} from "@/lib/research";
import { logActivity } from "@/services/activity-service";
import { Json } from "@/types/database.types";
import { ServiceError } from "./errors";


type ResearchWithRelations = {
  id: string;
  lead_id: string;
  account_id: string | null;
  business_trigger: string | null;
  trigger_source_type: string | null;
  trigger_source_title: string | null;
  trigger_source_url: string | null;
  trigger_source_date: string | null;
  trigger_notes: string | null;
  problem_hypothesis: string | null;
  business_consequence: string | null;
  future_state: string | null;
  personalization_angle: string | null;
  research_status: string;
  observed_facts: unknown;
  reasonable_inferences: unknown;
  unknowns: unknown;
  created_at: string;
  updated_at: string;
  leads: {
    first_name: string;
    last_name: string;
    accounts: {
      company_name: string;
    } | null;
  } | null;
  accounts: {
    company_name: string;
  } | null;
};

function parseObservedFacts(raw: unknown): ObservedFact[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null
    )
    .map((item) => ({
      fact: typeof item.fact === "string" ? item.fact : "",
      source_type:
        typeof item.source_type === "string" ? item.source_type : "other",
      source_title:
        typeof item.source_title === "string" ? item.source_title : "",
      source_url:
        typeof item.source_url === "string" ? item.source_url : null,
      source_date:
        typeof item.source_date === "string" ? item.source_date : null,
      notes: typeof item.notes === "string" ? item.notes : null,
      confidence:
        typeof item.confidence === "number" ? item.confidence : 1.0,
    }))
    .filter((f) => f.fact.trim().length > 0);
}

function parseReasonableInferences(raw: unknown): ReasonableInference[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null
    )
    .map((item) => ({
      inference: typeof item.inference === "string" ? item.inference : "",
      premise: typeof item.premise === "string" ? item.premise : "",
      source_type:
        typeof item.source_type === "string" ? item.source_type : "inference",
      source_title:
        typeof item.source_title === "string" ? item.source_title : "",
      source_url:
        typeof item.source_url === "string" ? item.source_url : null,
      source_date:
        typeof item.source_date === "string" ? item.source_date : null,
      notes: typeof item.notes === "string" ? item.notes : null,
    }))
    .filter((inf) => inf.inference.trim().length > 0);
}

function parseUnknownAssumptions(raw: unknown): UnknownAssumption[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null
    )
    .map((item) => ({
      topic: typeof item.topic === "string" ? item.topic : "",
      notes: typeof item.notes === "string" ? item.notes : "",
    }))
    .filter(
      (unk) => unk.topic.trim().length > 0 || unk.notes.trim().length > 0
    );
}

function mapRowToResearchProfile(row: ResearchWithRelations): ResearchProfile {
  const validStatuses: Array<"pending" | "completed" | "failed"> = [
    "pending",
    "completed",
    "failed",
  ];
  const research_status = validStatuses.includes(
    row.research_status as "pending" | "completed" | "failed"
  )
    ? (row.research_status as "pending" | "completed" | "failed")
    : "pending";

  const lead_name = row.leads
    ? `${row.leads.first_name} ${row.leads.last_name}`.trim()
    : "—";
  const company_name =
    row.leads?.accounts?.company_name || row.accounts?.company_name || "—";

  return {
    id: row.id,
    lead_id: row.lead_id,
    account_id: row.account_id,
    lead_name,
    company_name,
    observed_facts: parseObservedFacts(row.observed_facts),
    reasonable_inferences: parseReasonableInferences(
      row.reasonable_inferences
    ),
    unknowns: parseUnknownAssumptions(row.unknowns),
    business_trigger: row.business_trigger,
    trigger_source_type: row.trigger_source_type,
    trigger_source_title: row.trigger_source_title,
    trigger_source_url: row.trigger_source_url,
    trigger_source_date: row.trigger_source_date,
    trigger_notes: row.trigger_notes,
    problem_hypothesis: row.problem_hypothesis,
    business_consequence: row.business_consequence,
    future_state: row.future_state,
    personalization_angle: row.personalization_angle,
    research_status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function getResearchProfileByLeadId(
  leadId: string
): Promise<ResearchProfile | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("research")
    .select(`
      id,
      lead_id,
      account_id,
      business_trigger,
      trigger_source_type,
      trigger_source_title,
      trigger_source_url,
      trigger_source_date,
      trigger_notes,
      problem_hypothesis,
      business_consequence,
      future_state,
      personalization_angle,
      research_status,
      observed_facts,
      reasonable_inferences,
      unknowns,
      created_at,
      updated_at,
      leads (
        first_name,
        last_name,
        accounts (
          company_name
        )
      ),
      accounts (
        company_name
      )
    `)
    .eq("lead_id", leadId)
    .maybeSingle();

  if (error) {
    throw new ServiceError(
      "research-service",
      `Failed to retrieve research profile for lead ${leadId}: ${error.message}`,
      error.code,
      error.details
    );
  }

  if (!data) {
    return null;
  }

  return mapRowToResearchProfile(data as unknown as ResearchWithRelations);
}

export async function getLatestResearchProfile(): Promise<ResearchProfile | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("research")
    .select(`
      id,
      lead_id,
      account_id,
      business_trigger,
      trigger_source_type,
      trigger_source_title,
      trigger_source_url,
      trigger_source_date,
      trigger_notes,
      problem_hypothesis,
      business_consequence,
      future_state,
      personalization_angle,
      research_status,
      observed_facts,
      reasonable_inferences,
      unknowns,
      created_at,
      updated_at,
      leads (
        first_name,
        last_name,
        accounts (
          company_name
        )
      ),
      accounts (
        company_name
      )
    `)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new ServiceError(
      "research-service",
      `Failed to retrieve latest research profile: ${error.message}`,
      error.code,
      error.details
    );
  }

  if (!data) {
    return null;
  }

  return mapRowToResearchProfile(data as unknown as ResearchWithRelations);
}

export async function getResearchProfileById(
  id: string
): Promise<ResearchProfile | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("research")
    .select(`
      id,
      lead_id,
      account_id,
      business_trigger,
      trigger_source_type,
      trigger_source_title,
      trigger_source_url,
      trigger_source_date,
      trigger_notes,
      problem_hypothesis,
      business_consequence,
      future_state,
      personalization_angle,
      research_status,
      observed_facts,
      reasonable_inferences,
      unknowns,
      created_at,
      updated_at,
      leads (
        first_name,
        last_name,
        accounts (
          company_name
        )
      ),
      accounts (
        company_name
      )
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new ServiceError(
      "research-service",
      `Failed to retrieve research profile ${id}: ${error.message}`,
      error.code,
      error.details
    );
  }

  if (!data) {
    return null;
  }

  return mapRowToResearchProfile(data as unknown as ResearchWithRelations);
}

export async function getResearchProfiles(): Promise<ResearchProfile[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("research")
    .select(`
      id,
      lead_id,
      account_id,
      business_trigger,
      trigger_source_type,
      trigger_source_title,
      trigger_source_url,
      trigger_source_date,
      trigger_notes,
      problem_hypothesis,
      business_consequence,
      future_state,
      personalization_angle,
      research_status,
      observed_facts,
      reasonable_inferences,
      unknowns,
      created_at,
      updated_at,
      leads (
        first_name,
        last_name,
        accounts (
          company_name
        )
      ),
      accounts (
        company_name
      )
    `)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new ServiceError(
      "research-service",
      `Failed to retrieve research profiles: ${error.message}`,
      error.code,
      error.details
    );
  }

  if (!data || data.length === 0) {
    return [];
  }

  return (data as unknown as ResearchWithRelations[]).map(
    mapRowToResearchProfile
  );
}

/**
 * Persists a structured research profile for a lead.
 * Enforces authenticated session and lead ownership.
 * Performs an INSERT if no profile exists, or an UPDATE if one exists,
 * respecting the database's UNIQUE(lead_id) constraint.
 * Logs a 'research_completed' activity upon successful persistence.
 */
export async function saveResearchProfile(
  leadId: string,
  input: Omit<SaveResearchProfileInput, "lead_id">
): Promise<ResearchProfile> {
  const supabase = await createClient();

  // 1. Authenticate user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new ServiceError(
      "research-service",
      "Authentication required to save research profile",
      "UNAUTHENTICATED"
    );
  }

  // 2. Validate input schema
  const validated = saveResearchProfileSchema.parse({
    ...input,
    lead_id: leadId,
  });

  // 3. Verify lead belongs to authenticated user
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("id, user_id, campaign_id, account_id")
    .eq("id", leadId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (leadError || !lead) {
    throw new ServiceError(
      "research-service",
      `Lead ${leadId} not found or not owned by user`,
      "LEAD_NOT_FOUND"
    );
  }

  const targetAccountId = validated.account_id ?? lead.account_id ?? null;

  // 4. Check if research profile already exists for this lead
  const { data: existingProfile, error: checkError } = await supabase
    .from("research")
    .select("id")
    .eq("lead_id", leadId)
    .maybeSingle();

  if (checkError) {
    throw new ServiceError(
      "research-service",
      `Failed to check existing research profile: ${checkError.message}`,
      checkError.code,
      checkError.details
    );
  }

  let savedRow: ResearchWithRelations | null = null;

  const payload = {
    account_id: targetAccountId,
    observed_facts: validated.observed_facts as unknown as Json,
    reasonable_inferences: validated.reasonable_inferences as unknown as Json,
    unknowns: validated.unknowns as unknown as Json,
    business_trigger: validated.business_trigger ?? null,
    trigger_source_type: validated.trigger_source_type ?? null,
    trigger_source_title: validated.trigger_source_title ?? null,
    trigger_source_url: validated.trigger_source_url ?? null,
    trigger_source_date: validated.trigger_source_date ?? null,
    trigger_notes: validated.trigger_notes ?? null,
    problem_hypothesis: validated.problem_hypothesis ?? null,
    business_consequence: validated.business_consequence ?? null,
    future_state: validated.future_state ?? null,
    personalization_angle: validated.personalization_angle ?? null,
    research_status: validated.research_status,
  };

  const selectQuery = `
    id,
    lead_id,
    account_id,
    business_trigger,
    trigger_source_type,
    trigger_source_title,
    trigger_source_url,
    trigger_source_date,
    trigger_notes,
    problem_hypothesis,
    business_consequence,
    future_state,
    personalization_angle,
    research_status,
    observed_facts,
    reasonable_inferences,
    unknowns,
    created_at,
    updated_at,
    leads (
      first_name,
      last_name,
      accounts (
        company_name
      )
    ),
    accounts (
      company_name
    )
  `;

  if (existingProfile) {
    // UPDATE existing record
    const { data: updated, error: updateError } = await supabase
      .from("research")
      .update(payload)
      .eq("id", existingProfile.id)
      .select(selectQuery)
      .single();

    if (updateError) {
      throw new ServiceError(
        "research-service",
        `Failed to update research profile for lead ${leadId}: ${updateError.message}`,
        updateError.code,
        updateError.details
      );
    }
    savedRow = updated as unknown as ResearchWithRelations;
  } else {
    // INSERT new record
    const { data: inserted, error: insertError } = await supabase
      .from("research")
      .insert({
        ...payload,
        lead_id: leadId,
      })
      .select(selectQuery)
      .single();

    if (insertError) {
      // Catch concurrent race condition (uq_research_lead_id)
      if (insertError.code === "23505") {
        const { data: fallbackUpdated, error: fallbackErr } = await supabase
          .from("research")
          .update(payload)
          .eq("lead_id", leadId)
          .select(selectQuery)
          .single();

        if (fallbackErr) {
          throw new ServiceError(
            "research-service",
            `Failed to persist research profile on conflict: ${fallbackErr.message}`,
            fallbackErr.code,
            fallbackErr.details
          );
        }
        savedRow = fallbackUpdated as unknown as ResearchWithRelations;
      } else {
        throw new ServiceError(
          "research-service",
          `Failed to create research profile for lead ${leadId}: ${insertError.message}`,
          insertError.code,
          insertError.details
        );
      }
    } else {
      savedRow = inserted as unknown as ResearchWithRelations;
    }
  }

  if (!savedRow) {
    throw new ServiceError(
      "research-service",
      `Failed to persist research profile for lead ${leadId}: empty response`,
      "INTERNAL_ERROR"
    );
  }

  // 5. Log research activity
  try {
    await logActivity({
      lead_id: leadId,
      campaign_id: lead.campaign_id,
      activity_type: "research_completed",
      metadata: {
        observed_facts_count: validated.observed_facts.length,
        reasonable_inferences_count: validated.reasonable_inferences.length,
        unknowns_count: validated.unknowns.length,
        business_trigger: validated.business_trigger,
      },
    });
  } catch (logErr) {
    console.error("Failed to log research_completed activity:", logErr);
  }

  return mapRowToResearchProfile(savedRow);
}
