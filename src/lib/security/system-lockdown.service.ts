/**
 * ============================================================================
 * System Lockdown & Emergency Recovery Service
 * ============================================================================
 *
 * Provides two critical security capabilities for CampusLink:
 *
 *  1. SYSTEM LOCKDOWN MODE — Blocks all non-admin operations system-wide.
 *     While locked, every service call that passes through `assertNotLocked()`
 *     will throw for non-admin users. Only a SUPER_ADMIN (role === 'admin')
 *     can enable or disable lockdown.
 *
 *  2. EMERGENCY RECOVERY MODE — A structured, non-destructive recovery
 *     procedure that: locks the system → pauses background job processing →
 *     runs full integrity checks → snapshots entity counts → emits an audit
 *     trail. It does NOT auto-fix anything; the report is designed for manual
 *     human triage.
 *
 * State is stored on `globalThis` to survive Next.js HMR reloads in dev,
 * consistent with audit-log.ts, system-health.ts, and job-queue.ts.
 *
 * @module security/system-lockdown
 */

import { prisma } from '../db';
import { AuditLogService } from '../audit/audit-log';
import { IntegrityChecker, type IntegrityIssue } from '../monitoring/integrity-checker';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Persistent in-memory state describing an active lockdown. */
export interface LockdownState {
  active: boolean;
  reason: string;
  activatedBy: string;
  activatedAt: string;
}

/** Counts captured during an emergency recovery snapshot. */
export interface SafeStateSnapshot {
  bookings: number;
  payments: number;
  allocations: number;
  rooms: number;
  capturedAt: string;
}

/** Full report returned by the emergency recovery procedure. */
export interface RecoveryReport {
  lockdownActivated: boolean;
  jobQueuePaused: boolean;
  integrityCheckPassed: boolean;
  issuesFound: IntegrityIssue[];
  snapshot: SafeStateSnapshot;
  initiatedBy: string;
  initiatedAt: string;
}

// ---------------------------------------------------------------------------
// Global in-memory registries (survives HMR, reset on cold restart)
// ---------------------------------------------------------------------------

const globalLockdownRegistry = globalThis as unknown as {
  __campuslink_lockdown_state: LockdownState | null;
  __campuslink_job_queue_paused: boolean;
  __campuslink_recovery_snapshot: RecoveryReport | null;
};

if (globalLockdownRegistry.__campuslink_lockdown_state === undefined) {
  globalLockdownRegistry.__campuslink_lockdown_state = null;
}

if (globalLockdownRegistry.__campuslink_job_queue_paused === undefined) {
  globalLockdownRegistry.__campuslink_job_queue_paused = false;
}

if (globalLockdownRegistry.__campuslink_recovery_snapshot === undefined) {
  globalLockdownRegistry.__campuslink_recovery_snapshot = null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Verify that the given user has SUPER_ADMIN privileges.
 *
 * In the current CampusLink schema the highest privilege tier is
 * `Role.admin`. This function performs a lightweight prisma lookup and
 * throws a descriptive error when the caller lacks the required role.
 */
async function assertSuperAdmin(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!user) {
    throw new Error(
      `[LOCKDOWN] Authorization failed: user ${userId} not found.`,
    );
  }

  if (user.role !== 'admin') {
    throw new Error(
      `[LOCKDOWN] Access denied: user ${userId} requires SUPER_ADMIN (admin) role. Current role: ${user.role}.`,
    );
  }
}

// ---------------------------------------------------------------------------
// SystemLockdownService
// ---------------------------------------------------------------------------

export class SystemLockdownService {
  // -----------------------------------------------------------------------
  // 1. SYSTEM LOCKDOWN MODE
  // -----------------------------------------------------------------------

  /**
   * Activate system-wide lockdown.
   *
   * While active, `assertNotLocked()` will throw for every non-admin user,
   * effectively halting all student-facing operations.
   *
   * @param adminId - UUID of the admin activating lockdown.
   * @param reason  - Human-readable reason (shown in audit & status).
   * @returns The newly created {@link LockdownState}.
   *
   * @throws If the caller is not a SUPER_ADMIN.
   * @throws If the system is already locked (prevents double-lock).
   */
  static async enableSystemLockdown(
    adminId: string,
    reason: string,
  ): Promise<LockdownState> {
    await assertSuperAdmin(adminId);

    if (globalLockdownRegistry.__campuslink_lockdown_state?.active) {
      throw new Error(
        '[LOCKDOWN] System is already in lockdown mode. Disable the current lockdown before re-enabling.',
      );
    }

    const state: LockdownState = {
      active: true,
      reason,
      activatedBy: adminId,
      activatedAt: new Date().toISOString(),
    };

    globalLockdownRegistry.__campuslink_lockdown_state = state;

    await AuditLogService.logAudit({
      entityType: 'system',
      entityId: 'SYSTEM_LOCKDOWN',
      actionType: 'LOCKDOWN_ENABLED',
      previousState: 'UNLOCKED',
      newState: 'LOCKED',
      actor: 'admin',
      actorId: adminId,
      metadata: { reason },
    });

    console.log(
      `[LOCKDOWN] System lockdown ACTIVATED by ${adminId}. Reason: ${reason}`,
    );

    return state;
  }

  /**
   * Deactivate system-wide lockdown and resume normal operations.
   *
   * @param adminId - UUID of the admin deactivating lockdown.
   *
   * @throws If the caller is not a SUPER_ADMIN.
   * @throws If the system is not currently locked.
   */
  static async disableSystemLockdown(adminId: string): Promise<void> {
    await assertSuperAdmin(adminId);

    const current = globalLockdownRegistry.__campuslink_lockdown_state;

    if (!current?.active) {
      throw new Error(
        '[LOCKDOWN] System is not currently in lockdown mode.',
      );
    }

    const previousReason = current.reason;

    // Clear lockdown state
    globalLockdownRegistry.__campuslink_lockdown_state = null;

    // Also unpause the job queue if it was paused by emergency recovery
    globalLockdownRegistry.__campuslink_job_queue_paused = false;

    await AuditLogService.logAudit({
      entityType: 'system',
      entityId: 'SYSTEM_LOCKDOWN',
      actionType: 'LOCKDOWN_DISABLED',
      previousState: 'LOCKED',
      newState: 'UNLOCKED',
      actor: 'admin',
      actorId: adminId,
      metadata: { previousReason },
    });

    console.log(
      `[LOCKDOWN] System lockdown DEACTIVATED by ${adminId}. Previous reason: ${previousReason}`,
    );
  }

  /**
   * Quick boolean check — is the system currently locked?
   */
  static isSystemLocked(): boolean {
    return (
      globalLockdownRegistry.__campuslink_lockdown_state?.active === true
    );
  }

  /**
   * Return full lockdown details or `null` when the system is not locked.
   */
  static getLockdownStatus(): LockdownState | null {
    return globalLockdownRegistry.__campuslink_lockdown_state ?? null;
  }

  /**
   * Guard function to be called by other services before performing actions.
   *
   * If the system is in lockdown and the requesting user is **not** an
   * admin, an error is thrown — effectively blocking the operation.
   * Admins are always allowed through so they can perform recovery tasks.
   *
   * @param userId - UUID of the user attempting the action.
   *
   * @throws When the system is locked and the user is not an admin.
   */
  static async assertNotLocked(userId: string): Promise<void> {
    if (!SystemLockdownService.isSystemLocked()) {
      return; // System is open — nothing to block.
    }

    // Allow admins through the lockdown gate
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role === 'admin') {
      return; // Admin override — allowed.
    }

    const state = globalLockdownRegistry.__campuslink_lockdown_state!;
    throw new Error(
      `[LOCKDOWN] System is currently in lockdown mode. Reason: ${state.reason}. ` +
        `Only administrators may perform actions during lockdown. Contact support.`,
    );
  }

  // -----------------------------------------------------------------------
  // Job Queue Pause Flag (read by workers / job-queue consumers)
  // -----------------------------------------------------------------------

  /**
   * Returns `true` when background job processing should be paused.
   *
   * External job workers / queue processors should call this before
   * picking up the next job and skip processing when paused.
   */
  static isJobQueuePaused(): boolean {
    return globalLockdownRegistry.__campuslink_job_queue_paused === true;
  }

  // -----------------------------------------------------------------------
  // 2. EMERGENCY RECOVERY MODE
  // -----------------------------------------------------------------------

  /**
   * Initiate a full emergency recovery procedure.
   *
   * The sequence is strictly ordered and non-destructive:
   *
   *  1. Enable system lockdown with reason `EMERGENCY_RECOVERY`.
   *  2. Pause background job queue processing.
   *  3. Run the full integrity checker.
   *  4. Snapshot current entity counts (bookings, payments, allocations, rooms).
   *  5. Audit-log the entire recovery event.
   *  6. Return a {@link RecoveryReport} for human review.
   *
   * **This method does NOT automatically fix anything.** The report is
   * designed for a human operator to triage and resolve issues manually.
   *
   * @param adminId - UUID of the admin initiating the recovery.
   * @returns A detailed {@link RecoveryReport}.
   *
   * @throws If the caller is not a SUPER_ADMIN.
   */
  static async emergencyRecoveryMode(
    adminId: string,
  ): Promise<RecoveryReport> {
    await assertSuperAdmin(adminId);

    const initiatedAt = new Date().toISOString();

    // ------------------------------------------------------------------
    // Step 1: Activate system lockdown
    // ------------------------------------------------------------------
    // If already locked we re-use the existing lock rather than throwing.
    let lockdownActivated = false;
    if (!SystemLockdownService.isSystemLocked()) {
      await SystemLockdownService.enableSystemLockdown(
        adminId,
        'EMERGENCY_RECOVERY',
      );
      lockdownActivated = true;
    } else {
      // Update the reason on the existing lockdown to reflect recovery
      const current = globalLockdownRegistry.__campuslink_lockdown_state!;
      current.reason = 'EMERGENCY_RECOVERY';
      lockdownActivated = true;
    }

    // ------------------------------------------------------------------
    // Step 2: Pause background job queue processing
    // ------------------------------------------------------------------
    globalLockdownRegistry.__campuslink_job_queue_paused = true;

    console.log(
      `[RECOVERY] Job queue processing PAUSED by ${adminId}.`,
    );

    // ------------------------------------------------------------------
    // Step 3: Run integrity checker
    // ------------------------------------------------------------------
    let integrityResult: { success: boolean; issues: IntegrityIssue[] };
    try {
      integrityResult = await IntegrityChecker.runIntegrityCheck();
    } catch (err) {
      // If the integrity check itself fails, capture the error as an issue
      integrityResult = {
        success: false,
        issues: [
          {
            type: 'INVALID_TRANSITION',
            severity: 'CRITICAL',
            description: `IntegrityChecker threw an unexpected error: ${err instanceof Error ? err.message : String(err)}`,
            affectedEntityId: 'SYSTEM',
          },
        ],
      };
    }

    // ------------------------------------------------------------------
    // Step 4: Build safe-state snapshot (aggregate counts)
    // ------------------------------------------------------------------
    const [bookingCount, paymentCount, allocationCount, roomCount] =
      await Promise.all([
        prisma.booking.count(),
        prisma.payment.count(),
        prisma.allocation.count({ where: { revokedAt: null } }),
        prisma.room.count(),
      ]);

    const snapshot: SafeStateSnapshot = {
      bookings: bookingCount,
      payments: paymentCount,
      allocations: allocationCount,
      rooms: roomCount,
      capturedAt: new Date().toISOString(),
    };

    // ------------------------------------------------------------------
    // Step 5: Assemble report
    // ------------------------------------------------------------------
    const report: RecoveryReport = {
      lockdownActivated,
      jobQueuePaused: true,
      integrityCheckPassed: integrityResult.success,
      issuesFound: integrityResult.issues,
      snapshot,
      initiatedBy: adminId,
      initiatedAt,
    };

    // Persist for later retrieval
    globalLockdownRegistry.__campuslink_recovery_snapshot = report;

    // ------------------------------------------------------------------
    // Step 6: Audit trail
    // ------------------------------------------------------------------
    await AuditLogService.logAudit({
      entityType: 'system',
      entityId: 'EMERGENCY_RECOVERY',
      actionType: 'EMERGENCY_RECOVERY_INITIATED',
      previousState: 'NORMAL',
      newState: 'RECOVERY_MODE',
      actor: 'admin',
      actorId: adminId,
      metadata: {
        integrityCheckPassed: integrityResult.success,
        issueCount: integrityResult.issues.length,
        snapshot,
      },
    });

    console.log(
      `[RECOVERY] Emergency recovery completed by ${adminId}. ` +
        `Integrity passed: ${integrityResult.success}. ` +
        `Issues found: ${integrityResult.issues.length}. ` +
        `Snapshot: ${JSON.stringify(snapshot)}`,
    );

    return report;
  }

  /**
   * Retrieve the last emergency recovery report, or `null` if no recovery
   * has been performed during the current process lifecycle.
   */
  static getRecoverySnapshot(): RecoveryReport | null {
    return globalLockdownRegistry.__campuslink_recovery_snapshot ?? null;
  }
}

export default SystemLockdownService;
