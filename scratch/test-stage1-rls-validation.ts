import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { Database } from "@/types/database.types";

// Load environment variables from .env.local manually
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...vals] = trimmed.split("=");
    if (key && vals.length > 0) {
      process.env[key.trim()] = vals.join("=").trim();
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

// Read test credentials from environment variables or CLI arguments
const userAEmail = process.env.TEST_USER_A_EMAIL || process.argv[2];
const userAPassword = process.env.TEST_USER_A_PASSWORD || process.argv[3];
const userBEmail = process.env.TEST_USER_B_EMAIL || process.argv[4];
const userBPassword = process.env.TEST_USER_B_PASSWORD || process.argv[5];

function logPass(msg: string) {
  console.log(`[PASS] ${msg}`);
}

function logFail(msg: string) {
  console.error(`[FAIL] ${msg}`);
}

async function runTwoUserValidation() {
  console.log("==================================================");
  console.log("STAGE 1: TWO-USER MULTI-TENANT RLS RUNTIME VALIDATION");
  console.log("==================================================");
  console.log(`Supabase URL: ${supabaseUrl}`);

  // Safety Guard: Require pre-existing confirmed credentials before making any Auth calls
  if (!userAEmail || !userAPassword || !userBEmail || !userBPassword) {
    console.log("\n[STATUS: CREDENTIALS_REQUIRED]");
    console.log("This test harness requires two pre-existing, confirmed Supabase user accounts.");
    console.log("No automatic signup, probe, or email generation will be performed.\n");
    console.log("Usage:");
    console.log("  npx tsx scratch/test-stage1-rls-validation.ts <userA_email> <userA_password> <userB_email> <userB_password>\n");
    console.log("Or via environment variables:");
    console.log("  TEST_USER_A_EMAIL=... TEST_USER_A_PASSWORD=... TEST_USER_B_EMAIL=... TEST_USER_B_PASSWORD=... npx tsx scratch/test-stage1-rls-validation.ts\n");
    console.log("Exiting without making any network requests to Supabase Auth.");

    return {
      executed: false,
      reason: "Credentials required for pre-existing confirmed test users",
    };
  }

  // Create dedicated user-scoped clients using Supabase JS client and ANON key
  const clientA = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const clientB = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(`\n1. Authenticating USER A (${userAEmail})...`);
  const { data: authA, error: errA } = await clientA.auth.signInWithPassword({
    email: userAEmail,
    password: userAPassword,
  });
  if (errA || !authA.user || !authA.session) {
    logFail(`Failed to authenticate User A: ${errA?.message || "No session"}`);
    return { executed: false, reason: `User A auth failed: ${errA?.message}` };
  }
  const userAId = authA.user.id;
  logPass(`User A authenticated successfully (UID: ${userAId})`);

  console.log(`\n2. Authenticating USER B (${userBEmail})...`);
  const { data: authB, error: errB } = await clientB.auth.signInWithPassword({
    email: userBEmail,
    password: userBPassword,
  });
  if (errB || !authB.user || !authB.session) {
    logFail(`Failed to authenticate User B: ${errB?.message || "No session"}`);
    return { executed: false, reason: `User B auth failed: ${errB?.message}` };
  }
  const userBId = authB.user.id;
  logPass(`User B authenticated successfully (UID: ${userBId})`);

  if (userAId === userBId) {
    logFail("User A and User B have the same auth.uid! Distinct accounts required.");
    return { executed: false, reason: "Identical UIDs" };
  }

  console.log("\n==================================================");
  console.log("3. CREATING TEST DATA AS USER A");
  console.log("==================================================");

  // User A Account
  const accountADomain = `usera-corp-${Date.now()}.com`;
  const { data: accountA, error: accErrA } = await clientA
    .from("accounts")
    .insert({
      user_id: userAId,
      company_name: "User A Test Corp",
      domain: accountADomain,
      account_status: "target",
    })
    .select("id, user_id, company_name")
    .single();

  if (accErrA || !accountA) {
    logFail(`User A failed to create account: ${accErrA?.message}`);
    return { executed: false, reason: accErrA?.message };
  }
  logPass(`User A created Account A (ID: ${accountA.id})`);

  // User A Campaign
  const { data: campaignA, error: campErrA } = await clientA
    .from("campaigns")
    .insert({
      user_id: userAId,
      name: `User A Campaign ${Date.now()}`,
      icp_description: "Enterprise SaaS CTOs",
      offer_description: "AI-driven outbound engine",
      campaign_objective: "Book discovery calls",
      status: "active",
    })
    .select("id, user_id, name")
    .single();

  if (campErrA || !campaignA) {
    logFail(`User A failed to create campaign: ${campErrA?.message}`);
    return { executed: false, reason: campErrA?.message };
  }
  logPass(`User A created Campaign A (ID: ${campaignA.id})`);

  // User A Lead
  const leadAEmail = `lead.a.${Date.now()}@usera-corp.com`;
  const { data: leadA, error: leadErrA } = await clientA
    .from("leads")
    .insert({
      user_id: userAId,
      account_id: accountA.id,
      campaign_id: campaignA.id,
      first_name: "Alice",
      last_name: "ProspectA",
      email: leadAEmail,
      job_title: "VP Engineering",
      email_status: "valid",
      outreach_status: "in_progress",
    })
    .select("id, user_id, email, campaign_id")
    .single();

  if (leadErrA || !leadA) {
    logFail(`User A failed to create lead: ${leadErrA?.message}`);
    return { executed: false, reason: leadErrA?.message };
  }
  logPass(`User A created Lead A (ID: ${leadA.id})`);

  // User A Sequence
  const { data: seqA, error: seqErrA } = await clientA
    .from("sequences")
    .insert({
      campaign_id: campaignA.id,
      lead_id: leadA.id,
      current_step: 1,
      status: "active",
    })
    .select("id, campaign_id, lead_id")
    .single();

  if (seqErrA || !seqA) {
    logFail(`User A failed to create sequence: ${seqErrA?.message}`);
    return { executed: false, reason: seqErrA?.message };
  }
  logPass(`User A created Sequence A (ID: ${seqA.id})`);

  // User A Research
  const { data: resA, error: resErrA } = await clientA
    .from("research")
    .insert({
      lead_id: leadA.id,
      account_id: accountA.id,
      business_trigger: "Expanding EMEA sales team",
      problem_hypothesis: "Manual outbound copywriting scaling bottleneck",
      observed_facts: [{ fact: "Hiring 10 SDRs in London", source_type: "linkedin_post", confidence: 1.0 }],
      reasonable_inferences: [{ inference: "Needs outbound automation", premise: "Rapid SDR hiring" }],
      unknowns: [{ topic: "Current CRM tooling", notes: "Unknown if HubSpot or Salesforce" }],
      research_status: "completed",
    })
    .select("id, lead_id, business_trigger")
    .single();

  if (resErrA || !resA) {
    logFail(`User A failed to create research: ${resErrA?.message}`);
    return { executed: false, reason: resErrA?.message };
  }
  logPass(`User A created Research A (ID: ${resA.id})`);

  // User A Email Draft
  const { data: emailA, error: emailErrA } = await clientA
    .from("emails")
    .insert({
      sequence_id: seqA.id,
      lead_id: leadA.id,
      step_number: 1,
      strategic_purpose: "relevance",
      subject_line: "Scaling EMEA outbound",
      body_generated: "Saw the EMEA expansion. Scaling SDR headcount creates messaging consistency challenges.",
      qa_score: 46,
      approval_status: "pending_approval",
      sending_status: "unapproved",
    })
    .select("id, lead_id, sequence_id, approval_status, sending_status")
    .single();

  if (emailErrA || !emailA) {
    logFail(`User A failed to create email: ${emailErrA?.message}`);
    return { executed: false, reason: emailErrA?.message };
  }
  logPass(`User A created Email A (ID: ${emailA.id})`);

  // User A Activity
  const { data: actA, error: actErrA } = await clientA
    .from("activities")
    .insert({
      user_id: userAId,
      lead_id: leadA.id,
      campaign_id: campaignA.id,
      email_id: emailA.id,
      activity_type: "email_generated",
      metadata: { step: 1, score: 46 },
    })
    .select("id, user_id, activity_type")
    .single();

  if (actErrA || !actA) {
    logFail(`User A failed to create activity: ${actErrA?.message}`);
    return { executed: false, reason: actErrA?.message };
  }
  logPass(`User A created Activity A (ID: ${actA.id})`);

  console.log("\n==================================================");
  console.log("4. USER A POSITIVE ACCESS VERIFICATION");
  console.log("==================================================");

  const { data: readCampA } = await clientA.from("campaigns").select("id").eq("id", campaignA.id).single();
  const { data: readLeadA } = await clientA.from("leads").select("id").eq("id", leadA.id).single();
  const { data: readSeqA } = await clientA.from("sequences").select("id").eq("id", seqA.id).single();
  const { data: readResA } = await clientA.from("research").select("id").eq("id", resA.id).single();
  const { data: readEmailA } = await clientA.from("emails").select("id").eq("id", emailA.id).single();
  const { data: readActA } = await clientA.from("activities").select("id").eq("id", actA.id).single();

  if (readCampA && readLeadA && readSeqA && readResA && readEmailA && readActA) {
    logPass("User A successfully queried all 6 own tenant records (Campaign, Lead, Sequence, Research, Email, Activity)");
  } else {
    logFail("User A failed positive read on own records!");
  }

  console.log("\n==================================================");
  console.log("5. CREATING TEST DATA AS USER B");
  console.log("==================================================");

  const { data: campaignB, error: campErrB } = await clientB
    .from("campaigns")
    .insert({
      user_id: userBId,
      name: `User B Campaign ${Date.now()}`,
      icp_description: "FinTech Compliance Officers",
      offer_description: "Automated regulatory reporting",
      campaign_objective: "Book compliance demos",
      status: "active",
    })
    .select("id, user_id, name")
    .single();

  if (campErrB || !campaignB) {
    logFail(`User B failed to create campaign: ${campErrB?.message}`);
    return { executed: false, reason: campErrB?.message };
  }
  logPass(`User B created Campaign B (ID: ${campaignB.id})`);

  const { data: leadB, error: leadErrB } = await clientB
    .from("leads")
    .insert({
      user_id: userBId,
      campaign_id: campaignB.id,
      first_name: "Bob",
      last_name: "ProspectB",
      email: `lead.b.${Date.now()}@userb-corp.com`,
      job_title: "Chief Compliance Officer",
      email_status: "valid",
      outreach_status: "in_progress",
    })
    .select("id, user_id, email, campaign_id")
    .single();

  if (leadErrB || !leadB) {
    logFail(`User B failed to create lead: ${leadErrB?.message}`);
    return { executed: false, reason: leadErrB?.message };
  }
  logPass(`User B created Lead B (ID: ${leadB.id})`);

  console.log("\n==================================================");
  console.log("6. CROSS-TENANT READ ISOLATION: USER B -> USER A");
  console.log("==================================================");

  // B attempts to read Campaign A
  const { data: bReadCampA } = await clientB.from("campaigns").select("*").eq("id", campaignA.id);
  if (!bReadCampA || bReadCampA.length === 0) {
    logPass("User B cannot read Campaign A (0 rows returned via RLS)");
  } else {
    logFail("SECURITY VIOLATION: User B read Campaign A!");
  }

  // B attempts to read Lead A
  const { data: bReadLeadA } = await clientB.from("leads").select("*").eq("id", leadA.id);
  if (!bReadLeadA || bReadLeadA.length === 0) {
    logPass("User B cannot read Lead A (0 rows returned via RLS)");
  } else {
    logFail("SECURITY VIOLATION: User B read Lead A!");
  }

  // B attempts to read Sequence A
  const { data: bReadSeqA } = await clientB.from("sequences").select("*").eq("id", seqA.id);
  if (!bReadSeqA || bReadSeqA.length === 0) {
    logPass("User B cannot read Sequence A (0 rows returned via RLS)");
  } else {
    logFail("SECURITY VIOLATION: User B read Sequence A!");
  }

  // B attempts to read Research A
  const { data: bReadResA } = await clientB.from("research").select("*").eq("id", resA.id);
  if (!bReadResA || bReadResA.length === 0) {
    logPass("User B cannot read Research A (0 rows returned via RLS)");
  } else {
    logFail("SECURITY VIOLATION: User B read Research A!");
  }

  // B attempts to read Email A
  const { data: bReadEmailA } = await clientB.from("emails").select("*").eq("id", emailA.id);
  if (!bReadEmailA || bReadEmailA.length === 0) {
    logPass("User B cannot read Email A (0 rows returned via RLS)");
  } else {
    logFail("SECURITY VIOLATION: User B read Email A!");
  }

  // B attempts to read Activity A
  const { data: bReadActA } = await clientB.from("activities").select("*").eq("id", actA.id);
  if (!bReadActA || bReadActA.length === 0) {
    logPass("User B cannot read Activity A (0 rows returned via RLS)");
  } else {
    logFail("SECURITY VIOLATION: User B read Activity A!");
  }

  console.log("\n==================================================");
  console.log("7. CROSS-TENANT MUTATION GUARDS: USER B -> USER A");
  console.log("==================================================");

  // B attempts to UPDATE Campaign A
  const { data: bUpdateCampA } = await clientB
    .from("campaigns")
    .update({ name: "HACKED_BY_USER_B" })
    .eq("id", campaignA.id)
    .select();
  if (!bUpdateCampA || bUpdateCampA.length === 0) {
    logPass("User B update on Campaign A affected 0 rows (RLS blocked UPDATE)");
  } else {
    logFail("SECURITY VIOLATION: User B updated Campaign A!");
  }

  // B attempts to UPDATE Lead A
  const { data: bUpdateLeadA } = await clientB
    .from("leads")
    .update({ first_name: "HACKED_FIRST_NAME" })
    .eq("id", leadA.id)
    .select();
  if (!bUpdateLeadA || bUpdateLeadA.length === 0) {
    logPass("User B update on Lead A affected 0 rows (RLS blocked UPDATE)");
  } else {
    logFail("SECURITY VIOLATION: User B updated Lead A!");
  }

  // B attempts to UPDATE Email A (e.g. approve or change body)
  const { data: bUpdateEmailA } = await clientB
    .from("emails")
    .update({ approval_status: "approved", body_approved: "HACKED_BODY" })
    .eq("id", emailA.id)
    .select();
  if (!bUpdateEmailA || bUpdateEmailA.length === 0) {
    logPass("User B update on Email A affected 0 rows (RLS blocked UPDATE)");
  } else {
    logFail("SECURITY VIOLATION: User B modified Email A!");
  }

  // B attempts to INSERT Campaign with user_id = User A (Identity Spoofing)
  const { error: bSpoofCampErr } = await clientB.from("campaigns").insert({
    user_id: userAId,
    name: "Spoofed Campaign",
    icp_description: "Spoof ICP",
    offer_description: "Spoof Offer",
    campaign_objective: "Spoof Objective",
  });
  if (bSpoofCampErr) {
    logPass(`User B spoofed campaign insert rejected by RLS WITH CHECK: ${bSpoofCampErr.message}`);
  } else {
    logFail("SECURITY VIOLATION: User B inserted a campaign claiming User A ID!");
  }

  // B attempts to INSERT Lead with campaign_id = Campaign A (Relational Spoofing)
  const { error: bSpoofLeadErr } = await clientB.from("leads").insert({
    user_id: userBId,
    campaign_id: campaignA.id,
    first_name: "Spoofed",
    last_name: "Lead",
    email: `spoofed.${Date.now()}@userb-corp.com`,
  });
  if (bSpoofLeadErr) {
    logPass(`User B lead insert under Campaign A rejected by RLS WITH CHECK: ${bSpoofLeadErr.message}`);
  } else {
    logFail("SECURITY VIOLATION: User B inserted a lead linked to User A's Campaign!");
  }

  console.log("\n==================================================");
  console.log("8. REVERSE ISOLATION: USER A -> USER B");
  console.log("==================================================");

  // A attempts to read Campaign B
  const { data: aReadCampB } = await clientA.from("campaigns").select("*").eq("id", campaignB.id);
  if (!aReadCampB || aReadCampB.length === 0) {
    logPass("User A cannot read Campaign B (0 rows returned via RLS)");
  } else {
    logFail("SECURITY VIOLATION: User A read Campaign B!");
  }

  // A attempts to update Campaign B
  const { data: aUpdateCampB } = await clientA
    .from("campaigns")
    .update({ name: "HACKED_BY_USER_A" })
    .eq("id", campaignB.id)
    .select();
  if (!aUpdateCampB || aUpdateCampB.length === 0) {
    logPass("User A update on Campaign B affected 0 rows (RLS blocked UPDATE)");
  } else {
    logFail("SECURITY VIOLATION: User A updated Campaign B!");
  }

  console.log("\n==================================================");
  console.log("9. CLEANUP (EACH TENANT CLEANS OWN TEST DATA)");
  console.log("==================================================");

  // User A cleanup (Cascades to emails, sequences, research, activities, leads)
  const { error: delCampAErr } = await clientA.from("campaigns").delete().eq("id", campaignA.id);
  const { error: delAccAErr } = await clientA.from("accounts").delete().eq("id", accountA.id);
  if (!delCampAErr && !delAccAErr) {
    logPass("User A successfully cleaned up own test campaign, account, and cascaded child records");
  } else {
    console.warn(`User A cleanup warning: ${delCampAErr?.message || delAccAErr?.message}`);
  }

  // User B cleanup
  const { error: delCampBErr } = await clientB.from("campaigns").delete().eq("id", campaignB.id);
  if (!delCampBErr) {
    logPass("User B successfully cleaned up own test campaign and cascaded lead records");
  } else {
    console.warn(`User B cleanup warning: ${delCampBErr?.message}`);
  }

  console.log("\n==================================================");
  console.log("TWO-USER RUNTIME RLS ISOLATION VALIDATION COMPLETE");
  console.log("==================================================");

  return { executed: true, success: true };
}

runTwoUserValidation().catch((err) => {
  console.error("Test execution encountered an unhandled error:", err);
  process.exit(1);
});
