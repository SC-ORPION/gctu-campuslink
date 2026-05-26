import { AuditLogService, AuditLogEntry } from '../audit/audit-log';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SecurityAlertType =
  | 'REPEATED_PERMISSION_FAILURE'
  | 'BULK_OVERRIDE_ATTEMPT'
  | 'UNUSUAL_ALLOCATION_PATTERN'
  | 'ABNORMAL_VERIFICATION_SPIKE'
  | 'CONCURRENT_SESSION_ANOMALY'
  | 'RATE_LIMIT_VIOLATION';

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface SecurityAlert {
  id: string;
  type: SecurityAlertType;
  severity: AlertSeverity;
  description: string;
  actorId: string;
  timestamp: string;
  resolved: boolean;
  metadata?: Record<string, any>;
}

// ---------------------------------------------------------------------------
// In-memory tracking (globalThis – survives HMR, consistent with codebase)
// ---------------------------------------------------------------------------

interface ActivityRecord {
  count: number;
  timestamps: string[];
}

const globalSecurity = globalThis as unknown as {
  __campuslink_failedPermissionAttempts: Map<string, ActivityRecord>;
  __campuslink_overrideAttempts: Map<string, ActivityRecord>;
  __campuslink_securityAlerts: SecurityAlert[];
};

if (!globalSecurity.__campuslink_failedPermissionAttempts) {
  globalSecurity.__campuslink_failedPermissionAttempts = new Map();
}
if (!globalSecurity.__campuslink_overrideAttempts) {
  globalSecurity.__campuslink_overrideAttempts = new Map();
}
if (!globalSecurity.__campuslink_securityAlerts) {
  globalSecurity.__campuslink_securityAlerts = [];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Generate a short random id (same pattern as audit-log.ts). */
function generateId(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

/**
 * Filter an array of ISO-8601 timestamps, keeping only those within
 * `windowMs` milliseconds of `now`.
 */
function filterWithinWindow(timestamps: string[], windowMs: number, now: Date = new Date()): string[] {
  const cutoff = now.getTime() - windowMs;
  return timestamps.filter((ts) => new Date(ts).getTime() >= cutoff);
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class SuspiciousActivityService {
  // ---- Accessors for the three stores ----

  private static get failedPermissionAttempts(): Map<string, ActivityRecord> {
    return globalSecurity.__campuslink_failedPermissionAttempts;
  }

  private static get overrideAttempts(): Map<string, ActivityRecord> {
    return globalSecurity.__campuslink_overrideAttempts;
  }

  private static get securityAlerts(): SecurityAlert[] {
    return globalSecurity.__campuslink_securityAlerts;
  }

  // -----------------------------------------------------------------------
  // 3. recordFailedPermission
  // -----------------------------------------------------------------------

  /**
   * Record a failed permission attempt for a user.
   * If the user exceeds 5 failures within a 10-minute window a
   * `REPEATED_PERMISSION_FAILURE` alert is raised.
   */
  static recordFailedPermission(userId: string, action: string): void {
    const TEN_MINUTES_MS = 10 * 60 * 1000;
    const THRESHOLD = 5;
    const now = new Date();

    const record = this.failedPermissionAttempts.get(userId) ?? { count: 0, timestamps: [] };

    // Append the new timestamp, then prune outside the window
    record.timestamps.push(now.toISOString());
    record.timestamps = filterWithinWindow(record.timestamps, TEN_MINUTES_MS, now);
    record.count = record.timestamps.length;

    this.failedPermissionAttempts.set(userId, record);

    if (record.count > THRESHOLD) {
      this.triggerAlert({
        id: generateId(),
        type: 'REPEATED_PERMISSION_FAILURE',
        severity: 'HIGH',
        description: `User ${userId} has ${record.count} failed permission attempts in the last 10 minutes (action: ${action}).`,
        actorId: userId,
        timestamp: now.toISOString(),
        resolved: false,
        metadata: { action, failureCount: record.count, window: '10m' },
      });
    }
  }

  // -----------------------------------------------------------------------
  // 4. recordOverrideAttempt
  // -----------------------------------------------------------------------

  /**
   * Record an admin override attempt.
   * If the user exceeds 3 overrides within a 5-minute window a
   * `BULK_OVERRIDE_ATTEMPT` alert is raised.
   */
  static recordOverrideAttempt(userId: string, actionType: string): void {
    const FIVE_MINUTES_MS = 5 * 60 * 1000;
    const THRESHOLD = 3;
    const now = new Date();

    const record = this.overrideAttempts.get(userId) ?? { count: 0, timestamps: [] };

    record.timestamps.push(now.toISOString());
    record.timestamps = filterWithinWindow(record.timestamps, FIVE_MINUTES_MS, now);
    record.count = record.timestamps.length;

    this.overrideAttempts.set(userId, record);

    if (record.count > THRESHOLD) {
      this.triggerAlert({
        id: generateId(),
        type: 'BULK_OVERRIDE_ATTEMPT',
        severity: 'CRITICAL',
        description: `User ${userId} performed ${record.count} override actions (${actionType}) in the last 5 minutes.`,
        actorId: userId,
        timestamp: now.toISOString(),
        resolved: false,
        metadata: { actionType, overrideCount: record.count, window: '5m' },
      });
    }
  }

  // -----------------------------------------------------------------------
  // 5. detectSuspiciousAdminActivity
  // -----------------------------------------------------------------------

  /**
   * Perform a comprehensive scan of recent audit logs and return any
   * newly detected security alerts.
   *
   * Detection rules
   * ───────────────
   * a) Repeated failed permission attempts  (>5 in 10 min)
   * b) Bulk SYSTEM_OVERRIDE actions          (>3 in 5 min)
   * c) Unusual allocation pattern            (same admin >10 rooms in 30 min)
   * d) Abnormal verification spike           (same admin >20 verifications in 1 h)
   */
  static async detectSuspiciousAdminActivity(): Promise<SecurityAlert[]> {
    const now = new Date();
    const allLogs = await AuditLogService.getAuditLogs();
    const newAlerts: SecurityAlert[] = [];

    // ── (a) Repeated failed permission attempts ──────────────────────────
    const TEN_MINUTES = 10 * 60 * 1000;
    const permissionFailures = allLogs.filter(
      (log) =>
        log.actionType === 'PERMISSION_DENIED' &&
        new Date(log.timestamp).getTime() >= now.getTime() - TEN_MINUTES,
    );

    const permissionByActor = this.groupByActor(permissionFailures);
    for (const [actorId, logs] of permissionByActor) {
      if (logs.length > 5) {
        const alert = this.buildAlert({
          type: 'REPEATED_PERMISSION_FAILURE',
          severity: 'HIGH',
          description: `Admin ${actorId} had ${logs.length} permission failures in the last 10 minutes (audit-log scan).`,
          actorId,
          now,
          metadata: { source: 'audit-scan', count: logs.length },
        });
        newAlerts.push(alert);
        this.triggerAlert(alert);
      }
    }

    // ── (b) Bulk SYSTEM_OVERRIDE actions ─────────────────────────────────
    const FIVE_MINUTES = 5 * 60 * 1000;
    const overrideLogs = allLogs.filter(
      (log) =>
        log.actionType === 'SYSTEM_OVERRIDE' &&
        new Date(log.timestamp).getTime() >= now.getTime() - FIVE_MINUTES,
    );

    const overrideByActor = this.groupByActor(overrideLogs);
    for (const [actorId, logs] of overrideByActor) {
      if (logs.length > 3) {
        const alert = this.buildAlert({
          type: 'BULK_OVERRIDE_ATTEMPT',
          severity: 'CRITICAL',
          description: `Admin ${actorId} issued ${logs.length} SYSTEM_OVERRIDE actions in the last 5 minutes.`,
          actorId,
          now,
          metadata: { source: 'audit-scan', count: logs.length },
        });
        newAlerts.push(alert);
        this.triggerAlert(alert);
      }
    }

    // ── (c) Unusual allocation pattern ───────────────────────────────────
    const THIRTY_MINUTES = 30 * 60 * 1000;
    const allocationLogs = allLogs.filter(
      (log) =>
        log.entityType === 'allocation' &&
        log.actionType === 'STATE_TRANSITION' &&
        log.newState === 'ALLOCATED' &&
        new Date(log.timestamp).getTime() >= now.getTime() - THIRTY_MINUTES,
    );

    const allocationByActor = this.groupByActor(allocationLogs);
    for (const [actorId, logs] of allocationByActor) {
      if (logs.length > 10) {
        const alert = this.buildAlert({
          type: 'UNUSUAL_ALLOCATION_PATTERN',
          severity: 'HIGH',
          description: `Admin ${actorId} allocated ${logs.length} rooms in the last 30 minutes — possible bulk manipulation.`,
          actorId,
          now,
          metadata: { source: 'audit-scan', count: logs.length, window: '30m' },
        });
        newAlerts.push(alert);
        this.triggerAlert(alert);
      }
    }

    // ── (d) Abnormal payment verification spike ──────────────────────────
    const ONE_HOUR = 60 * 60 * 1000;
    const verificationLogs = allLogs.filter(
      (log) =>
        log.entityType === 'payment' &&
        (log.actionType === 'PAYMENT_VERIFIED' || log.actionType === 'STATE_TRANSITION') &&
        log.newState === 'VERIFIED' &&
        new Date(log.timestamp).getTime() >= now.getTime() - ONE_HOUR,
    );

    const verificationByActor = this.groupByActor(verificationLogs);
    for (const [actorId, logs] of verificationByActor) {
      if (logs.length > 20) {
        const alert = this.buildAlert({
          type: 'ABNORMAL_VERIFICATION_SPIKE',
          severity: 'CRITICAL',
          description: `Admin ${actorId} verified ${logs.length} payments in the last hour — potential fraud vector.`,
          actorId,
          now,
          metadata: { source: 'audit-scan', count: logs.length, window: '1h' },
        });
        newAlerts.push(alert);
        this.triggerAlert(alert);
      }
    }

    return newAlerts;
  }

  // -----------------------------------------------------------------------
  // 6. getActiveSecurityAlerts
  // -----------------------------------------------------------------------

  /** Return all unresolved security alerts. */
  static getActiveSecurityAlerts(): SecurityAlert[] {
    return this.securityAlerts.filter((a) => !a.resolved);
  }

  // -----------------------------------------------------------------------
  // 7. resolveSecurityAlert
  // -----------------------------------------------------------------------

  /** Mark an alert as resolved and create an audit trail entry. */
  static async resolveSecurityAlert(alertId: string, adminId: string): Promise<SecurityAlert | null> {
    const alert = this.securityAlerts.find((a) => a.id === alertId);
    if (!alert) return null;

    alert.resolved = true;

    await AuditLogService.logAudit({
      entityType: 'system',
      entityId: alertId,
      actionType: 'SECURITY_ALERT_RESOLVED',
      previousState: 'ACTIVE',
      newState: 'RESOLVED',
      actor: 'admin',
      actorId: adminId,
      metadata: {
        alertType: alert.type,
        severity: alert.severity,
        originalActorId: alert.actorId,
        resolvedAt: new Date().toISOString(),
      },
    });

    console.log(
      `[SECURITY] Alert ${alertId} (${alert.type}) resolved by admin ${adminId}`,
    );

    return alert;
  }

  // -----------------------------------------------------------------------
  // 8. triggerAlert – internal helper
  // -----------------------------------------------------------------------

  /**
   * Persist a `SecurityAlert` to the in-memory store and record an
   * audit log entry so the alert is part of the permanent record.
   */
  private static triggerAlert(alert: SecurityAlert): void {
    // Deduplicate: skip if an unresolved alert of the same type for the
    // same actor already exists within the last 60 seconds.
    const ONE_MINUTE = 60 * 1000;
    const duplicate = this.securityAlerts.find(
      (existing) =>
        !existing.resolved &&
        existing.type === alert.type &&
        existing.actorId === alert.actorId &&
        Math.abs(
          new Date(existing.timestamp).getTime() - new Date(alert.timestamp).getTime(),
        ) < ONE_MINUTE,
    );
    if (duplicate) return;

    this.securityAlerts.push(alert);

    // Fire-and-forget audit entry – intentionally not awaited to keep
    // the hot path synchronous for real-time recording methods.
    AuditLogService.logAudit({
      entityType: 'system',
      entityId: alert.id,
      actionType: `SECURITY_ALERT_${alert.type}`,
      previousState: 'NONE',
      newState: 'ACTIVE',
      actor: 'system',
      actorId: alert.actorId,
      metadata: {
        alertSeverity: alert.severity,
        alertDescription: alert.description,
        ...(alert.metadata ?? {}),
      },
    }).catch((err) =>
      console.error('[SECURITY] Failed to persist alert audit entry:', err),
    );

    console.warn(
      `[SECURITY] 🚨 ${alert.severity} ALERT – ${alert.type}: ${alert.description}`,
    );
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  /** Group audit log entries by their effective actor id. */
  private static groupByActor(logs: AuditLogEntry[]): Map<string, AuditLogEntry[]> {
    const map = new Map<string, AuditLogEntry[]>();
    for (const log of logs) {
      const actorId = log.actorId ?? 'unknown';
      const existing = map.get(actorId);
      if (existing) {
        existing.push(log);
      } else {
        map.set(actorId, [log]);
      }
    }
    return map;
  }

  /** Convenience factory for building a SecurityAlert inside `detect…`. */
  private static buildAlert(opts: {
    type: SecurityAlertType;
    severity: AlertSeverity;
    description: string;
    actorId: string;
    now: Date;
    metadata?: Record<string, any>;
  }): SecurityAlert {
    return {
      id: generateId(),
      type: opts.type,
      severity: opts.severity,
      description: opts.description,
      actorId: opts.actorId,
      timestamp: opts.now.toISOString(),
      resolved: false,
      metadata: opts.metadata,
    };
  }
}

export default SuspiciousActivityService;
