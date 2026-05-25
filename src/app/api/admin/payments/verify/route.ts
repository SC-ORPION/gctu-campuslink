import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/lib/services/payment.service';

export async function POST(request: NextRequest) {
  try {
    const { bookingId, adminId, reason } = await request.json();

    if (!bookingId || !adminId) {
      return NextResponse.json({ error: 'Missing bookingId or adminId.' }, { status: 400 });
    }

    const booking = await PaymentService.verifyPayment(bookingId, adminId, reason);
    return NextResponse.json({ success: true, booking });
  } catch (err: any) {
    console.error('API verify payment error:', err);
    return NextResponse.json({ error: err.message || 'Failed to verify payment.' }, { status: 400 });
  }
}
