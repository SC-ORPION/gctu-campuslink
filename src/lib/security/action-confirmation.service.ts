import * as crypto from 'crypto';
import { AuditLogService } from '../audit/audit-log';

// ============================================================================
// HIGH-RISK ACTION DEFINITIONS
// ============================================================================

const HIGH_RISK_ACTIONS = [
  'SYSTEM_OVERRIDE',
  'BULK_REVOKE',
  'SYSTEM_RESET',
  'EMERGENCY_RECOVERY',
  'SYSTEM_LOCKDOWN',
  'ROLE_ASSIGNMENT',
  'FORCE_ALLOCATE',
  'FORCE_REVOKE',
  'EMERGENCY_RESET_ALL',
] as const;

export type HighRiskAction = (typeof HIGH_RISK_ACTIONS)[number];

// ============================================================================
// CONFIRMATION TOKEN TYPES
// ============================================================================

export interface ConfirmationToken {
  id: string;
  adminId: string;
  action: string;
  reason: string;
  token: string;
  createdAt: string;
  expiresAt: string;
  used: boolean;
  metadata?: Record<string, any>;
}

// ============================================================================
// ADMIN SESSION TYPES
// ============================================================================

export interface AdminSession {
  sessionId: string;
  adminId: string;
  createdAt: string;
  lastActivityAt: string;
  ipAddress?: string;
  userAgent?: string;
  isActive: boolean;
  invalidatedReason?: string;
}

// ============================================================================
// GLOBAL IN-MEMORY STORES
// ============================================================================

const globalConfirmationRegistry = globalThis as unknown as {
  confirmationTokens: ConfirmationToken[];
};

if (!globalConfirmationRegistry.confirmationTokens) {
  globalConfirmationRegistry.confirmationTokens = [];
}

const globalSessionRegistry = globalThis as unknown as {
  adminSessions: AdminSession[];
};

if (!globalSessionRegistry.adminSessions) {
  globalSessionRegistry.adminSessions = [];
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Maximum number of concurrent admin sessions per admin user */
const MAX_CONCURRENT_SESSIONS = 3;

/** Session inactivity timeout: 30 minutes */
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

/** Confirmation token validity window: 5 minutes */
const TOKEN_EXPIRY_MS = 5 * 60 * 1000;

/** Expired token cleanup threshold: 10 minutes */
const TOKEN_CLEANUP_THRESHOLD_MS = 10 * 60 * 1000;

// ============================================================================
// PART 1: CriticalActionConfirmation
// ============================================================================

/**
 * Manages confirmation tokens for high-risk administrative actions.
 *
 * High-risk actions (e.g. SYSTEM_OVERRIDE, BULK_REVOKE, SYSTEM_LOCKDOWN)
 * require a two-step confirmation flow:
 *   1. Generate a time-limited confirmation token with a mandatory reason.
 *   2. Present the token back to validate and execute the action.
 *
 * All token lifecycle events are written to the audit log.
 */
export class CriticalActionConfirmation {
  // --------------------------------------------------------------------------
  // Query helpers
  // --------------------------------------------------------------------------

  /**
   * Returns `true` if the given action string is classified as high-risk
   * and therefore requires a confirmation token before execution.
   */
  static requiresConfirmation(action: string): boolean {
    return (HIGH_RISK_ACTIONS as readonly string[]).includes(action);
  }

  // --------------------------------------------------------------------------
  // Token lifecycle
  // --------------------------------------------------------------------------

  /**
   * Generate a cryptographically secure confirmation token for a high-risk
   * action. The token is valid for 5 minutes and must be consumed exactly
   * once via {@link validateConfirmationToken}.
   *
   * @param adminId  The admin requesting the action.
   * @param action   The action identifier (should be a HIGH_RISK_ACTION).
   * @param reason   A mandatory human-readable justification for the action.
   * @param metadata Optional extra context to attach to the token.
   * @returns The generated {@link ConfirmationToken}.
   * @throws If `reason` is empty or blank.
   */
  static generateConfirmationToken(
    adminId: string,
    action: string,
    reason: string,
    metadata?: Record<string, any>,
  ): ConfirmationToken {
    if (!reason || reason.trim().length === 0) {
      throw new Error(
        'A reason is mandatory when generating a confirmation token for a high-risk action.',
      );
    }

    const now = new Date();
    const token: ConfirmationToken = {
      id: crypto.randomUUID(),
      adminId,
      action,
      reason: reason.trim(),
      token: crypto.randomBytes(32).toString('hex'),
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + TOKEN_EXPIRY_MS).toISOString(),
      used: false,
      metadata,
    };

    globalConfirmationRegistry.confirmationTokens.push(token);

    // Fire-and-forget audit entry
    AuditLogService.logAudit({
      entityType: 'system',
      entityId: token.id,
      actionType: 'CONFIRMATION_TOKEN_GENERATED',
      previousState: 'NONE',
      newState: 'PENDING',
      actor: 'admin',
      actorId: adminId,
      metadata: {
        action,
        reason: token.reason,
        expiresAt: token.expiresAt,
        ...metadata,
      },
    }).catch((err) => console.error('[CriticalActionConfirmation] Audit log write failed:', err));

    return token;
  }

  /**
   * Validate and consume a confirmation token.
   *
   * @param adminId The admin presenting the token (must match the original requester).
   * @param token   The raw token string.
   * @param action  The action being confirmed (must match the token's action).
   * @returns `true` when the token is successfully validated and consumed.
   * @throws Descriptive error when validation fails.
   */
  static validateConfirmationToken(
    adminId: string,
    token: string,
    action: string,
  ): boolean {
    const stored = globalConfirmationRegistry.confirmationTokens.find(
      (t) => t.token === token,
    );

    if (!stored) {
      throw new Error('Confirmation token not found. It may have expired or been cleaned up.');
    }

    if (stored.adminId !== adminId) {
      throw new Error(
        `Confirmation token was issued to a different admin. Expected admin "${stored.adminId}", received "${adminId}".`,
      );
    }

    if (stored.action !== action) {
      throw new Error(
        `Confirmation token was issued for action "${stored.action}", but is being used for "${action}".`,
      );
    }

    if (new Date(stored.expiresAt).getTime() < Date.now()) {
      throw new Error(
        `Confirmation token expired at ${stored.expiresAt}. Please generate a new token.`,
      );
    }

    if (stored.used) {
      throw new Error('Confirmation token has already been used. Each token is single-use.');
    }

    // Mark consumed
    stored.used = true;

    return true;
  }

  /**
   * High-level assertion gate: verifies that an action which *requires*
   * confirmation has a valid, unused token and a non-empty reason.
   *
   * Call this at the top of any handler that performs a high-risk action.
   *
   * @param adminId The admin executing the action.
   * @param action  The action identifier.
   * @param token   The raw confirmation token string.
   * @param reason  The reason / justification for the action.
   * @throws If the action requires confirmation and validation fails.
   */
  static assertConfirmation(
    adminId: string,
    action: string,
    token: string,
    reason: string,
  ): void {
    if (!this.requiresConfirmation(action)) {
      return; // Action does not require confirmation
    }

    if (!reason || reason.trim().length === 0) {
      throw new Error(
        `High-risk action "${action}" requires a non-empty reason for audit compliance.`,
      );
    }

    this.validateConfirmationToken(adminId, token, action);

    // Fire-and-forget audit entry for successful confirmation
    AuditLogService.logAudit({
      entityType: 'system',
      entityId: action,
      actionType: 'CRITICAL_ACTION_CONFIRMED',
      previousState: 'PENDING_CONFIRMATION',
      newState: 'CONFIRMED',
      actor: 'admin',
      actorId: adminId,
      metadata: {
        action,
        reason: reason.trim(),
      },
    }).catch((err) => console.error('[CriticalActionConfirmation] Audit log write failed:', err));
  }

  // --------------------------------------------------------------------------
  // Maintenance
  // --------------------------------------------------------------------------

  /**
   * Remove tokens that were created more than 10 minutes ago (regardless of
   * whether they were used or expired). Call periodically to prevent
   * unbounded memory growth.
   */
  static cleanExpiredTokens(): void {
    const cutoff = Date.now() - TOKEN_CLEANUP_THRESHOLD_MS;

    globalConfirmationRegistry.confirmationTokens =
      globalConfirmationRegistry.confirmationTokens.filter(
        (t) => new Date(t.createdAt).getTime() > cutoff,
      );
  }
}

// ============================================================================
// PART 2: AdminSessionService
// ============================================================================

/**
 * Manages admin sessions with:
 * - Concurrent session limiting (max 3 per admin).
 * - Inactivity timeout (30 minutes).
 * - IP-based anomaly detection.
 *
 * All session lifecycle events are written to the audit log.
 */
export class AdminSessionService {
  // --------------------------------------------------------------------------
  // Session lifecycle
  // --------------------------------------------------------------------------

  /**
   * Create a new admin session. If the admin already has
   * {@link MAX_CONCURRENT_SESSIONS} active sessions, the oldest one is
   * automatically invalidated before creating the new session.
   *
   * @param adminId   The admin's user ID.
   * @param ipAddress Optional IP address of the client.
   * @param userAgent Optional User-Agent header value.
   * @returns The newly created {@link AdminSession}.
   */
  static createSession(
    adminId: string,
    ipAddress?: string,
    userAgent?: string,
  ): AdminSession {
    // Enforce concurrent session limit
    const activeSessions = this.getActiveSessions(adminId);

    if (activeSessions.length >= MAX_CONCURRENT_SESSIONS) {
      // Sort ascending by creation time and invalidate the oldest
      const sorted = [...activeSessions].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );

      const oldest = sorted[0];
      this.invalidateSession(
        oldest.sessionId,
        `Exceeded max concurrent sessions (${MAX_CONCURRENT_SESSIONS}). Auto-invalidated oldest session.`,
      );
    }

    const now = new Date().toISOString();

    const session: AdminSession = {
      sessionId: crypto.randomUUID(),
      adminId,
      createdAt: now,
      lastActivityAt: now,
      ipAddress,
      userAgent,
      isActive: true,
    };

    globalSessionRegistry.adminSessions.push(session);

    // Fire-and-forget audit entry
    AuditLogService.logAudit({
      entityType: 'system',
      entityId: session.sessionId,
      actionType: 'ADMIN_SESSION_CREATED',
      previousState: 'NONE',
      newState: 'ACTIVE',
      actor: 'admin',
      actorId: adminId,
      metadata: {
        ipAddress,
        userAgent,
        activeSessions: this.getActiveSessions(adminId).length,
      },
    }).catch((err) => console.error('[AdminSessionService] Audit log write failed:', err));

    return session;
  }

  /**
   * Validate an existing session. Returns `true` if the session exists,
   * is active, and has not timed out. A successful validation refreshes
   * the session's `lastActivityAt` timestamp.
   *
   * @param sessionId The session ID to validate.
   * @returns `true` if the session is valid.
   */
  static validateSession(sessionId: string): boolean {
    const session = globalSessionRegistry.adminSessions.find(
      (s) => s.sessionId === sessionId,
    );

    if (!session) {
      return false;
    }

    if (!session.isActive) {
      return false;
    }

    // Check inactivity timeout
    const lastActivity = new Date(session.lastActivityAt).getTime();
    if (Date.now() - lastActivity > SESSION_TIMEOUT_MS) {
      session.isActive = false;
      session.invalidatedReason = 'Session timed out due to inactivity.';
      return false;
    }

    // Refresh activity timestamp
    session.lastActivityAt = new Date().toISOString();
    return true;
  }

  /**
   * Explicitly invalidate a single session.
   *
   * @param sessionId The session ID to invalidate.
   * @param reason    A human-readable reason for invalidation.
   */
  static invalidateSession(sessionId: string, reason: string): void {
    const session = globalSessionRegistry.adminSessions.find(
      (s) => s.sessionId === sessionId,
    );

    if (!session) {
      return;
    }

    session.isActive = false;
    session.invalidatedReason = reason;

    AuditLogService.logAudit({
      entityType: 'system',
      entityId: sessionId,
      actionType: 'ADMIN_SESSION_INVALIDATED',
      previousState: 'ACTIVE',
      newState: 'INVALIDATED',
      actor: 'admin',
      actorId: session.adminId,
      metadata: { reason },
    }).catch((err) => console.error('[AdminSessionService] Audit log write failed:', err));
  }

  /**
   * Invalidate **all** active sessions for a given admin. Useful for
   * password resets, account locks, or security incidents.
   *
   * @param adminId The admin whose sessions should be invalidated.
   * @param reason  A human-readable reason for the bulk invalidation.
   */
  static invalidateAllSessions(adminId: string, reason: string): void {
    const sessions = this.getActiveSessions(adminId);

    for (const session of sessions) {
      session.isActive = false;
      session.invalidatedReason = reason;
    }

    if (sessions.length > 0) {
      AuditLogService.logAudit({
        entityType: 'system',
        entityId: adminId,
        actionType: 'ADMIN_ALL_SESSIONS_INVALIDATED',
        previousState: 'ACTIVE',
        newState: 'INVALIDATED',
        actor: 'admin',
        actorId: adminId,
        metadata: {
          reason,
          sessionsInvalidated: sessions.length,
          sessionIds: sessions.map((s) => s.sessionId),
        },
      }).catch((err) => console.error('[AdminSessionService] Audit log write failed:', err));
    }
  }

  // --------------------------------------------------------------------------
  // Anomaly detection
  // --------------------------------------------------------------------------

  /**
   * Detect concurrent-session anomalies by inspecting the IP addresses of
   * all active sessions for a given admin. If the admin has active sessions
   * originating from two or more *distinct* IP addresses, this is flagged
   * as a potential anomaly (session hijacking, credential sharing, etc.).
   *
   * @param adminId The admin to inspect.
   * @returns `true` if an anomaly is detected.
   */
  static detectConcurrentAnomaly(adminId: string): boolean {
    const activeSessions = this.getActiveSessions(adminId);

    // Collect unique, non-undefined IPs
    const uniqueIps = new Set(
      activeSessions
        .map((s) => s.ipAddress)
        .filter((ip): ip is string => ip !== undefined && ip.length > 0),
    );

    if (uniqueIps.size >= 2) {
      // Fire-and-forget anomaly audit
      AuditLogService.logAudit({
        entityType: 'system',
        entityId: adminId,
        actionType: 'CONCURRENT_SESSION_ANOMALY_DETECTED',
        previousState: 'MONITORING',
        newState: 'ANOMALY_FLAGGED',
        actor: 'system',
        metadata: {
          uniqueIps: Array.from(uniqueIps),
          activeSessions: activeSessions.length,
          sessionIds: activeSessions.map((s) => s.sessionId),
        },
      }).catch((err) => console.error('[AdminSessionService] Audit log write failed:', err));

      return true;
    }

    return false;
  }

  // --------------------------------------------------------------------------
  // Query helpers
  // --------------------------------------------------------------------------

  /**
   * Retrieve all currently active sessions for a given admin.
   *
   * @param adminId The admin's user ID.
   * @returns An array of active {@link AdminSession} objects.
   */
  static getActiveSessions(adminId: string): AdminSession[] {
    return globalSessionRegistry.adminSessions.filter(
      (s) => s.adminId === adminId && s.isActive,
    );
  }

  // --------------------------------------------------------------------------
  // Maintenance
  // --------------------------------------------------------------------------

  /**
   * Auto-invalidate sessions that have exceeded the inactivity timeout.
   * Call periodically (e.g. via a cron job or health-check) to ensure
   * stale sessions are cleaned up even if no new validation calls arrive.
   */
  static cleanExpiredSessions(): void {
    const now = Date.now();

    for (const session of globalSessionRegistry.adminSessions) {
      if (!session.isActive) {
        continue;
      }

      const lastActivity = new Date(session.lastActivityAt).getTime();
      if (now - lastActivity > SESSION_TIMEOUT_MS) {
        session.isActive = false;
        session.invalidatedReason = 'Auto-invalidated: session timed out during cleanup.';
      }
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { HIGH_RISK_ACTIONS, MAX_CONCURRENT_SESSIONS, SESSION_TIMEOUT_MS };
export default { CriticalActionConfirmation, AdminSessionService };
