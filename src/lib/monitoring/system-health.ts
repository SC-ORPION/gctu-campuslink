import { prisma } from '../db';
import { JobQueue } from '../queue/job-queue';

export interface SystemErrorLog {
  id: string;
  error: string;
  context: string;
  stackTrace?: string;
  affectedEntity?: { type: string; id: string };
  timestamp: string;
}

// In-memory registry for system errors
const globalErrorRegistry = globalThis as unknown as {
  errorLogs: SystemErrorLog[];
};

if (!globalErrorRegistry.errorLogs) {
  globalErrorRegistry.errorLogs = [];
}

// Keep track of allocation durations
const globalMetricsRegistry = globalThis as unknown as {
  allocationDurations: number[];
  paymentVerificationDelays: number[];
};

if (!globalMetricsRegistry.allocationDurations) {
  globalMetricsRegistry.allocationDurations = [];
}
if (!globalMetricsRegistry.paymentVerificationDelays) {
  globalMetricsRegistry.paymentVerificationDelays = [];
}

export class SystemHealthMonitor {
  /**
   * Capture and log a system error.
   */
  static createErrorLog(entry: {
    error: Error | string;
    context: string;
    stackTrace?: string;
    affectedEntity?: { type: string; id: string };
  }): SystemErrorLog {
    const errorMsg = entry.error instanceof Error ? entry.error.message : entry.error;
    const stack = entry.error instanceof Error ? entry.error.stack : entry.stackTrace;
    
    const errorLog: SystemErrorLog = {
      id: Math.random().toString(36).substring(2, 11),
      error: errorMsg,
      context: entry.context,
      stackTrace: stack,
      affectedEntity: entry.affectedEntity,
      timestamp: new Date().toISOString(),
    };

    globalErrorRegistry.errorLogs.push(errorLog);
    console.error(`[SYSTEM_ERROR_LOG] [${errorLog.timestamp}] Context: ${errorLog.context} | Error: ${errorLog.error} | Entity: ${JSON.stringify(errorLog.affectedEntity || {})}`);
    return errorLog;
  }

  static getErrorLogs(): SystemErrorLog[] {
    return globalErrorRegistry.errorLogs;
  }

  static recordAllocationTime(ms: number) {
    globalMetricsRegistry.allocationDurations.push(ms);
  }

  static recordPaymentVerificationDelay(ms: number) {
    globalMetricsRegistry.paymentVerificationDelays.push(ms);
  }

  /**
   * Health metrics retrieval.
   */
  static async getHealthMetrics() {
    const jobs = JobQueue.getAllJobs();
    
    const backlogSize = jobs.filter((j) => j.status === 'pending' || j.status === 'running').length;
    const failedJobCount = jobs.filter((j) => j.status === 'failed').length;
    
    const avgAllocTime = globalMetricsRegistry.allocationDurations.length > 0 
      ? globalMetricsRegistry.allocationDurations.reduce((a, b) => a + b, 0) / globalMetricsRegistry.allocationDurations.length 
      : 0;

    const avgPaymentDelay = globalMetricsRegistry.paymentVerificationDelays.length > 0
      ? globalMetricsRegistry.paymentVerificationDelays.reduce((a, b) => a + b, 0) / globalMetricsRegistry.paymentVerificationDelays.length
      : 0;

    const totalActionsCount = 100; // Simulated scale base
    const systemErrorRate = totalActionsCount > 0 
      ? (globalErrorRegistry.errorLogs.length / totalActionsCount) * 100 
      : 0;

    return {
      queueBacklogSize: backlogSize,
      failedJobCount,
      averageAllocationTimeMs: avgAllocTime,
      paymentVerificationDelayMs: avgPaymentDelay,
      systemErrorRatePercent: systemErrorRate,
    };
  }

  /**
   * Data Source stats for Admin Monitoring Dashboard.
   */
  static async getActiveBookingsStats() {
    const counts = await prisma.booking.groupBy({
      by: ['status'],
      _count: { id: true },
    });
    return counts.map((c) => ({ status: c.status, count: c._count.id }));
  }

  static async getPendingPaymentsStats() {
    const pendingCount = await prisma.payment.count({
      where: { status: 'PENDING' },
    });
    return { pendingPayments: pendingCount };
  }

  static async getAllocationQueueStats() {
    const queuedCount = await prisma.booking.count({
      where: { status: 'CONFIRMED', allocations: { none: {} } },
    });
    return { studentsInQueue: queuedCount };
  }

  static async getFailedJobsStats() {
    const jobs = JobQueue.getAllJobs();
    const failedJobs = jobs.filter((j) => j.status === 'failed');
    return failedJobs.map((j) => ({
      id: j.id,
      type: j.type,
      retryCount: j.retryCount,
      errorReason: j.errorReason,
      createdAt: j.createdAt,
    }));
  }

  static async getRoomOccupancyStats() {
    const rooms = await prisma.room.findMany({
      select: {
        id: true,
        roomNumber: true,
        capacity: true,
        currentOccupancy: true,
        genderRule: true,
      },
    });

    const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0);
    const totalOccupancy = rooms.reduce((sum, r) => sum + r.currentOccupancy, 0);
    
    return {
      totalCapacity,
      totalOccupancy,
      occupancyPercentage: totalCapacity > 0 ? (totalOccupancy / totalCapacity) * 100 : 0,
      roomDetails: rooms.map((r) => ({
        id: r.id,
        roomNumber: r.roomNumber,
        occupancy: `${r.currentOccupancy}/${r.capacity}`,
        genderRule: r.genderRule,
      })),
    };
  }
}
export default SystemHealthMonitor;
