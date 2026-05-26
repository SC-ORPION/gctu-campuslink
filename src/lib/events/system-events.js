"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.systemEvents = void 0;
const events_1 = require("events");
class SystemEventEmitter extends events_1.EventEmitter {
    static instance;
    constructor() {
        super();
        // Prevent max listener warnings in high traffic envs
        this.setMaxListeners(100);
    }
    static getInstance() {
        if (!SystemEventEmitter.instance) {
            SystemEventEmitter.instance = new SystemEventEmitter();
        }
        return SystemEventEmitter.instance;
    }
    emitEvent(type, payload) {
        console.log(`[SYSTEM_EVENT] Broadcasting: ${type} for entity ${payload?.entityId || payload?.bookingId || payload?.studentId}`);
        this.emit(type, payload);
    }
}
exports.systemEvents = SystemEventEmitter.getInstance();
exports.default = exports.systemEvents;
