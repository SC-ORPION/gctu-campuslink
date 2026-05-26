import * as fs from 'fs';
import * as path from 'path';
import { systemEvents, SystemEventType } from '../events/system-events';

export interface AuditLogEntry {
  id: string;
  entityType: 'student' | 'booking' | 'payment' | 'allocation' | 'system';
  entityId: string;
  actionType: string;
  previousState: string;
  newState: string;
  actor: 'admin' | 'system' | 'student';
  actorId?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

const LOG_FILE_PATH = path.join(process.cwd(), 'src', 'lib', 'audit', 'audit.log');

// Global registry fallback to maintain audit logs in-memory during a session
const globalAuditRegistry = globalThis as unknown as {
  auditLogs: AuditLogEntry[];
};

if (!globalAuditRegistry.auditLogs) {
  globalAuditRegistry.auditLogs = [];
}

export class AuditLogService {
  /**
   * Log an audit event with detailed structure.
   */
  static async logAudit(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>, tx?: any): Promise<AuditLogEntry> {
    const fullEntry: AuditLogEntry = {
      id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      ...entry,
      timestamp: new Date().toISOString(),
    };

    // Save to global memory
    globalAuditRegistry.auditLogs.push(fullEntry);

    // Format log entry for textual storage
    const logLine = `[AUDIT] [${fullEntry.timestamp}] [ID: ${fullEntry.id}] [Entity: ${fullEntry.entityType}#${fullEntry.entityId}] Action: ${fullEntry.actionType} | Transition: ${fullEntry.previousState} -> ${fullEntry.newState} | Actor: ${fullEntry.actor}${fullEntry.actorId ? `(${fullEntry.actorId})` : ''} | Metadata: ${JSON.stringify(fullEntry.metadata || {})}\n`;

    // Append to file
    try {
      const dir = path.dirname(LOG_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.appendFileSync(LOG_FILE_PATH, logLine, 'utf8');
    } catch (err) {
      console.error('Failed to write to audit log file:', err);
    }

    console.log(logLine.trim());
    return fullEntry;
  }

  /**
   * Specifically log a state transition and emit standard system events automatically.
   */
  static async logStateTransition(
    entityId: string,
    entityType: 'student' | 'booking' | 'payment' | 'allocation',
    fromState: string,
    toState: string,
    actor: 'admin' | 'system' | 'student',
    actorId?: string,
    reason?: string,
    metadata?: Record<string, any>
  ): Promise<AuditLogEntry> {
    const log = await this.logAudit({
      entityType,
      entityId,
      actionType: 'STATE_TRANSITION',
      previousState: fromState,
      newState: toState,
      actor,
      actorId,
      metadata: { reason, ...metadata },
    });

    // Automatically feed event stream if maps to SystemEventType
    let matchedEvent: SystemEventType | null = null;
    if (entityType === 'student' && toState === 'BLOCKED') {
      matchedEvent = 'STUDENT_BLOCKED';
    } else if (entityType === 'booking' && toState === 'CONFIRMED' && fromState === 'PENDING_PAYMENT') {
      matchedEvent = 'BOOKING_CREATED';
    } else if (entityType === 'booking' && fromState === 'HOSTEL_SELECTED' && toState === 'HOSTEL_LOCKED') {
      matchedEvent = 'BOOKING_LOCKED';
    }

    if (matchedEvent) {
      systemEvents.emitEvent(matchedEvent, {
        entityId,
        fromState,
        toState,
        actor,
        actorId,
        metadata: log.metadata,
      });
    }

    return log;
  }

  /**
   * Retrieve audit logs.
   */
  static async getAuditLogs(): Promise<AuditLogEntry[]> {
    return globalAuditRegistry.auditLogs;
  }

  /**
   * Replay-based reconstruction capabilities.
   */
  static async getStudentHistory(studentId: string): Promise<AuditLogEntry[]> {
    return globalAuditRegistry.auditLogs.filter(
      (log) => (log.entityType === 'student' && log.entityId === studentId) || 
               (log.metadata?.studentId === studentId)
    );
  }

  static async getBookingLifecycle(bookingId: string): Promise<AuditLogEntry[]> {
    return globalAuditRegistry.auditLogs.filter(
      (log) => (log.entityType === 'booking' && log.entityId === bookingId) || 
               (log.metadata?.bookingId === bookingId)
    );
  }

  static async getPaymentLifecycle(paymentId: string): Promise<AuditLogEntry[]> {
    return globalAuditRegistry.auditLogs.filter(
      (log) => (log.entityType === 'payment' && log.entityId === paymentId) ||
               (log.metadata?.paymentId === paymentId)
    );
  }

  static async getAllocationTimeline(): Promise<AuditLogEntry[]> {
    return globalAuditRegistry.auditLogs.filter(
      (log) => log.entityType === 'allocation'
    );
  }
}

export default AuditLogService;
