import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from "https://deno.land/x/zod@v3.21.4/mod.ts"

const RevocationSchema = z.object({
  allocation_id: z.string().uuid(),
  admin_id: z.string().uuid(),
  reason: z.string().min(5),
})

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    const body = await req.json()
    const { allocation_id, admin_id, reason } = RevocationSchema.parse(body)

    // 1. Fetch allocation and room_id
    const { data: allocation, error: fetchErr } = await supabase
      .from('allocations')
      .select('room_id, booking_id')
      .eq('id', allocation_id)
      .single()

    if (fetchErr || !allocation) throw new Error("Allocation not found")

    // 2. Perform revocation in a single RPC for atomicity
    const { error: rpcErr } = await supabase.rpc('revoke_allocation_atomic', {
      p_allocation_id: allocation_id,
      p_room_id: allocation.room_id,
      p_booking_id: allocation.booking_id,
      p_admin_id: admin_id,
      p_reason: reason
    })

    if (rpcErr) throw rpcErr

    return new Response(JSON.stringify({ success: true }), { status: 200 })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
