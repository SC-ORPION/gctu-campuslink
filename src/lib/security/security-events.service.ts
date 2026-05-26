/**
 * ============================================================================
 * CAMPUSLINK SECURITY EVENT LOGGING SERVICE
 * ============================================================================
 * 
 * Centralized, append-only security event log.
 * All security-critical events are captured here for forensic analysis,
 * compliance auditing, and real-time monitoring.
 * 
 * Events logged:
 * - Permission denied
 * - System lockdown triggered/released
 * - Suspicious activity detected
 * - Rate limit triggered
 * - Override attempt blocked
 * - Session anomaly detected
 * - Confirmation token events
 * - Integrity violation detected
 * - Emergency recovery initiated
 * 
 * IMMUTABILITY: This log is append-only. No delete or edit operations exist.
 * ============================================================================
 */

import { AuditLogService } from '../audit/audit-log';

// ============================================================================
// TYPES
// ============================================================================

/** All possible security event types */
export type SecurityEventType =
  | 'PERMISSION_DENIED'
  | 'PERMISSION_GRANTED'
  | 'LOCKDOWN_ACTIVATED'
  | 'LOCKDOWN_DEACTIVATED'
  | 'SUSPICIOUS_ACTIVITY_DETECTED'
  | 'RATE_LIMIT_TRIGGERED'
  | 'RATE_LIMIT_ESCALATED'
  | 'OVERRIDE_ATTEMPT_BLOCKED'
  | 'OVERRIDE_EXECUTED'
  | 'SESSION_CREATED'
  | 'SESSION_INVALIDATED'
  | 'SESSION_ANOMALY_DETECTED'
  | 'CONCURRENT_SESSION_VIOLATION'
  | 'CONFIRMATION_TOKEN_GENERATED'
  | 'CONFIRMATION_TOKEN_VALIDATED'
  | 'CONFIRMATION_TOKEN_EXPIRED'
  | 'CONFIRMATION_REQUIRED_MISSING'
  | 'INTEGRITY_VIOLATION_DETECTED'
  | 'EMERGENCY_RECOVERY_INITIATED'
  | 'EMERGENCY_RECOVERY_COMPLETED'
  | 'ROLE_CHANGED'
  | 'SCOPE_ASSIGNED'
  | 'DATA_ACCESS_VIOLATION'
  | 'ACTIVE_ENTITY_DELETION_BLOCKED'
  | 'VERIFIED_PAYMENT_MODIFICATION_BLOCKED'
  | 'STATE_TRANSITION_VIOLATION';

/** Severity classification for security events */
export type SecurityEventSeverity = 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';

/** A single security event log entry */
export interface SecurityEvent {
  /** Unique identifier */
  id: string;
  /** Classification of the event */
  type: SecurityEventType;
  /** How severe this event is */
  severity: SecurityEventSeverity;
  /** Human-readable description */
  description: string;
  /** Who triggered this event (user ID or 'system') */
  actorId: string;
  /** IP address if available */
  ipAddress?: string;
  /** ISO-8601 timestamp */
  timestamp: string;
  /** Additional contextual data */
  metadata?: Record<string, any>;
  /** The action that was being attempted */
  attemptedAction?: string;
  /** The target entity affected */
  targetEntity?: { type: string; id: string };
}

// ============================================================================
// IN-MEMORY STORE (append-only, globalThis pattern)
// ============================================================================

const globalSecurityEvents = globalThis as unknown as {
  securityEventLog: SecurityEvent[];
};

if (!globalSecurityEvents.securityEventLog) {
  globalSecurityEvents.securityEventLog = [];
}

// ============================================================================
// SERVICE
// ============================================================================

/**
 * SecurityEventLogger provides a centralized, append-only security event log.
 * 
 * All security subsystems (RBAC, lockdown, rate limiter, suspicious activity
 * detector, session manager, confirmation system) feed events into this logger.
 * 
 * **IMMUTABILITY GUARANTEE**: This service only exposes append and read operations.
 * No delete, update, or clear methods exist by design.
 */
export class SecurityEventLogger {

  // --------------------------------------------------------------------------
  // CORE LOGGING
  // --------------------------------------------------------------------------

  /**
   * Log a security event. This is the primary entry point for all security subsystems.
   * Events are stored in-memory and also forwarded to the main audit log for persistence.
   */
  static async log(event: Omit<SecurityEvent, 'id' | 'timestamp'>): Promise<SecurityEvent> {
    const fullEvent: SecurityEvent = {
      id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
      ...event,
      timestamp: new Date().toISOString(),
    };

    // Append to in-memory store (never removed)
    globalSecurityEvents.securityEventLog.push(fullEvent);

    // Console output for real-time monitoring
    const severityIcon = {
      INFO: 'ℹ️',
      WARNING: '⚠️',
      HIGH: '🔴',
      CRITICAL: '🚨',
    }[fullEvent.severity];

    console.log(
      `[SECURITY_EVENT] ${severityIcon} [${fullEvent.severity}] ${fullEvent.type} | ` +
      `Actor: ${fullEvent.actorId} | ${fullEvent.description}` +
      (fullEvent.attemptedAction ? ` | Action: ${fullEvent.attemptedAction}` : '') +
      (fullEvent.targetEntity ? ` | Target: ${fullEvent.targetEntity.type}#${fullEvent.targetEntity.id}` : '')
    );

    // Cross-log to main audit system for persistence
    try {
      await AuditLogService.logAudit({
        entityType: 'system',
        entityId: fullEvent.id,
        actionType: `SECURITY_${fullEvent.type}`,
        previousState: 'N/A',
        newState: fullEvent.severity,
        actor: fullEvent.actorId === 'system' ? 'system' : 'admin',
        actorId: fullEvent.actorId,
        metadata: {
          securityEventType: fullEvent.type,
          description: fullEvent.description,
          attemptedAction: fullEvent.attemptedAction,
          targetEntity: fullEvent.targetEntity,
          ipAddress: fullEvent.ipAddress,
          ...fullEvent.metadata,
        },
      });
    } catch (err) {
      // Security events must not fail silently but also must not crash the system
      console.error('[SECURITY_EVENT] Failed to cross-log to audit system:', err);
    }

    return fullEvent;
  }

  // --------------------------------------------------------------------------
  // CONVENIENCE LOGGERS
  // --------------------------------------------------------------------------

  /** Log a permission denied event */
  static async logPermissionDenied(
    actorId: string,
    attemptedAction: string,
    reason: string,
    metadata?: Record<string, any>
  ): Promise<SecurityEvent> {
    return this.log({
      type: 'PERMISSION_DENIED',
      severity: 'WARNING',
      description: `Permission denied for action '${attemptedAction}': ${reason}`,
      actorId,
      attemptedAction,
      metadata,
    });
  }

  /** Log a lockdown activation */
  static async logLockdownActivated(
    actorId: string,
    reason: string
  ): Promise<SecurityEvent> {
    return this.log({
      type: 'LOCKDOWN_ACTIVATED',
      severity: 'CRITICAL',
      description: `System lockdown activated. Reason: ${reason}`,
      actorId,
      attemptedAction: 'SYSTEM_LOCKDOWN',
    });
  }

  /** Log a lockdown deactivation */
  static async logLockdownDeactivated(actorId: string): Promise<SecurityEvent> {
    return this.log({
      type: 'LOCKDOWN_DEACTIVATED',
      severity: 'HIGH',
      description: 'System lockdown has been deactivated.',
      actorId,
      attemptedAction: 'SYSTEM_LOCKDOWN_RELEASE',
    });
  }

  /** Log suspicious activity detection */
  static async logSuspiciousActivity(
    actorId: string,
    activityType: string,
    description: string,
    metadata?: Record<string, any>
  ): Promise<SecurityEvent> {
    return this.log({
      type: 'SUSPICIOUS_ACTIVITY_DETECTED',
      severity: 'HIGH',
      description: `Suspicious activity: ${activityType} — ${description}`,
      actorId,
      metadata: { activityType, ...metadata },
    });
  }

  /** Log a rate limit trigger */
  static async logRateLimitTriggered(
    actorId: string,
    actionType: string,
    details: { count: number; windowMs: number; cooldownMs: number }
  ): Promise<SecurityEvent> {
    return this.log({
      type: 'RATE_LIMIT_TRIGGERED',
      severity: 'WARNING',
      description: `Rate limit triggered for action '${actionType}': ${details.count} actions in ${details.windowMs}ms window.`,
      actorId,
      attemptedAction: actionType,
      metadata: details,
    });
  }

  /** Log an escalated rate limit violation */
  static async logRateLimitEscalated(
    actorId: string,
    actionType: string,
    violationCount: number,
    cooldownMs: number
  ): Promise<SecurityEvent> {
    return this.log({
      type: 'RATE_LIMIT_ESCALATED',
      severity: 'HIGH',
      description: `Escalated rate limit for '${actionType}': violation #${violationCount}, cooldown ${cooldownMs}ms.`,
      actorId,
      attemptedAction: actionType,
      metadata: { violationCount, cooldownMs },
    });
  }

  /** Log an override attempt that was blocked */
  static async logOverrideBlocked(
    actorId: string,
    action: string,
    reason: string
  ): Promise<SecurityEvent> {
    return this.log({
      type: 'OVERRIDE_ATTEMPT_BLOCKED',
      severity: 'HIGH',
      description: `Override attempt blocked for '${action}': ${reason}`,
      actorId,
      attemptedAction: action,
    });
  }

  /** Log a session anomaly */
  static async logSessionAnomaly(
    actorId: string,
    description: string,
    metadata?: Record<string, any>
  ): Promise<SecurityEvent> {
    return this.log({
      type: 'SESSION_ANOMALY_DETECTED',
      severity: 'HIGH',
      description,
      actorId,
      metadata,
    });
  }

  /** Log emergency recovery initiation */
  static async logEmergencyRecovery(
    actorId: string,
    phase: 'INITIATED' | 'COMPLETED',
    details?: Record<string, any>
  ): Promise<SecurityEvent> {
    return this.log({
      type: phase === 'INITIATED' ? 'EMERGENCY_RECOVERY_INITIATED' : 'EMERGENCY_RECOVERY_COMPLETED',
      severity: 'CRITICAL',
      description: `Emergency recovery mode ${phase.toLowerCase()}.`,
      actorId,
      attemptedAction: 'EMERGENCY_RECOVERY',
      metadata: details,
    });
  }

  /** Log integrity violation */
  static async logIntegrityViolation(
    description: string,
    targetEntity?: { type: string; id: string },
    metadata?: Record<string, any>
  ): Promise<SecurityEvent> {
    return this.log({
      type: 'INTEGRITY_VIOLATION_DETECTED',
      severity: 'CRITICAL',
      description,
      actorId: 'system',
      targetEntity,
      metadata,
    });
  }

  // --------------------------------------------------------------------------
  // QUERY METHODS (read-only)
  // --------------------------------------------------------------------------

  /** Get all security events (full log) */
  static getAllEvents(): SecurityEvent[] {
    return [...globalSecurityEvents.securityEventLog];
  }

  /** Get events filtered by type */
  static getEventsByType(type: SecurityEventType): SecurityEvent[] {
    return globalSecurityEvents.securityEventLog.filter((e) => e.type === type);
  }

  /** Get events filtered by severity */
  static getEventsBySeverity(severity: SecurityEventSeverity): SecurityEvent[] {
    return globalSecurityEvents.securityEventLog.filter((e) => e.severity === severity);
  }

  /** Get events for a specific actor */
  static getEventsByActor(actorId: string): SecurityEvent[] {
    return globalSecurityEvents.securityEventLog.filter((e) => e.actorId === actorId);
  }

  /** Get events within a time range */
  static getEventsInRange(startTime: Date, endTime: Date): SecurityEvent[] {
    const start = startTime.getTime();
    const end = endTime.getTime();
    return globalSecurityEvents.securityEventLog.filter((e) => {
      const t = new Date(e.timestamp).getTime();
      return t >= start && t <= end;
    });
  }

  /** Get recent events (last N minutes) */
  static getRecentEvents(minutes: number = 60): SecurityEvent[] {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.getEventsInRange(cutoff, new Date());
  }

  /** Get critical events only */
  static getCriticalEvents(): SecurityEvent[] {
    return this.getEventsBySeverity('CRITICAL');
  }

  /** Get a security event summary for dashboard display */
  static getSummary(): {
    totalEvents: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    recentCriticalCount: number;
    lastEventAt: string | null;
  } {
    const events = globalSecurityEvents.securityEventLog;
    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    for (const e of events) {
      byType[e.type] = (byType[e.type] || 0) + 1;
      bySeverity[e.severity] = (bySeverity[e.severity] || 0) + 1;
    }

    const recentCritical = this.getRecentEvents(60).filter((e) => e.severity === 'CRITICAL');

    return {
      totalEvents: events.length,
      byType,
      bySeverity,
      recentCriticalCount: recentCritical.length,
      lastEventAt: events.length > 0 ? events[events.length - 1].timestamp : null,
    };
  }

  /** Get total event count */
  static getEventCount(): number {
    return globalSecurityEvents.securityEventLog.length;
  }
}

export default SecurityEventLogger;
