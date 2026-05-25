import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from "https://deno.land/x/zod@v3.21.4/mod.ts"

const PaymentSchema = z.object({
  booking_id: z.string().uuid(),
  action: z.enum(['INITIATE', 'VERIFY', 'FAIL']),
  method: z.enum(['ONLINE', 'CASH', 'BANK']).optional(),
  reference_code: z.string().optional(),
  proof_url: z.string().url().optional(),
  admin_id: z.string().uuid().optional(),
})

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    const body = await req.json()
    const { booking_id, action, method, reference_code, proof_url, admin_id } = PaymentSchema.parse(body)

    if (action === 'INITIATE') {
      // Logic for initiating payment (e.g. creating Paystack session)
      const { data, error } = await supabase.from('payments').insert({
        booking_id,
        method,
        reference_code,
        proof_url,
        status: 'PENDING'
      }).select().single()
      if (error) throw error
      return new Response(JSON.stringify(data), { status: 200 })
    }

    if (action === 'VERIFY') {
      if (!admin_id) throw new Error("admin_id required for verification")
      
      // Call the SQL RPC to verify payment and trigger allocation
      const { data, error } = await supabase.rpc('verify_payment', { 
        p_booking_id: booking_id,
        p_admin_id: admin_id
      })
      if (error) throw error
      return new Response(JSON.stringify({ success: true }), { status: 200 })
    }

    if (action === 'FAIL') {
      await supabase.from('payments').update({ status: 'FAILED' }).eq('booking_id', booking_id)
      await supabase.from('bookings').update({ payment_status: 'FAILED' }).eq('id', booking_id)
      return new Response(JSON.stringify({ success: true }), { status: 200 })
    }

    throw new Error("Invalid action")

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
