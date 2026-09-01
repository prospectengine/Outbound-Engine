-- Outbound Engine V1: Initial Database Schema Migration
-- Authoritative Specification: docs/database-schema.md
-- Target Database: Supabase PostgreSQL (with Row Level Security)

-- ============================================================================
-- 0. UTILITY EXTENSIONS & FUNCTIONS
-- ============================================================================

-- Ensure pgcrypto extension is available for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Reusable trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 1. TABLE: users
-- Mirrors authenticated Supabase identity records (auth.users)
-- ============================================================================

-- NOTE: Cascading deletions (ON DELETE CASCADE) throughout this schema 
-- (e.g., from auth.users to public.users, from leads to sequences/emails) 
-- are intentional in the V1 model. Future soft-delete/audit-retention 
-- requirements may require a later architectural change.

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Automatically sync new user registrations from auth.users to public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
      updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

-- NOTE: Future SECURITY DEFINER functions must explicitly use a safe search_path 
-- (e.g., SET search_path = public, pg_catalog;) to prevent privilege escalation.

-- Drop trigger if already exists before recreating
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 2. TABLE: accounts
-- Stores target company/organization level data and research context
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  domain VARCHAR(255),
  website TEXT,
  industry VARCHAR(150),
  company_size VARCHAR(50),
  country VARCHAR(100),
  region VARCHAR(100),
  linkedin_url TEXT,
  company_context JSONB DEFAULT '{}'::jsonb,
  account_status VARCHAR(50) NOT NULL DEFAULT 'target'
    CHECK (account_status IN ('target', 'active', 'customer', 'disqualified')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_accounts_user_domain ON public.accounts(user_id, domain) WHERE domain IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_domain ON public.accounts(domain);
CREATE INDEX IF NOT EXISTS idx_accounts_status ON public.accounts(account_status);

CREATE TRIGGER trg_accounts_updated_at
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 3. TABLE: campaigns
-- Outbound campaign definitions, ICP specifications, and broad objectives
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icp_description TEXT NOT NULL,
  offer_description TEXT NOT NULL,
  target_region VARCHAR(100),
  campaign_objective TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON public.campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);

CREATE TRIGGER trg_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 4. TABLE: leads
-- Individual prospect records, lead-specific objectives, and progression state
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  job_title VARCHAR(200),
  linkedin_url TEXT,
  country VARCHAR(100),
  industry VARCHAR(150),
  lead_objective TEXT,
  email_status VARCHAR(50) NOT NULL DEFAULT 'unverified'
    CHECK (email_status IN ('unverified', 'valid', 'catch_all', 'invalid')),
  outreach_status VARCHAR(50) NOT NULL DEFAULT 'not_started'
    CHECK (outreach_status IN ('not_started', 'in_progress', 'paused', 'completed', 'stopped')),
  approval_status VARCHAR(50) NOT NULL DEFAULT 'pending'
    CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  reply_status VARCHAR(50) NOT NULL DEFAULT 'none'
    CHECK (reply_status IN ('none', 'replied_interested', 'replied_not_interested', 'replied_wrong_person', 'replied_ooo')),
  stop_sequence BOOLEAN NOT NULL DEFAULT false,
  current_step INTEGER NOT NULL DEFAULT 0
    CHECK (current_step BETWEEN 0 AND 6),
  next_action VARCHAR(100),
  next_action_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_leads_campaign_email UNIQUE (campaign_id, email)
);

CREATE INDEX IF NOT EXISTS idx_leads_user_id ON public.leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_campaign_id ON public.leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_leads_account_id ON public.leads(account_id);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_outreach_status ON public.leads(outreach_status);
CREATE INDEX IF NOT EXISTS idx_leads_next_action_date ON public.leads(next_action_date)
  WHERE outreach_status = 'in_progress';

CREATE TRIGGER trg_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 5. TABLE: research
-- Verified evidence, classified inferences, and synthesized business hypotheses
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  observed_facts JSONB NOT NULL DEFAULT '[]'::jsonb,
  reasonable_inferences JSONB NOT NULL DEFAULT '[]'::jsonb,
  unknowns JSONB NOT NULL DEFAULT '[]'::jsonb,
  business_trigger TEXT,
  trigger_source_type VARCHAR(100),
  trigger_source_title TEXT,
  trigger_source_url TEXT,
  trigger_source_date DATE,
  trigger_notes TEXT,
  problem_hypothesis TEXT,
  business_consequence TEXT,
  future_state TEXT,
  personalization_angle TEXT,
  research_status VARCHAR(50) NOT NULL DEFAULT 'pending'
    CHECK (research_status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_research_lead_id UNIQUE (lead_id)
);

CREATE INDEX IF NOT EXISTS idx_research_lead_id ON public.research(lead_id);
CREATE INDEX IF NOT EXISTS idx_research_account_id ON public.research(account_id);
CREATE INDEX IF NOT EXISTS idx_research_status ON public.research(research_status);

CREATE TRIGGER trg_research_updated_at
  BEFORE UPDATE ON public.research
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 6. TABLE: sequences
-- Execution state and progression tracking across the 6-touch framework
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  current_step INTEGER NOT NULL DEFAULT 1
    CHECK (current_step BETWEEN 1 AND 6),
  status VARCHAR(50) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'paused', 'completed', 'stopped_replied', 'stopped_manual')),
  next_action VARCHAR(100),
  next_action_date TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  stopped_at TIMESTAMPTZ,
  stop_reason VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_sequences_campaign_lead UNIQUE (campaign_id, lead_id)
);

CREATE INDEX IF NOT EXISTS idx_sequences_lead_id ON public.sequences(lead_id);
CREATE INDEX IF NOT EXISTS idx_sequences_campaign_id ON public.sequences(campaign_id);
CREATE INDEX IF NOT EXISTS idx_sequences_status ON public.sequences(status);
CREATE INDEX IF NOT EXISTS idx_sequences_next_action ON public.sequences(next_action_date)
  WHERE status = 'active';

CREATE TRIGGER trg_sequences_updated_at
  BEFORE UPDATE ON public.sequences
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 7. TABLE: emails
-- Generated vs. approved copy, 50-point QA scores, and delivery state
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES public.sequences(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL
    CHECK (step_number BETWEEN 1 AND 6),
  strategic_purpose VARCHAR(50) NOT NULL
    CHECK (strategic_purpose IN ('relevance', 'reframe', 'proof', 'insight', 'objection_removal', 'decision')),
  subject_line VARCHAR(255) NOT NULL,
  preview_text VARCHAR(255),
  body_generated TEXT NOT NULL,
  body_approved TEXT,
  ps_text TEXT,
  qa_score INTEGER
    CHECK (qa_score IS NULL OR (qa_score BETWEEN 0 AND 50)),
  approval_status VARCHAR(50) NOT NULL DEFAULT 'draft'
    CHECK (approval_status IN ('draft', 'qa_passed', 'qa_failed', 'pending_approval', 'approved', 'rejected', 'edited', 'needs_manual_review')),
  sending_status VARCHAR(50) NOT NULL DEFAULT 'unapproved'
    CHECK (sending_status IN ('unapproved', 'queued', 'sending', 'sent', 'failed', 'cancelled')),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  message_id VARCHAR(255),
  thread_id VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_emails_sequence_step UNIQUE (sequence_id, step_number),
  -- Database-level safety enforcement: An email CANNOT be queued, sending, or sent without human approval & approved body
  CONSTRAINT chk_email_approval_before_send CHECK (
    sending_status NOT IN ('queued', 'sending', 'sent')
    OR (approval_status IN ('approved', 'edited') AND body_approved IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_emails_sequence_id ON public.emails(sequence_id);
CREATE INDEX IF NOT EXISTS idx_emails_lead_id ON public.emails(lead_id);
CREATE INDEX IF NOT EXISTS idx_emails_approval_status ON public.emails(approval_status);
CREATE INDEX IF NOT EXISTS idx_emails_sending_status ON public.emails(sending_status);
CREATE INDEX IF NOT EXISTS idx_emails_scheduled_at ON public.emails(scheduled_at)
  WHERE sending_status = 'queued';
CREATE INDEX IF NOT EXISTS idx_emails_thread_id ON public.emails(thread_id)
  WHERE thread_id IS NOT NULL;

CREATE TRIGGER trg_emails_updated_at
  BEFORE UPDATE ON public.emails
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 8. TABLE: qa_evaluations
-- Itemized 50-point rubric score evaluations and mandatory failure diagnostics
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.qa_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID NOT NULL REFERENCES public.emails(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL DEFAULT 1
    CHECK (attempt_number BETWEEN 1 AND 5),
  total_score INTEGER NOT NULL
    CHECK (total_score BETWEEN 0 AND 50),
  dimension_scores JSONB NOT NULL,
  passed BOOLEAN NOT NULL,
  mandatory_failures JSONB NOT NULL DEFAULT '[]'::jsonb,
  feedback_notes TEXT,
  evaluator_model VARCHAR(100) NOT NULL DEFAULT 'nemotron-3.5-lightning',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_qa_evaluations_email_id ON public.qa_evaluations(email_id);
CREATE INDEX IF NOT EXISTS idx_qa_evaluations_passed ON public.qa_evaluations(passed);

-- ============================================================================
-- 9. TABLE: activities
-- Append-only audit log tracking user actions, edits, and delivery events
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  email_id UUID REFERENCES public.emails(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  activity_type VARCHAR(100) NOT NULL
    CHECK (activity_type IN (
      'lead_created', 'lead_imported', 'research_started', 'research_completed', 'research_failed',
      'email_generated', 'qa_completed', 'qa_regenerated', 'human_edited', 'email_approved', 'email_rejected',
      'email_queued', 'email_sent', 'email_send_failed', 'reply_detected', 'sequence_stopped', 'sequence_resumed', 'sequence_completed'
    )),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_lead_id ON public.activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_activities_email_id ON public.activities(email_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON public.activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON public.activities(created_at DESC);

-- ============================================================================
-- 10. TABLE: replies
-- Inbound reply tracking, intent classification, and sequence halting
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  email_id UUID REFERENCES public.emails(id) ON DELETE SET NULL,
  thread_id VARCHAR(255) NOT NULL,
  provider_message_id VARCHAR(255) NOT NULL,
  reply_snippet TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  classification VARCHAR(50) NOT NULL DEFAULT 'unclassified'
    CHECK (classification IN ('interested', 'not_interested', 'wrong_person', 'ooo', 'unclassified')),
  sequence_impact VARCHAR(50) NOT NULL DEFAULT 'sequence_halted'
    CHECK (sequence_impact IN ('sequence_halted', 'no_action')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_replies_provider_message_id UNIQUE (provider_message_id)
);

CREATE INDEX IF NOT EXISTS idx_replies_lead_id ON public.replies(lead_id);
CREATE INDEX IF NOT EXISTS idx_replies_thread_id ON public.replies(thread_id);
CREATE INDEX IF NOT EXISTS idx_replies_classification ON public.replies(classification);

-- ============================================================================
-- 11. TABLE: proof_library
-- Verified customer case studies, quantifiable results, and mechanisms
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.proof_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  customer_name VARCHAR(255) NOT NULL,
  industry VARCHAR(150) NOT NULL,
  company_size_context VARCHAR(100),
  problem_addressed TEXT NOT NULL,
  mechanism_solution TEXT NOT NULL,
  quantifiable_result TEXT NOT NULL,
  source_reference TEXT,
  verification_status VARCHAR(50) NOT NULL DEFAULT 'verified'
    CHECK (verification_status IN ('verified', 'provisional', 'deprecated')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proof_library_user_id ON public.proof_library(user_id);
CREATE INDEX IF NOT EXISTS idx_proof_library_industry ON public.proof_library(industry);
CREATE INDEX IF NOT EXISTS idx_proof_library_status ON public.proof_library(verification_status);

CREATE TRIGGER trg_proof_library_updated_at
  BEFORE UPDATE ON public.proof_library
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- Strict user isolation enforcing ownership boundaries
-- ============================================================================

-- Enable RLS across all application tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proof_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qa_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replies ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 12.1 Direct Ownership Policies (Root Entities)
-- ----------------------------------------------------------------------------

-- public.users
CREATE POLICY "users_self_access" ON public.users
  FOR ALL TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- public.accounts
CREATE POLICY "accounts_user_isolation" ON public.accounts
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- public.campaigns
CREATE POLICY "campaigns_user_isolation" ON public.campaigns
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- public.leads
CREATE POLICY "leads_user_isolation" ON public.leads
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- public.proof_library
CREATE POLICY "proof_library_user_isolation" ON public.proof_library
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- public.activities
CREATE POLICY "activities_user_isolation" ON public.activities
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 12.2 Inherited Ownership Policies (Child Entities via Parent Foreign Keys)
-- ----------------------------------------------------------------------------

-- public.research (Inherited via lead_id -> leads.user_id)
CREATE POLICY "research_lead_isolation" ON public.research
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.leads
      WHERE leads.id = research.lead_id
        AND leads.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.leads
      WHERE leads.id = research.lead_id
        AND leads.user_id = auth.uid()
    )
  );

-- public.sequences (Inherited via lead_id -> leads.user_id)
CREATE POLICY "sequences_lead_isolation" ON public.sequences
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.leads
      WHERE leads.id = sequences.lead_id
        AND leads.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.leads
      WHERE leads.id = sequences.lead_id
        AND leads.user_id = auth.uid()
    )
  );

-- public.emails (Inherited via lead_id -> leads.user_id)
CREATE POLICY "emails_lead_isolation" ON public.emails
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.leads
      WHERE leads.id = emails.lead_id
        AND leads.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.leads
      WHERE leads.id = emails.lead_id
        AND leads.user_id = auth.uid()
    )
  );

-- public.qa_evaluations (Inherited via email_id -> emails.lead_id -> leads.user_id)
CREATE POLICY "qa_evaluations_email_isolation" ON public.qa_evaluations
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.emails
      JOIN public.leads ON emails.lead_id = leads.id
      WHERE emails.id = qa_evaluations.email_id
        AND leads.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.emails
      JOIN public.leads ON emails.lead_id = leads.id
      WHERE emails.id = qa_evaluations.email_id
        AND leads.user_id = auth.uid()
    )
  );

-- public.replies (Inherited via lead_id -> leads.user_id)
CREATE POLICY "replies_lead_isolation" ON public.replies
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.leads
      WHERE leads.id = replies.lead_id
        AND leads.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.leads
      WHERE leads.id = replies.lead_id
        AND leads.user_id = auth.uid()
    )
  );
