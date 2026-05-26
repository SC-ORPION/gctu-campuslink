-- Supabase Database Security & Hardening Fixes
-- Date: 2026-05-26
-- Targets: Resolving all 9 Linter Security Warnings

-- ====================================================================
-- 1. FIX: FUNCTION MUTABLE SEARCH_PATH & SECURITY DEFINER EXECUTION
-- ====================================================================

-- A. Revoke broad execute privileges from public/anon/authenticated roles
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM public, anon, authenticated;

-- B. Explicitly grant execute privilege only to system service role & postgres
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO postgres, service_role;

-- C. Harden search_path on both security definer functions to prevent spoofing
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.rls_auto_enable() SET search_path = public;


-- ====================================================================
-- 2. FIX: OVERLY PERMISSIVE RLS POLICY (Public Write Reports)
-- ====================================================================

-- Ensure RLS is active on public.reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Drop the overly permissive insert policy
DROP POLICY IF EXISTS "Public Write Reports" ON public.reports;
DROP POLICY IF EXISTS "Authenticated users can submit reports" ON public.reports;

-- Re-create a hardened policy requiring an authenticated session to submit reports
CREATE POLICY "Authenticated users can submit reports"
ON public.reports
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');


-- ====================================================================
-- 3. FIX: PUBLIC STORAGE BUCKET BROAD LISTING EXPOSURE
-- ====================================================================

-- Drop the redundant SELECT policies on storage.objects.
-- Because the "documents" and "hostels" buckets are PUBLIC, objects can be 
-- accessed directly via public URLs without needing broad SELECT/list privileges 
-- that expose file indexes.
DROP POLICY IF EXISTS "Public Document Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

-- ====================================================================
-- 4. FIX: ENABLE ROW LEVEL SECURITY (RLS) ON PLANNED TABLES
-- ====================================================================

-- Ensure RLS is active on tables that have policies but RLS is disabled
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.past_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

