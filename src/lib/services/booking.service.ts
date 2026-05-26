import { prisma } from '../db';
import { z } from 'zod';
import { LifecycleService } from './lifecycle.service';
import { NotificationService } from './notification.service';

export const CreateBookingSchema = z.object({
  studentId: z.string().uuid(),
  hostelId: z.string().uuid(),
});


export class BookingService {
  /**
   * Create student booking atomically.
   * Enforces rules:
   * 1. Lock user profile row to prevent concurrent booking submissions.
   * 2. Ensure only ONE active (non-cancelled) booking per student.
   * 3. Check if hostel has bookingEnabled = true and status is OPEN.
   */
  static async createBooking(studentId: string, hostelId: string, externalTx?: any) {
    // 1. Validate payloads
    CreateBookingSchema.parse({ studentId, hostelId });

    const execute = async (tx: any) => {
      // STEP 1: Lock student row to prevent concurrent bookings
      await tx.$executeRaw`SELECT 1 FROM users WHERE id = ${studentId}::uuid FOR UPDATE`;

      // 2. Enforce global constraints & gate blocked student
      const userProfile = await tx.user.findUnique({
        where: { id: studentId },
      });

      if (!userProfile) {
        throw new Error('User record not found.');
      }
      if (userProfile.status === 'BLOCKED') {
        // Log failure reason & throw
        await NotificationService.sendNotification(
          studentId,
          'Booking Attempt Denied',
          'Attempted to book hostel while profile is BLOCKED.',
          'ALERT'
        );
        throw new Error('Access Denied: Restricted profiles cannot submit booking requests.');
      }

      // 3. Ensure ONE active booking
      const activeBooking = await tx.booking.findFirst({
        where: {
          studentId,
          status: {
            not: 'CANCELLED',
          },
        },
      });

      if (activeBooking) {
        throw new Error('Conflict: You already hold an active accommodation booking.');
      }

      // 4. Verify hostel availability
      const hostel = await tx.hostel.findUnique({
        where: { id: hostelId },
      });

      if (!hostel) {
        throw new Error('Hostel not found.');
      }
      if (!hostel.bookingEnabled || hostel.status !== 'OPEN') {
        throw new Error('Unavailable: This hostel is closed for booking.');
      }

      // 5. Create booking with standard duration expiration (e.g. 24 hours to complete payment verification)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const booking = await tx.booking.create({
        data: {
          studentId,
          hostelId,
          status: 'PENDING_PAYMENT',
          lockedSelection: true, // locked upon initial confirm selection (State: HOSTEL_LOCKED)
          expiresAt,
        },
        include: {
          hostel: true,
        },
      });

      // 6. Generate Notification Event
      await NotificationService.sendNotification(
        studentId,
        'Hostel Selection Confirmed',
        `You have selected ${hostel.name}. Selection locked. Please submit payment proof to secure room allocation.`,
        'SUCCESS'
      );

      return booking;
    };

    if (externalTx) {
      return await execute(externalTx);
    } else {
      return await prisma.$transaction(async (tx: any) => {
        return await execute(tx);
      });
    }
  }

  /**
   * Cancel/revoke an active booking and clear assigned rooms.
   */
  static async cancelBooking(bookingId: string, adminId: string, reason: string = 'Cancelled by administrator', externalTx?: any) {
    const execute = async (tx: any) => {
      // Lock related booking row
      await tx.$executeRaw`SELECT 1 FROM bookings WHERE id = ${bookingId}::uuid FOR UPDATE`;

      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { allocations: true, student: true },
      });

      if (!booking) {
        throw new Error('Booking record not found.');
      }

      // 1. Mark allocations as revoked
      if (booking.allocations.length > 0) {
        for (const allocation of booking.allocations) {
          if (!allocation.revokedAt) {
            // Lock room row before decrementing occupancy
            await tx.$executeRaw`SELECT 1 FROM rooms WHERE id = ${allocation.roomId}::uuid FOR UPDATE`;

            await tx.allocation.update({
              where: { id: allocation.id },
              data: { revokedAt: new Date(), assignedByAdminId: adminId },
            });

            // Decrement occupancy safely
            await tx.room.update({
              where: { id: allocation.roomId },
              data: {
                currentOccupancy: {
                  decrement: 1,
                },
              },
            });
          }
        }
      }

      // 2. Mark booking as cancelled
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: 'CANCELLED',
          paymentStatus: 'FAILED',
        },
      });

      // 3. Dispatch revocation / cancellation notification
      await NotificationService.sendNotification(
        booking.studentId,
        'Booking Cancelled',
        `Your hostel booking has been cancelled. Reason: ${reason}.`,
        'WARNING'
      );

      return updatedBooking;
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

export default BookingService;

