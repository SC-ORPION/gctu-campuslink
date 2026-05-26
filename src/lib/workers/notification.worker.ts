import { JobQueue } from '../queue/job-queue';
import { NotificationService } from '../services/notification.service';

let notificationWorkerActive = false;
let notificationWorkerInterval: NodeJS.Timeout | null = null;

export class NotificationWorker {
  static start() {
    if (notificationWorkerActive) return;
    notificationWorkerActive = true;
    console.log('[NOTIFICATION_WORKER] Started background worker loop.');

    const loop = async () => {
      if (!notificationWorkerActive) return;

      try {
        const job = JobQueue.processNext();
        if (!job) {
          notificationWorkerInterval = setTimeout(loop, 1000);
          return;
        }

        if (job.type === 'NOTIFICATION_JOB') {
          const { studentId, title, message, severity } = job.payload;
          if (!studentId || !title || !message) {
            throw new Error('Invalid notification payload');
          }

          // Deliver notification
          await NotificationService.sendNotification(studentId, title, message, severity || 'INFO');
          JobQueue.completeJob(job.id);
        } else {
          // Pass it back, not handled by this worker
          job.status = 'pending';
          job.lockedUntil = undefined;
        }
      } catch (err: any) {
        const jobs = JobQueue.getAllJobs();
        const activeJob = jobs.find((j) => j.status === 'running' && j.type === 'NOTIFICATION_JOB');
        if (activeJob) {
          JobQueue.failJob(activeJob.id, err.message || 'Notification sending failed');
        }
      }

      notificationWorkerInterval = setTimeout(loop, 500);
    };

    loop();
  }

  static stop() {
    notificationWorkerActive = false;
    if (notificationWorkerInterval) {
      clearTimeout(notificationWorkerInterval);
      notificationWorkerInterval = null;
    }
    console.log('[NOTIFICATION_WORKER] Stopped background worker loop.');
  }
}

// Auto-start worker when loaded
if (typeof window === 'undefined') {
  NotificationWorker.start();
}
