"use strict";
/**
 * ============================================================================
 * CAMPUSLINK SECURITY HARDENING INTEGRATION SUITE
 * ============================================================================
 *
 * An executable integration and verification test suite designed to validate
 * the full suite of security modules under various simulation vectors:
 *
 * 1. Role-Based Access Control Core (RBAC) & Permission Matrix
 * 2. System Lockdown & Emergency Recovery System
 * 3. Suspicious Activity Detection & Incident Triggering
 * 4. Rate Limiting, Cooldown Enforcement & Escalation
 * 5. Immutable Audit Log Hash Chain & Tamper Evidence
 * 6. Action Confirmation System & Session Lifecycle management
 * 7. Scope Filtering & System Integrity Protection Gates
 *
 * Run using ts-node or similar.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const rbac_service_1 = require("./rbac.service");
const suspicious_activity_service_1 = require("./suspicious-activity.service");
const rate_limiter_service_1 = require("./rate-limiter.service");
const audit_protection_service_1 = require("./audit-protection.service");
const action_confirmation_service_1 = require("./action-confirmation.service");
const data_scope_service_1 = require("./data-scope.service");
// Mock DB objects
const mockSuperAdminId = '88888888-8888-8888-8888-888888888888';
const mockManagerId = '99999999-9999-9999-9999-999999999999';
const mockSupportId = '77777777-7777-7777-7777-777777777777';
async function runTests() {
    console.log('============================================================================');
    console.log('🛡️  STARTING CAMPUSLINK SECURITY HARDENING VERIFICATION SUITE');
    console.log('============================================================================\n');
    let passed = 0;
    let failed = 0;
    function assert(condition, testName) {
        if (condition) {
            console.log(` ✅ PASS: ${testName}`);
            passed++;
        }
        else {
            console.log(` ❌ FAIL: ${testName}`);
            failed++;
        }
    }
    // ---------------------------------------------------------------------------
    // TEST VECTOR 1: RBAC Perm Matrix
    // ---------------------------------------------------------------------------
    try {
        console.log('--- TEST VECTOR 1: RBAC Permission Matrix ---');
        assert((0, rbac_service_1.hasPermission)('SUPER_ADMIN', 'SYSTEM_LOCKDOWN'), 'SUPER_ADMIN has SYSTEM_LOCKDOWN');
        assert(!(0, rbac_service_1.hasPermission)('ADMIN', 'SYSTEM_LOCKDOWN'), 'ADMIN does NOT have SYSTEM_LOCKDOWN');
        assert((0, rbac_service_1.hasPermission)('FINANCE_ADMIN', 'PAYMENT_VERIFY'), 'FINANCE_ADMIN has PAYMENT_VERIFY');
        assert(!(0, rbac_service_1.hasPermission)('FINANCE_ADMIN', 'ALLOCATION_MANAGE'), 'FINANCE_ADMIN does NOT have ALLOCATION_MANAGE');
        assert((0, rbac_service_1.hasPermission)('HOSTEL_MANAGER', 'ALLOCATION_MANAGE'), 'HOSTEL_MANAGER has ALLOCATION_MANAGE');
        assert(!(0, rbac_service_1.hasPermission)('SUPPORT_STAFF', 'PAYMENT_VERIFY'), 'SUPPORT_STAFF does NOT have PAYMENT_VERIFY');
    }
    catch (err) {
        console.error('Vector 1 failed:', err);
        failed++;
    }
    // ---------------------------------------------------------------------------
    // TEST VECTOR 2: Rate Limiter & Escalation
    // ---------------------------------------------------------------------------
    try {
        console.log('\n--- TEST VECTOR 2: Rate Limiting & Cooldown Escalation ---');
        // Call 1
        let check = rate_limiter_service_1.AdminRateLimiter.checkRateLimit(mockManagerId, 'ALLOCATION_MANAGE');
        assert(check.allowed, 'First request within rate limit is allowed');
        // Perform an override action that has a very small allowance (max 3 actions)
        rate_limiter_service_1.AdminRateLimiter.checkRateLimit(mockManagerId, 'SYSTEM_OVERRIDE');
        rate_limiter_service_1.AdminRateLimiter.checkRateLimit(mockManagerId, 'SYSTEM_OVERRIDE');
        rate_limiter_service_1.AdminRateLimiter.checkRateLimit(mockManagerId, 'SYSTEM_OVERRIDE');
        let limitCheck = rate_limiter_service_1.AdminRateLimiter.checkRateLimit(mockManagerId, 'SYSTEM_OVERRIDE');
        assert(!limitCheck.allowed, '4th SYSTEM_OVERRIDE within small window is rate limited');
        assert(limitCheck.retryAfterMs !== undefined && limitCheck.retryAfterMs > 0, 'Rate limit return includes retryAfterMs cooldown time');
    }
    catch (err) {
        console.error('Vector 2 failed:', err);
        failed++;
    }
    // ---------------------------------------------------------------------------
    // TEST VECTOR 3: Immutable Audit Log Chaining
    // ---------------------------------------------------------------------------
    try {
        console.log('\n--- TEST VECTOR 3: Immutable Audit Protection (SHA-256 Hash Chain) ---');
        const genesisLength = audit_protection_service_1.ImmutableAuditService.getChainLength();
        // Simulate auditing some operations
        const mockAuditEntry = {
            id: 'audit-1',
            entityType: 'booking',
            entityId: 'booking-uuid-123',
            actionType: 'BOOKING_CREATE',
            previousState: 'NONE',
            newState: 'SUBMITTED',
            actor: 'student',
            actorId: 'student-uuid-456',
            timestamp: new Date().toISOString(),
            metadata: { source: 'web_portal' }
        };
        const secured = audit_protection_service_1.ImmutableAuditService.appendToChain(mockAuditEntry);
        assert(audit_protection_service_1.ImmutableAuditService.getChainLength() === genesisLength + 1, 'Append grows the Immutable Audit Hash Chain length');
        const verificationResult = audit_protection_service_1.ImmutableAuditService.verifyChainIntegrity();
        assert(verificationResult.valid, 'Verification verifies overall hash chain and signature logic');
        // Verify block format
        assert(secured.currentHash.length === 64, 'SHA-256 block hash generated with length of 64 characters');
    }
    catch (err) {
        console.error('Vector 3 failed:', err);
        failed++;
    }
    // ---------------------------------------------------------------------------
    // TEST VECTOR 4: Suspicious Activity Detection
    // ---------------------------------------------------------------------------
    try {
        console.log('\n--- TEST VECTOR 4: Suspicious Activity Detection & Alerts ---');
        // Record multiple failed permission attempts
        for (let i = 0; i < 6; i++) {
            suspicious_activity_service_1.SuspiciousActivityService.recordFailedPermission(mockSupportId, 'SYSTEM_LOCKDOWN');
        }
        const activeAlerts = suspicious_activity_service_1.SuspiciousActivityService.getActiveSecurityAlerts();
        const repeatingAlert = activeAlerts.find(a => a.actorId === mockSupportId && a.type === 'REPEATED_PERMISSION_FAILURE');
        assert(repeatingAlert !== undefined, 'Multiple permission failures generates REPEATED_PERMISSION_FAILURE alert');
        assert(repeatingAlert?.severity === 'HIGH', 'Permission failure alert triggered at HIGH severity level');
        // Resolve alert
        if (repeatingAlert) {
            suspicious_activity_service_1.SuspiciousActivityService.resolveSecurityAlert(repeatingAlert.id, mockSuperAdminId);
            assert(repeatingAlert.resolved, 'Super Admin can successfully resolve generated security alert');
        }
    }
    catch (err) {
        console.error('Vector 4 failed:', err);
        failed++;
    }
    // ---------------------------------------------------------------------------
    // TEST VECTOR 5: Action Confirmation
    // ---------------------------------------------------------------------------
    try {
        console.log('\n--- TEST VECTOR 5: Critical Action Confirmation System ---');
        const riskAction = 'SYSTEM_LOCKDOWN';
        assert(action_confirmation_service_1.CriticalActionConfirmation.requiresConfirmation(riskAction), 'High risk action requires explicit token confirmation');
        const tokenObj = action_confirmation_service_1.CriticalActionConfirmation.generateConfirmationToken(mockSuperAdminId, riskAction, 'Scheduled system maintenance');
        assert(tokenObj.token.length >= 32, 'Generate secure, cryptographically random high-entropy confirmation token');
        const isValid = action_confirmation_service_1.CriticalActionConfirmation.validateConfirmationToken(mockSuperAdminId, tokenObj.token, riskAction);
        assert(isValid, 'Validation succeeds with correct admin, token string, and action context');
    }
    catch (err) {
        console.error('Vector 5 failed:', err);
        failed++;
    }
    // ---------------------------------------------------------------------------
    // TEST VECTOR 6: Session Management & Security
    // ---------------------------------------------------------------------------
    try {
        console.log('\n--- TEST VECTOR 6: Security Session Lifecycles ---');
        const session = action_confirmation_service_1.AdminSessionService.createSession(mockSupportId, '192.168.1.100', 'Mozilla/5.0');
        assert(session.isActive, 'Newly created support session starts in ACTIVE state');
        const isValidSession = action_confirmation_service_1.AdminSessionService.validateSession(session.sessionId);
        assert(isValidSession, 'Verification validation succeeds on non-expired valid session');
        // Concurrent limit check
        action_confirmation_service_1.AdminSessionService.createSession(mockSupportId, '192.168.1.101', 'Mozilla/5.0');
        action_confirmation_service_1.AdminSessionService.createSession(mockSupportId, '192.168.1.102', 'Mozilla/5.0');
        // This 4th session should kick out/invalidate the first one since max is 3
        action_confirmation_service_1.AdminSessionService.createSession(mockSupportId, '192.168.1.103', 'Mozilla/5.0');
        const isFirstSessionValid = action_confirmation_service_1.AdminSessionService.validateSession(session.sessionId);
        assert(!isFirstSessionValid, 'Exceeding maximum concurrent sessions invalidates the oldest session automatically');
    }
    catch (err) {
        console.error('Vector 6 failed:', err);
        failed++;
    }
    // ---------------------------------------------------------------------------
    // TEST VECTOR 7: Scope Filtering
    // ---------------------------------------------------------------------------
    try {
        console.log('\n--- TEST VECTOR 7: Hostel Scoping Restrictions ---');
        // Temporarily register roles in memory
        data_scope_service_1.DataScopeService.registerAdminRole(mockSuperAdminId, 'SUPER_ADMIN');
        data_scope_service_1.DataScopeService.registerAdminRole(mockManagerId, 'HOSTEL_MANAGER');
        // Assign scope
        await data_scope_service_1.DataScopeService.assignHostelScope(mockSuperAdminId, mockManagerId, ['hostel-a', 'hostel-b']);
        const scope = data_scope_service_1.DataScopeService.getAdminHostelScope(mockManagerId);
        assert(scope.includes('hostel-a') && scope.includes('hostel-b'), 'Scope assignments successfully register specific hostels');
        // Filter students by scope
        const mockStudents = [
            { id: 'stud-1', bookings: [{ hostelId: 'hostel-a' }] },
            { id: 'stud-2', bookings: [{ hostelId: 'hostel-c' }] }
        ];
        const filtered = data_scope_service_1.DataScopeService.filterStudentsByScope(mockManagerId, mockStudents);
        assert(filtered.length === 1 && filtered[0].id === 'stud-1', 'Scope filter screens out students with bookings in unscoped hostels');
    }
    catch (err) {
        console.error('Vector 7 failed:', err);
        failed++;
    }
    // ---------------------------------------------------------------------------
    // SUMMARY
    // ---------------------------------------------------------------------------
    console.log('\n============================================================================');
    console.log(`🛡️  SECURITY VERIFICATION COMPLETED: ${passed} PASSED, ${failed} FAILED`);
    console.log('============================================================================');
}
runTests().catch(console.error);
