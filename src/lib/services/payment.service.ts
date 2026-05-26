import { prisma } from '../db';
import { z } from 'zod';
import { AllocationService } from './allocation.service';
import { NotificationService } from './notification.service';
import { LifecycleService } from './lifecycle.service';
import { CampusLinkStateMachine } from '../state-machine/campuslink-state-machine';
import { JobQueue } from '../queue/job-queue';

export const SubmitPaymentSchema = z.object({
  bookingId: z.string().uuid(),
  method: z.enum(['ONLINE', 'BANK', 'CASH']),
  reference: z.string().min(3),
  proofImage: z.string().optional(),
});

export class PaymentService {
  /**
   * Submit transaction receipt details.
   */
  static async submitPayment(studentId: string, data: {
    bookingId: string;
    method: 'ONLINE' | 'BANK' | 'CASH';
    reference: string;
    proofImage?: string;
  }, externalTx?: any) {
    SubmitPaymentSchema.parse(data);

    const execute = async (tx: any) => {
      // STEP 1: Lock booking row
      await tx.$executeRaw`SELECT 1 FROM bookings WHERE id = ${data.bookingId}::uuid FOR UPDATE`;

      const booking = await tx.booking.findUnique({
        where: { id: data.bookingId },
        include: { student: true, payments: true },
      });

      if (!booking) {
        throw new Error('Booking not found.');
      }
      if (booking.studentId !== studentId) {
        throw new Error('Access Denied: Booking does not belong to this student.');
      }
      if (booking.student.status === 'BLOCKED') {
        throw new Error('Access Denied: Restricted profiles cannot submit booking payments.');
      }

      // Check if already paid
      if (booking.status === 'CONFIRMED' || booking.status === 'ALLOCATED') {
        throw new Error('Already Verified: This booking is already fully paid and confirmed.');
      }

      // STEP 2: Ensure booking is HOSTEL_LOCKED
      const isHostelLocked = booking.status === 'PENDING_PAYMENT' && booking.lockedSelection && booking.payments.length === 0;
      if (!isHostelLocked) {
        throw new Error('Precondition Failed: Booking is not in HOSTEL_LOCKED state.');
      }

      // STEP 3: Create payment record
      const payment = await tx.payment.create({
        data: {
          bookingId: data.bookingId,
          method: data.method,
          status: data.method === 'ONLINE' ? 'VERIFIED' : 'PENDING',
          reference: data.reference,
          proofImage: data.proofImage || null,
        },
      });

      // STEP 4: Set state = PAYMENT_SUBMITTED atomically
      await CampusLinkStateMachine.transitionStudentState(
        studentId,
        'PAYMENT_SUBMITTED',
        { actor: 'student', actorId: studentId, reason: 'Payment proof submitted' },
        tx
      );

      // Also trigger auto allocation atomically if online payment
      if (data.method === 'ONLINE') {
        // Transition to confirmed / verified status and auto allocate
        await tx.booking.update({
          where: { id: data.bookingId },
          data: {
            status: 'CONFIRMED',
            paymentStatus: 'VERIFIED',
          },
        });
        await CampusLinkStateMachine.transitionStudentState(
          studentId,
          'PAYMENT_VERIFIED',
          { actor: 'system', reason: 'Online payment auto-verified' },
          tx
        );
        // Queue the auto allocation run and return immediately
        JobQueue.enqueue('ALLOCATION_ENGINE_JOB', {
          bookingId: data.bookingId,
          studentId,
        }, { priority: 'high' });
      }

      return { payment };
    };

    if (externalTx) {
      return await execute(externalTx);
    } else {
      return await prisma.$transaction(async (tx: any) => {
        return await execute(tx);
      });
    }
  }

  static async submitPaymentProof(data: {
    bookingId: string;
    method: 'ONLINE' | 'BANK' | 'CASH';
    reference: string;
    proofImage?: string;
  }, externalTx?: any) {
    const booking = await (externalTx || prisma).booking.findUnique({
      where: { id: data.bookingId },
    });
    if (!booking) throw new Error('Booking not found.');
    const result = await this.submitPayment(booking.studentId, data, externalTx);
    const updatedBooking = await (externalTx || prisma).booking.findUnique({
      where: { id: data.bookingId },
    });
    return { payment: result.payment, booking: updatedBooking };
  }

  /**
   * Verify bank/cash payments manually by administrator.
   */
  static async verifyPayment(bookingId: string, adminId: string, reason: string = 'Payment verified manually', externalTx?: any) {
    const execute = async (tx: any) => {
      // Lock related booking row
      await tx.$executeRaw`SELECT 1 FROM bookings WHERE id = ${bookingId}::uuid FOR UPDATE`;

      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { payments: true, student: true },
      });

      if (!booking) {
        throw new Error('Booking record not found.');
      }

      // Blocked student guard
      if (booking.student.status === 'BLOCKED') {
        throw new Error('Access Denied: Restricted profiles cannot have payments verified.');
      }

      // Strict Transition Rule: PAYMENT cannot be verified unless submitted
      const pendingPayment = booking.payments.find((p: any) => p.status === 'PENDING');
      if (!pendingPayment && booking.paymentStatus !== 'PENDING_VERIFICATION') {
        throw new Error('Precondition Failed: No pending payment submitted to verify.');
      }

      // Lock payment row if exists
      if (pendingPayment) {
        await tx.$executeRaw`SELECT 1 FROM payments WHERE id = ${pendingPayment.id}::uuid FOR UPDATE`;
      }

      // 1. Update payments statuses
      await tx.payment.updateMany({
        where: { bookingId, status: 'PENDING' },
        data: { status: 'VERIFIED' },
      });

      // 2. Update booking via State Machine transition StudentState
      const startTime = Date.now();
      await CampusLinkStateMachine.transitionStudentState(
        booking.studentId,
        'PAYMENT_VERIFIED',
        { actor: 'admin', actorId: adminId, reason },
        tx
      );
      
      const duration = Date.now() - startTime;
      const { SystemHealthMonitor } = require('../monitoring/system-health');
      SystemHealthMonitor.recordPaymentVerificationDelay(duration);

      const { systemEvents } = require('../events/system-events');
      systemEvents.emitEvent('PAYMENT_VERIFIED', {
        bookingId,
        studentId: booking.studentId,
        actorId: adminId,
        metadata: { reason }
      });

      // 3. Generate Notification Event via NOTIFICATION_JOB
      JobQueue.enqueue('NOTIFICATION_JOB', {
        studentId: booking.studentId,
        title: 'Payment Verified',
        message: 'Your bank payment reference has been manually verified. Room allocation queued.',
        severity: 'SUCCESS',
      });

      return await tx.booking.findUnique({ where: { id: bookingId } });
    };

    let resultBooking;
    if (externalTx) {
      resultBooking = await execute(externalTx);
      // Queue the auto allocation run and return immediately
      JobQueue.enqueue('ALLOCATION_ENGINE_JOB', {
        bookingId,
        studentId: resultBooking.studentId,
      }, { priority: 'high' });
    } else {
      resultBooking = await prisma.$transaction(async (tx: any) => {
        return await execute(tx);
      });
      // Queue the auto allocation run and return immediately
      JobQueue.enqueue('ALLOCATION_ENGINE_JOB', {
        bookingId,
        studentId: resultBooking.studentId,
      }, { priority: 'high' });
    }

    return resultBooking;
  }

  /**
   * Reject a payment manual slip by administrator.
   */
  static async rejectPayment(bookingId: string, adminId: string, reason: string = 'Payment rejected', externalTx?: any) {
    const execute = async (tx: any) => {
      // Lock booking row
      await tx.$executeRaw`SELECT 1 FROM bookings WHERE id = ${bookingId}::uuid FOR UPDATE`;

      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { student: true, payments: true },
      });

      if (!booking) {
        throw new Error('Booking record not found.');
      }

      // Find pending payment and lock it
      const pendingPayment = booking.payments.find((p: any) => p.status === 'PENDING');
      if (pendingPayment) {
        await tx.$executeRaw`SELECT 1 FROM payments WHERE id = ${pendingPayment.id}::uuid FOR UPDATE`;
      }

      // Update payments statuses
      await tx.payment.updateMany({
        where: { bookingId, status: 'PENDING' },
        data: { status: 'FAILED' },
      });

      // Reset booking status back to locked booking stage for resubmission via State Machine
      await CampusLinkStateMachine.transitionStudentState(
        booking.studentId,
        'PAYMENT_PENDING',
        { actor: 'admin', actorId: adminId, reason },
        tx
      );

      // Dispatch Notification
      await NotificationService.sendNotification(
        booking.studentId,
        'Payment Rejected',
        `Your payment proof was rejected. Reason: ${reason}. Please resubmit a valid transaction receipt reference.`,
        'ALERT'
      );

      return await tx.booking.findUnique({ where: { id: bookingId } });
    };

    if (externalTx) {
      return await execute(externalTx);
    } else {
      return await prisma.$transaction(async (tx: any) => {
        return await execute(tx);
      });
    }
  }
}

export default PaymentService;
