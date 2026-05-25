-- GCTU CampusLink Security & Role-Based Auth Migration
-- Date: 2026-05-17
-- Upgrade: Secure Profile Creation & Strict Role Assignment (Client Override Prevention)

-- ==========================================
-- 1. RECURSION-SAFE ADMIN HELPER FUNCTION
-- ==========================================

CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = p_user_id AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 2. HARDENED PROFILE SYNC FUNCTION
-- ==========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, student_id, full_name, role, gender)
    VALUES (
        new.id,
        new.email,
        new.raw_user_meta_data->>'student_id',
        coalesce(new.raw_user_meta_data->>'full_name', 'Student User'),
        -- Hardcode role logic: ONLY abrahamfiamordzi1@gmail.com gets admin status, everyone else is forced to student
        CASE 
            WHEN lower(new.email) = 'abrahamfiamordzi1@gmail.com' THEN 'admin'
            ELSE 'student'
        END,
        CASE 
            WHEN upper(new.raw_user_meta_data->>'gender') IN ('MALE', 'FEMALE') THEN upper(new.raw_user_meta_data->>'gender')
            ELSE NULL
        END
    )
    ON CONFLICT (id) DO UPDATE 
    SET 
        email = EXCLUDED.email,
        student_id = EXCLUDED.student_id,
        full_name = EXCLUDED.full_name,
        role = CASE 
            WHEN lower(EXCLUDED.email) = 'abrahamfiamordzi1@gmail.com' THEN 'admin'
            ELSE public.users.role -- retain existing role unless they are the master email
        END;
        
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 3. POLICIES ON PUBLIC.USERS TABLE (RLS HARDFLOOR)
-- ==========================================

-- Enable Row Level Security (redundancy protection)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Clean existing policies on public.users
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON public.users;
DROP POLICY IF EXISTS "Allow users to update own profile" ON public.users;
DROP POLICY IF EXISTS "Allow admins full access to all profiles" ON public.users;

-- Define clean, recursive-safe RLS policies on public.users
-- Policy A: Roommates and hostel searchers can view active student listings
CREATE POLICY "Allow authenticated users to read profiles"
ON public.users
FOR SELECT
USING (auth.role() = 'authenticated');

-- Policy B: User owners can update their basic registration fields
CREATE POLICY "Allow users to update own profile"
ON public.users
FOR UPDATE
USING (auth.uid() = id);

-- Policy C: Verified admins can read, create, update, and manage all accounts
CREATE POLICY "Allow admins full access to all profiles"
ON public.users
FOR ALL
USING (public.is_admin(auth.uid()));

-- ==========================================
-- 4. MASTER ADMIN AUTO-PROVISIONING SEED RUN
-- ==========================================

UPDATE public.users 
SET role = 'admin' 
WHERE lower(email) = 'abrahamfiamordzi1@gmail.com';
