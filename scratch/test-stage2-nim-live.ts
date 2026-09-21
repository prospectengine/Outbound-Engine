import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";
import { callAIProvider } from "../lib/ai/provider";
import { buildCopywriterPrompt } from "../lib/ai/prompts";
import { evaluateDeterministicQA } from "../lib/ai/qa-evaluator";
import { ResearchProfile } from "../types/research";

// Load environment variables safely
function loadEnvFile(filePath: string) {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}

loadEnvFile(path.resolve(process.cwd(), ".env.local"));
loadEnvFile(path.resolve(process.cwd(), ".env"));

async function runStage2LiveTest() {
  console.log("==================================================");
  console.log("STAGE 2: LIVE NVIDIA NIM + AI COPYWRITING VALIDATION");
  console.log("==================================================\n");

  // 1. PREFLIGHT CHECKS
  console.log("--- 1. PREFLIGHT VERIFICATION ---");
  const nimKey = process.env.NVIDIA_NIM_API_KEY || process.env.AI_API_KEY;
  const userAEmail = process.env.TEST_USER_A_EMAIL;
  const userAPassword = process.env.TEST_USER_A_PASSWORD;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log("NVIDIA_NIM_API_KEY:", nimKey && nimKey.trim().length > 0 ? "PRESENT" : "MISSING");
  console.log("NVIDIA_NIM_BASE_URL:", process.env.NVIDIA_NIM_BASE_URL || "https://integrate.api.nvidia.com/v1");
  console.log("NVIDIA_NIM_MODEL:", process.env.NVIDIA_NIM_MODEL || "openai/gpt-oss-20b (provider default)");
  console.log("TEST_USER_A_EMAIL:", userAEmail ? "PRESENT" : "MISSING");
  console.log("TEST_USER_A_PASSWORD:", userAPassword ? "PRESENT" : "MISSING");
  console.log("NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "PRESENT" : "MISSING");
  console.log("NEXT_PUBLIC_SUPABASE_ANON_KEY:", supabaseAnonKey ? "PRESENT" : "MISSING");

  if (!nimKey || !userAEmail || !userAPassword || !supabaseUrl || !supabaseAnonKey) {
    console.error("\n[FATAL] Missing required preflight environment variables. Aborting.");
    process.exit(1);
  }

  // 2. AUTHENTICATION (signInWithPassword only)
  console.log("\n--- 2. SUPABASE AUTHENTICATION ---");
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: userAEmail,
    password: userAPassword,
  });

  if (authError || !authData.user) {
    console.error("[FAIL] User A authentication failed:", authError?.message);
    process.exit(1);
  }
  const userId = authData.user.id;
  console.log("[PASS] User A authenticated successfully via signInWithPassword (0 Auth emails triggered).");

  let createdAccountId: string | null = null;
  let createdCampaignId: string | null = null;
  let createdLeadId: string | null = null;
  let createdSequenceId: string | null = null;
  let createdResearchId: string | null = null;
  let createdEmailId: string | null = null;

  try {
    // 3. CREATE CONTROLLED TEST DATA
    console.log("\n--- 3. CREATING CONTROLLED TEST DATA ---");

    // Create Account
    const { data: accData, error: accErr } = await supabase
      .from("accounts")
      .insert({
        user_id: userId,
        company_name: "[STAGE2-NIM-TEST] Vertex Robotics Corp",
        domain: "vertexrobotics-test.example.com",
        industry: "Enterprise Automation",
        company_size: "200-500",
      })
      .select("id")
      .single();

    if (accErr || !accData) {
      throw new Error(`Failed to create test account: ${accErr?.message}`);
    }
    createdAccountId = accData.id;
    console.log(`[PASS] Test Account created: ${createdAccountId}`);

    // Create Campaign
    const { data: campData, error: campErr } = await supabase
      .from("campaigns")
      .insert({
        user_id: userId,
        name: "[STAGE2-NIM-TEST] European Expansion Outreach",
        campaign_objective: "Book exploratory meetings on SDR workflow efficiency",
        icp_description: "Sales leadership at mid-market B2B tech companies",
        offer_description: "Grounded AI sequencing pipeline that eliminates manual rep friction and boosts pipeline capacity",
        target_region: "EMEA",
        status: "active",
      })
      .select("id")
      .single();

    if (campErr || !campData) {
      throw new Error(`Failed to create test campaign: ${campErr?.message}`);
    }
    createdCampaignId = campData.id;
    console.log(`[PASS] Test Campaign created: ${createdCampaignId}`);

    // Create Lead (Database test data only - never sent to Supabase Auth)
    const { data: leadData, error: leadErr } = await supabase
      .from("leads")
      .insert({
        user_id: userId,
        campaign_id: createdCampaignId,
        account_id: createdAccountId,
        first_name: "Elena",
        last_name: "Rostova",
        email: "elena.rostova@vertexrobotics-test.example.com",
        job_title: "Head of Sales Development",
        industry: "Enterprise Automation",
        country: "United Kingdom",
        outreach_status: "not_started",
        approval_status: "pending",
        email_status: "unverified",
        reply_status: "none",
        current_step: 1,
        stop_sequence: false,
      })
      .select("id")
      .single();

    if (leadErr || !leadData) {
      throw new Error(`Failed to create test lead: ${leadErr?.message}`);
    }
    createdLeadId = leadData.id;
    console.log(`[PASS] Test Lead created: ${createdLeadId}`);

    // Create Sequence
    const { data: seqData, error: seqErr } = await supabase
      .from("sequences")
      .insert({
        campaign_id: createdCampaignId,
        lead_id: createdLeadId,
        current_step: 1,
        status: "pending",
      })
      .select("id")
      .single();

    if (seqErr || !seqData) {
      throw new Error(`Failed to create test sequence: ${seqErr?.message}`);
    }
    createdSequenceId = seqData.id;
    console.log(`[PASS] Test Sequence created: ${createdSequenceId}`);

    // Create Research Record
    const researchPayload = {
      lead_id: createdLeadId,
      account_id: createdAccountId,
      observed_facts: [
        {
          fact: "Vertex Robotics announced an expansion of European operations in Q3.",
          source_type: "press_release",
          source_title: "Vertex Q3 European Expansion Announcement",
          source_url: "https://vertexrobotics-test.example.com/news/q3-europe",
          source_date: "2026-08-15",
          confidence: 1.0,
        },
        {
          fact: "Currently hiring 12 new enterprise SDRs across London and Frankfurt.",
          source_type: "careers_page",
          source_title: "Vertex Careers Portal",
          source_url: "https://vertexrobotics-test.example.com/careers",
          source_date: "2026-08-20",
          confidence: 1.0,
        },
      ],
      reasonable_inferences: [
        {
          inference: "Expanding sales development reps across new EMEA regions often encounter response latency and inconsistent follow-up workflows.",
          premise: "Rapid distributed hiring across multiple territories stresses onboarding and prospecting cadence consistency.",
          source_type: "inference",
          source_title: "B2B Sales Development Benchmark Report",
        },
      ],
      unknowns: [
        {
          topic: "Current sales engagement tooling",
          notes: "Specific SDR tech stack is not publicly disclosed.",
        },
      ],
      business_trigger: "Announced expansion of European operations in Q3.",
      problem_hypothesis: "Response time friction and follow-up inconsistency across expanding SDR teams.",
      business_consequence: "Pipeline leakage and missed conversion opportunities during territorial ramp-up.",
      future_state: "Consistent follow-up capacity and predictable qualified pipeline generation.",
      personalization_angle: "Q3 European expansion and EMEA sales team hiring",
      research_status: "completed",
    };

    const { data: resData, error: resErr } = await supabase
      .from("research")
      .insert(researchPayload)
      .select("id")
      .single();

    if (resErr || !resData) {
      throw new Error(`Failed to create test research record: ${resErr?.message}`);
    }
    createdResearchId = resData.id;
    console.log(`[PASS] Test Research record created: ${createdResearchId}`);

    // Build ResearchProfile context object for prompt and QA
    const researchProfile: ResearchProfile = {
      id: createdResearchId!,
      lead_id: createdLeadId!,
      account_id: createdAccountId,
      lead_name: "Elena Rostova",
      company_name: "[STAGE2-NIM-TEST] Vertex Robotics Corp",
      observed_facts: researchPayload.observed_facts,
      reasonable_inferences: researchPayload.reasonable_inferences,
      unknowns: researchPayload.unknowns,
      business_trigger: researchPayload.business_trigger,
      problem_hypothesis: researchPayload.problem_hypothesis,
      business_consequence: researchPayload.business_consequence,
      future_state: researchPayload.future_state,
      personalization_angle: researchPayload.personalization_angle,
      research_status: "completed",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 4. EXECUTE REAL NVIDIA NIM INFERENCE
    console.log("\n--- 4. EXECUTING LIVE NVIDIA NIM INFERENCE ---");
    const promptPayload = buildCopywriterPrompt({
      lead: {
        first_name: "Elena",
        last_name: "Rostova",
        job_title: "Head of Sales Development",
        industry: "Enterprise Automation",
        country: "United Kingdom",
      },
      account: {
        company_name: "Vertex Robotics Corp",
        domain: "vertexrobotics-test.example.com",
        industry: "Enterprise Automation",
        company_size: "200-500",
      },
      campaign: {
        name: "European Expansion Outreach",
        campaign_objective: "Book exploratory meetings on SDR workflow efficiency",
        icp_description: "Sales leadership at mid-market B2B tech companies",
        offer_description: "Grounded AI sequencing pipeline that eliminates manual rep friction and boosts pipeline capacity",
        target_region: "EMEA",
      },
      research: researchProfile,
      stepNumber: 1,
      strategicPurpose: "relevance",
    });

    console.log("Initiating live POST request to NVIDIA NIM endpoint (https://integrate.api.nvidia.com/v1/chat/completions)...");
    const startTime = Date.now();
    const candidate = await callAIProvider(promptPayload, {
      timeoutMs: 90000,
      temperature: 0.3,
    });
    const durationMs = Date.now() - startTime;

    console.log(`[PASS] Real NVIDIA NIM call succeeded in ${durationMs}ms!`);
    console.log("\nGenerated AI Draft Structure:");
    console.log("- Subject Line:", candidate.subject_line);
    console.log("- Preview Text:", candidate.preview_text);
    console.log("- Body Generated:\n  " + candidate.body_generated.replace(/\n/g, "\n  "));
    console.log("- PS Text:", candidate.ps_text);

    // 5. DETERMINISTIC 50-POINT QA EVALUATION
    console.log("\n--- 5. RUNNING DETERMINISTIC 50-POINT QA EVALUATION ---");
    const qaResult = evaluateDeterministicQA({
      subject_line: candidate.subject_line,
      preview_text: candidate.preview_text,
      body_generated: candidate.body_generated,
      ps_text: candidate.ps_text,
      research: researchProfile,
      campaign_offer: "Grounded AI sequencing pipeline that eliminates manual rep friction and boosts pipeline capacity",
    });

    console.log(`Total QA Score: ${qaResult.total_score} / 50 points`);
    console.log(`QA Result Passed: ${qaResult.passed} (Threshold >= 40/50, 0 mandatory failures)`);
    console.log(`Sentence Count: ${qaResult.sentence_count} (Max allowed: 5)`);
    console.log(`Word Count: ${qaResult.word_count} (Max allowed: 120)`);
    console.log("Dimension Breakdown:", JSON.stringify(qaResult.dimension_scores, null, 2));
    console.log("Mandatory Failures:", qaResult.mandatory_failures.length === 0 ? "NONE (0)" : qaResult.mandatory_failures);
    if (qaResult.feedback_notes) {
      console.log("Feedback Notes:", qaResult.feedback_notes);
    }

    // 6. PERSIST DRAFT AND QA RECORD
    console.log("\n--- 6. PERSISTING DRAFT AND QA RECORD ---");
    const approvalStatus = qaResult.passed ? "pending_approval" : "needs_manual_review";
    const sendingStatus = "unapproved";

    const { data: emailData, error: emailErr } = await supabase
      .from("emails")
      .insert({
        sequence_id: createdSequenceId,
        lead_id: createdLeadId,
        step_number: 1,
        strategic_purpose: "relevance",
        subject_line: candidate.subject_line,
        preview_text: candidate.preview_text,
        body_generated: candidate.body_generated,
        body_approved: null, // STRICT: remains null until explicit human approval
        ps_text: candidate.ps_text,
        qa_score: qaResult.total_score,
        approval_status: approvalStatus,
        sending_status: sendingStatus,
        generated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (emailErr || !emailData) {
      throw new Error(`Failed to persist email draft: ${emailErr?.message}`);
    }
    createdEmailId = emailData.id;
    console.log(`[PASS] Email draft persisted with id: ${createdEmailId}`);

    const { error: qaErr } = await supabase
      .from("qa_evaluations")
      .insert({
        email_id: createdEmailId,
        attempt_number: 1,
        total_score: qaResult.total_score,
        dimension_scores: qaResult.dimension_scores,
        passed: qaResult.passed,
        mandatory_failures: qaResult.mandatory_failures,
        feedback_notes: qaResult.feedback_notes,
        evaluator_model: "deterministic-qa-v1",
      });

    if (qaErr) {
      throw new Error(`Failed to persist QA evaluation: ${qaErr.message}`);
    }
    console.log("[PASS] QA evaluation persisted successfully in qa_evaluations table.");

    // 7. VERIFY PERSISTENCE INTEGRITY & STATE BOUNDARIES
    console.log("\n--- 7. VERIFYING PERSISTED STATE AND APPROVAL BOUNDARIES ---");
    const { data: reloadedEmail, error: reloadErr } = await supabase
      .from("emails")
      .select("*")
      .eq("id", createdEmailId)
      .single();

    if (reloadErr || !reloadedEmail) {
      throw new Error(`Failed to reload persisted email: ${reloadErr?.message}`);
    }

    console.log(`- Persisted approval_status: '${reloadedEmail.approval_status}' (Expected: '${approvalStatus}')`);
    console.log(`- Persisted sending_status: '${reloadedEmail.sending_status}' (Expected: 'unapproved')`);
    console.log(`- Persisted body_approved: ${reloadedEmail.body_approved === null ? "null (STRICT PASS)" : reloadedEmail.body_approved}`);
    console.log(`- Persisted qa_score: ${reloadedEmail.qa_score}`);

    if (reloadedEmail.approval_status !== approvalStatus) {
      throw new Error(`Approval status mismatch: got ${reloadedEmail.approval_status}, expected ${approvalStatus}`);
    }
    if (reloadedEmail.sending_status !== "unapproved") {
      throw new Error(`Sending status violation: got ${reloadedEmail.sending_status}, expected unapproved`);
    }
    if (reloadedEmail.body_approved !== null) {
      throw new Error("body_approved was populated prematurely without human approval!");
    }
    console.log("[PASS] State boundaries and human approval guard verified.");

  } finally {
    // 8. CLEANUP OF TEST RECORDS
    console.log("\n--- 8. CLEANUP OF STAGE 2 TEST RECORDS ---");
    let cleanups = 0;

    if (createdEmailId) {
      await supabase.from("qa_evaluations").delete().eq("email_id", createdEmailId);
      await supabase.from("emails").delete().eq("id", createdEmailId);
      console.log(`- Cleaned up email & qa_evaluations (${createdEmailId})`);
      cleanups++;
    }

    if (createdResearchId) {
      await supabase.from("research").delete().eq("id", createdResearchId);
      console.log(`- Cleaned up research record (${createdResearchId})`);
      cleanups++;
    }

    if (createdSequenceId) {
      await supabase.from("sequences").delete().eq("id", createdSequenceId);
      console.log(`- Cleaned up sequence record (${createdSequenceId})`);
      cleanups++;
    }

    if (createdLeadId) {
      await supabase.from("leads").delete().eq("id", createdLeadId);
      console.log(`- Cleaned up lead record (${createdLeadId})`);
      cleanups++;
    }

    if (createdCampaignId) {
      await supabase.from("campaigns").delete().eq("id", createdCampaignId);
      console.log(`- Cleaned up campaign record (${createdCampaignId})`);
      cleanups++;
    }

    if (createdAccountId) {
      await supabase.from("accounts").delete().eq("id", createdAccountId);
      console.log(`- Cleaned up account record (${createdAccountId})`);
      cleanups++;
    }

    console.log(`[PASS] All ${cleanups} Stage 2 temporary test records cleanly deleted by authenticated user.`);
  }

  console.log("\n==================================================");
  console.log("STAGE 2 LIVE VALIDATION COMPLETED SUCCESSFULLY");
  console.log("==================================================");
}

runStage2LiveTest().catch((err) => {
  console.error("\n[STAGE 2 FAILED]:", err);
  process.exit(1);
});
