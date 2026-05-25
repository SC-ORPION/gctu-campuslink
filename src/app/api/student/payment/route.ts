import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/lib/services/payment.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await PaymentService.submitPaymentProof(body);
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    console.error('API submit payment proof error:', err);
    return NextResponse.json({ error: err.message || 'Failed to submit payment proof.' }, { status: 400 });
  }
}
