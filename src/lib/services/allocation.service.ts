import { prisma } from '../db';
import { NotificationService } from './notification.service';
import { CampusLinkStateMachine } from '../state-machine/campuslink-state-machine';
import { JobQueue } from '../queue/job-queue';

export class AllocationService {
  /**
   * Run the allocation engine.
   * Scans all students in PAYMENT_VERIFIED state, filters eligible ones, finds gender-matching rooms,
   * locks room rows transactionally, and assigns rooms safely.
   */
  static async runAllocationEngine(): Promise<{ allocatedCount: number; queuedCount: number }> {
    const users = await prisma.user.findMany({
      where: { role: 'student', status: 'ACTIVE' },
      include: {
        bookings: {
          where: { status: { not: 'CANCELLED' } },
          include: {
            payments: { orderBy: { createdAt: 'desc' } },
            allocations: { orderBy: { createdAt: 'desc' } },
          },
        },
      },
    });

    let allocatedCount = 0;
    let queuedCount = 0;

    for (const user of users) {
      try {
        const derivedState = await CampusLinkStateMachine.deriveStudentState(user.id);
        if (derivedState === 'PAYMENT_VERIFIED' || derivedState === 'ALLOCATION_QUEUED') {
          const activeBooking = user.bookings[0];
          if (!activeBooking) continue;

          const hasActiveAlloc = activeBooking.allocations.some((a) => a.revokedAt === null);
          if (hasActiveAlloc) continue;

          await prisma.$transaction(async (tx: any) => {
            // STEP 1: Lock student row
            await tx.$executeRaw`SELECT 1 FROM users WHERE id = ${user.id}::uuid FOR UPDATE`;

            // STEP 2: Lock active booking row
            await tx.$executeRaw`SELECT 1 FROM bookings WHERE id = ${activeBooking.id}::uuid FOR UPDATE`;

            // Re-derive state inside transaction for absolute correctness and locking
            const innerState = await CampusLinkStateMachine.deriveStudentState(user.id, tx);
            if (innerState !== 'PAYMENT_VERIFIED' && innerState !== 'ALLOCATION_QUEUED') {
              throw new Error('State mismatch inside transaction');
            }

            // Transitioning from PAYMENT_VERIFIED to ALLOCATION_QUEUED
            if (innerState === 'PAYMENT_VERIFIED') {
              await CampusLinkStateMachine.transitionStudentState(
                user.id,
                'ALLOCATION_QUEUED',
                { actor: 'system', reason: 'Automatic transition to allocation queue' },
                tx
              );
            }

            const gender = user.gender;
            if (!gender) throw new Error('Student gender missing');
            const expectedGenderRule = gender === 'MALE' ? 'MALE_ONLY' : 'FEMALE_ONLY';

            // Find and lock room row via FOR UPDATE (Locks target room row)
            const eligibleRooms = await tx.$queryRawUnsafe(`
              SELECT r.* 
              FROM rooms r
              JOIN buildings b ON r.building_id = b.id
              WHERE r.booking_enabled = true
                AND r.gender_rule = '${expectedGenderRule}'::"GenderRule"
                AND r.current_occupancy < r.capacity
                AND b.hostel_id = '${activeBooking.hostelId}'::uuid
                AND b.booking_enabled = true
                AND (b.gender_rule = 'MIXED'::"GenderRule" OR b.gender_rule = '${expectedGenderRule}'::"GenderRule")
              FOR UPDATE
              LIMIT 1
            `);

            const targetRoom = eligibleRooms && eligibleRooms[0];
            if (!targetRoom) {
              throw new Error('No rooms available matching constraints');
            }

            // Update occupancy count safely
            await tx.room.update({
              where: { id: targetRoom.id },
              data: { currentOccupancy: { increment: 1 } },
            });

            // Create allocation record
            await tx.allocation.create({
              data: {
                bookingId: activeBooking.id,
                roomId: targetRoom.id,
              },
            });

            const startTime = Date.now();
            // Transition to ALLOCATED via State Machine
            await CampusLinkStateMachine.transitionStudentState(
              user.id,
              'ALLOCATED',
              { actor: 'system', reason: 'Auto-allocation engine successfully assigned room' },
              tx
            );

            const duration = Date.now() - startTime;
            const { SystemHealthMonitor } = require('../monitoring/system-health');
            SystemHealthMonitor.recordAllocationTime(duration);

            const { systemEvents } = require('../events/system-events');
            systemEvents.emitEvent('ALLOCATION_SUCCESS', {
              bookingId: activeBooking.id,
              studentId: user.id,
              roomId: targetRoom.id,
            });

            // Send notification via queue
            JobQueue.enqueue('NOTIFICATION_JOB', {
              studentId: user.id,
              title: 'Room Allocated',
              message: `Room assignment successful! Room ${targetRoom.room_number || targetRoom.roomNumber} has been allocated to you.`,
              severity: 'SUCCESS',
            });
          });
          allocatedCount++;
        }
      } catch (allocErr: any) {
        console.warn(`Allocation failed for student ${user.id}: ${allocErr.message}`);
        const { SystemHealthMonitor } = require('../monitoring/system-health');
        SystemHealthMonitor.createErrorLog({
          error: allocErr,
          context: 'AutoAllocationEngineExecution',
          affectedEntity: { type: 'student', id: user.id },
        });

        const { systemEvents } = require('../events/system-events');
        systemEvents.emitEvent('ALLOCATION_FAILED', {
          studentId: user.id,
          reason: allocErr.message,
        });

        queuedCount++;
        try {
          await prisma.$transaction(async (tx: any) => {
            const innerState = await CampusLinkStateMachine.deriveStudentState(user.id, tx);
            if (innerState === 'PAYMENT_VERIFIED') {
              await CampusLinkStateMachine.transitionStudentState(
                user.id,
                'ALLOCATION_QUEUED',
                { actor: 'system', reason: `Allocation engine failed: ${allocErr.message}` },
                tx
              );
            }
          });
        } catch (e) {}
      }
    }

    return { allocatedCount, queuedCount };
  }

  /**
   * Automatically allocate a gender-matching room within the booking's hostel.
   * Leverages Prisma transactions for robust race condition prevention.
   */
  static async triggerAutoAllocation(bookingId: string, externalTx?: any) {
    const runInTx = async (tx: any) => {
      // STEP 1: Lock booking row
      await tx.$executeRaw`SELECT 1 FROM bookings WHERE id = ${bookingId}::uuid FOR UPDATE`;

      // 1. Fetch booking and user details
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { student: true, hostel: true },
      });

      if (!booking) {
        throw new Error('Booking not found.');
      }

      // STEP 2: Lock student row
      await tx.$executeRaw`SELECT 1 FROM users WHERE id = ${booking.studentId}::uuid FOR UPDATE`;

      // Check if blocked student
      if (booking.student.status === 'BLOCKED') {
        throw new Error('Access Denied: Blocked students cannot be allocated rooms.');
      }

      // Check if payment is VERIFIED. Strict sequence constraint!
      if (booking.paymentStatus !== 'VERIFIED') {
        throw new Error('Precondition Failed: Allocation cannot happen unless payment is VERIFIED.');
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

      // STEP 3: Lock target room row during search using raw SQL FOR UPDATE
      const eligibleRooms = await tx.$queryRawUnsafe(`
        SELECT r.* 
        FROM rooms r
        JOIN buildings b ON r.building_id = b.id
        WHERE r.booking_enabled = true
          AND r.gender_rule = '${mappedGenderRule}'::"GenderRule"
          AND r.current_occupancy < r.capacity
          AND b.hostel_id = '${booking.hostelId}'::uuid
          AND b.booking_enabled = true
          AND (b.gender_rule = 'MIXED'::"GenderRule" OR b.gender_rule = '${mappedGenderRule}'::"GenderRule")
        FOR UPDATE
        LIMIT 1
      `);

      const targetRoom = eligibleRooms && eligibleRooms[0];

      if (!targetRoom) {
        // FAIL GRACEFULLY: place student in standby queue
        JobQueue.enqueue('NOTIFICATION_JOB', {
          studentId: booking.studentId,
          title: 'Allocation Standby Queue',
          message: `No matching rooms available for ${gender} students in ${booking.hostel.name} at this time. You are placed in the standby allocation queue.`,
          severity: 'WARNING',
        });
        throw new Error(`Queue Standby: No matching rooms available for ${gender} students in this hostel.`);
      }

      // 4. Create allocation record
      const allocation = await tx.allocation.create({
        data: {
          bookingId,
          roomId: targetRoom.id,
        },
      });

      // 5. Increment occupancy safely (the room row is already locked via FOR UPDATE)
      await tx.room.update({
        where: { id: targetRoom.id },
        data: {
          currentOccupancy: {
            increment: 1,
          },
        },
      });

      // 6. Update booking status
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: 'ALLOCATED',
        },
      });

      // 7. Generate Notification Event via queue
      JobQueue.enqueue('NOTIFICATION_JOB', {
        studentId: booking.studentId,
        title: 'Room Allocated',
        message: `Room assignment successful! Room ${targetRoom.room_number || targetRoom.roomNumber} at ${booking.hostel.name} is allocated to you.`,
        severity: 'SUCCESS',
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
  static async allocateManually(bookingId: string, roomId: string, adminId: string, externalTx?: any) {
    const execute = async (tx: any) => {
      // Lock related booking row
      await tx.$executeRaw`SELECT 1 FROM bookings WHERE id = ${bookingId}::uuid FOR UPDATE`;

      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { student: true, hostel: true },
      });

      if (!booking) {
        throw new Error('Booking not found.');
      }

      // Lock student row
      await tx.$executeRaw`SELECT 1 FROM users WHERE id = ${booking.studentId}::uuid FOR UPDATE`;

      // Blocked student guard
      if (booking.student.status === 'BLOCKED') {
        throw new Error('Access Denied: Blocked students cannot be allocated rooms.');
      }

      // Precondition Check: payment must be VERIFIED
      if (booking.paymentStatus !== 'VERIFIED') {
        throw new Error('Precondition Failed: Allocation cannot happen unless payment is VERIFIED.');
      }

      // Lock target room row
      await tx.$executeRaw`SELECT 1 FROM rooms WHERE id = ${roomId}::uuid FOR UPDATE`;

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

      // 2. Validate strict gender segregation rules (room and building level)
      const studentGender = booking.student.gender;
      const expectedGenderRule = studentGender === 'MALE' ? 'MALE_ONLY' : 'FEMALE_ONLY';

      if (room.genderRule !== expectedGenderRule) {
        throw new Error(`Gender Rule Policy: Room gender (${room.genderRule}) mismatch for user gender (${studentGender}).`);
      }

      if (room.building.genderRule !== 'MIXED' && room.building.genderRule !== expectedGenderRule) {
        throw new Error(`Gender Rule Policy: Building gender (${room.building.genderRule}) mismatch for user gender (${studentGender}).`);
      }

      // 3. Clear existing active allocation if any
      const activeAlloc = await tx.allocation.findFirst({
        where: { bookingId, revokedAt: null },
      });

      if (activeAlloc) {
        // Lock old room row
        await tx.$executeRaw`SELECT 1 FROM rooms WHERE id = ${activeAlloc.roomId}::uuid FOR UPDATE`;

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

      // 7. Generate Notification Event via queue
      JobQueue.enqueue('NOTIFICATION_JOB', {
        studentId: booking.studentId,
        title: 'Room Allocated',
        message: `Room assignment successful! Room ${room.roomNumber} at ${booking.hostel.name} has been manually allocated to you.`,
        severity: 'SUCCESS',
      });

      return allocation;
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
   * Revoke an existing room assignment.
   */
  static async revokeAllocation(allocationId: string, adminId: string, reason: string = 'Revoked by admin', externalTx?: any) {
    const execute = async (tx: any) => {
      // STEP 1: Lock allocation row
      await tx.$executeRaw`SELECT 1 FROM allocations WHERE id = ${allocationId}::uuid FOR UPDATE`;

      const allocation = await tx.allocation.findUnique({
        where: { id: allocationId },
        include: { booking: { include: { hostel: true } } },
      });

      if (!allocation) {
        throw new Error('Allocation not found.');
      }

      if (allocation.revokedAt) {
        throw new Error('Already Revoked: This room allocation is already inactive.');
      }

      // STEP 2: Lock related booking row
      await tx.$executeRaw`SELECT 1 FROM bookings WHERE id = ${allocation.bookingId}::uuid FOR UPDATE`;

      // STEP 3: Lock room row
      await tx.$executeRaw`SELECT 1 FROM rooms WHERE id = ${allocation.roomId}::uuid FOR UPDATE`;

      // 1. Mark revoked
      const updatedAlloc = await tx.allocation.update({
        where: { id: allocationId },
        data: {
          revokedAt: new Date(),
          assignedByAdminId: adminId,
        },
      });

      // 2. Decrement occupancy safely
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

      // 4. Generate Notification Event via queue
      JobQueue.enqueue('NOTIFICATION_JOB', {
        studentId: allocation.booking.studentId,
        title: 'Room Allocation Revoked',
        message: `Your room allocation at ${allocation.booking.hostel.name} has been revoked by the hostel administrator. Reason: ${reason}.`,
        severity: 'WARNING',
      });

      return updatedAlloc;
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

export default AllocationService;
