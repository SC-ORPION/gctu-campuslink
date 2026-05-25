import { NextRequest, NextResponse } from 'next/server';
import { HostelService } from '@/lib/services/hostel.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const hostel = await HostelService.createHostel(body);
    return NextResponse.json({ success: true, hostel });
  } catch (err: any) {
    console.error('API create hostel error:', err);
    return NextResponse.json({ error: err.message || 'Failed to create hostel.' }, { status: 400 });
  }
}
