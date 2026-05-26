"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrityChecker = void 0;
const db_1 = require("../db");
const audit_log_1 = require("../audit/audit-log");
class IntegrityChecker {
    /**
     * Periodically check for any data inconsistencies in production.
     */
    static async runIntegrityCheck() {
        const issues = [];
        // Fetch all bookings
        const bookings = await db_1.prisma.booking.findMany({
            include: {
                student: true,
                hostel: true,
                payments: true,
                allocations: true,
            },
        });
        // Fetch all rooms
        const rooms = await db_1.prisma.room.findMany({
            include: {
                allocations: { where: { revokedAt: null } },
            },
        });
        // 1. Orphan Bookings & Missing Allocations & Payment Mismatch Check
        for (const booking of bookings) {
            // Orphan check
            if (!booking.student) {
                issues.push({
                    type: 'ORPHAN_BOOKING',
                    severity: 'CRITICAL',
                    description: `Booking ${booking.id} references non-existent student user ID ${booking.studentId}`,
                    affectedEntityId: booking.id,
                });
                continue;
            }
            if (!booking.hostel) {
                issues.push({
                    type: 'ORPHAN_BOOKING',
                    severity: 'CRITICAL',
                    description: `Booking ${booking.id} references non-existent hostel ID ${booking.hostelId}`,
                    affectedEntityId: booking.id,
                });
            }
            const activeAllocations = booking.allocations.filter((a) => a.revokedAt === null);
            // Missing allocations for verified/confirmed state
            if (booking.status === 'ALLOCATED' && activeAllocations.length === 0) {
                issues.push({
                    type: 'MISSING_ALLOCATION',
                    severity: 'CRITICAL',
                    description: `Booking ${booking.id} is in status ALLOCATED but lacks an active allocation record.`,
                    affectedEntityId: booking.id,
                });
            }
            // Payment Mismatch States
            const verifiedPaymentsCount = booking.payments.filter((p) => p.status === 'VERIFIED').length;
            if (booking.paymentStatus === 'VERIFIED' && verifiedPaymentsCount === 0) {
                issues.push({
                    type: 'PAYMENT_MISMATCH',
                    severity: 'WARNING',
                    description: `Booking ${booking.id} paymentStatus is VERIFIED but has 0 verified payment records.`,
                    affectedEntityId: booking.id,
                });
            }
            if (booking.paymentStatus === 'PENDING' && verifiedPaymentsCount > 0) {
                issues.push({
                    type: 'PAYMENT_MISMATCH',
                    severity: 'WARNING',
                    description: `Booking ${booking.id} paymentStatus is PENDING but has ${verifiedPaymentsCount} verified payment record(s).`,
                    affectedEntityId: booking.id,
                });
            }
        }
        // 2. Room Overcapacity checks
        for (const room of rooms) {
            const dbOccupancy = room.currentOccupancy;
            const actualCount = room.allocations.length;
            if (dbOccupancy !== actualCount) {
                issues.push({
                    type: 'ROOM_OVERCAPACITY',
                    severity: 'CRITICAL',
                    description: `Room ${room.roomNumber} mismatch: db occupancy count is ${dbOccupancy} but found ${actualCount} active allocations.`,
                    affectedEntityId: room.id,
                    metadata: { dbOccupancy, actualCount },
                });
            }
            if (actualCount > room.capacity) {
                issues.push({
                    type: 'ROOM_OVERCAPACITY',
                    severity: 'CRITICAL',
                    description: `Room ${room.roomNumber} has exceeded maximum capacity: ${actualCount}/${room.capacity}`,
                    affectedEntityId: room.id,
                });
            }
        }
        // 3. Reconstruct audit logs state validations
        const logs = await audit_log_1.AuditLogService.getAuditLogs();
        const studentsTrack = {};
        for (const log of logs) {
            if (log.entityType === 'student' && log.actionType === 'STATE_TRANSITION') {
                const lastKnown = studentsTrack[log.entityId];
                if (lastKnown && lastKnown !== log.previousState) {
                    issues.push({
                        type: 'INVALID_TRANSITION',
                        severity: 'WARNING',
                        description: `Audit log timeline anomaly for student ${log.entityId}: transition starts from ${log.previousState} but last logged state was ${lastKnown}`,
                        affectedEntityId: log.entityId,
                    });
                }
                studentsTrack[log.entityId] = log.newState;
            }
        }
        const success = issues.length === 0;
        console.log(`[INTEGRITY_CHECK] Completed. Consistent: ${success}. Found ${issues.length} issue(s).`);
        return { success, issues };
    }
}
exports.IntegrityChecker = IntegrityChecker;
exports.default = IntegrityChecker;
