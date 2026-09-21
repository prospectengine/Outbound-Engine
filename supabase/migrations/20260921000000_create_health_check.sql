-- ============================================================================
-- Outbound Engine: Supabase Free-Tier Keepalive Health Check Migration
-- Purpose: Minimal public-read table to prevent Supabase Free-tier pausing
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.health_check (
  id INTEGER PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure table has exactly one row with id = 1
INSERT INTO public.health_check (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE public.health_check ENABLE ROW LEVEL SECURITY;

-- Minimum SELECT policy allowing public/anon and authenticated read access strictly to id = 1
DROP POLICY IF EXISTS "health_check_public_read" ON public.health_check;
CREATE POLICY "health_check_public_read" ON public.health_check
  FOR SELECT
  TO anon, authenticated
  USING (id = 1);
