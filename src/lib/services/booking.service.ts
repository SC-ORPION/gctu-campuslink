import { prisma } from '../db';
import { z } from 'zod';

export const CreateBookingSchema = z.object({
  studentId: z.string().uuid(),
  hostelId: z.string().uuid(),
});

export class BookingService {
  /**
   * Create student booking atomically.
   * Enforces rules:
   * 1. Check if user is blocked (cannot book).
   * 2. Ensure only ONE active (non-cancelled) booking per student.
   * 3. Check if hostel has bookingEnabled = true and status is OPEN.
   */
  static async createBooking(studentId: string, hostelId: string) {
    // 1. Validate payloads
    CreateBookingSchema.parse({ studentId, hostelId });

    return await prisma.$transaction(async (tx: any) => {
      // 2. Gate blocked student
      const userProfile = await tx.user.findUnique({
        where: { id: studentId },
      });

      if (!userProfile) {
        throw new Error('User record not found.');
      }
      if (userProfile.status === 'BLOCKED') {
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

      return await tx.booking.create({
        data: {
          studentId,
          hostelId,
          status: 'PENDING_PAYMENT',
          lockedSelection: true, // locked upon initial confirm selection
          expiresAt,
        },
        include: {
          hostel: true,
        },
      });
    });
  }

  /**
   * Cancel/revoke an active booking and clear assigned rooms.
   */
  static async cancelBooking(bookingId: string, adminId: string, reason: string = 'Cancelled by administrator') {
    return await prisma.$transaction(async (tx: any) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { allocations: true },
      });

      if (!booking) {
        throw new Error('Booking record not found.');
      }

      // 1. Mark allocations as revoked
      if (booking.allocations.length > 0) {
        for (const allocation of booking.allocations) {
          if (!allocation.revokedAt) {
            await tx.allocation.update({
              where: { id: allocation.id },
              data: { revokedAt: new Date(), assignedByAdminId: adminId },
            });

            // Decrement occupancy
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
      return await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: 'CANCELLED',
          paymentStatus: 'FAILED',
        },
      });
    });
  }
}
export default BookingService;
