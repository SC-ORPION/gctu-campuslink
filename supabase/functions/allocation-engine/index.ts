import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from "https://deno.land/x/zod@v3.21.4/mod.ts"

const AllocationSchema = z.object({
  booking_id: z.string().uuid(),
  admin_id: z.string().uuid().optional(),
  mode: z.enum(['AUTO', 'MANUAL']).default('AUTO'),
  room_id: z.string().uuid().optional(), // Required if mode is MANUAL
})

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    const body = await req.json()
    const { booking_id, admin_id, mode, room_id } = AllocationSchema.parse(body)

    // 1. Check if payment is verified
    const { data: booking, error: bError } = await supabase
      .from('bookings')
      .select('payment_status, status')
      .eq('id', booking_id)
      .single()

    if (bError || !booking) throw new Error("Booking not found")
    if (booking.payment_status !== 'VERIFIED') {
      return new Response(JSON.stringify({ error: "Cannot allocate room before payment verification" }), { status: 400 })
    }

    let result;

    if (mode === 'AUTO') {
      // Call the atomic SQL RPC for auto-allocation
      const { data, error } = await supabase.rpc('allocate_room_atomic', { p_booking_id: booking_id })
      if (error) throw error
      result = data
    } else {
      // MANUAL ALLOCATION
      if (!room_id) throw new Error("room_id required for manual mode")
      
      // Manual mode also needs to be atomic and check gender
      const { data, error } = await supabase.rpc('allocate_room_manual', { 
        p_booking_id: booking_id, 
        p_room_id: room_id,
        p_admin_id: admin_id
      })
      if (error) throw error
      result = data
    }

    // 2. Audit Log if admin-initiated
    if (admin_id) {
      await supabase.from('audit_logs').insert({
        admin_id,
        action_type: `ALLOCATE_${mode}`,
        target_id: booking_id,
        reason: mode === 'AUTO' ? 'Automatic system allocation' : 'Manual admin allocation'
      })
    }

    return new Response(JSON.stringify({ success: true, allocation_id: result }), { status: 200 })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
