import { NextRequest, NextResponse } from 'next/server';
import { AllocationService } from '@/lib/services/allocation.service';
import { JobQueue } from '@/lib/queue/job-queue';

export async function POST(request: NextRequest) {
  try {
    const { action, bookingId, roomId, allocationId, adminId, reason } = await request.json();

    if (!action) {
      return NextResponse.json({ error: 'Missing action parameter.' }, { status: 400 });
    }

    let result;

    if (action === 'auto') {
      if (!bookingId) return NextResponse.json({ error: 'Missing bookingId.' }, { status: 400 });
      // Queue immediately and return responsiveness
      const job = JobQueue.enqueue('ALLOCATION_ENGINE_JOB', { bookingId }, { priority: 'high' });
      result = { queued: true, jobId: job.id };
    } else if (action === 'bulk_allocation') {
      // Bulk run queued
      const job = JobQueue.enqueue('ALLOCATION_ENGINE_JOB', {}, { priority: 'medium' });
      result = { queued: true, jobId: job.id, type: 'bulk_allocation' };
    } else if (action === 'bulk_payment_sync') {
      const job = JobQueue.enqueue('PAYMENT_VERIFICATION_JOB', {}, { priority: 'low' });
      result = { queued: true, jobId: job.id, type: 'bulk_payment_sync' };
    } else if (action === 'bulk_revocation_recovery') {
      const job = JobQueue.enqueue('ALLOCATION_ENGINE_JOB', { recovery: true }, { priority: 'medium' });
      result = { queued: true, jobId: job.id, type: 'bulk_revocation_recovery' };
    } else if (action === 'manual') {
      if (!bookingId || !roomId || !adminId) {
        return NextResponse.json({ error: 'Missing parameters for manual allocation.' }, { status: 400 });
      }
      result = await AllocationService.allocateManually(bookingId, roomId, adminId);
    } else if (action === 'revoke') {
      if (!allocationId || !adminId) {
        return NextResponse.json({ error: 'Missing allocationId or adminId.' }, { status: 400 });
      }
      result = await AllocationService.revokeAllocation(allocationId, adminId, reason);
    } else {
      return NextResponse.json({ error: 'Unsupported action.' }, { status: 400 });
    }

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error('API allocation error:', err);
    return NextResponse.json({ error: err.message || 'Failed to execute allocation action.' }, { status: 400 });
  }
}
