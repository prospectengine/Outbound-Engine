import { createClient } from "@/lib/supabase/server";
import {
  Lead,
  EmailStatus,
  OutreachStatus,
  ApprovalStatus,
  ReplyStatus,
  BatchImportResult,
  ImportRowResult,
} from "@/types";
import {
  createLeadSchema,
  csvLeadRowSchema,
  normalizeDomain,
  CreateLeadInput,
  CsvLeadRowInput,
} from "@/lib/validations/lead";
import { logActivity } from "@/services/activity-service";
import { ServiceError } from "./errors";


type LeadWithAccount = {
  id: string;
  user_id: string;
  account_id: string | null;
  campaign_id: string;
  first_name: string;
  last_name: string;
  email: string;
  job_title: string | null;
  linkedin_url: string | null;
  country: string | null;
  industry: string | null;
  lead_objective: string | null;
  email_status: string;
  outreach_status: string;
  approval_status: string;
  reply_status: string;
  stop_sequence: boolean;
  current_step: number;
  next_action: string | null;
  next_action_date: string | null;
  created_at: string;
  updated_at: string;
  accounts: {
    id: string;
    company_name: string;
    domain: string | null;
    website: string | null;
    industry: string | null;
    company_size: string | null;
    country: string | null;
    region: string | null;
  } | null;
};

function mapRowToLead(row: LeadWithAccount): Lead {
  const validEmailStatuses: EmailStatus[] = [
    "unverified",
    "valid",
    "catch_all",
    "invalid",
  ];
  const email_status: EmailStatus = validEmailStatuses.includes(
    row.email_status as EmailStatus
  )
    ? (row.email_status as EmailStatus)
    : "unverified";

  const validOutreachStatuses: OutreachStatus[] = [
    "not_started",
    "in_progress",
    "paused",
    "completed",
    "stopped",
  ];
  const outreach_status: OutreachStatus = validOutreachStatuses.includes(
    row.outreach_status as OutreachStatus
  )
    ? (row.outreach_status as OutreachStatus)
    : "not_started";

  const validApprovalStatuses: ApprovalStatus[] = [
    "pending",
    "approved",
    "rejected",
  ];
  const approval_status: ApprovalStatus = validApprovalStatuses.includes(
    row.approval_status as ApprovalStatus
  )
    ? (row.approval_status as ApprovalStatus)
    : "pending";

  const validReplyStatuses: ReplyStatus[] = [
    "none",
    "replied_interested",
    "replied_not_interested",
    "replied_wrong_person",
    "replied_ooo",
  ];
  const reply_status: ReplyStatus = validReplyStatuses.includes(
    row.reply_status as ReplyStatus
  )
    ? (row.reply_status as ReplyStatus)
    : "none";

  const company_name = row.accounts?.company_name || "—";
  const industry = row.industry || row.accounts?.industry || "—";
  const country = row.country || row.accounts?.country || "—";

  return {
    id: row.id,
    user_id: row.user_id,
    account_id: row.account_id,
    campaign_id: row.campaign_id,
    first_name: row.first_name,
    last_name: row.last_name,
    email: row.email,
    job_title: row.job_title,
    company_name,
    linkedin_url: row.linkedin_url,
    country,
    industry,
    lead_objective: row.lead_objective,
    email_status,
    outreach_status,
    approval_status,
    reply_status,
    stop_sequence: row.stop_sequence,
    current_step: row.current_step,
    next_action: row.next_action,
    next_action_date: row.next_action_date,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function getLeads(): Promise<Lead[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("leads")
    .select(`
      id,
      user_id,
      account_id,
      campaign_id,
      first_name,
      last_name,
      email,
      job_title,
      linkedin_url,
      country,
      industry,
      lead_objective,
      email_status,
      outreach_status,
      approval_status,
      reply_status,
      stop_sequence,
      current_step,
      next_action,
      next_action_date,
      created_at,
      updated_at,
      accounts (
        id,
        company_name,
        domain,
        website,
        industry,
        company_size,
        country,
        region
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    throw new ServiceError(
      "lead-service",
      `Failed to retrieve leads: ${error.message}`,
      error.code,
      error.details
    );
  }

  if (!data || data.length === 0) {
    return [];
  }

  return (data as unknown as LeadWithAccount[]).map(mapRowToLead);
}

export async function getLeadById(id: string): Promise<Lead | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("leads")
    .select(`
      id,
      user_id,
      account_id,
      campaign_id,
      first_name,
      last_name,
      email,
      job_title,
      linkedin_url,
      country,
      industry,
      lead_objective,
      email_status,
      outreach_status,
      approval_status,
      reply_status,
      stop_sequence,
      current_step,
      next_action,
      next_action_date,
      created_at,
      updated_at,
      accounts (
        id,
        company_name,
        domain,
        website,
        industry,
        company_size,
        country,
        region
      )
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new ServiceError(
      "lead-service",
      `Failed to retrieve lead ${id}: ${error.message}`,
      error.code,
      error.details
    );
  }

  if (!data) {
    return null;
  }

  return mapRowToLead(data as unknown as LeadWithAccount);
}

/**
 * Resolves an existing account for the authenticated user or creates a new one.
 * Adheres strictly to the domain/no-domain match rules:
 * - With domain: search by (user_id, domain) -> reuse if 1, insert if 0 (catch unique constraint on concurrent race)
 * - Without domain: search by company_name -> reuse if exactly 1, insert if 0, throw AMBIGUOUS_ACCOUNT_MATCH if > 1 (never guess)
 */
export async function resolveOrCreateAccount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  accountData: {
    company_name: string;
    domain?: string | null;
    website?: string | null;
    industry?: string | null;
    company_size?: string | null;
    country?: string | null;
    linkedin_url?: string | null;
  }
): Promise<string> {
  const trimmedCompanyName = accountData.company_name.trim();
  const normalizedDomain = accountData.domain ? normalizeDomain(accountData.domain) : null;

  if (normalizedDomain) {
    // 1. Search for account belonging to authenticated user with exact normalized domain
    const { data: domainAccounts, error: searchError } = await supabase
      .from("accounts")
      .select("id")
      .eq("user_id", userId)
      .eq("domain", normalizedDomain);

    if (searchError) {
      throw new ServiceError(
        "lead-service",
        `Failed to search accounts by domain: ${searchError.message}`,
        searchError.code,
        searchError.details
      );
    }

    if (domainAccounts && domainAccounts.length > 0) {
      return domainAccounts[0].id;
    }

    // 2. No account exists with domain -> insert new account
    const { data: newAccount, error: insertError } = await supabase
      .from("accounts")
      .insert({
        user_id: userId,
        company_name: trimmedCompanyName,
        domain: normalizedDomain,
        website: accountData.website ?? `https://${normalizedDomain}`,
        industry: accountData.industry ?? null,
        company_size: accountData.company_size ?? null,
        country: accountData.country ?? null,
        linkedin_url: accountData.linkedin_url ?? null,
        account_status: "target",
      })
      .select("id")
      .single();

    if (insertError) {
      // Catch unique constraint violation on concurrent insert race (uq_accounts_user_domain)
      if (insertError.code === "23505") {
        const { data: retryAccounts } = await supabase
          .from("accounts")
          .select("id")
          .eq("user_id", userId)
          .eq("domain", normalizedDomain);

        if (retryAccounts && retryAccounts.length > 0) {
          return retryAccounts[0].id;
        }
      }

      throw new ServiceError(
        "lead-service",
        `Failed to create account for domain ${normalizedDomain}: ${insertError.message}`,
        insertError.code,
        insertError.details
      );
    }

    return newAccount.id;
  }

  // Missing domain path:
  // 1. Search accounts belonging to the authenticated user by company_name
  const { data: nameAccounts, error: nameSearchError } = await supabase
    .from("accounts")
    .select("id")
    .eq("user_id", userId)
    .eq("company_name", trimmedCompanyName);

  if (nameSearchError) {
    throw new ServiceError(
      "lead-service",
      `Failed to search accounts by company name: ${nameSearchError.message}`,
      nameSearchError.code,
      nameSearchError.details
    );
  }

  // 2. Exactly one match -> reuse
  if (nameAccounts && nameAccounts.length === 1) {
    return nameAccounts[0].id;
  }

  // 3. Multiple matches -> DO NOT GUESS. Return structured ambiguous_account_match error
  if (nameAccounts && nameAccounts.length > 1) {
    throw new ServiceError(
      "lead-service",
      `Ambiguous account match: multiple accounts (${nameAccounts.length}) found with company name "${trimmedCompanyName}". Please provide a company domain to disambiguate.`,
      "AMBIGUOUS_ACCOUNT_MATCH"
    );
  }

  // 4. Zero matches -> create new account with domain = null
  const { data: newAccount, error: createError } = await supabase
    .from("accounts")
    .insert({
      user_id: userId,
      company_name: trimmedCompanyName,
      domain: null,
      website: accountData.website ?? null,
      industry: accountData.industry ?? null,
      company_size: accountData.company_size ?? null,
      country: accountData.country ?? null,
      linkedin_url: accountData.linkedin_url ?? null,
      account_status: "target",
    })
    .select("id")
    .single();

  if (createError) {
    throw new ServiceError(
      "lead-service",
      `Failed to create account for company "${trimmedCompanyName}": ${createError.message}`,
      createError.code,
      createError.details
    );
  }

  return newAccount.id;
}

/**
 * Creates a single lead in an existing campaign owned by the authenticated user.
 * Initializes exactly 1 sequence and logs a 'lead_created' activity.
 */
export async function createLead(input: CreateLeadInput): Promise<Lead> {
  const supabase = await createClient();

  // 1. Authenticate user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new ServiceError(
      "lead-service",
      "Authentication required to create a lead",
      "UNAUTHENTICATED"
    );
  }

  // 2. Validate input schema
  const validated = createLeadSchema.parse(input);
  const normalizedEmail = validated.email.trim().toLowerCase();

  // 3. Verify campaign ownership
  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("id, status")
    .eq("id", validated.campaign_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (campaignError || !campaign) {
    throw new ServiceError(
      "lead-service",
      `Campaign ${validated.campaign_id} not found or not owned by user`,
      "CAMPAIGN_NOT_FOUND"
    );
  }

  // 4. Duplicate pre-check on (campaign_id, email)
  const { data: existingLead, error: dupCheckError } = await supabase
    .from("leads")
    .select("id")
    .eq("campaign_id", validated.campaign_id)
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (dupCheckError) {
    throw new ServiceError(
      "lead-service",
      `Failed to check duplicate lead: ${dupCheckError.message}`,
      dupCheckError.code,
      dupCheckError.details
    );
  }

  if (existingLead) {
    throw new ServiceError(
      "lead-service",
      `Lead with email "${normalizedEmail}" already exists in this campaign.`,
      "DUPLICATE_LEAD"
    );
  }

  // 5. Resolve or create Account
  const accountId = await resolveOrCreateAccount(supabase, user.id, {
    company_name: validated.company_name,
    domain: validated.company_domain,
    website: validated.company_website,
    industry: validated.industry,
    company_size: validated.company_size,
    country: validated.country,
    linkedin_url: validated.linkedin_url,
  });

  // 6. Insert Lead
  const { data: newLeadRow, error: leadInsertError } = await supabase
    .from("leads")
    .insert({
      user_id: user.id,
      campaign_id: validated.campaign_id,
      account_id: accountId,
      first_name: validated.first_name,
      last_name: validated.last_name,
      email: normalizedEmail,
      job_title: validated.job_title ?? null,
      linkedin_url: validated.linkedin_url ?? null,
      country: validated.country ?? null,
      industry: validated.industry ?? null,
      lead_objective: validated.lead_objective ?? null,
      email_status: "unverified",
      outreach_status: "not_started",
      approval_status: "pending",
      reply_status: "none",
      stop_sequence: false,
      current_step: 0,
    })
    .select(`
      id,
      user_id,
      account_id,
      campaign_id,
      first_name,
      last_name,
      email,
      job_title,
      linkedin_url,
      country,
      industry,
      lead_objective,
      email_status,
      outreach_status,
      approval_status,
      reply_status,
      stop_sequence,
      current_step,
      next_action,
      next_action_date,
      created_at,
      updated_at,
      accounts (
        id,
        company_name,
        domain,
        website,
        industry,
        company_size,
        country,
        region
      )
    `)
    .single();

  if (leadInsertError) {
    if (leadInsertError.code === "23505") {
      throw new ServiceError(
        "lead-service",
        `Lead with email "${normalizedEmail}" already exists in this campaign.`,
        "DUPLICATE_LEAD"
      );
    }
    throw new ServiceError(
      "lead-service",
      `Failed to create lead: ${leadInsertError.message}`,
      leadInsertError.code,
      leadInsertError.details
    );
  }

  // 7. Create exactly one sequence for the new lead
  const { error: seqError } = await supabase.from("sequences").insert({
    campaign_id: validated.campaign_id,
    lead_id: newLeadRow.id,
    current_step: 1,
    status: "pending",
  });

  if (seqError) {
    throw new ServiceError(
      "lead-service",
      `Lead created (${newLeadRow.id}) but sequence initialization failed: ${seqError.message}`,
      seqError.code,
      seqError.details
    );
  }

  // 8. Log activity event
  try {
    await logActivity({
      lead_id: newLeadRow.id,
      campaign_id: validated.campaign_id,
      activity_type: "lead_created",
      metadata: {
        email: normalizedEmail,
        first_name: validated.first_name,
        last_name: validated.last_name,
        company_name: validated.company_name,
      },
    });
  } catch (logErr) {
    console.error("Failed to log lead_created activity:", logErr);
  }

  return mapRowToLead(newLeadRow as unknown as LeadWithAccount);
}

/**
 * Imports a batch of CSV lead rows into a campaign owned by the authenticated user.
 * Sequentially processes each row and returns structured created / duplicate / failed breakdowns.
 */
export async function importLeadsBatch(
  campaignId: string,
  rows: CsvLeadRowInput[]
): Promise<BatchImportResult> {
  const supabase = await createClient();

  // 1. Authenticate user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new ServiceError(
      "lead-service",
      "Authentication required to import leads",
      "UNAUTHENTICATED"
    );
  }

  // 2. Verify campaign ownership
  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("id, status")
    .eq("id", campaignId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (campaignError || !campaign) {
    throw new ServiceError(
      "lead-service",
      `Campaign ${campaignId} not found or not owned by user`,
      "CAMPAIGN_NOT_FOUND"
    );
  }

  const results: ImportRowResult[] = [];
  let createdCount = 0;
  let duplicateCount = 0;
  let failedCount = 0;

  // 3. Process each row sequentially
  for (let i = 0; i < rows.length; i++) {
    const rowNumber = i + 1;
    const rawRow = rows[i];

    // Step 1: Validate row schema
    const parseResult = csvLeadRowSchema.safeParse(rawRow);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues
        .map((issue) => issue.message)
        .join("; ");
      results.push({
        row_number: rowNumber,
        status: "failed",
        email: typeof rawRow.email === "string" ? rawRow.email : undefined,
        failed_step: "validation",
        error: errorMsg || "Validation failed for lead row",
      });
      failedCount++;
      continue;
    }

    const row = parseResult.data;
    const normalizedEmail = row.email.trim().toLowerCase();

    // Step 2: Check duplicate in campaign
    let existingLead: { id: string } | null = null;
    try {
      const { data: dupData, error: dupError } = await supabase
        .from("leads")
        .select("id")
        .eq("campaign_id", campaignId)
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (dupError) {
        throw new Error(dupError.message);
      }
      existingLead = dupData;
    } catch (dupErr: unknown) {
      const errMsg = dupErr instanceof Error ? dupErr.message : "Duplicate check failed";
      results.push({
        row_number: rowNumber,
        status: "failed",
        email: normalizedEmail,
        failed_step: "duplicate_check",
        error: `Database check error: ${errMsg}`,
      });
      failedCount++;
      continue;
    }

    if (existingLead) {
      results.push({
        row_number: rowNumber,
        status: "duplicate",
        email: normalizedEmail,
        message: `Lead with email "${normalizedEmail}" already exists in this campaign.`,
      });
      duplicateCount++;
      continue;
    }

    // Step 3: Resolve or create Account
    let accountId: string;
    try {
      accountId = await resolveOrCreateAccount(supabase, user.id, {
        company_name: row.company_name,
        domain: row.company_domain,
        website: row.company_website,
        industry: row.industry,
        company_size: row.company_size,
        country: row.country,
        linkedin_url: row.linkedin_url,
      });
    } catch (accErr: unknown) {
      const errMsg = accErr instanceof Error ? accErr.message : "Account resolution failed";
      results.push({
        row_number: rowNumber,
        status: "failed",
        email: normalizedEmail,
        failed_step: "account_resolution",
        error: errMsg,
      });
      failedCount++;
      continue;
    }

    // Step 4: Insert Lead
    let newLeadRow: LeadWithAccount | null = null;
    try {
      const { data: insertedData, error: leadInsertError } = await supabase
        .from("leads")
        .insert({
          user_id: user.id,
          campaign_id: campaignId,
          account_id: accountId,
          first_name: row.first_name,
          last_name: row.last_name,
          email: normalizedEmail,
          job_title: row.job_title ?? null,
          linkedin_url: row.linkedin_url ?? null,
          country: row.country ?? null,
          industry: row.industry ?? null,
          lead_objective: row.lead_objective ?? null,
          email_status: "unverified",
          outreach_status: "not_started",
          approval_status: "pending",
          reply_status: "none",
          stop_sequence: false,
          current_step: 0,
        })
        .select(`
          id,
          user_id,
          account_id,
          campaign_id,
          first_name,
          last_name,
          email,
          job_title,
          linkedin_url,
          country,
          industry,
          lead_objective,
          email_status,
          outreach_status,
          approval_status,
          reply_status,
          stop_sequence,
          current_step,
          next_action,
          next_action_date,
          created_at,
          updated_at,
          accounts (
            id,
            company_name,
            domain,
            website,
            industry,
            company_size,
            country,
            region
          )
        `)
        .single();

      if (leadInsertError) {
        if (leadInsertError.code === "23505") {
          results.push({
            row_number: rowNumber,
            status: "duplicate",
            email: normalizedEmail,
            message: `Lead with email "${normalizedEmail}" already exists in this campaign.`,
          });
          duplicateCount++;
          continue;
        }
        throw new Error(leadInsertError.message);
      }

      newLeadRow = insertedData as unknown as LeadWithAccount;
    } catch (insertErr: unknown) {
      const errMsg = insertErr instanceof Error ? insertErr.message : "Failed to create lead";
      results.push({
        row_number: rowNumber,
        status: "failed",
        email: normalizedEmail,
        failed_step: "lead_creation",
        error: errMsg,
      });
      failedCount++;
      continue;
    }

    if (!newLeadRow) {
      results.push({
        row_number: rowNumber,
        status: "failed",
        email: normalizedEmail,
        failed_step: "lead_creation",
        error: "Lead insert returned empty record",
      });
      failedCount++;
      continue;
    }

    // Step 5: Insert Sequence
    try {
      const { error: seqError } = await supabase.from("sequences").insert({
        campaign_id: campaignId,
        lead_id: newLeadRow.id,
        current_step: 1,
        status: "pending",
      });

      if (seqError) {
        throw new Error(seqError.message);
      }
    } catch (seqErr: unknown) {
      const errMsg = seqErr instanceof Error ? seqErr.message : "Sequence creation failed";
      results.push({
        row_number: rowNumber,
        status: "failed",
        email: normalizedEmail,
        failed_step: "sequence_creation",
        error: `Lead was created (ID: ${newLeadRow.id}) but sequence initialization failed: ${errMsg}`,
      });
      failedCount++;
      continue;
    }

    // Step 6: Log activity
    try {
      await logActivity({
        lead_id: newLeadRow.id,
        campaign_id: campaignId,
        activity_type: "lead_imported",
        metadata: {
          row_number: rowNumber,
          email: normalizedEmail,
          first_name: row.first_name,
          last_name: row.last_name,
          company_name: row.company_name,
        },
      });
    } catch (logErr) {
      console.error(`Failed to log activity for imported lead ${newLeadRow.id}:`, logErr);
    }

    // Step 7: Record success
    results.push({
      row_number: rowNumber,
      status: "created",
      lead: mapRowToLead(newLeadRow),
    });
    createdCount++;
  }

  return {
    total: rows.length,
    created_count: createdCount,
    duplicate_count: duplicateCount,
    failed_count: failedCount,
    results,
  };
}
