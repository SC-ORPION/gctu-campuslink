-- Fix: "Database error saving new user" during registration
-- Date: 2026-05-29
-- Root Cause: RLS recursion + missing INSERT policy + potential constraint violations

-- =====================================================
-- 1. ENSURE ALL REQUIRED COLUMNS EXIST WITH SAFE DEFAULTS
-- =====================================================
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'BLOCKED'));
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS guardian_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS guardian_phone TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS guardian_relationship TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS digital_address TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS home_address TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS level INTEGER CHECK (level IN (100, 200, 300, 400, 500, 600));

-- =====================================================
-- 2. REPLACE handle_new_user() WITH ROBUST ERROR HANDLING
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_program_id BIGINT;
    v_department_id BIGINT;
    v_faculty_id BIGINT;
    v_level INTEGER;
BEGIN
    -- 1. Insert into public.users
    INSERT INTO public.users (
        id, email, full_name, role, status, gender, student_id, phone,
        avatar_url, guardian_name, guardian_phone, guardian_relationship,
        date_of_birth, digital_address, home_address, level
    )
    VALUES (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'full_name', 'Student User'),
        -- HARDCODE role: only the master admin email gets admin, everyone else is student
        CASE 
            WHEN lower(new.email) = 'abrahamfiamordzi1@gmail.com' THEN 'admin'
            ELSE 'student'
        END,
        'ACTIVE',
        CASE 
            WHEN upper(new.raw_user_meta_data->>'gender') IN ('MALE', 'FEMALE') THEN upper(new.raw_user_meta_data->>'gender')
            ELSE NULL
        END,
        new.raw_user_meta_data->>'student_id',
        new.raw_user_meta_data->>'phone_number',
        new.raw_user_meta_data->>'avatar_url',
        new.raw_user_meta_data->>'guardian_name',
        new.raw_user_meta_data->>'guardian_phone',
        new.raw_user_meta_data->>'guardian_relationship',
        CASE 
            WHEN new.raw_user_meta_data->>'date_of_birth' IS NOT NULL 
                 AND new.raw_user_meta_data->>'date_of_birth' != ''
            THEN (new.raw_user_meta_data->>'date_of_birth')::DATE
            ELSE NULL
        END,
        new.raw_user_meta_data->>'digital_address',
        new.raw_user_meta_data->>'home_address',
        CASE 
            WHEN new.raw_user_meta_data->>'level' IS NOT NULL 
                 AND new.raw_user_meta_data->>'level' ~ '^\d+$'
                 AND (new.raw_user_meta_data->>'level')::INTEGER IN (100, 200, 300, 400, 500, 600)
            THEN (new.raw_user_meta_data->>'level')::INTEGER
            ELSE NULL
        END
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        gender = COALESCE(public.users.gender, EXCLUDED.gender),
        student_id = COALESCE(public.users.student_id, EXCLUDED.student_id),
        phone = COALESCE(public.users.phone, EXCLUDED.phone),
        avatar_url = COALESCE(public.users.avatar_url, EXCLUDED.avatar_url),
        guardian_name = COALESCE(public.users.guardian_name, EXCLUDED.guardian_name),
        guardian_phone = COALESCE(public.users.guardian_phone, EXCLUDED.guardian_phone),
        guardian_relationship = COALESCE(public.users.guardian_relationship, EXCLUDED.guardian_relationship),
        date_of_birth = COALESCE(public.users.date_of_birth, EXCLUDED.date_of_birth),
        digital_address = COALESCE(public.users.digital_address, EXCLUDED.digital_address),
        home_address = COALESCE(public.users.home_address, EXCLUDED.home_address),
        level = COALESCE(public.users.level, EXCLUDED.level);

    -- 2. Sync to student_academics if program / department is set
    v_level := CASE 
        WHEN new.raw_user_meta_data->>'level' IS NOT NULL 
             AND new.raw_user_meta_data->>'level' ~ '^\d+$'
             AND (new.raw_user_meta_data->>'level')::INTEGER IN (100, 200, 300, 400, 500, 600)
        THEN (new.raw_user_meta_data->>'level')::INTEGER
        ELSE 100
    END;

    -- Lookup program
    SELECT p.id, p.department_id, d.faculty_id
    INTO v_program_id, v_department_id, v_faculty_id
    FROM public.programs p
    JOIN public.departments d ON p.department_id = d.id
    WHERE lower(p.name) = lower(new.raw_user_meta_data->>'program')
    LIMIT 1;

    -- If not found by program, try looking up by department name
    IF v_department_id IS NULL AND new.raw_user_meta_data->>'department' IS NOT NULL THEN
        SELECT d.id, d.faculty_id
        INTO v_department_id, v_faculty_id
        FROM public.departments d
        WHERE lower(d.name) = lower(new.raw_user_meta_data->>'department')
        LIMIT 1;
    END IF;

    -- Insert/update student_academics
    IF v_program_id IS NOT NULL OR v_department_id IS NOT NULL OR v_faculty_id IS NOT NULL THEN
        INSERT INTO public.student_academics (user_id, faculty_id, department_id, program_id, level)
        VALUES (new.id, v_faculty_id, v_department_id, v_program_id, v_level)
        ON CONFLICT (user_id) DO UPDATE SET
            faculty_id = EXCLUDED.faculty_id,
            department_id = EXCLUDED.department_id,
            program_id = EXCLUDED.program_id,
            level = EXCLUDED.level;
    END IF;

    RETURN new;
EXCEPTION WHEN OTHERS THEN
    -- Log the error and raise an exception to roll back transaction
    RAISE EXCEPTION 'Database profile sync failed: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 3. FIX RLS POLICIES: ELIMINATE ALL RECURSION
-- =====================================================

-- Drop ALL existing policies on public.users to start clean
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON public.users;
DROP POLICY IF EXISTS "Allow users to update own profile" ON public.users;
DROP POLICY IF EXISTS "Allow admins full access to all profiles" ON public.users;
DROP POLICY IF EXISTS "Allow trigger insert" ON public.users;
DROP POLICY IF EXISTS "Service role bypass" ON public.users;

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy 1: Any authenticated user can SELECT user profiles
CREATE POLICY "Allow authenticated users to read profiles"
ON public.users
FOR SELECT
USING (auth.role() = 'authenticated');

-- Policy 2: Users can UPDATE their own profile
CREATE POLICY "Allow users to update own profile"
ON public.users
FOR UPDATE
USING (auth.uid() = id);

-- Policy 3: Admin access via JWT (NO recursion — does NOT query public.users)
CREATE POLICY "Allow admins full access to all profiles"
ON public.users
FOR ALL
USING (
    (auth.jwt() ->> 'email') = 'abrahamfiamordzi1@gmail.com'
    OR ((auth.jwt() -> 'user_metadata') ->> 'role') = 'admin'
);

-- Policy 4: Allow INSERT for the auth trigger (service_role bypass)
-- The handle_new_user() runs as SECURITY DEFINER (postgres owner) which bypasses RLS,
-- but add an explicit INSERT policy as a safety net for any edge cases
CREATE POLICY "Allow trigger insert"
ON public.users
FOR INSERT
WITH CHECK (true);

-- =====================================================
-- 4. GRANT EXECUTE PERMISSIONS FOR TRIGGER
-- =====================================================
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, service_role;

-- =====================================================
-- 5. PROVISION ADMIN (ensure admin row exists)
-- =====================================================
INSERT INTO public.users (id, email, full_name, role, status)
SELECT id, email, 
    COALESCE(raw_user_meta_data->>'full_name', 'Abraham Fiamordzi'), 
    'admin', 'ACTIVE'
FROM auth.users
WHERE lower(email) = 'abrahamfiamordzi1@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin', status = 'ACTIVE';

-- =====================================================
-- 6. BACKFILL ALL EXISTING AUTH USERS TO PUBLIC USERS
-- =====================================================
DO $$
DECLARE
    r RECORD;
    v_program_id BIGINT;
    v_department_id BIGINT;
    v_faculty_id BIGINT;
    v_level INTEGER;
BEGIN
    FOR r IN SELECT * FROM auth.users LOOP
        BEGIN
            -- Insert/Update public.users
            INSERT INTO public.users (
                id, email, full_name, role, status, gender, student_id, phone,
                avatar_url, guardian_name, guardian_phone, guardian_relationship,
                date_of_birth, digital_address, home_address, level
            )
            VALUES (
                r.id,
                r.email,
                coalesce(r.raw_user_meta_data->>'full_name', 'Student User'),
                CASE 
                    WHEN lower(r.email) = 'abrahamfiamordzi1@gmail.com' THEN 'admin'
                    ELSE coalesce(r.raw_user_meta_data->>'role', 'student')
                END,
                'ACTIVE',
                CASE 
                    WHEN upper(r.raw_user_meta_data->>'gender') IN ('MALE', 'FEMALE') THEN upper(r.raw_user_meta_data->>'gender')
                    ELSE NULL
                END,
                r.raw_user_meta_data->>'student_id',
                r.raw_user_meta_data->>'phone_number',
                r.raw_user_meta_data->>'avatar_url',
                r.raw_user_meta_data->>'guardian_name',
                r.raw_user_meta_data->>'guardian_phone',
                r.raw_user_meta_data->>'guardian_relationship',
                CASE 
                    WHEN r.raw_user_meta_data->>'date_of_birth' IS NOT NULL 
                         AND r.raw_user_meta_data->>'date_of_birth' != ''
                    THEN (r.raw_user_meta_data->>'date_of_birth')::DATE
                    ELSE NULL
                END,
                r.raw_user_meta_data->>'digital_address',
                r.raw_user_meta_data->>'home_address',
                CASE 
                    WHEN r.raw_user_meta_data->>'level' IS NOT NULL 
                         AND r.raw_user_meta_data->>'level' ~ '^\d+$'
                         AND (r.raw_user_meta_data->>'level')::INTEGER IN (100, 200, 300, 400, 500, 600)
                    THEN (r.raw_user_meta_data->>'level')::INTEGER
                    ELSE NULL
                END
            )
            ON CONFLICT (id) DO UPDATE SET
                email = EXCLUDED.email,
                full_name = EXCLUDED.full_name,
                gender = COALESCE(public.users.gender, EXCLUDED.gender),
                student_id = COALESCE(public.users.student_id, EXCLUDED.student_id),
                phone = COALESCE(public.users.phone, EXCLUDED.phone),
                avatar_url = COALESCE(public.users.avatar_url, EXCLUDED.avatar_url),
                guardian_name = COALESCE(public.users.guardian_name, EXCLUDED.guardian_name),
                guardian_phone = COALESCE(public.users.guardian_phone, EXCLUDED.guardian_phone),
                guardian_relationship = COALESCE(public.users.guardian_relationship, EXCLUDED.guardian_relationship),
                date_of_birth = COALESCE(public.users.date_of_birth, EXCLUDED.date_of_birth),
                digital_address = COALESCE(public.users.digital_address, EXCLUDED.digital_address),
                home_address = COALESCE(public.users.home_address, EXCLUDED.home_address),
                level = COALESCE(public.users.level, EXCLUDED.level);

            -- Sync academics if role is student
            IF coalesce(r.raw_user_meta_data->>'role', 'student') = 'student' AND lower(r.email) != 'abrahamfiamordzi1@gmail.com' THEN
                v_level := CASE 
                    WHEN r.raw_user_meta_data->>'level' IS NOT NULL 
                         AND r.raw_user_meta_data->>'level' ~ '^\d+$'
                         AND (r.raw_user_meta_data->>'level')::INTEGER IN (100, 200, 300, 400, 500, 600)
                    THEN (r.raw_user_meta_data->>'level')::INTEGER
                    ELSE 100
                END;

                -- Lookup program
                SELECT p.id, p.department_id, d.faculty_id
                INTO v_program_id, v_department_id, v_faculty_id
                FROM public.programs p
                JOIN public.departments d ON p.department_id = d.id
                WHERE lower(p.name) = lower(r.raw_user_meta_data->>'program')
                LIMIT 1;

                -- If not found by program, try looking up by department name
                IF v_department_id IS NULL AND r.raw_user_meta_data->>'department' IS NOT NULL THEN
                    SELECT d.id, d.faculty_id
                    INTO v_department_id, v_faculty_id
                    FROM public.departments d
                    WHERE lower(d.name) = lower(r.raw_user_meta_data->>'department')
                    LIMIT 1;
                END IF;

                -- Insert/update student_academics
                IF v_program_id IS NOT NULL OR v_department_id IS NOT NULL OR v_faculty_id IS NOT NULL THEN
                    INSERT INTO public.student_academics (user_id, faculty_id, department_id, program_id, level)
                    VALUES (r.id, v_faculty_id, v_department_id, v_program_id, v_level)
                    ON CONFLICT (user_id) DO UPDATE SET
                        faculty_id = EXCLUDED.faculty_id,
                        department_id = EXCLUDED.department_id,
                        program_id = EXCLUDED.program_id,
                        level = EXCLUDED.level;
                END IF;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            -- Skip individual duplicate constraint failures and log warning
            RAISE WARNING 'Backfill failed for user %: % (SQLSTATE: %)', r.email, SQLERRM, SQLSTATE;
        END;
    END LOOP;
END;
$$;

-- Enable student booking insert and updates
DROP POLICY IF EXISTS student_insert_own_booking ON public.bookings;
CREATE POLICY student_insert_own_booking ON public.bookings
FOR INSERT
WITH CHECK (auth.uid() = user_id AND status = 'PENDING_PAYMENT');

DROP POLICY IF EXISTS student_update_own_booking ON public.bookings;
CREATE POLICY student_update_own_booking ON public.bookings
FOR UPDATE
USING (auth.uid() = user_id);

-- =====================================================
-- 7. DEFINE RLS POLICIES FOR HOSTELS, BUILDINGS, AND ROOMS
-- =====================================================

-- Hostels
DROP POLICY IF EXISTS "Allow authenticated read hostels" ON public.hostels;
CREATE POLICY "Allow authenticated read hostels" ON public.hostels
FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow admin write hostels" ON public.hostels;
CREATE POLICY "Allow admin write hostels" ON public.hostels
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Buildings
DROP POLICY IF EXISTS "Allow authenticated read buildings" ON public.buildings;
CREATE POLICY "Allow authenticated read buildings" ON public.buildings
FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow admin write buildings" ON public.buildings;
CREATE POLICY "Allow admin write buildings" ON public.buildings
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Rooms
DROP POLICY IF EXISTS "Allow authenticated read rooms" ON public.rooms;
CREATE POLICY "Allow authenticated read rooms" ON public.rooms
FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow admin write rooms" ON public.rooms;
CREATE POLICY "Allow admin write rooms" ON public.rooms
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- =====================================================
-- 8. DEFINE RLS POLICIES FOR MAINTENANCE INCIDENTS
-- =====================================================
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS student_insert_incident ON public.incidents;
CREATE POLICY student_insert_incident ON public.incidents
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS student_select_own_incidents ON public.incidents;
CREATE POLICY student_select_own_incidents ON public.incidents
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS admin_all_incidents ON public.incidents;
CREATE POLICY admin_all_incidents ON public.incidents
FOR ALL
USING (
    (auth.jwt() ->> 'email') = 'abrahamfiamordzi1@gmail.com'
    OR ((auth.jwt() -> 'user_metadata') ->> 'role') = 'admin'
    OR EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'admin'
    )
);

