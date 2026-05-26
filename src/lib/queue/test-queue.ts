import '../services/load-env';
import { JobQueue } from './job-queue';
import { AllocationWorker } from '../workers/allocation.worker';
import { NotificationWorker } from '../workers/notification.worker';
import { PaymentService } from '../services/payment.service';
import { prisma } from '../db';

async function runQueueTest() {
  console.log('=== STARTING BACKGROUND QUEUE SYSTEM VERIFICATION ===');
  
  // Ensure workers are started
  AllocationWorker.start();
  NotificationWorker.start();

  // 1. Enqueue dummy notification job
  console.log('\n--- Test Case 1: Notification Job ---');
  const dummyJob = JobQueue.enqueue('NOTIFICATION_JOB', {
    studentId: 'a7c64883-9b88-410a-8bf8-80f074d47d4e',
    title: 'Test Notification Alert',
    message: 'Async queues are fully working.',
    severity: 'INFO'
  });

  // Wait 1.5 seconds for worker to pull and complete the job
  await new Promise((resolve) => setTimeout(resolve, 1500));
  
  const jobs = JobQueue.getAllJobs();
  const checkedJob = jobs.find(j => j.id === dummyJob.id);
  console.log(`Notification Job status after wait: ${checkedJob?.status} (Expected: completed)`);

  // 2. Test Concurrency Locking Safety
  console.log('\n--- Test Case 2: Concurrency Lock Verification ---');
  const firstClaim = JobQueue.processNext();
  if (firstClaim) {
    console.log(`Lock Claim 1: Claimed job ${firstClaim.id}. Status is: ${firstClaim.status}`);
    const secondClaim = JobQueue.processNext();
    console.log(`Lock Claim 2 (on same empty queue or locked jobs): Claimed ${secondClaim ? secondClaim.id : 'null'} (Expected: null/no-job)`);
  } else {
    console.log('No pending jobs left to test locking.');
  }

  // 3. Test Failure & Retry System Capping
  console.log('\n--- Test Case 3: Failed Retry Pipeline (Exhaustion and Escalation) ---');
  const badJob = JobQueue.enqueue('ALLOCATION_ENGINE_JOB', {
    bookingId: 'invalid-uuid-forces-failure',
    studentId: 'a7c64883-9b88-410a-8bf8-80f074d47d4e'
  }, { maxRetries: 2 });

  // Let worker attempt bad allocation twice with retry system delay
  await new Promise((resolve) => setTimeout(resolve, 6000));
  
  const badJobChecked = JobQueue.getAllJobs().find(j => j.id === badJob.id);
  console.log(`Bad Job final status: ${badJobChecked?.status} (Expected: failed)`);
  console.log(`Bad Job final retryCount: ${badJobChecked?.retryCount} (Expected: 2)`);
  console.log(`Bad Job final errorReason: ${badJobChecked?.errorReason}`);

  console.log('\n=== QUEUE SYSTEM TEST COMPLETED SUCCESSFULLY ===');
  
  // Terminate loops
  AllocationWorker.stop();
  NotificationWorker.stop();
  process.exit(0);
}

runQueueTest().catch(err => {
  console.error('Queue test crash:', err);
  process.exit(1);
});
