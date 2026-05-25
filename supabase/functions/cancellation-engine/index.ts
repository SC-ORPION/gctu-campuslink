import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from "https://deno.land/x/zod@v3.21.4/mod.ts"

const CancellationSchema = z.object({
  booking_id: z.string().uuid(),
  admin_id: z.string().uuid().optional(),
  reason: z.string().min(5),
})

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    const body = await req.json()
    const { booking_id, admin_id, reason } = CancellationSchema.parse(body)

    // Call the atomic cancellation RPC
    const { error: rpcErr } = await supabase.rpc('cancel_booking_atomic', {
      p_booking_id: booking_id,
      p_admin_id: admin_id,
      p_reason: reason
    })

    if (rpcErr) throw rpcErr

    return new Response(JSON.stringify({ success: true }), { status: 200 })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
