import { EventEmitter } from 'events';

export type SystemEventType =
  | 'PAYMENT_VERIFIED'
  | 'ALLOCATION_SUCCESS'
  | 'ALLOCATION_FAILED'
  | 'BOOKING_CREATED'
  | 'BOOKING_LOCKED'
  | 'STUDENT_BLOCKED';

class SystemEventEmitter extends EventEmitter {
  private static instance: SystemEventEmitter;

  private constructor() {
    super();
    // Prevent max listener warnings in high traffic envs
    this.setMaxListeners(100);
  }

  public static getInstance(): SystemEventEmitter {
    if (!SystemEventEmitter.instance) {
      SystemEventEmitter.instance = new SystemEventEmitter();
    }
    return SystemEventEmitter.instance;
  }

  emitEvent(type: SystemEventType, payload: any) {
    console.log(`[SYSTEM_EVENT] Broadcasting: ${type} for entity ${payload?.entityId || payload?.bookingId || payload?.studentId}`);
    this.emit(type, payload);
  }
}

export const systemEvents = SystemEventEmitter.getInstance();
export default systemEvents;
