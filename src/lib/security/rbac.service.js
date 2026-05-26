"use strict";
/**
 * @fileoverview RBAC (Role-Based Access Control) Service for CampusLink
 *
 * Provides fine-grained permission control layered on top of the existing
 * admin/student role system. The Prisma schema defines a base `Role` enum
 * (student | admin). This module extends admin users with granular sub-roles
 * (SUPER_ADMIN, ADMIN, FINANCE_ADMIN, HOSTEL_MANAGER, SUPPORT_STAFF) and
 * maps each to a set of permissions via a static permission matrix.
 *
 * Role assignments are stored in an in-memory globalThis registry, consistent
 * with the patterns used by AuditLogService, SystemHealthMonitor, and JobQueue.
 *
 * @module security/rbac
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RBACError = exports.PERMISSION_MATRIX = exports.Permission = exports.AdminRole = void 0;
exports.hasPermission = hasPermission;
exports.getPermissionsForRole = getPermissionsForRole;
exports.getUserRole = getUserRole;
exports.validatePermission = validatePermission;
exports.assignRole = assignRole;
exports.getAllRoleAssignments = getAllRoleAssignments;
exports.revokeRole = revokeRole;
exports.userHasPermission = userHasPermission;
exports.seedSuperAdmin = seedSuperAdmin;
const db_1 = require("../db");
const audit_log_1 = require("../audit/audit-log");
// ============================================================================
// 1. ADMIN ROLES
// ============================================================================
/**
 * Fine-grained admin roles for CampusLink.
 * These extend the base Prisma `Role.admin` with scoped responsibilities.
 */
exports.AdminRole = {
    /** Full system control — can lock down the platform, assign roles, and override everything. */
    SUPER_ADMIN: 'SUPER_ADMIN',
    /** Day-to-day administrative operations — everything except platform lockdown. */
    ADMIN: 'ADMIN',
    /** Financial operations scope — payment verification, rejection, and financial dashboards. */
    FINANCE_ADMIN: 'FINANCE_ADMIN',
    /** Hostel-specific operations — room allocation, hostel management, and queue control. */
    HOSTEL_MANAGER: 'HOSTEL_MANAGER',
    /** Read-only support role — student lookup, dashboard viewing, and audit trail access. */
    SUPPORT_STAFF: 'SUPPORT_STAFF',
};
// ============================================================================
// 2. PERMISSIONS
// ============================================================================
/**
 * Atomic permission actions that can be checked against the permission matrix.
 * Each permission maps to a discrete capability within the CampusLink platform.
 */
exports.Permission = {
    /** Read student records, profiles, and booking history. */
    STUDENT_READ: 'STUDENT_READ',
    /** Modify student records — block, unblock, reset bookings. */
    STUDENT_WRITE: 'STUDENT_WRITE',
    /** Verify pending payment proofs. */
    PAYMENT_VERIFY: 'PAYMENT_VERIFY',
    /** Reject pending payment proofs. */
    PAYMENT_REJECT: 'PAYMENT_REJECT',
    /** Manage room allocations — assign, reassign, revoke. */
    ALLOCATION_MANAGE: 'ALLOCATION_MANAGE',
    /** Manage hostels — create, update, enable/disable. */
    HOSTEL_MANAGE: 'HOSTEL_MANAGE',
    /** Override system constraints — force state transitions, bypass guards. */
    SYSTEM_OVERRIDE: 'SYSTEM_OVERRIDE',
    /** Manage allocation and job queues — prioritize, reorder, flush. */
    QUEUE_MANAGE: 'QUEUE_MANAGE',
    /** Read audit logs and compliance trails. */
    AUDIT_READ: 'AUDIT_READ',
    /** Access admin dashboards and analytics views. */
    DASHBOARD_VIEW: 'DASHBOARD_VIEW',
    /** Manage system alerts — create, resolve, escalate. */
    ALERT_MANAGE: 'ALERT_MANAGE',
    /** Initiate platform-wide lockdown (booking freeze, maintenance mode). */
    SYSTEM_LOCKDOWN: 'SYSTEM_LOCKDOWN',
    /** Execute bulk operations — mass allocations, batch status changes. */
    BULK_OPERATIONS: 'BULK_OPERATIONS',
    /** Manage admin sessions — force logout, session invalidation. */
    SESSION_MANAGE: 'SESSION_MANAGE',
};
/** All defined permissions as an immutable array. */
const ALL_PERMISSIONS = Object.values(exports.Permission);
// ============================================================================
// 3. PERMISSION MATRIX
// ============================================================================
/**
 * Static permission matrix mapping each admin role to its allowed permissions.
 * This is the single source of truth for access control decisions.
 *
 * Design rationale:
 * - SUPER_ADMIN gets every permission (platform owner / CTO level).
 * - ADMIN gets everything except SYSTEM_LOCKDOWN to prevent accidental platform freezes.
 * - FINANCE_ADMIN is scoped strictly to financial operations + read-only student data.
 * - HOSTEL_MANAGER is scoped to physical hostel operations + allocation queues.
 * - SUPPORT_STAFF is the most restrictive — read-only access for helpdesk triage.
 */
exports.PERMISSION_MATRIX = {
    [exports.AdminRole.SUPER_ADMIN]: ALL_PERMISSIONS,
    [exports.AdminRole.ADMIN]: ALL_PERMISSIONS.filter((p) => p !== exports.Permission.SYSTEM_LOCKDOWN),
    [exports.AdminRole.FINANCE_ADMIN]: [
        exports.Permission.STUDENT_READ,
        exports.Permission.PAYMENT_VERIFY,
        exports.Permission.PAYMENT_REJECT,
        exports.Permission.DASHBOARD_VIEW,
        exports.Permission.AUDIT_READ,
    ],
    [exports.AdminRole.HOSTEL_MANAGER]: [
        exports.Permission.STUDENT_READ,
        exports.Permission.ALLOCATION_MANAGE,
        exports.Permission.HOSTEL_MANAGE,
        exports.Permission.DASHBOARD_VIEW,
        exports.Permission.QUEUE_MANAGE,
    ],
    [exports.AdminRole.SUPPORT_STAFF]: [
        exports.Permission.STUDENT_READ,
        exports.Permission.DASHBOARD_VIEW,
        exports.Permission.AUDIT_READ,
    ],
};
const globalRbacRegistry = globalThis;
if (!globalRbacRegistry.__rbac_role_assignments) {
    globalRbacRegistry.__rbac_role_assignments = new Map();
}
if (!globalRbacRegistry.__rbac_initialized) {
    globalRbacRegistry.__rbac_initialized = true;
}
// ============================================================================
// 4. CORE RBAC FUNCTIONS
// ============================================================================
/**
 * Pure utility check: does a given role include a specific permission?
 *
 * This is a synchronous, side-effect-free function suitable for use in
 * middleware, guards, and UI-layer permission gating.
 *
 * @param role - The admin role to check.
 * @param permission - The permission to verify.
 * @returns `true` if the role includes the permission, `false` otherwise.
 *
 * @example
 * ```ts
 * if (hasPermission('FINANCE_ADMIN', 'PAYMENT_VERIFY')) {
 *   // render verify button
 * }
 * ```
 */
function hasPermission(role, permission) {
    const allowedPermissions = exports.PERMISSION_MATRIX[role];
    if (!allowedPermissions) {
        return false;
    }
    return allowedPermissions.includes(permission);
}
/**
 * Get all permissions granted to a specific role.
 *
 * @param role - The admin role to query.
 * @returns Read-only array of permissions, or empty array for unknown roles.
 */
function getPermissionsForRole(role) {
    return exports.PERMISSION_MATRIX[role] ?? [];
}
/**
 * Fetch and determine the fine-grained admin role for a user.
 *
 * Resolution order:
 * 1. Check the in-memory role assignment registry.
 * 2. If the user has the base Prisma `admin` role but no assignment, default to ADMIN.
 * 3. If the user is not an admin at all, return `null`.
 *
 * @param userId - The UUID of the user.
 * @returns The resolved AdminRole, or `null` if the user is not an admin.
 * @throws Error if the user does not exist in the database.
 */
async function getUserRole(userId) {
    const user = await db_1.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, status: true },
    });
    if (!user) {
        throw new RBACError(`RBAC lookup failed: User ${userId} does not exist.`, 'USER_NOT_FOUND', userId);
    }
    // Non-admin users have no admin role
    if (user.role !== 'admin') {
        return null;
    }
    // Check in-memory registry for fine-grained assignment
    const assignment = globalRbacRegistry.__rbac_role_assignments.get(userId);
    if (assignment) {
        return assignment.role;
    }
    // Default: base admin users without explicit assignment get ADMIN role
    return exports.AdminRole.ADMIN;
}
/**
 * Validate that a user has a specific permission to perform an action.
 *
 * This is the primary access gate for all protected operations. It performs
 * a full validation chain:
 * 1. Verify the user exists in the database.
 * 2. Verify the user has an active account (status = ACTIVE).
 * 3. Verify the user is an admin (role = admin).
 * 4. Resolve their fine-grained AdminRole.
 * 5. Check the permission matrix.
 * 6. On denial: audit-log the attempt and throw.
 * 7. On success: return the user object for downstream use.
 *
 * @param userId - The UUID of the user attempting the action.
 * @param requiredPermission - The permission required for the action.
 * @returns The validated user record from the database.
 * @throws {RBACError} With a descriptive code if any check fails.
 *
 * @example
 * ```ts
 * const admin = await validatePermission(adminId, 'PAYMENT_VERIFY');
 * // proceed with payment verification...
 * ```
 */
async function validatePermission(userId, requiredPermission) {
    // Step 1: Fetch user from database
    const user = await db_1.prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
    });
    // Step 2: User existence check
    if (!user) {
        await auditDeniedAccess(userId, requiredPermission, 'USER_NOT_FOUND');
        throw new RBACError(`Access Denied: User ${userId} does not exist.`, 'USER_NOT_FOUND', userId);
    }
    // Step 3: Account status check
    if (user.status !== 'ACTIVE') {
        await auditDeniedAccess(userId, requiredPermission, 'ACCOUNT_INACTIVE', {
            currentStatus: user.status,
            email: user.email,
        });
        throw new RBACError(`Access Denied: Account ${userId} is ${user.status}. Only ACTIVE accounts can perform actions.`, 'ACCOUNT_INACTIVE', userId);
    }
    // Step 4: Base admin role check
    if (user.role !== 'admin') {
        await auditDeniedAccess(userId, requiredPermission, 'INSUFFICIENT_ROLE', {
            currentRole: user.role,
            email: user.email,
        });
        throw new RBACError(`Access Denied: User ${userId} has role '${user.role}'. Admin role required.`, 'INSUFFICIENT_ROLE', userId);
    }
    // Step 5: Resolve fine-grained admin role
    const adminRole = await getUserRole(userId);
    // Defensive: should not happen if user.role === 'admin', but guard anyway
    if (!adminRole) {
        await auditDeniedAccess(userId, requiredPermission, 'ROLE_RESOLUTION_FAILED', {
            email: user.email,
        });
        throw new RBACError(`Access Denied: Unable to resolve admin role for user ${userId}.`, 'ROLE_RESOLUTION_FAILED', userId);
    }
    // Step 6: Permission matrix check
    if (!hasPermission(adminRole, requiredPermission)) {
        await auditDeniedAccess(userId, requiredPermission, 'PERMISSION_DENIED', {
            adminRole,
            requiredPermission,
            email: user.email,
            grantedPermissions: getPermissionsForRole(adminRole),
        });
        throw new RBACError(`Access Denied: Role '${adminRole}' does not include permission '${requiredPermission}'.`, 'PERMISSION_DENIED', userId);
    }
    // Step 7: Success — return validated user
    return {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        status: user.status,
        adminRole,
        gender: user.gender,
        studentId: user.studentId,
    };
}
// ============================================================================
// 5. ROLE ASSIGNMENT
// ============================================================================
/**
 * Assign or update a fine-grained admin role for a target user.
 *
 * Security constraints:
 * - Only users with the SUPER_ADMIN role can assign roles.
 * - The target user must exist and have the base `admin` role in Prisma.
 * - Self-demotion from SUPER_ADMIN is blocked to prevent lockout.
 * - Every assignment is audit-logged with full before/after state.
 *
 * @param adminId - The UUID of the admin performing the assignment (must be SUPER_ADMIN).
 * @param targetUserId - The UUID of the user receiving the new role.
 * @param newRole - The AdminRole to assign.
 * @returns The created or updated RoleAssignment record.
 * @throws {RBACError} If authorization checks fail.
 *
 * @example
 * ```ts
 * await assignRole(superAdminId, financeUserId, AdminRole.FINANCE_ADMIN);
 * ```
 */
async function assignRole(adminId, targetUserId, newRole) {
    // Validate the requesting admin has SUPER_ADMIN privileges
    const requestingAdmin = await validatePermission(adminId, exports.Permission.SYSTEM_LOCKDOWN);
    if (requestingAdmin.adminRole !== exports.AdminRole.SUPER_ADMIN) {
        await auditDeniedAccess(adminId, 'ROLE_ASSIGNMENT', 'PERMISSION_DENIED', {
            reason: 'Only SUPER_ADMIN can assign roles',
            targetUserId,
            requestedRole: newRole,
        });
        throw new RBACError(`Access Denied: Only SUPER_ADMIN users can assign roles. Current role: ${requestingAdmin.adminRole}.`, 'PERMISSION_DENIED', adminId);
    }
    // Validate the target user
    const targetUser = await db_1.prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, role: true, status: true, email: true, fullName: true },
    });
    if (!targetUser) {
        throw new RBACError(`Role assignment failed: Target user ${targetUserId} does not exist.`, 'USER_NOT_FOUND', targetUserId);
    }
    if (targetUser.role !== 'admin') {
        throw new RBACError(`Role assignment failed: Target user ${targetUserId} must have base 'admin' role. Current: '${targetUser.role}'.`, 'INSUFFICIENT_ROLE', targetUserId);
    }
    // Prevent SUPER_ADMIN self-demotion (lockout protection)
    if (adminId === targetUserId && newRole !== exports.AdminRole.SUPER_ADMIN) {
        throw new RBACError(`Role assignment failed: SUPER_ADMIN cannot demote themselves. This prevents platform lockout.`, 'SELF_DEMOTION_BLOCKED', adminId);
    }
    // Determine previous role for audit trail
    const previousAssignment = globalRbacRegistry.__rbac_role_assignments.get(targetUserId);
    const previousRole = previousAssignment?.role ?? exports.AdminRole.ADMIN;
    // Create the assignment
    const assignment = {
        userId: targetUserId,
        role: newRole,
        assignedBy: adminId,
        assignedAt: new Date().toISOString(),
    };
    globalRbacRegistry.__rbac_role_assignments.set(targetUserId, assignment);
    // Audit log the role change
    await audit_log_1.AuditLogService.logAudit({
        entityType: 'system',
        entityId: targetUserId,
        actionType: 'RBAC_ROLE_ASSIGNED',
        previousState: previousRole,
        newState: newRole,
        actor: 'admin',
        actorId: adminId,
        metadata: {
            targetEmail: targetUser.email,
            targetName: targetUser.fullName,
            previousRole,
            newRole,
            assignedAt: assignment.assignedAt,
        },
    });
    console.log(`[RBAC] Role assigned: ${targetUser.email} (${targetUserId}) -> ${newRole} by ${adminId}`);
    return assignment;
}
// ============================================================================
// 6. QUERY & INTROSPECTION HELPERS
// ============================================================================
/**
 * List all current role assignments in the system.
 * Useful for admin dashboards and compliance audits.
 *
 * @returns Array of all active role assignments.
 */
function getAllRoleAssignments() {
    return Array.from(globalRbacRegistry.__rbac_role_assignments.values());
}
/**
 * Remove a role assignment, reverting the user to the default ADMIN role.
 * Only SUPER_ADMIN can perform this operation.
 *
 * @param adminId - The UUID of the admin performing the revocation (must be SUPER_ADMIN).
 * @param targetUserId - The UUID of the user whose role assignment is being removed.
 * @returns `true` if a role was removed, `false` if no assignment existed.
 */
async function revokeRole(adminId, targetUserId) {
    // Verify caller is SUPER_ADMIN
    const requestingAdmin = await validatePermission(adminId, exports.Permission.SYSTEM_LOCKDOWN);
    if (requestingAdmin.adminRole !== exports.AdminRole.SUPER_ADMIN) {
        throw new RBACError(`Access Denied: Only SUPER_ADMIN users can revoke roles.`, 'PERMISSION_DENIED', adminId);
    }
    // Prevent self-revocation
    if (adminId === targetUserId) {
        throw new RBACError(`Role revocation failed: SUPER_ADMIN cannot revoke their own role.`, 'SELF_DEMOTION_BLOCKED', adminId);
    }
    const previousAssignment = globalRbacRegistry.__rbac_role_assignments.get(targetUserId);
    const removed = globalRbacRegistry.__rbac_role_assignments.delete(targetUserId);
    if (removed && previousAssignment) {
        await audit_log_1.AuditLogService.logAudit({
            entityType: 'system',
            entityId: targetUserId,
            actionType: 'RBAC_ROLE_REVOKED',
            previousState: previousAssignment.role,
            newState: exports.AdminRole.ADMIN,
            actor: 'admin',
            actorId: adminId,
            metadata: {
                previousRole: previousAssignment.role,
                revertedTo: exports.AdminRole.ADMIN,
                reason: 'Manual revocation by SUPER_ADMIN',
            },
        });
        console.log(`[RBAC] Role revoked: ${targetUserId} reverted from ${previousAssignment.role} to ${exports.AdminRole.ADMIN} by ${adminId}`);
    }
    return removed;
}
/**
 * Check if a specific user has a specific permission, without throwing.
 * Combines user lookup + role resolution + matrix check in a single call.
 *
 * @param userId - The UUID of the user to check.
 * @param permission - The permission to check for.
 * @returns `true` if the user has the permission, `false` otherwise.
 */
async function userHasPermission(userId, permission) {
    try {
        const role = await getUserRole(userId);
        if (!role)
            return false;
        return hasPermission(role, permission);
    }
    catch {
        return false;
    }
}
/**
 * Seed an initial SUPER_ADMIN role. This is intended to be called once
 * during system bootstrap or first-run setup. It bypasses the normal
 * SUPER_ADMIN-only restriction since no SUPER_ADMIN may exist yet.
 *
 * @param userId - The UUID of the user to designate as the initial SUPER_ADMIN.
 * @returns The created RoleAssignment.
 * @throws {RBACError} If a SUPER_ADMIN already exists, or the user is not an admin.
 */
async function seedSuperAdmin(userId) {
    // Check that no SUPER_ADMIN already exists
    const existingSuperAdmins = Array.from(globalRbacRegistry.__rbac_role_assignments.values()).filter((a) => a.role === exports.AdminRole.SUPER_ADMIN);
    if (existingSuperAdmins.length > 0) {
        throw new RBACError(`SUPER_ADMIN seed failed: A SUPER_ADMIN already exists (${existingSuperAdmins[0].userId}). Use assignRole() instead.`, 'SEED_CONFLICT', userId);
    }
    // Validate the user is a base admin
    const user = await db_1.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, email: true, fullName: true },
    });
    if (!user) {
        throw new RBACError(`SUPER_ADMIN seed failed: User ${userId} does not exist.`, 'USER_NOT_FOUND', userId);
    }
    if (user.role !== 'admin') {
        throw new RBACError(`SUPER_ADMIN seed failed: User ${userId} must have base 'admin' role. Current: '${user.role}'.`, 'INSUFFICIENT_ROLE', userId);
    }
    const assignment = {
        userId,
        role: exports.AdminRole.SUPER_ADMIN,
        assignedBy: 'SYSTEM_BOOTSTRAP',
        assignedAt: new Date().toISOString(),
    };
    globalRbacRegistry.__rbac_role_assignments.set(userId, assignment);
    await audit_log_1.AuditLogService.logAudit({
        entityType: 'system',
        entityId: userId,
        actionType: 'RBAC_SUPER_ADMIN_SEEDED',
        previousState: 'NONE',
        newState: exports.AdminRole.SUPER_ADMIN,
        actor: 'system',
        metadata: {
            email: user.email,
            fullName: user.fullName,
            reason: 'Initial system bootstrap — first SUPER_ADMIN seeded',
        },
    });
    console.log(`[RBAC] SUPER_ADMIN seeded: ${user.email} (${userId})`);
    return assignment;
}
/**
 * Structured RBAC error with machine-readable error codes for
 * consistent error handling in API routes and middleware.
 */
class RBACError extends Error {
    /** Machine-readable error code for programmatic handling. */
    code;
    /** The user ID that triggered the error. */
    userId;
    constructor(message, code, userId) {
        super(message);
        this.name = 'RBACError';
        this.code = code;
        this.userId = userId;
        // Maintain proper prototype chain for instanceof checks
        Object.setPrototypeOf(this, RBACError.prototype);
    }
}
exports.RBACError = RBACError;
// ============================================================================
// 8. INTERNAL HELPERS
// ============================================================================
/**
 * Log a denied access attempt to the audit trail.
 * This is an internal helper — every denial is recorded for compliance.
 */
async function auditDeniedAccess(userId, attemptedAction, reason, metadata) {
    try {
        await audit_log_1.AuditLogService.logAudit({
            entityType: 'system',
            entityId: userId,
            actionType: 'RBAC_ACCESS_DENIED',
            previousState: 'ATTEMPTED',
            newState: 'DENIED',
            actor: 'system',
            actorId: userId,
            metadata: {
                attemptedAction,
                denialReason: reason,
                ...metadata,
            },
        });
    }
    catch (auditError) {
        // Audit logging must never block the denial flow
        console.error('[RBAC] Failed to write denial audit log:', auditError);
    }
}
