-- CampusLink Normalized Schema (Phase 3)

-- 1. AUTH & USERS
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT auth.uid(),
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    student_id TEXT UNIQUE,
    password_hash TEXT, -- For custom auth if needed, though Supabase Auth is preferred
    gender TEXT CHECK (gender IN ('MALE', 'FEMALE')),
    phone TEXT,
    role TEXT DEFAULT 'student' CHECK (role IN ('student', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ACADEMIC STRUCTURE
CREATE TABLE IF NOT EXISTS public.faculties (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS public.departments (
    id BIGSERIAL PRIMARY KEY,
    faculty_id BIGINT REFERENCES public.faculties(id) ON DELETE CASCADE,
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.programs (
    id BIGSERIAL PRIMARY KEY,
    department_id BIGINT REFERENCES public.departments(id) ON DELETE CASCADE,
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.student_academics (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    faculty_id BIGINT REFERENCES public.faculties(id),
    department_id BIGINT REFERENCES public.departments(id),
    program_id BIGINT REFERENCES public.programs(id),
    level INTEGER CHECK (level IN (100, 200, 300, 400, 500, 600))
);

-- 3. HOSTEL INFRASTRUCTURE
CREATE TABLE IF NOT EXISTS public.hostels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    campus TEXT CHECK (campus IN ('Tesano', 'Abeka')),
    gender_rule TEXT CHECK (gender_rule IN ('MALE_ONLY', 'FEMALE_ONLY', 'MIXED')),
    location_name TEXT,
    distance_from_campus TEXT,
    status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED', 'FULL')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.buildings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hostel_id UUID REFERENCES public.hostels(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    gender_rule TEXT CHECK (gender_rule IN ('MALE_ONLY', 'FEMALE_ONLY')),
    capacity INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID REFERENCES public.buildings(id) ON DELETE CASCADE,
    room_number TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    gender_rule TEXT CHECK (gender_rule IN ('MALE_ONLY', 'FEMALE_ONLY')),
    current_occupancy INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT room_occupancy_limit CHECK (current_occupancy <= capacity)
);

-- 4. BUSINESS LOGIC
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    hostel_id UUID REFERENCES public.hostels(id),
    status TEXT DEFAULT 'PENDING_PAYMENT' CHECK (status IN ('PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'ROOM_UNASSIGNED')),
    payment_status TEXT DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'VERIFIED', 'FAILED')),
    allocation_mode TEXT DEFAULT 'AUTO' CHECK (allocation_mode IN ('AUTO', 'MANUAL')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- One active booking per student constraint (only one non-cancelled/non-completed)
    CONSTRAINT unique_active_student_booking UNIQUE (user_id) -- Simplified for now, can be improved with partial index
);

CREATE TABLE IF NOT EXISTS public.room_allocation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
    room_id UUID REFERENCES public.rooms(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    revoked_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    method TEXT CHECK (method IN ('ONLINE', 'CASH', 'BANK')),
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'VERIFIED', 'FAILED')),
    reference_code TEXT UNIQUE,
    proof_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bank_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hostel_id UUID REFERENCES public.hostels(id) ON DELETE CASCADE, -- Nullable for global settings
    bank_name TEXT NOT NULL,
    account_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    instructions TEXT
);

-- 5. OPERATIONS & AUDIT
CREATE TABLE IF NOT EXISTS public.incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id),
    room_id UUID REFERENCES public.rooms(id),
    type TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'REPORTED' CHECK (status IN ('REPORTED', 'IN_PROGRESS', 'RESOLVED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.users(id),
    action_type TEXT NOT NULL,
    target_id UUID,
    reason TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Basic - to be expanded)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- Students can read their own profile
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
