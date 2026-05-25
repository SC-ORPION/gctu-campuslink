import { prisma } from '../db';
import { z } from 'zod';
import { AllocationService } from './allocation.service';

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
  static async submitPaymentProof(data: {
    bookingId: string;
    method: 'ONLINE' | 'BANK' | 'CASH';
    reference: string;
    proofImage?: string;
  }) {
    SubmitPaymentSchema.parse(data);

    return await prisma.$transaction(async (tx: any) => {
      const booking = await tx.booking.findUnique({
        where: { id: data.bookingId },
      });

      if (!booking) {
        throw new Error('Booking not found.');
      }

      // Check if already paid
      if (booking.status === 'CONFIRMED' || booking.status === 'ALLOCATED') {
        throw new Error('Already Verified: This booking is already fully paid and confirmed.');
      }

      // 1. Create payment slip entry
      const payment = await tx.payment.create({
        data: {
          bookingId: data.bookingId,
          method: data.method,
          status: data.method === 'ONLINE' ? 'VERIFIED' : 'PENDING',
          reference: data.reference,
          proofImage: data.proofImage || null,
        },
      });

      // 2. Update booking status
      const nextBookingStatus = data.method === 'ONLINE' ? 'CONFIRMED' : 'PENDING_VERIFICATION';
      const nextPaymentStatus = data.method === 'ONLINE' ? 'VERIFIED' : 'PENDING_VERIFICATION';

      const updatedBooking = await tx.booking.update({
        where: { id: data.bookingId },
        data: {
          status: nextBookingStatus,
          paymentStatus: nextPaymentStatus,
        },
      });

      // 3. If online, trigger auto allocation atomically
      if (data.method === 'ONLINE') {
        try {
          await AllocationService.triggerAutoAllocation(data.bookingId, tx);
        } catch (allocError) {
          console.warn('Auto allocation failed during online payment, student remains in queue:', allocError);
        }
      }

      return { payment, booking: updatedBooking };
    });
  }

  /**
   * Verify bank/cash payments manually by administrator.
   */
  static async verifyPayment(bookingId: string, adminId: string, reason: string = 'Payment verified manually') {
    return await prisma.$transaction(async (tx: any) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { payments: true },
      });

      if (!booking) {
        throw new Error('Booking record not found.');
      }

      // 1. Update payments statuses
      await tx.payment.updateMany({
        where: { bookingId, status: 'PENDING' },
        data: { status: 'VERIFIED' },
      });

      // 2. Update booking
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: 'CONFIRMED',
          paymentStatus: 'VERIFIED',
        },
      });

      // 3. Execute room allocation automatically on payment verification
      try {
        await AllocationService.triggerAutoAllocation(bookingId, tx);
      } catch (allocError) {
        console.warn('Auto allocation failed during admin payment verification, student remains in queue:', allocError);
      }

      return updatedBooking;
    });
  }
}
export default PaymentService;
