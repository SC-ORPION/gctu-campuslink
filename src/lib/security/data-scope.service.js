"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemIntegrityProtection = exports.DataScopeService = void 0;
const db_1 = require("../db");
const audit_log_1 = require("../audit/audit-log");
// ---------------------------------------------------------------------------
// Global In-Memory Registry  (mirrors audit-log.ts / system-health.ts pattern)
// ---------------------------------------------------------------------------
const globalScopeRegistry = globalThis;
if (!globalScopeRegistry.hostelAssignments) {
    globalScopeRegistry.hostelAssignments = [];
}
if (!globalScopeRegistry.adminRoles) {
    globalScopeRegistry.adminRoles = {};
}
// ═══════════════════════════════════════════════════════════════════════════
//  PART 1 – DataScopeService
// ═══════════════════════════════════════════════════════════════════════════
class DataScopeService {
    // -----------------------------------------------------------------------
    // Role helpers  (allow other modules to register / query admin roles
    //                without a separate persistence layer)
    // -----------------------------------------------------------------------
    /**
     * Register an admin's role in the in-memory registry.
     * Must be called during login / session bootstrap so that scope checks
     * can resolve roles without hitting the DB on every request.
     */
    static registerAdminRole(adminId, role) {
        globalScopeRegistry.adminRoles[adminId] = role;
    }
    /**
     * Resolve the role for a given admin.  Falls back to 'SUPPORT_STAFF'
     * (least-privilege) when the admin has not been registered.
     */
    static getAdminRole(adminId) {
        return globalScopeRegistry.adminRoles[adminId] ?? 'SUPPORT_STAFF';
    }
    // -----------------------------------------------------------------------
    // 1. Hostel Assignment Tracking
    // -----------------------------------------------------------------------
    /**
     * Return all current hostel assignments from the in-memory store.
     */
    static getAssignments() {
        return globalScopeRegistry.hostelAssignments;
    }
    // -----------------------------------------------------------------------
    // 2. assignHostelScope
    // -----------------------------------------------------------------------
    /**
     * Assign a set of hostel IDs to a target admin's management scope.
     *
     * **Authorization**: Only a SUPER_ADMIN may invoke this operation.
     * Duplicate assignments for the same admin are replaced (last-write-wins).
     */
    static async assignHostelScope(superAdminId, targetAdminId, hostelIds) {
        // Gate: caller must be SUPER_ADMIN
        const callerRole = this.getAdminRole(superAdminId);
        if (callerRole !== 'SUPER_ADMIN') {
            throw new Error(`Access Denied: Only SUPER_ADMIN can assign hostel scopes. ` +
                `Caller ${superAdminId} has role ${callerRole}.`);
        }
        if (!hostelIds || hostelIds.length === 0) {
            throw new Error('Validation Error: At least one hostel ID must be provided.');
        }
        // Upsert: remove any previous assignment for this target
        globalScopeRegistry.hostelAssignments =
            globalScopeRegistry.hostelAssignments.filter((a) => a.adminId !== targetAdminId);
        const assignment = {
            adminId: targetAdminId,
            hostelIds,
            assignedAt: new Date().toISOString(),
            assignedBy: superAdminId,
        };
        globalScopeRegistry.hostelAssignments.push(assignment);
        // Audit trail
        await audit_log_1.AuditLogService.logAudit({
            entityType: 'system',
            entityId: targetAdminId,
            actionType: 'ASSIGN_HOSTEL_SCOPE',
            previousState: 'UNSCOPED',
            newState: `SCOPED:${hostelIds.join(',')}`,
            actor: 'admin',
            actorId: superAdminId,
            metadata: { targetAdminId, hostelIds },
        });
        return assignment;
    }
    // -----------------------------------------------------------------------
    // 3. getAdminHostelScope
    // -----------------------------------------------------------------------
    /**
     * Retrieve the list of hostel IDs the specified admin is allowed to manage.
     *
     * Returns:
     *  - `[]` (empty array) → no restriction, admin sees ALL hostels.
     *    Applies to SUPER_ADMIN, ADMIN, FINANCE_ADMIN, SUPPORT_STAFF.
     *  - `string[]` → explicit hostel scope for HOSTEL_MANAGER.
     */
    static getAdminHostelScope(adminId) {
        const role = this.getAdminRole(adminId);
        // Unrestricted roles
        if (role === 'SUPER_ADMIN' ||
            role === 'ADMIN' ||
            role === 'FINANCE_ADMIN' ||
            role === 'SUPPORT_STAFF') {
            return []; // empty = no restriction
        }
        // HOSTEL_MANAGER – look up assigned hostels
        const assignment = globalScopeRegistry.hostelAssignments.find((a) => a.adminId === adminId);
        return assignment?.hostelIds ?? [];
    }
    // -----------------------------------------------------------------------
    // 4. filterStudentsByScope
    // -----------------------------------------------------------------------
    /**
     * Given a raw list of students (with nested bookings), return only those
     * whose bookings reference hostels within the admin's scope.
     *
     * If the admin is unrestricted (empty scope), ALL students are returned.
     *
     * Expected student shape:
     * ```
     * { id, bookings: [{ hostelId }] }
     * ```
     */
    static filterStudentsByScope(adminId, students) {
        const scope = this.getAdminHostelScope(adminId);
        // No restriction – pass through
        if (scope.length === 0) {
            return students;
        }
        const scopeSet = new Set(scope);
        return students.filter((student) => {
            // A student is visible if at least one booking is in a scoped hostel
            const bookings = student.bookings ?? [];
            return bookings.some((b) => scopeSet.has(b.hostelId));
        });
    }
    // -----------------------------------------------------------------------
    // 5. filterPaymentsByScope
    // -----------------------------------------------------------------------
    /**
     * Filter a list of payments to only those linked to bookings within the
     * admin's hostel scope.
     *
     * Expected payment shape:
     * ```
     * { id, booking: { hostelId } }
     * ```
     */
    static filterPaymentsByScope(adminId, payments) {
        const scope = this.getAdminHostelScope(adminId);
        if (scope.length === 0) {
            return payments;
        }
        const scopeSet = new Set(scope);
        return payments.filter((payment) => {
            const hostelId = payment.booking?.hostelId;
            return hostelId !== undefined && scopeSet.has(hostelId);
        });
    }
    // -----------------------------------------------------------------------
    // 6. assertHostelAccess
    // -----------------------------------------------------------------------
    /**
     * Throw if the admin does **not** have management access to the given hostel.
     * No-op for unrestricted roles.
     */
    static assertHostelAccess(adminId, hostelId) {
        const scope = this.getAdminHostelScope(adminId);
        // Empty scope = unrestricted
        if (scope.length === 0) {
            return;
        }
        if (!scope.includes(hostelId)) {
            throw new Error(`Access Denied: Admin ${adminId} does not have management access to hostel ${hostelId}. ` +
                `Allowed hostels: [${scope.join(', ')}].`);
        }
    }
}
exports.DataScopeService = DataScopeService;
// ═══════════════════════════════════════════════════════════════════════════
//  PART 2 – SystemIntegrityProtection
// ═══════════════════════════════════════════════════════════════════════════
class SystemIntegrityProtection {
    // -----------------------------------------------------------------------
    // 1. preventActiveAllocationDeletion
    // -----------------------------------------------------------------------
    /**
     * Guard against deleting an allocation that is still active (not revoked).
     * Forces the caller to revoke before deletion to maintain audit continuity.
     */
    static async preventActiveAllocationDeletion(allocationId) {
        const allocation = await db_1.prisma.allocation.findUnique({
            where: { id: allocationId },
            select: { id: true, revokedAt: true },
        });
        if (!allocation) {
            throw new Error(`Integrity Error: Allocation ${allocationId} does not exist.`);
        }
        if (allocation.revokedAt === null) {
            throw new Error('Cannot delete active allocation. Must revoke first.');
        }
    }
    // -----------------------------------------------------------------------
    // 2. preventVerifiedPaymentModification
    // -----------------------------------------------------------------------
    /**
     * Guard against modifying a payment that has already been verified,
     * unless the caller holds explicit override permission.
     */
    static async preventVerifiedPaymentModification(paymentId, hasOverridePermission) {
        const payment = await db_1.prisma.payment.findUnique({
            where: { id: paymentId },
            select: { id: true, status: true },
        });
        if (!payment) {
            throw new Error(`Integrity Error: Payment ${paymentId} does not exist.`);
        }
        if (payment.status === 'VERIFIED' && !hasOverridePermission) {
            throw new Error(`Integrity Error: Payment ${paymentId} has already been VERIFIED. ` +
                'Modification requires explicit override permission (SYSTEM_OVERRIDE scope).');
        }
    }
    // -----------------------------------------------------------------------
    // 3. validateStateTransitionIntegrity
    // -----------------------------------------------------------------------
    /**
     * Validate that a state transition is legal according to the supplied
     * transition map.
     *
     * @param currentState  The entity's current state.
     * @param targetState   The desired next state.
     * @param validTransitions  A map of `{ [state]: allowedNextStates[] }`.
     *
     * @throws If the transition is not listed as valid.
     */
    static validateStateTransitionIntegrity(currentState, targetState, validTransitions) {
        const allowedTargets = validTransitions[currentState];
        if (!allowedTargets) {
            throw new Error(`Invalid State Transition: Current state "${currentState}" is not recognised ` +
                `in the transition map. Valid source states: [${Object.keys(validTransitions).join(', ')}].`);
        }
        if (!allowedTargets.includes(targetState)) {
            throw new Error(`Invalid State Transition: Cannot move from "${currentState}" to "${targetState}". ` +
                `Allowed transitions from "${currentState}": [${allowedTargets.join(', ')}].`);
        }
    }
    // -----------------------------------------------------------------------
    // 4. preventDirectDbMutation
    // -----------------------------------------------------------------------
    /**
     * Self-documenting guard that services can call to flag an operation as one
     * that **should** go through the service layer rather than issuing raw
     * Prisma mutations.
     *
     * Does NOT throw – logs a warning so that developers / monitoring pipelines
     * can spot policy violations without breaking runtime behaviour.
     */
    static preventDirectDbMutation(operation) {
        const timestamp = new Date().toISOString();
        console.warn(`[INTEGRITY_WARNING] [${timestamp}] Direct DB mutation detected: "${operation}". ` +
            'All data mutations should route through the service layer to ensure audit logging, ' +
            'state machine validation, and scope enforcement.');
    }
    // -----------------------------------------------------------------------
    // 5. validateEntityExists
    // -----------------------------------------------------------------------
    /**
     * Generic existence check for any Prisma-managed entity.
     *
     * Supported entity types map directly to Prisma model delegates:
     * `user`, `booking`, `payment`, `allocation`, `hostel`, `room`, `building`.
     *
     * @throws If the entity is not found.
     */
    static async validateEntityExists(entityType, entityId) {
        const modelMap = {
            user: 'user',
            booking: 'booking',
            payment: 'payment',
            allocation: 'allocation',
            hostel: 'hostel',
            room: 'room',
            building: 'building',
        };
        const modelKey = modelMap[entityType.toLowerCase()];
        if (!modelKey) {
            throw new Error(`Integrity Error: Unknown entity type "${entityType}". ` +
                `Supported types: [${Object.keys(modelMap).join(', ')}].`);
        }
        // Use dynamic delegate access – Prisma delegates all expose `findUnique`
        const delegate = db_1.prisma[modelKey];
        const record = await delegate.findUnique({
            where: { id: entityId },
            select: { id: true },
        });
        if (!record) {
            throw new Error(`Entity Not Found: ${entityType} with ID "${entityId}" does not exist.`);
        }
    }
}
exports.SystemIntegrityProtection = SystemIntegrityProtection;
// ---------------------------------------------------------------------------
// Default exports for convenience
// ---------------------------------------------------------------------------
exports.default = DataScopeService;
