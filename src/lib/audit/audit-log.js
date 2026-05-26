"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogService = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const system_events_1 = require("../events/system-events");
const LOG_FILE_PATH = path.join(process.cwd(), 'src', 'lib', 'audit', 'audit.log');
// Global registry fallback to maintain audit logs in-memory during a session
const globalAuditRegistry = globalThis;
if (!globalAuditRegistry.auditLogs) {
    globalAuditRegistry.auditLogs = [];
}
class AuditLogService {
    /**
     * Log an audit event with detailed structure.
     */
    static async logAudit(entry, tx) {
        const fullEntry = {
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
        }
        catch (err) {
            console.error('Failed to write to audit log file:', err);
        }
        console.log(logLine.trim());
        return fullEntry;
    }
    /**
     * Specifically log a state transition and emit standard system events automatically.
     */
    static async logStateTransition(entityId, entityType, fromState, toState, actor, actorId, reason, metadata) {
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
        let matchedEvent = null;
        if (entityType === 'student' && toState === 'BLOCKED') {
            matchedEvent = 'STUDENT_BLOCKED';
        }
        else if (entityType === 'booking' && toState === 'CONFIRMED' && fromState === 'PENDING_PAYMENT') {
            matchedEvent = 'BOOKING_CREATED';
        }
        else if (entityType === 'booking' && fromState === 'HOSTEL_SELECTED' && toState === 'HOSTEL_LOCKED') {
            matchedEvent = 'BOOKING_LOCKED';
        }
        if (matchedEvent) {
            system_events_1.systemEvents.emitEvent(matchedEvent, {
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
    static async getAuditLogs() {
        return globalAuditRegistry.auditLogs;
    }
    /**
     * Replay-based reconstruction capabilities.
     */
    static async getStudentHistory(studentId) {
        return globalAuditRegistry.auditLogs.filter((log) => (log.entityType === 'student' && log.entityId === studentId) ||
            (log.metadata?.studentId === studentId));
    }
    static async getBookingLifecycle(bookingId) {
        return globalAuditRegistry.auditLogs.filter((log) => (log.entityType === 'booking' && log.entityId === bookingId) ||
            (log.metadata?.bookingId === bookingId));
    }
    static async getPaymentLifecycle(paymentId) {
        return globalAuditRegistry.auditLogs.filter((log) => (log.entityType === 'payment' && log.entityId === paymentId) ||
            (log.metadata?.paymentId === paymentId));
    }
    static async getAllocationTimeline() {
        return globalAuditRegistry.auditLogs.filter((log) => log.entityType === 'allocation');
    }
}
exports.AuditLogService = AuditLogService;
exports.default = AuditLogService;
