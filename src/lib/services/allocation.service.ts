import { prisma } from '../db';
import { z } from 'zod';

export class AllocationService {
  /**
   * Automatically allocate a gender-matching room within the booking's hostel.
   * Leverages Prisma transactions for robust race condition prevention.
   */
  static async triggerAutoAllocation(bookingId: string, externalTx?: any) {
    const runInTx = async (tx: any) => {
      // 1. Fetch booking and user details
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { student: true, hostel: true },
      });

      if (!booking) {
        throw new Error('Booking not found.');
      }

      // Check if already allocated
      const existingAlloc = await tx.allocation.findFirst({
        where: { bookingId, revokedAt: null },
      });
      if (existingAlloc) {
        throw new Error('Conflict: Active allocation already exists for this booking.');
      }

      const gender = booking.student.gender;
      if (!gender) {
        throw new Error('Prerequisite Missing: Student gender profile details must be defined.');
      }

      const mappedGenderRule = gender === 'MALE' ? 'MALE_ONLY' : 'FEMALE_ONLY';

      // 2. Find eligible rooms
      // Must match hostel campus buildings, gender rule (MALE_ONLY/FEMALE_ONLY), and have space.
      const eligibleRooms = await tx.room.findMany({
        where: {
          bookingEnabled: true,
          genderRule: mappedGenderRule,
          building: {
            hostelId: booking.hostelId,
            bookingEnabled: true,
            OR: [
              { genderRule: 'MIXED' },
              { genderRule: mappedGenderRule }
            ]
          }
        },
        orderBy: {
          currentOccupancy: 'asc', // Fill rooms starting with lowest occupancy
        },
      });

      // Find a room where occupancy < capacity
      const targetRoom = eligibleRooms.find((r: any) => r.currentOccupancy < r.capacity);

      if (!targetRoom) {
        throw new Error(`Queue Standby: No matching rooms available for ${gender} students in this hostel.`);
      }

      // 3. Atomically allocate room (Optimistic update & concurrency double check)
      const updateResult = await tx.room.updateMany({
        where: {
          id: targetRoom.id,
          currentOccupancy: {
            lt: targetRoom.capacity,
          },
        },
        data: {
          currentOccupancy: {
            increment: 1,
          },
        },
      });

      if (updateResult.count === 0) {
        // Concurrency retry trigger: race condition occurred, retry auto allocation
        throw new Error('Concurrency Conflict: Room occupancy changed. Please retry allocation.');
      }

      // 4. Create allocation record
      const allocation = await tx.allocation.create({
        data: {
          bookingId,
          roomId: targetRoom.id,
        },
      });

      // 5. Update booking status
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: 'ALLOCATED',
        },
      });

      return allocation;
    };

    if (externalTx) {
      return await runInTx(externalTx);
    } else {
      return await prisma.$transaction(async (tx: any) => {
        return await runInTx(tx);
      });
    }
  }

  /**
   * Manually allocate/assign a room by an administrator.
   */
  static async allocateManually(bookingId: string, roomId: string, adminId: string) {
    return await prisma.$transaction(async (tx: any) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { student: true },
      });

      if (!booking) {
        throw new Error('Booking not found.');
      }

      const room = await tx.room.findUnique({
        where: { id: roomId },
        include: { building: true },
      });

      if (!room) {
        throw new Error('Target room not found.');
      }

      // 1. Verify capacity bounds
      if (room.currentOccupancy >= room.capacity) {
        throw new Error('Unavailable: The selected room is already at maximum capacity.');
      }

      // 2. Validate strict gender segregation rules
      const studentGender = booking.student.gender;
      const expectedGenderRule = studentGender === 'MALE' ? 'MALE_ONLY' : 'FEMALE_ONLY';

      if (room.genderRule !== expectedGenderRule) {
        throw new Error(`Gender Rule Policy: Room gender (${room.genderRule}) mismatch for user gender (${studentGender}).`);
      }

      // 3. Clear existing active allocation if any
      const activeAlloc = await tx.allocation.findFirst({
        where: { bookingId, revokedAt: null },
      });

      if (activeAlloc) {
        // Revoke the old one first
        await tx.allocation.update({
          where: { id: activeAlloc.id },
          data: { revokedAt: new Date(), assignedByAdminId: adminId },
        });

        await tx.room.update({
          where: { id: activeAlloc.roomId },
          data: {
            currentOccupancy: {
              decrement: 1,
            },
          },
        });
      }

      // 4. Assign target room atomically
      await tx.room.update({
        where: { id: roomId },
        data: {
          currentOccupancy: {
            increment: 1,
          },
        },
      });

      // 5. Create new allocation
      const allocation = await tx.allocation.create({
        data: {
          bookingId,
          roomId,
          assignedByAdminId: adminId,
        },
      });

      // 6. Set booking status
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'ALLOCATED' },
      });

      return allocation;
    });
  }

  /**
   * Revoke an existing room assignment.
   */
  static async revokeAllocation(allocationId: string, adminId: string, reason: string = 'Revoked by admin') {
    return await prisma.$transaction(async (tx: any) => {
      const allocation = await tx.allocation.findUnique({
        where: { id: allocationId },
      });

      if (!allocation) {
        throw new Error('Allocation not found.');
      }

      if (allocation.revokedAt) {
        throw new Error('Already Revoked: This room allocation is already inactive.');
      }

      // 1. Mark revoked
      const updatedAlloc = await tx.allocation.update({
        where: { id: allocationId },
        data: {
          revokedAt: new Date(),
          assignedByAdminId: adminId,
        },
      });

      // 2. Decrement occupancy
      await tx.room.update({
        where: { id: allocation.roomId },
        data: {
          currentOccupancy: {
            decrement: 1,
          },
        },
      });

      // 3. Revert booking status back to confirmed queue status
      await tx.booking.update({
        where: { id: allocation.bookingId },
        data: {
          status: 'CONFIRMED',
        },
      });

      return updatedAlloc;
    });
  }
}
export default AllocationService;
