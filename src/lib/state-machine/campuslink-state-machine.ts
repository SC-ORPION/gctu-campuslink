import { prisma } from '../db';
import { AuditLogService } from '../audit/audit-log';
import { NotificationService } from '../services/notification.service';

export type StudentState =
  | 'REGISTERED'
  | 'HOSTEL_SELECTED'
  | 'HOSTEL_LOCKED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_SUBMITTED'
  | 'PAYMENT_UNDER_VERIFICATION'
  | 'PAYMENT_VERIFIED'
  | 'ALLOCATION_QUEUED'
  | 'ALLOCATED'
  | 'CONFIRMED';

export type AdminState =
  | 'VERIFYING_PAYMENT'
  | 'REJECTING_PAYMENT'
  | 'AUTO_ALLOCATING'
  | 'MANUAL_ALLOCATING'
  | 'REVOKING_ALLOCATION'
  | 'BLOCKING_STUDENT';

// Strict transition map
export const VALID_TRANSITIONS: Record<StudentState, StudentState[]> = {
  REGISTERED: ['HOSTEL_SELECTED'],
  HOSTEL_SELECTED: ['HOSTEL_LOCKED'],
  HOSTEL_LOCKED: ['PAYMENT_PENDING'],
  PAYMENT_PENDING: ['PAYMENT_SUBMITTED'],
  PAYMENT_SUBMITTED: ['PAYMENT_UNDER_VERIFICATION', 'PAYMENT_PENDING'], // Can be verified/reviewed, or rejected back to pending
  PAYMENT_UNDER_VERIFICATION: ['PAYMENT_VERIFIED', 'PAYMENT_PENDING'], // Can be verified, or rejected back to pending
  PAYMENT_VERIFIED: ['ALLOCATION_QUEUED'],
  ALLOCATION_QUEUED: ['ALLOCATED'],
  ALLOCATED: ['CONFIRMED', 'ALLOCATION_QUEUED'], // Can be confirmed, or revoked back to queue
  CONFIRMED: ['ALLOCATION_QUEUED'], // Can be revoked back to queue
};

export class CampusLinkStateMachine {
  /**
   * Derive the current StudentState based on database records.
   */
  static async deriveStudentState(studentId: string, tx?: any): Promise<StudentState> {
    const client = tx || prisma;
    const student = await client.user.findUnique({
      where: { id: studentId },
      include: {
        bookings: {
          where: { status: { not: 'CANCELLED' } },
          orderBy: { createdAt: 'desc' },
          include: {
            payments: { orderBy: { createdAt: 'desc' } },
            allocations: { orderBy: { createdAt: 'desc' } },
          },
        },
      },
    });

    if (!student) {
      throw new Error(`Student not found: ${studentId}`);
    }

    if (student.bookings.length === 0) {
      return 'REGISTERED';
    }

    const latestBooking = student.bookings[0];

    // ALLOCATED / CONFIRMED
    if (latestBooking.status === 'ALLOCATED') {
      const activeAlloc = latestBooking.allocations.find((a: any) => a.revokedAt === null);
      if (activeAlloc) {
        // If there's an active allocation, check if they are fully CONFIRMED.
        // We will treat ALLOCATED as the initial room allocation state, and CONFIRMED as the finalized booking state.
        return 'ALLOCATED';
      }
    }

    if (latestBooking.status === 'CONFIRMED') {
      const activeAlloc = latestBooking.allocations.find((a: any) => a.revokedAt === null);
      if (activeAlloc) {
        return 'CONFIRMED';
      }
      return 'ALLOCATION_QUEUED';
    }

    // PAYMENT_VERIFIED / ALLOCATION_QUEUED
    if (latestBooking.paymentStatus === 'VERIFIED') {
      return 'PAYMENT_VERIFIED'; // Or ALLOCATION_QUEUED depending on trigger sequence
    }

    // PAYMENT_SUBMITTED / PAYMENT_UNDER_VERIFICATION
    if (latestBooking.status === 'PENDING_VERIFICATION') {
      const latestPayment = latestBooking.payments[0];
      if (latestPayment && latestPayment.status === 'PENDING') {
        return 'PAYMENT_SUBMITTED';
      }
      return 'PAYMENT_UNDER_VERIFICATION';
    }

    // HOSTEL_SELECTED, HOSTEL_LOCKED, PAYMENT_PENDING
    if (latestBooking.status === 'PENDING_PAYMENT') {
      if (!latestBooking.lockedSelection) {
        return 'HOSTEL_SELECTED';
      }
      if (latestBooking.payments.length === 0) {
        return 'HOSTEL_LOCKED';
      }
      return 'PAYMENT_PENDING';
    }

    return 'REGISTERED';
  }

  /**
   * Transition student state with strict validation, atomicity, and audit logging.
   */
  static async transitionStudentState(
    studentId: string,
    newState: StudentState,
    context: { actor: 'system' | 'admin' | 'student'; actorId?: string; reason?: string },
    externalTx?: any
  ): Promise<StudentState> {
    const execute = async (tx: any) => {
      // Lock student row to prevent concurrent transitions
      await tx.$executeRaw`SELECT 1 FROM users WHERE id = ${studentId}::uuid FOR UPDATE`;

      // 1. Fetch current state
      const currentState = await CampusLinkStateMachine.deriveStudentState(studentId, tx);

      if (currentState === newState) {
        return currentState;
      }

      // 2. Validate transition using transition map
      const allowed = VALID_TRANSITIONS[currentState]?.includes(newState);
      if (!allowed) {
        throw new Error(
          `Invalid State Transition: Cannot transition student ${studentId} from ${currentState} to ${newState}.`
        );
      }

      // 3. Perform database updates depending on target state
      await CampusLinkStateMachine.updateDatabaseState(studentId, currentState, newState, tx);

      // 4. Log transition history
      await AuditLogService.logStateTransition(
        studentId,
        'student',
        currentState,
        newState,
        context.actor,
        context.actorId,
        context.reason
      );

      return newState;
    };

    if (externalTx) {
      return await execute(externalTx);
    } else {
      return await prisma.$transaction(async (tx: any) => {
        return await execute(tx);
      });
    }
  }

  private static async updateDatabaseState(
    studentId: string,
    oldState: StudentState,
    newState: StudentState,
    tx: any
  ): Promise<void> {
    const student = await tx.user.findUnique({
      where: { id: studentId },
      include: {
        bookings: {
          where: { status: { not: 'CANCELLED' } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!student) throw new Error('Student not found');
    const latestBooking = student.bookings[0];
    if (latestBooking) {
      // Lock the active booking row to prevent concurrent updates
      await tx.$executeRaw`SELECT 1 FROM bookings WHERE id = ${latestBooking.id}::uuid FOR UPDATE`;
    }

    switch (newState) {
      case 'HOSTEL_SELECTED':
        // Safe check done in BookingService
        break;
      case 'HOSTEL_LOCKED':
        if (latestBooking) {
          await tx.booking.update({
            where: { id: latestBooking.id },
            data: { lockedSelection: true },
          });
        }
        break;
      case 'PAYMENT_PENDING':
        if (latestBooking) {
          await tx.booking.update({
            where: { id: latestBooking.id },
            data: { status: 'PENDING_PAYMENT', paymentStatus: 'FAILED' },
          });
        }
        break;
      case 'PAYMENT_SUBMITTED':
        if (latestBooking) {
          await tx.booking.update({
            where: { id: latestBooking.id },
            data: { status: 'PENDING_VERIFICATION', paymentStatus: 'PENDING_VERIFICATION' },
          });
        }
        break;
      case 'PAYMENT_UNDER_VERIFICATION':
        // Handled by admin viewing/reviewing payment
        break;
      case 'PAYMENT_VERIFIED':
        if (latestBooking) {
          await tx.booking.update({
            where: { id: latestBooking.id },
            data: { status: 'CONFIRMED', paymentStatus: 'VERIFIED' },
          });
        }
        break;
      case 'ALLOCATION_QUEUED':
        // Can be auto or via revocation
        if (latestBooking) {
          await tx.booking.update({
            where: { id: latestBooking.id },
            data: { status: 'CONFIRMED' },
          });
        }
        break;
      case 'ALLOCATED':
        if (latestBooking) {
          await tx.booking.update({
            where: { id: latestBooking.id },
            data: { status: 'ALLOCATED' },
          });
        }
        break;
      case 'CONFIRMED':
        if (latestBooking) {
          await tx.booking.update({
            where: { id: latestBooking.id },
            data: { status: 'CONFIRMED' }, // If final confirmed state maps to CONFIRMED
          });
        }
        break;
    }
  }

  /**
   * Block a student, invalidating any active booking and allocations.
   */
  static async blockStudent(studentId: string, adminId: string, reason: string): Promise<void> {
    return await prisma.$transaction(async (tx: any) => {
      // STEP 1: Lock student row
      await tx.$executeRaw`SELECT 1 FROM users WHERE id = ${studentId}::uuid FOR UPDATE`;

      const student = await tx.user.findUnique({
        where: { id: studentId },
        include: {
          bookings: {
            where: { status: { not: 'CANCELLED' } },
            include: { allocations: { where: { revokedAt: null } } },
          },
        },
      });

      if (!student) {
        throw new Error(`Student not found: ${studentId}`);
      }

      // Lock admin row
      await tx.$executeRaw`SELECT 1 FROM users WHERE id = ${adminId}::uuid FOR UPDATE`;

      // 1. Verify admin
      const admin = await tx.user.findUnique({ where: { id: adminId } });
      if (!admin || admin.role !== 'admin') {
        throw new Error('Access Denied: Only administrators can block students.');
      }

      const priorState = await CampusLinkStateMachine.deriveStudentState(studentId, tx);

      // 2. Set student status to BLOCKED
      await tx.user.update({
        where: { id: studentId },
        data: { status: 'BLOCKED' },
      });

      // 3. Invalidate active booking and allocations if exists
      for (const booking of student.bookings) {
        // Lock booking row
        await tx.$executeRaw`SELECT 1 FROM bookings WHERE id = ${booking.id}::uuid FOR UPDATE`;

        // Revoke allocations
        for (const allocation of booking.allocations) {
          // Lock room row
          await tx.$executeRaw`SELECT 1 FROM rooms WHERE id = ${allocation.roomId}::uuid FOR UPDATE`;

          await tx.allocation.update({
            where: { id: allocation.id },
            data: { revokedAt: new Date(), assignedByAdminId: adminId },
          });

          await tx.room.update({
            where: { id: allocation.roomId },
            data: { currentOccupancy: { decrement: 1 } },
          });
        }

        // Cancel booking
        await tx.booking.update({
          where: { id: booking.id },
          data: { status: 'CANCELLED', paymentStatus: 'FAILED' },
        });

        await NotificationService.sendNotification(
          studentId,
          'Booking Cancelled',
          `Your booking has been cancelled due to administrative block. Reason: ${reason}`,
          'ALERT'
        );
      }

      // 4. Log audit entry
      await AuditLogService.logStateTransition(
        studentId,
        'student',
        priorState,
        'BLOCKED',
        'admin',
        adminId,
        reason
      );

      // 5. Send notification
      await NotificationService.sendNotification(
        studentId,
        'Profile Blocked',
        `Your profile has been restricted by an administrator. Reason: ${reason}`,
        'ALERT'
      );
    });
  }
}

// Guard Functions
export async function isStudentBlocked(student: any): Promise<boolean> {
  return student?.status === 'BLOCKED';
}

export function canBookHostel(student: any): { allowed: boolean; reason?: string } {
  if (student?.status === 'BLOCKED') {
    return { allowed: false, reason: 'Restricted profiles cannot submit booking requests.' };
  }
  const activeBookings = student?.bookings?.filter((b: any) => b.status !== 'CANCELLED') || [];
  if (activeBookings.length > 0) {
    return { allowed: false, reason: 'You already hold an active accommodation booking.' };
  }
  return { allowed: true };
}

export function canSubmitPayment(student: any): { allowed: boolean; reason?: string } {
  if (student?.status === 'BLOCKED') {
    return { allowed: false, reason: 'Restricted profiles cannot submit booking payments.' };
  }
  const activeBooking = student?.bookings?.find((b: any) => b.status !== 'CANCELLED');
  if (!activeBooking) {
    return { allowed: false, reason: 'No active booking found.' };
  }
  if (activeBooking.status !== 'PENDING_PAYMENT') {
    return { allowed: false, reason: 'Booking is not in pending payment state.' };
  }
  return { allowed: true };
}

export function canVerifyPayment(admin: any, payment: any): { allowed: boolean; reason?: string } {
  if (admin?.role !== 'admin') {
    return { allowed: false, reason: 'Access Denied: Only administrators can verify payments.' };
  }
  if (payment?.status !== 'PENDING') {
    return { allowed: false, reason: 'Payment is not in PENDING state.' };
  }
  if (payment?.booking?.student?.status === 'BLOCKED') {
    return { allowed: false, reason: 'Access Denied: Restricted profiles cannot have payments verified.' };
  }
  return { allowed: true };
}

export function canAllocateRoom(student: any): { allowed: boolean; reason?: string } {
  if (student?.status === 'BLOCKED') {
    return { allowed: false, reason: 'Blocked students cannot be allocated rooms.' };
  }
  const activeBooking = student?.bookings?.find((b: any) => b.status !== 'CANCELLED');
  if (!activeBooking) {
    return { allowed: false, reason: 'No active booking found.' };
  }
  if (activeBooking.paymentStatus !== 'VERIFIED') {
    return { allowed: false, reason: 'Allocation cannot happen unless payment is VERIFIED.' };
  }
  const activeAlloc = activeBooking.allocations?.find((a: any) => a.revokedAt === null);
  if (activeAlloc) {
    return { allowed: false, reason: 'Active allocation already exists for this booking.' };
  }
  return { allowed: true };
}

export function canRevokeAllocation(admin: any, allocation: any): { allowed: boolean; reason?: string } {
  if (admin?.role !== 'admin') {
    return { allowed: false, reason: 'Access Denied: Only administrators can revoke allocations.' };
  }
  if (allocation?.revokedAt !== null) {
    return { allowed: false, reason: 'This room allocation is already inactive.' };
  }
  return { allowed: true };
}
