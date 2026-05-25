-- CampusLink Logic Engines (Phase 3)

-- 1. UTILITIES: Update Occupancy
CREATE OR REPLACE FUNCTION public.update_room_occupancy()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.rooms SET current_occupancy = current_occupancy + 1 WHERE id = NEW.room_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.rooms SET current_occupancy = current_occupancy - 1 WHERE id = OLD.room_id;
    ELSIF (TG_OP = 'UPDATE' AND OLD.room_id IS DISTINCT FROM NEW.room_id) THEN
        UPDATE public.rooms SET current_occupancy = current_occupancy - 1 WHERE id = OLD.room_id;
        UPDATE public.rooms SET current_occupancy = current_occupancy + 1 WHERE id = NEW.room_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_occupancy
AFTER INSERT OR UPDATE OR DELETE ON public.room_allocation
FOR EACH ROW EXECUTE FUNCTION public.update_room_occupancy();


-- 2. BOOKING ENGINE: Create Booking
CREATE OR REPLACE FUNCTION public.create_booking(p_user_id UUID, p_hostel_id UUID)
RETURNS UUID AS $$
DECLARE
    v_booking_id UUID;
    v_existing_booking_count INTEGER;
    v_hostel_status TEXT;
BEGIN
    -- 1. Check for active booking
    SELECT COUNT(*) INTO v_existing_booking_count FROM public.bookings 
    WHERE user_id = p_user_id AND status != 'CANCELLED';
    
    IF v_existing_booking_count > 0 THEN
        RAISE EXCEPTION 'User already has an active booking.';
    END IF;

    -- 2. Check hostel status
    SELECT status INTO v_hostel_status FROM public.hostels WHERE id = p_hostel_id;
    IF v_hostel_status != 'OPEN' THEN
        RAISE EXCEPTION 'Selected hostel is not open for booking.';
    END IF;

    -- 3. Create booking
    INSERT INTO public.bookings (user_id, hostel_id, status, payment_status)
    VALUES (p_user_id, p_hostel_id, 'PENDING_PAYMENT', 'PENDING')
    RETURNING id INTO v_booking_id;

    RETURN v_booking_id;
END;
$$ LANGUAGE plpgsql;


-- 3. ALLOCATION ENGINE: Atomic Allocation
CREATE OR REPLACE FUNCTION public.allocate_room_atomic(p_booking_id UUID)
RETURNS UUID AS $$
DECLARE
    v_hostel_id UUID;
    v_user_gender TEXT;
    v_room_id UUID;
    v_allocation_id UUID;
BEGIN
    -- 1. Get user details and lock booking row
    SELECT b.hostel_id, u.gender INTO v_hostel_id, v_user_gender
    FROM public.bookings b
    JOIN public.users u ON b.user_id = u.id
    WHERE b.id = p_booking_id
    FOR UPDATE;

    -- 2. Find and LOCK the first available room matching criteria
    -- We join with buildings to ensure building-level gender rules too
    SELECT r.id INTO v_room_id
    FROM public.rooms r
    JOIN public.buildings b ON r.building_id = b.id
    WHERE b.hostel_id = v_hostel_id
      AND (b.gender_rule = 'MIXED' OR b.gender_rule = v_user_gender || '_ONLY')
      AND (r.gender_rule = v_user_gender || '_ONLY')
      AND r.current_occupancy < r.capacity
    ORDER BY r.current_occupancy DESC -- Try to fill rooms sequentially or spread out? 
    LIMIT 1
    FOR UPDATE SKIP LOCKED; -- SKIP LOCKED prevents blocking other concurrent allocations

    IF v_room_id IS NULL THEN
        RAISE EXCEPTION 'CRITICAL: No available room found for gender % in hostel %', v_user_gender, v_hostel_id;
    END IF;

    -- 3. Create allocation
    INSERT INTO public.allocations (booking_id, room_id)
    VALUES (p_booking_id, v_room_id)
    RETURNING id INTO v_allocation_id;

    -- 4. Update room occupancy
    UPDATE public.rooms 
    SET current_occupancy = current_occupancy + 1 
    WHERE id = v_room_id;

    RETURN v_allocation_id;
END;
$$ LANGUAGE plpgsql;


-- 4. ALLOCATION ENGINE: Manual Allocation
CREATE OR REPLACE FUNCTION public.allocate_room_manual(p_booking_id UUID, p_room_id UUID, p_admin_id UUID)
RETURNS UUID AS $$
DECLARE
    v_user_gender TEXT;
    v_room_gender TEXT;
    v_room_capacity INTEGER;
    v_room_occupancy INTEGER;
    v_allocation_id UUID;
BEGIN
    -- 1. Get user details and lock booking row
    SELECT u.gender INTO v_user_gender
    FROM public.bookings b
    JOIN public.users u ON b.user_id = u.id
    WHERE b.id = p_booking_id
    FOR UPDATE;

    -- 2. Lock and check the target room
    SELECT gender_rule, capacity, current_occupancy 
    INTO v_room_gender, v_room_capacity, v_room_occupancy
    FROM public.rooms
    WHERE id = p_room_id
    FOR UPDATE;

    -- 3. Strict Verification
    IF v_room_gender != v_user_gender || '_ONLY' THEN
        RAISE EXCEPTION 'Gender mismatch: Room is % but user is %', v_room_gender, v_user_gender;
    END IF;

    IF v_room_occupancy >= v_room_capacity THEN
        RAISE EXCEPTION 'Room is full';
    END IF;

    -- 4. Create allocation
    INSERT INTO public.allocations (booking_id, room_id)
    VALUES (p_booking_id, p_room_id)
    RETURNING id INTO v_allocation_id;

    -- 5. Update room occupancy
    UPDATE public.rooms 
    SET current_occupancy = current_occupancy + 1 
    WHERE id = p_room_id;

    RETURN v_allocation_id;
END;
$$ LANGUAGE plpgsql;

-- 5. PAYMENT ENGINE: Verify Payment
CREATE OR REPLACE FUNCTION public.verify_payment(p_booking_id UUID, p_admin_id UUID, p_reason TEXT DEFAULT 'Payment verified manually')
RETURNS BOOLEAN AS $$
BEGIN
    -- 1. Update Payment Status
    UPDATE public.payments SET status = 'VERIFIED' WHERE booking_id = p_booking_id;
    
    -- 2. Update Booking Status
    UPDATE public.bookings SET payment_status = 'VERIFIED', status = 'CONFIRMED' WHERE id = p_booking_id;

    -- 3. Trigger Allocation (AUTO)
    PERFORM public.allocate_room_atomic(p_booking_id);

    -- 4. Audit Log
    INSERT INTO public.audit_logs (admin_id, action_type, target_id, reason)
    VALUES (p_admin_id, 'VERIFY_PAYMENT', p_booking_id, p_reason);

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;



-- 6. REVOCATION ENGINE: Atomic Revocation
CREATE OR REPLACE FUNCTION public.revoke_allocation_atomic(
    p_allocation_id UUID, 
    p_room_id UUID, 
    p_booking_id UUID, 
    p_admin_id UUID, 
    p_reason TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    -- 1. Update allocation record
    UPDATE public.allocations 
    SET revoked_at = NOW() 
    WHERE id = p_allocation_id;

    -- 2. Decrement room occupancy
    UPDATE public.rooms 
    SET current_occupancy = current_occupancy - 1 
    WHERE id = p_room_id;

    -- 3. Update booking status
    UPDATE public.bookings 
    SET status = 'ROOM_UNASSIGNED' 
    WHERE id = p_booking_id;

    -- 4. Audit Log
    INSERT INTO public.audit_logs (admin_id, action_type, target_id, reason)
    VALUES (p_admin_id, 'REVOKE_ALLOCATION', p_allocation_id, p_reason);

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 7. CANCELLATION ENGINE: Cancel Booking
CREATE OR REPLACE FUNCTION public.cancel_booking_atomic(
    p_booking_id UUID, 
    p_admin_id UUID, 
    p_reason TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_room_id UUID;
BEGIN
    -- 1. Get room_id if allocated
    SELECT room_id INTO v_room_id FROM public.allocations WHERE booking_id = p_booking_id AND revoked_at IS NULL;

    -- 2. Remove allocation and update occupancy if exists
    IF v_room_id IS NOT NULL THEN
        UPDATE public.rooms SET current_occupancy = current_occupancy - 1 WHERE id = v_room_id;
        DELETE FROM public.allocations WHERE booking_id = p_booking_id;
    END IF;

    -- 3. Set booking to CANCELLED
    UPDATE public.bookings SET status = 'CANCELLED' WHERE id = p_booking_id;

    -- 4. Audit Log
    INSERT INTO public.audit_logs (admin_id, action_type, target_id, reason)
    VALUES (p_admin_id, 'CANCEL_BOOKING', p_booking_id, p_reason);

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

