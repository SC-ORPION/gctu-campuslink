import { JobQueue } from '../queue/job-queue';
import { AllocationService } from '../services/allocation.service';
import { prisma } from '../db';
import { CampusLinkStateMachine } from '../state-machine/campuslink-state-machine';

let allocationWorkerActive = false;
let allocationWorkerInterval: NodeJS.Timeout | null = null;

export class AllocationWorker {
  static start() {
    if (allocationWorkerActive) return;
    allocationWorkerActive = true;
    console.log('[ALLOCATION_WORKER] Started background worker loop.');

    const loop = async () => {
      if (!allocationWorkerActive) return;

      try {
        const job = JobQueue.processNext();
        if (!job) {
          // Sleep briefly if queue empty
          allocationWorkerInterval = setTimeout(loop, 1000);
          return;
        }

        console.log(`[ALLOCATION_WORKER] Processing job ${job.id} of type ${job.type}`);

        if (job.type === 'ALLOCATION_ENGINE_JOB') {
          // Process full allocation run or single booking
          const bookingId = job.payload?.bookingId;
          
          if (bookingId) {
            // Allocate single booking
            await AllocationService.triggerAutoAllocation(bookingId);
          } else {
            // Bulk allocation engine run
            await AllocationService.runAllocationEngine();
          }
          
          JobQueue.completeJob(job.id);
        } else if (job.type === 'ALLOCATION_RETRY_JOB') {
          const { bookingId } = job.payload;
          if (!bookingId) {
            throw new Error('Missing bookingId in retry payload.');
          }
          
          await AllocationService.triggerAutoAllocation(bookingId);
          JobQueue.completeJob(job.id);
        } else {
          // Pass it back, not handled by this worker
          job.status = 'pending';
          job.lockedUntil = undefined;
        }
      } catch (err: any) {
        // Find locked job and fail it to increment retries
        const jobs = JobQueue.getAllJobs();
        const activeJob = jobs.find((j) => j.status === 'running' && (j.type === 'ALLOCATION_ENGINE_JOB' || j.type === 'ALLOCATION_RETRY_JOB'));
        if (activeJob) {
          JobQueue.failJob(activeJob.id, err.message || 'Unknown allocation failure');
          
          // Requeue as a distinct ALLOCATION_RETRY_JOB if it failed and has remaining retries
          if (activeJob.status === 'pending' && activeJob.type === 'ALLOCATION_ENGINE_JOB') {
            JobQueue.enqueue('ALLOCATION_RETRY_JOB', {
              bookingId: activeJob.payload?.bookingId,
              studentId: activeJob.payload?.studentId,
            }, { priority: 'high', maxRetries: activeJob.maxRetries - activeJob.retryCount });
            
            // Mark the original job completed since we spawned a dedicated retry job
            JobQueue.completeJob(activeJob.id);
          }
        }
      }

      allocationWorkerInterval = setTimeout(loop, 500);
    };

    loop();
  }

  static stop() {
    allocationWorkerActive = false;
    if (allocationWorkerInterval) {
      clearTimeout(allocationWorkerInterval);
      allocationWorkerInterval = null;
    }
    console.log('[ALLOCATION_WORKER] Stopped background worker loop.');
  }
}

// Auto-start worker when loaded
if (typeof window === 'undefined') {
  AllocationWorker.start();
}
