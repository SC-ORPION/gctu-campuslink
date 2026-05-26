"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminRateLimiter = void 0;
const audit_log_1 = require("../audit/audit-log");
// ---------------------------------------------------------------------------
// Per-action rate limit configuration
// ---------------------------------------------------------------------------
const RATE_LIMITS = {
    PAYMENT_VERIFY: { maxActions: 30, windowMs: 60_000, cooldownMs: 30_000 },
    PAYMENT_REJECT: { maxActions: 20, windowMs: 60_000, cooldownMs: 30_000 },
    ALLOCATION_MANAGE: { maxActions: 15, windowMs: 60_000, cooldownMs: 60_000 },
    HOSTEL_MANAGE: { maxActions: 10, windowMs: 60_000, cooldownMs: 60_000 },
    SYSTEM_OVERRIDE: { maxActions: 3, windowMs: 300_000, cooldownMs: 300_000 },
    STUDENT_WRITE: { maxActions: 20, windowMs: 60_000, cooldownMs: 30_000 },
    BULK_OPERATIONS: { maxActions: 5, windowMs: 600_000, cooldownMs: 600_000 },
    DEFAULT: { maxActions: 50, windowMs: 60_000, cooldownMs: 30_000 },
};
// ---------------------------------------------------------------------------
// In-memory state (globalThis – survives Next.js HMR, one per process)
// ---------------------------------------------------------------------------
const globalRateLimitRegistry = globalThis;
if (!globalRateLimitRegistry.__rateLimitActionLog) {
    globalRateLimitRegistry.__rateLimitActionLog = new Map();
}
if (!globalRateLimitRegistry.__rateLimitViolationHistory) {
    globalRateLimitRegistry.__rateLimitViolationHistory = [];
}
// Cap in-memory violation history to prevent unbounded growth
const MAX_VIOLATION_HISTORY = 500;
// ---------------------------------------------------------------------------
// AdminRateLimiter
// ---------------------------------------------------------------------------
class AdminRateLimiter {
    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------
    /** Resolve the config for a given action type, falling back to DEFAULT. */
    static getConfig(actionType) {
        return RATE_LIMITS[actionType] ?? RATE_LIMITS.DEFAULT;
    }
    /** Build the composite map key for an admin + action pair. */
    static buildKey(adminId, actionType) {
        return `${adminId}:${actionType}`;
    }
    /** Get or initialise an entry in the action log. */
    static getOrCreateEntry(key) {
        const map = globalRateLimitRegistry.__rateLimitActionLog;
        let entry = map.get(key);
        if (!entry) {
            entry = { timestamps: [], violationCount: 0 };
            map.set(key, entry);
        }
        return entry;
    }
    /** Remove timestamps that fall outside the sliding window. */
    static pruneWindow(entry, windowMs) {
        const cutoff = Date.now() - windowMs;
        entry.timestamps = entry.timestamps.filter((ts) => ts > cutoff);
    }
    /** Persist a violation to the in-memory history ring-buffer. */
    static recordViolation(adminId, actionType, violationCount, cooldownAppliedMs) {
        const record = {
            adminId,
            actionType,
            violationCount,
            cooldownAppliedMs,
            timestamp: new Date().toISOString(),
        };
        const history = globalRateLimitRegistry.__rateLimitViolationHistory;
        history.push(record);
        // Trim oldest entries when the buffer overflows
        if (history.length > MAX_VIOLATION_HISTORY) {
            history.splice(0, history.length - MAX_VIOLATION_HISTORY);
        }
    }
    // -----------------------------------------------------------------------
    // Core API
    // -----------------------------------------------------------------------
    /**
     * Check whether an admin action is within its rate limit.
     *
     * - If allowed, the action timestamp is recorded automatically.
     * - If blocked, returns the wait time and a descriptive reason.
     *
     * Escalating cooldown: first violation = 1× base cooldown,
     * second = 2×, third = 3×, etc.
     */
    static checkRateLimit(adminId, actionType) {
        const config = this.getConfig(actionType);
        const key = this.buildKey(adminId, actionType);
        const entry = this.getOrCreateEntry(key);
        const now = Date.now();
        // 1. Prune stale timestamps
        this.pruneWindow(entry, config.windowMs);
        // 2. Cooldown check
        if (entry.cooldownUntil && now < entry.cooldownUntil) {
            const retryAfterMs = entry.cooldownUntil - now;
            return {
                allowed: false,
                retryAfterMs,
                reason: `Rate limit cooldown active for action "${actionType}". ` +
                    `Retry after ${Math.ceil(retryAfterMs / 1000)}s ` +
                    `(violation #${entry.violationCount}).`,
            };
        }
        // If we passed the cooldown window, clear the flag (but keep violationCount
        // so the next violation still escalates until an explicit reset).
        if (entry.cooldownUntil && now >= entry.cooldownUntil) {
            entry.cooldownUntil = undefined;
        }
        // 3. Window capacity check
        if (entry.timestamps.length >= config.maxActions) {
            // --- Violation path ---
            entry.violationCount += 1;
            const escalatedCooldown = config.cooldownMs * entry.violationCount;
            entry.cooldownUntil = now + escalatedCooldown;
            // Persist to violation history
            this.recordViolation(adminId, actionType, entry.violationCount, escalatedCooldown);
            // Fire-and-forget audit log entry
            audit_log_1.AuditLogService.logAudit({
                entityType: 'system',
                entityId: adminId,
                actionType: 'RATE_LIMIT_VIOLATION',
                previousState: 'ACTIVE',
                newState: 'COOLDOWN',
                actor: 'system',
                actorId: adminId,
                metadata: {
                    rateLimitedAction: actionType,
                    violationNumber: entry.violationCount,
                    cooldownMs: escalatedCooldown,
                    actionsInWindow: entry.timestamps.length,
                    maxActions: config.maxActions,
                    windowMs: config.windowMs,
                },
            }).catch((err) => console.error('[RATE_LIMITER] Failed to write audit log:', err));
            console.warn(`[RATE_LIMITER] Admin ${adminId} exceeded rate limit for "${actionType}" ` +
                `(${entry.timestamps.length}/${config.maxActions} in ${config.windowMs}ms). ` +
                `Violation #${entry.violationCount} – cooldown ${escalatedCooldown}ms.`);
            return {
                allowed: false,
                retryAfterMs: escalatedCooldown,
                reason: `Rate limit exceeded for action "${actionType}": ` +
                    `${entry.timestamps.length} actions in ${config.windowMs / 1000}s window ` +
                    `(max ${config.maxActions}). ` +
                    `Cooldown ${Math.ceil(escalatedCooldown / 1000)}s applied ` +
                    `(violation #${entry.violationCount}).`,
            };
        }
        // --- Allowed path ---
        entry.timestamps.push(now);
        return { allowed: true };
    }
    /**
     * Assert that the admin is within rate limits. Throws if blocked.
     */
    static assertRateLimit(adminId, actionType) {
        const result = this.checkRateLimit(adminId, actionType);
        if (!result.allowed) {
            const error = new Error(result.reason ?? 'Rate limit exceeded');
            error.name = 'RateLimitExceededError';
            error.retryAfterMs = result.retryAfterMs;
            throw error;
        }
    }
    // -----------------------------------------------------------------------
    // Observability
    // -----------------------------------------------------------------------
    /**
     * Retrieve the current rate-limit status for every action type an admin
     * has interacted with.
     */
    static getRateLimitStatus(adminId) {
        const now = Date.now();
        const entries = {};
        for (const [key, entry] of globalRateLimitRegistry.__rateLimitActionLog.entries()) {
            if (!key.startsWith(`${adminId}:`))
                continue;
            const actionType = key.slice(adminId.length + 1);
            const config = this.getConfig(actionType);
            // Prune for an accurate snapshot
            this.pruneWindow(entry, config.windowMs);
            const cooldownActive = !!(entry.cooldownUntil && now < entry.cooldownUntil);
            entries[actionType] = {
                actionType,
                activeActions: entry.timestamps.length,
                maxActions: config.maxActions,
                windowMs: config.windowMs,
                violationCount: entry.violationCount,
                cooldownUntil: entry.cooldownUntil
                    ? new Date(entry.cooldownUntil).toISOString()
                    : null,
                isInCooldown: cooldownActive,
            };
        }
        return { adminId, entries };
    }
    // -----------------------------------------------------------------------
    // Administration
    // -----------------------------------------------------------------------
    /**
     * Reset rate-limit state for an admin.
     *
     * @param adminId   The admin whose limits should be reset.
     * @param actionType  Optional – reset only a specific action type.
     *                    If omitted, all action types for the admin are reset.
     *
     * NOTE: This is a SUPER_ADMIN-level operation. Callers are responsible
     * for enforcing role-based access before invoking this method.
     */
    static resetRateLimit(adminId, actionType) {
        const map = globalRateLimitRegistry.__rateLimitActionLog;
        if (actionType) {
            const key = this.buildKey(adminId, actionType);
            map.delete(key);
            console.log(`[RATE_LIMITER] Reset rate limit for admin ${adminId}, action "${actionType}".`);
        }
        else {
            const keysToDelete = [];
            for (const key of map.keys()) {
                if (key.startsWith(`${adminId}:`)) {
                    keysToDelete.push(key);
                }
            }
            keysToDelete.forEach((k) => map.delete(k));
            console.log(`[RATE_LIMITER] Reset ALL rate limits for admin ${adminId} ` +
                `(${keysToDelete.length} entries cleared).`);
        }
        // Audit the reset itself
        audit_log_1.AuditLogService.logAudit({
            entityType: 'system',
            entityId: adminId,
            actionType: 'RATE_LIMIT_RESET',
            previousState: 'COOLDOWN_OR_ACTIVE',
            newState: 'RESET',
            actor: 'admin',
            actorId: adminId,
            metadata: {
                resetScope: actionType ?? 'ALL',
            },
        }).catch((err) => console.error('[RATE_LIMITER] Failed to write audit log for reset:', err));
    }
    // -----------------------------------------------------------------------
    // Violation history
    // -----------------------------------------------------------------------
    /**
     * Return recent rate-limit violations across all admins.
     *
     * @param limit  Maximum number of records to return (default 50, newest first).
     */
    static getViolationHistory(limit = 50) {
        const history = globalRateLimitRegistry.__rateLimitViolationHistory;
        // Return newest first, capped at `limit`
        return history.slice(-limit).reverse();
    }
}
exports.AdminRateLimiter = AdminRateLimiter;
exports.default = AdminRateLimiter;
