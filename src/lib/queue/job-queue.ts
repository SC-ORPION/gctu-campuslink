import { prisma } from '../db';
import { CampusLinkStateMachine } from '../state-machine/campuslink-state-machine';
import { NotificationService } from '../services/notification.service';

export type JobType =
  | 'PAYMENT_VERIFICATION_JOB'
  | 'ALLOCATION_ENGINE_JOB'
  | 'ROOM_ASSIGNMENT_JOB'
  | 'ALLOCATION_RETRY_JOB'
  | 'NOTIFICATION_JOB';

export type JobStatus = 'pending' | 'running' | 'failed' | 'completed';

export interface Job<TPayload = any> {
  id: string;
  type: JobType;
  payload: TPayload;
  priority: 'high' | 'medium' | 'low';
  retryCount: number;
  maxRetries: number;
  status: JobStatus;
  errorReason?: string;
  createdAt: Date;
  lockedUntil?: Date;
  
  // Observability infrastructure traces
  startedAt?: Date;
  finishedAt?: Date;
  executionDuration?: number;
}

// In-memory queue store with global safety for Next.js hot-reloads
const globalQueue = globalThis as unknown as {
  jobs: Job[];
};

if (!globalQueue.jobs) {
  globalQueue.jobs = [];
}

export class JobQueue {
  /**
   * Enqueue a new job
   */
  static enqueue<TPayload = any>(
    type: JobType,
    payload: TPayload,
    options?: { priority?: 'high' | 'medium' | 'low'; maxRetries?: number }
  ): Job<TPayload> {
    const job: Job<TPayload> = {
      id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      type,
      payload,
      priority: options?.priority || 'medium',
      retryCount: 0,
      maxRetries: options?.maxRetries !== undefined ? options.maxRetries : 3,
      status: 'pending',
      createdAt: new Date(),
    };

    globalQueue.jobs.push(job);
    console.log(`[JOB_QUEUE] Enqueued job ${job.id} of type ${job.type} with priority ${job.priority}`);
    return job;
  }

  /**
   * Fetch and atomically lock the next executable job
   */
  static processNext(): Job | null {
    const now = new Date();
    
    // Sort logic: High priority first, then oldest first
    const sortedJobs = [...globalQueue.jobs]
      .filter((j) => {
        if (j.status === 'completed') return false;
        if (j.status === 'running') {
          // If a job is locked but lockedUntil is in the past, unlock/recover it
          if (j.lockedUntil && j.lockedUntil < now) {
            j.status = 'pending';
            return true;
          }
          return false;
        }
        return j.status === 'pending';
      })
      .sort((a, b) => {
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        const diff = priorityWeight[b.priority] - priorityWeight[a.priority];
        if (diff !== 0) return diff;
        return a.createdAt.getTime() - b.createdAt.getTime();
      });

    const nextJob = sortedJobs[0];
    if (!nextJob) return null;

    // Lock job for 30 seconds to prevent concurrent processing by other workers
    nextJob.status = 'running';
    nextJob.lockedUntil = new Date(Date.now() + 30000);
    
    // Start trace timing
    nextJob.startedAt = new Date();

    return nextJob;
  }

  /**
   * Complete a job successfully
   */
  static completeJob(jobId: string) {
    const job = globalQueue.jobs.find((j) => j.id === jobId);
    if (job) {
      job.status = 'completed';
      job.lockedUntil = undefined;
      job.finishedAt = new Date();
      if (job.startedAt) {
        job.executionDuration = job.finishedAt.getTime() - job.startedAt.getTime();
      }
      console.log(`[JOB_QUEUE] Job ${jobId} completed successfully in ${job.executionDuration || 0}ms.`);
    }
  }

  /**
   * Fail a job, handle retries or final escalation
   */
  static failJob(jobId: string, error: string, delayMs = 2000) {
    const job = globalQueue.jobs.find((j) => j.id === jobId);
    if (!job) return;

    job.errorReason = error;
    job.lockedUntil = undefined;
    job.finishedAt = new Date();
    if (job.startedAt) {
      job.executionDuration = job.finishedAt.getTime() - job.startedAt.getTime();
    }

    if (job.retryCount < job.maxRetries) {
      job.retryCount++;
      job.status = 'pending';
      // Postpone its creation date to implement delay/backoff
      job.createdAt = new Date(Date.now() + delayMs * job.retryCount);
      console.warn(`[JOB_QUEUE] Job ${jobId} failed in ${job.executionDuration || 0}ms: ${error}. Scheduled retry #${job.retryCount} in ${delayMs * job.retryCount}ms.`);
    } else {
      job.status = 'failed';
      console.error(`[JOB_QUEUE] Job ${jobId} failed permanently after ${job.retryCount} retries. Error: ${error}`);
      
      // Perform escalation for ALLOCATION_ENGINE_JOB & ALLOCATION_RETRY_JOB
      if (job.type === 'ALLOCATION_ENGINE_JOB' || job.type === 'ALLOCATION_RETRY_JOB') {
        const studentId = job.payload?.studentId || job.payload?.booking?.studentId;
        if (studentId) {
          this.escalateAllocationFailure(studentId, error);
        }
      }
    }
  }

  private static async escalateAllocationFailure(studentId: string, reason: string) {
    try {
      await prisma.$transaction(async (tx) => {
        // Enforce state transition rule if possible
        const innerState = await CampusLinkStateMachine.deriveStudentState(studentId, tx);
        if (innerState === 'ALLOCATION_QUEUED' || innerState === 'PAYMENT_VERIFIED') {
          // Send notification of failure
          await NotificationService.sendNotification(
            studentId,
            'Allocation Failed',
            `We were unable to allocate a room for you at this time. Reason: ${reason}. Support has been notified.`,
            'ALERT'
          );
        }
      });
    } catch (err) {
      console.error('Failed to escalate allocation failure in DB:', err);
    }
  }

  /**
   * Retrieve all jobs in memory (for tracking/admin status)
   */
  static getAllJobs(): Job[] {
    return globalQueue.jobs;
  }

  /**
   * Reset/retry failed jobs manually
   */
  static retryFailedJobs() {
    let resetCount = 0;
    globalQueue.jobs.forEach((j) => {
      if (j.status === 'failed') {
        j.status = 'pending';
        j.retryCount = 0;
        j.createdAt = new Date();
        resetCount++;
      }
    });
    console.log(`[JOB_QUEUE] Reset ${resetCount} failed jobs back to pending status.`);
    return resetCount;
  }
}

export default JobQueue;
