-- CampusLink Production Schema (Phase 3 Upgrade)

-- 1. USERS & AUTH
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT auth.uid(),
    email TEXT UNIQUE NOT NULL,
    student_id TEXT UNIQUE,
    password_hash TEXT,
    full_name TEXT NOT NULL,
    gender TEXT CHECK (gender IN ('MALE','FEMALE')),
    role TEXT DEFAULT 'student' CHECK (role IN ('student','admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. HOSTELS
CREATE TABLE IF NOT EXISTS public.hostels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    campus TEXT CHECK (campus IN ('TESANO','ABEKA')),
    gender_rule TEXT CHECK (gender_rule IN ('MALE_ONLY','FEMALE_ONLY','MIXED')),
    status TEXT DEFAULT 'OPEN',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. BUILDINGS
CREATE TABLE IF NOT EXISTS public.buildings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hostel_id UUID REFERENCES public.hostels(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    gender_rule TEXT CHECK (gender_rule IN ('MALE_ONLY','FEMALE_ONLY','MIXED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Strict gender rule consistency
    CONSTRAINT building_gender_rule_check CHECK (
        (gender_rule = 'MIXED') -- Logic for hostel rule match should be in trigger or function
        OR (gender_rule IN ('MALE_ONLY','FEMALE_ONLY'))
    )
);

-- 4. ROOMS
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID REFERENCES public.buildings(id) ON DELETE CASCADE,
    room_number TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    gender_rule TEXT CHECK (gender_rule IN ('MALE_ONLY','FEMALE_ONLY')),
    current_occupancy INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT occupancy_limit CHECK (current_occupancy <= capacity)
);

-- 5. BOOKINGS
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    hostel_id UUID REFERENCES public.hostels(id),
    status TEXT DEFAULT 'PENDING_PAYMENT' CHECK (status IN ('PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'ROOM_UNASSIGNED')),
    payment_status TEXT DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PENDING_VERIFICATION', 'VERIFIED', 'FAILED')),
    allocation_mode TEXT DEFAULT 'AUTO' CHECK (allocation_mode IN ('AUTO', 'MANUAL')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MANDATORY: SINGLE ACTIVE BOOKING CONSTRAINT
CREATE UNIQUE INDEX IF NOT EXISTS one_active_booking
ON public.bookings(user_id)
WHERE status NOT IN ('CANCELLED');

-- 6. ALLOCATIONS
CREATE TABLE IF NOT EXISTS public.allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
    room_id UUID REFERENCES public.rooms(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    revoked_at TIMESTAMP WITH TIME ZONE
);

-- 7. PAYMENTS
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    method TEXT CHECK (method IN ('ONLINE', 'CASH', 'BANK')),
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PENDING_VERIFICATION', 'VERIFIED', 'FAILED')),
    proof_url TEXT,
    reference_code TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.users(id),
    action_type TEXT NOT NULL,
    target_id UUID,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS POLICIES (ENFORCED)
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Student can see their own data
CREATE POLICY student_view_own_booking ON public.bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY student_view_own_allocation ON public.allocations FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = allocations.booking_id AND b.user_id = auth.uid())
);
CREATE POLICY student_view_own_payment ON public.payments FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = payments.booking_id AND b.user_id = auth.uid())
);

-- Admin can see everything
CREATE POLICY admin_full_access_bookings ON public.bookings FOR ALL USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);
CREATE POLICY admin_full_access_allocations ON public.allocations FOR ALL USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);
CREATE POLICY admin_full_access_payments ON public.payments FOR ALL USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);
