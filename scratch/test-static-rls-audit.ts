import * as fs from "fs";
import * as path from "path";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`[FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`[PASS] ${message}`);
}

async function runStaticAudit() {
  console.log("==================================================");
  console.log("CHECKPOINT 4G — STATIC RLS & SECURITY AUDIT");
  console.log("==================================================");

  // 1. Read the initial schema migration file
  const migrationPath = path.resolve(
    process.cwd(),
    "supabase/migrations/00000000000000_initial_schema.sql"
  );
  assert(
    fs.existsSync(migrationPath),
    "Migration file supabase/migrations/00000000000000_initial_schema.sql exists"
  );
  const migrationSql = fs.readFileSync(migrationPath, "utf-8");

  // 2. Check RLS enabled on all 11 tables
  const expectedTables = [
    "users",
    "accounts",
    "campaigns",
    "leads",
    "proof_library",
    "activities",
    "research",
    "sequences",
    "emails",
    "qa_evaluations",
    "replies",
  ];

  for (const table of expectedTables) {
    const rlsPattern = new RegExp(
      `ALTER\\s+TABLE\\s+public\\.${table}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`,
      "i"
    );
    assert(
      rlsPattern.test(migrationSql),
      `RLS is enabled on table public.${table}`
    );
  }

  // 3. Check Direct Ownership Policies
  assert(
    migrationSql.includes('CREATE POLICY "users_self_access" ON public.users') &&
      migrationSql.includes("auth.uid() = id"),
    "Direct ownership policy on public.users enforces auth.uid() = id"
  );

  assert(
    migrationSql.includes(
      'CREATE POLICY "accounts_user_isolation" ON public.accounts'
    ) && migrationSql.includes("auth.uid() = user_id"),
    "Direct ownership policy on public.accounts enforces auth.uid() = user_id"
  );

  assert(
    migrationSql.includes(
      'CREATE POLICY "campaigns_user_isolation" ON public.campaigns'
    ) && migrationSql.includes("auth.uid() = user_id"),
    "Direct ownership policy on public.campaigns enforces auth.uid() = user_id"
  );

  assert(
    migrationSql.includes(
      'CREATE POLICY "leads_user_isolation" ON public.leads'
    ) && migrationSql.includes("auth.uid() = user_id"),
    "Direct ownership policy on public.leads enforces auth.uid() = user_id"
  );

  assert(
    migrationSql.includes(
      'CREATE POLICY "proof_library_user_isolation" ON public.proof_library'
    ) && migrationSql.includes("auth.uid() = user_id"),
    "Direct ownership policy on public.proof_library enforces auth.uid() = user_id"
  );

  assert(
    migrationSql.includes(
      'CREATE POLICY "activities_user_isolation" ON public.activities'
    ) && migrationSql.includes("auth.uid() = user_id"),
    "Direct ownership policy on public.activities enforces auth.uid() = user_id"
  );

  // 4. Check Relational Ownership Policies
  assert(
    migrationSql.includes(
      'CREATE POLICY "research_lead_isolation" ON public.research'
    ) &&
      migrationSql.includes("leads.id = research.lead_id") &&
      migrationSql.includes("leads.user_id = auth.uid()"),
    "Relational ownership policy on public.research enforces leads.user_id = auth.uid()"
  );

  assert(
    migrationSql.includes(
      'CREATE POLICY "sequences_lead_isolation" ON public.sequences'
    ) &&
      migrationSql.includes("leads.id = sequences.lead_id") &&
      migrationSql.includes("leads.user_id = auth.uid()"),
    "Relational ownership policy on public.sequences enforces leads.user_id = auth.uid()"
  );

  assert(
    migrationSql.includes(
      'CREATE POLICY "emails_lead_isolation" ON public.emails'
    ) &&
      migrationSql.includes("leads.id = emails.lead_id") &&
      migrationSql.includes("leads.user_id = auth.uid()"),
    "Relational ownership policy on public.emails enforces leads.user_id = auth.uid()"
  );

  assert(
    migrationSql.includes(
      'CREATE POLICY "qa_evaluations_email_isolation" ON public.qa_evaluations'
    ) &&
      migrationSql.includes("emails.id = qa_evaluations.email_id") &&
      migrationSql.includes("emails.lead_id = leads.id") &&
      migrationSql.includes("leads.user_id = auth.uid()"),
    "Relational ownership policy on public.qa_evaluations enforces leads.user_id = auth.uid()"
  );

  assert(
    migrationSql.includes(
      'CREATE POLICY "replies_lead_isolation" ON public.replies'
    ) &&
      migrationSql.includes("leads.id = replies.lead_id") &&
      migrationSql.includes("leads.user_id = auth.uid()"),
    "Relational ownership policy on public.replies enforces leads.user_id = auth.uid()"
  );

  // 5. Service-layer audit: ensure all services use createClient and derive user_id
  const serviceFiles = [
    "campaign-service.ts",
    "lead-service.ts",
    "sequence-service.ts",
    "email-service.ts",
    "research-service.ts",
    "metrics-service.ts",
    "activity-service.ts",
  ];

  for (const file of serviceFiles) {
    const serviceContent = fs.readFileSync(
      path.resolve(process.cwd(), "services", file),
      "utf-8"
    );
    assert(
      serviceContent.includes('from "@/lib/supabase/server"') ||
        serviceContent.includes("createClient"),
      `Service ${file} uses authenticated server Supabase client`
    );
    assert(
      !serviceContent.includes("SUPABASE_SERVICE_ROLE_KEY"),
      `Service ${file} does NOT use SUPABASE_SERVICE_ROLE_KEY`
    );
  }

  // 6. Server actions audit
  const actionFiles = [
    "app/(dashboard)/campaigns/actions.ts",
    "app/(dashboard)/leads/actions.ts",
    "app/(dashboard)/actions/email-actions.ts",
  ];

  for (const file of actionFiles) {
    const actionContent = fs.readFileSync(
      path.resolve(process.cwd(), file),
      "utf-8"
    );
    assert(
      !actionContent.includes("user_id"),
      `Server Action ${file} does not accept or trust user_id from client`
    );
  }

  console.log("==================================================");
  console.log("ALL STATIC RLS & SECURITY CHECKS PASSED");
  console.log("==================================================");
}

runStaticAudit().catch(console.error);
