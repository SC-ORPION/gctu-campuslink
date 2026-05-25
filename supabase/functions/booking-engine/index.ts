import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from "https://deno.land/x/zod@v3.21.4/mod.ts"

const BookingSchema = z.object({
  user_id: z.string().uuid(),
  hostel_id: z.string().uuid(),
})

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    const body = await req.json()
    const { user_id, hostel_id } = BookingSchema.parse(body)

    // 1. Check for active booking (Strict constraint)
    const { data: existing, error: checkError } = await supabase
      .from('bookings')
      .select('id')
      .eq('user_id', user_id)
      .not('status', 'eq', 'CANCELLED')
      .single()

    if (existing) {
      return new Response(JSON.stringify({ error: "User already has an active booking" }), { status: 400 })
    }

    // 2. Fetch User and Hostel for gender verification
    const [userRes, hostelRes] = await Promise.all([
      supabase.from('users').select('gender').eq('id', user_id).single(),
      supabase.from('hostels').select('gender_rule, status').eq('id', hostel_id).single()
    ])

    if (userRes.error || hostelRes.error) throw new Error("Verification failed")
    
    const user = userRes.data
    const hostel = hostelRes.data

    if (hostel.status !== 'OPEN') {
      return new Response(JSON.stringify({ error: "Hostel is closed" }), { status: 400 })
    }

    // Gender Enforcement at Hostel Level
    if (hostel.gender_rule !== 'MIXED' && hostel.gender_rule !== `${user.gender}_ONLY`) {
      return new Response(JSON.stringify({ error: "Gender mismatch for this hostel" }), { status: 400 })
    }

    // 3. Create Booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id,
        hostel_id,
        status: 'PENDING_PAYMENT',
        payment_status: 'PENDING',
        allocation_mode: 'AUTO'
      })
      .select()
      .single()

    if (bookingError) throw bookingError

    return new Response(JSON.stringify(booking), { status: 200 })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
