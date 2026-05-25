-- GCTU CampusLink Canonical Production Schema Migration
-- Date: 2026-05-17
-- Phase 4 Upgrade: Schema Parity, Redundancy Elimination, Auto-sync Trigger

-- ==========================================
-- 1. ADD MISSING COLUMNS FOR SCHEMAS
-- ==========================================

-- Hostels metadata enrichment
ALTER TABLE public.hostels 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS location_name TEXT,
ADD COLUMN IF NOT EXISTS distance_from_campus TEXT;

-- Rooms pricing & amenities enrichment
ALTER TABLE public.rooms
ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS ac_available BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS wifi_available BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS kitchen_available BOOLEAN DEFAULT FALSE;

-- User status enforcement for student blocking system
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'BLOCKED'));

-- ==========================================
-- 2. USER AUTO-SYNC TRIGGER (Supabase Auth -> Public Profiles)
-- ==========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, role, gender)
    VALUES (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'full_name', 'Student User'),
        coalesce(new.raw_user_meta_data->>'role', 'student'),
        CASE 
            WHEN upper(new.raw_user_meta_data->>'gender') IN ('MALE', 'FEMALE') THEN upper(new.raw_user_meta_data->>'gender')
            ELSE NULL
        END
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 3. DROP LEGACY TRIGGERS & RPC ENGINE FUNCTIONS
-- ==========================================

DROP TRIGGER IF EXISTS trg_update_occupancy ON public.room_allocation;
DROP TRIGGER IF EXISTS trg_update_occupancy ON public.allocations;
DROP FUNCTION IF EXISTS public.update_room_occupancy() CASCADE;
DROP FUNCTION IF EXISTS public.allocate_room_atomic(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.allocate_room_manual(UUID, UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.verify_payment(UUID, UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.revoke_allocation_atomic(UUID, UUID, UUID, UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.cancel_booking_atomic(UUID, UUID, TEXT) CASCADE;

-- ==========================================
-- 4. CLEAN & ROBUST ROOM OCCUPANCY TRIGGER
-- ==========================================

CREATE OR REPLACE FUNCTION public.update_room_occupancy()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT (New room allocation)
    IF (TG_OP = 'INSERT') THEN
        IF NEW.revoked_at IS NULL THEN
            UPDATE public.rooms 
            SET current_occupancy = current_occupancy + 1 
            WHERE id = NEW.room_id;
        END IF;
        
    -- Handle DELETE (Allocation removed completely)
    ELSIF (TG_OP = 'DELETE') THEN
        IF OLD.revoked_at IS NULL THEN
            UPDATE public.rooms 
            SET current_occupancy = current_occupancy - 1 
            WHERE id = OLD.room_id;
        END IF;
        
    -- Handle UPDATE (Allocation state changed)
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Case A: Room changed
        IF OLD.room_id IS DISTINCT FROM NEW.room_id THEN
            -- Decrement old room if it was active
            IF OLD.revoked_at IS NULL THEN
                UPDATE public.rooms SET current_occupancy = current_occupancy - 1 WHERE id = OLD.room_id;
            END IF;
            -- Increment new room if it is active
            IF NEW.revoked_at IS NULL THEN
                UPDATE public.rooms SET current_occupancy = current_occupancy + 1 WHERE id = NEW.room_id;
            END IF;
            
        -- Case B: Revocation state changed
        ELSIF OLD.revoked_at IS NULL AND NEW.revoked_at IS NOT NULL THEN
            -- Active allocation got revoked -> Decrement occupancy
            UPDATE public.rooms 
            SET current_occupancy = current_occupancy - 1 
            WHERE id = NEW.room_id;
            
        ELSIF OLD.revoked_at IS NOT NULL AND NEW.revoked_at IS NULL THEN
            -- Revocation cleared (re-allocated) -> Increment occupancy
            UPDATE public.rooms 
            SET current_occupancy = current_occupancy + 1 
            WHERE id = NEW.room_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_occupancy
AFTER INSERT OR UPDATE OR DELETE ON public.allocations
FOR EACH ROW EXECUTE FUNCTION public.update_room_occupancy();

-- ==========================================
-- 5. ATOMIC ENGINE FUNCTIONS (Occupancy delegated to Trigger)
-- ==========================================

-- A. ATOMIC BOOKING
CREATE OR REPLACE FUNCTION public.create_booking(p_user_id UUID, p_hostel_id UUID)
RETURNS UUID AS $$
DECLARE
    v_booking_id UUID;
    v_existing_booking_count INTEGER;
    v_hostel_status TEXT;
BEGIN
    -- Check for existing active booking (Status is not CANCELLED)
    SELECT COUNT(*) INTO v_existing_booking_count FROM public.bookings 
    WHERE user_id = p_user_id AND status != 'CANCELLED';
    
    IF v_existing_booking_count > 0 THEN
        RAISE EXCEPTION 'User already has an active booking.';
    END IF;

    -- Check hostel availability status
    SELECT status INTO v_hostel_status FROM public.hostels WHERE id = p_hostel_id;
    IF v_hostel_status != 'OPEN' THEN
        RAISE EXCEPTION 'Selected hostel is not open for booking.';
    END IF;

    -- Create booking
    INSERT INTO public.bookings (user_id, hostel_id, status, payment_status)
    VALUES (p_user_id, p_hostel_id, 'PENDING_PAYMENT', 'PENDING')
    RETURNING id INTO v_booking_id;

    RETURN v_booking_id;
END;
$$ LANGUAGE plpgsql;

-- B. ATOMIC AUTOMATIC ALLOCATION
CREATE OR REPLACE FUNCTION public.allocate_room_atomic(p_booking_id UUID)
RETURNS UUID AS $$
DECLARE
    v_hostel_id UUID;
    v_user_gender TEXT;
    v_room_id UUID;
    v_allocation_id UUID;
BEGIN
    -- Get user gender and lock booking
    SELECT b.hostel_id, u.gender INTO v_hostel_id, v_user_gender
    FROM public.bookings b
    JOIN public.users u ON b.user_id = u.id
    WHERE b.id = p_booking_id
    FOR UPDATE;

    -- Find first available locked room matching gender criteria and campus location
    SELECT r.id INTO v_room_id
    FROM public.rooms r
    JOIN public.buildings b ON r.building_id = b.id
    WHERE b.hostel_id = v_hostel_id
      AND (b.gender_rule = 'MIXED' OR b.gender_rule = v_user_gender || '_ONLY')
      AND (r.gender_rule = v_user_gender || '_ONLY')
      AND r.current_occupancy < r.capacity
    ORDER BY r.current_occupancy DESC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    IF v_room_id IS NULL THEN
        RAISE EXCEPTION 'CRITICAL: No available room found for gender % in hostel %', v_user_gender, v_hostel_id;
    END IF;

    -- Create allocation (the trigger will auto-increment current_occupancy)
    INSERT INTO public.allocations (booking_id, room_id)
    VALUES (p_booking_id, v_room_id)
    RETURNING id INTO v_allocation_id;

    RETURN v_allocation_id;
END;
$$ LANGUAGE plpgsql;

-- C. ATOMIC MANUAL ALLOCATION
CREATE OR REPLACE FUNCTION public.allocate_room_manual(p_booking_id UUID, p_room_id UUID, p_admin_id UUID)
RETURNS UUID AS $$
DECLARE
    v_user_gender TEXT;
    v_room_gender TEXT;
    v_room_capacity INTEGER;
    v_room_occupancy INTEGER;
    v_allocation_id UUID;
BEGIN
    -- Lock booking and fetch student gender
    SELECT u.gender INTO v_user_gender
    FROM public.bookings b
    JOIN public.users u ON b.user_id = u.id
    WHERE b.id = p_booking_id
    FOR UPDATE;

    -- Lock room and check capacity & gender matching
    SELECT gender_rule, capacity, current_occupancy 
    INTO v_room_gender, v_room_capacity, v_room_occupancy
    FROM public.rooms
    WHERE id = p_room_id
    FOR UPDATE;

    IF v_room_gender != v_user_gender || '_ONLY' THEN
        RAISE EXCEPTION 'Gender mismatch: Room is % but user is %', v_room_gender, v_user_gender;
    END IF;

    IF v_room_occupancy >= v_room_capacity THEN
        RAISE EXCEPTION 'Room is full';
    END IF;

    -- Create allocation (trigger updates occupancy)
    INSERT INTO public.allocations (booking_id, room_id)
    VALUES (p_booking_id, p_room_id)
    RETURNING id INTO v_allocation_id;

    RETURN v_allocation_id;
END;
$$ LANGUAGE plpgsql;

-- D. PAYMENT VERIFICATION RPC
CREATE OR REPLACE FUNCTION public.verify_payment(p_booking_id UUID, p_admin_id UUID, p_reason TEXT DEFAULT 'Payment verified manually')
RETURNS BOOLEAN AS $$
BEGIN
    -- Update payment and booking statuses
    UPDATE public.payments SET status = 'VERIFIED' WHERE booking_id = p_booking_id;
    UPDATE public.bookings SET payment_status = 'VERIFIED', status = 'CONFIRMED' WHERE id = p_booking_id;

    -- Trigger auto-allocation immediately upon payment verification
    PERFORM public.allocate_room_atomic(p_booking_id);

    -- Log to administrative audit
    INSERT INTO public.audit_logs (admin_id, action_type, target_id, reason)
    VALUES (p_admin_id, 'VERIFY_PAYMENT', p_booking_id, p_reason);

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- E. ATOMIC REVOCATION
CREATE OR REPLACE FUNCTION public.revoke_allocation_atomic(
    p_allocation_id UUID, 
    p_room_id UUID, 
    p_booking_id UUID, 
    p_admin_id UUID, 
    p_reason TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Revoke allocation (trigger updates occupancy automatically)
    UPDATE public.allocations 
    SET revoked_at = NOW() 
    WHERE id = p_allocation_id;

    -- Release booking room hold
    UPDATE public.bookings 
    SET status = 'ROOM_UNASSIGNED' 
    WHERE id = p_booking_id;

    -- Audit trail log
    INSERT INTO public.audit_logs (admin_id, action_type, target_id, reason)
    VALUES (p_admin_id, 'REVOKE_ALLOCATION', p_allocation_id, p_reason);

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- F. ATOMIC CANCELLATION
CREATE OR REPLACE FUNCTION public.cancel_booking_atomic(
    p_booking_id UUID, 
    p_admin_id UUID, 
    p_reason TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Remove active allocations (trigger decrements occupancy automatically)
    DELETE FROM public.allocations WHERE booking_id = p_booking_id;

    -- Mark booking state to terminal cancelled state
    UPDATE public.bookings SET status = 'CANCELLED' WHERE id = p_booking_id;

    -- Audit log
    INSERT INTO public.audit_logs (admin_id, action_type, target_id, reason)
    VALUES (p_admin_id, 'CANCEL_BOOKING', p_booking_id, p_reason);

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
