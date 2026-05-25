import { NextRequest, NextResponse } from 'next/server';
import { BookingService } from '@/lib/services/booking.service';

export async function POST(request: NextRequest) {
  try {
    const { studentId, hostelId } = await request.json();

    if (!studentId || !hostelId) {
      return NextResponse.json({ error: 'Missing studentId or hostelId.' }, { status: 400 });
    }

    const booking = await BookingService.createBooking(studentId, hostelId);
    return NextResponse.json({ success: true, booking });
  } catch (err: any) {
    console.error('API create booking error:', err);
    return NextResponse.json({ error: err.message || 'Failed to create booking.' }, { status: 400 });
  }
}
