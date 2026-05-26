import { prisma } from '../db';
import { AuditLogService } from '../audit/audit-log';
import { CampusLinkStateMachine, StudentState } from '../state-machine/campuslink-state-machine';
import { AllocationService } from '../services/allocation.service';
import { PaymentService } from '../services/payment.service';
import { NotificationService } from '../services/notification.service';
import { JobQueue } from '../queue/job-queue';
import { SystemHealthMonitor } from '../monitoring/system-health';
import { IntegrityChecker } from '../monitoring/integrity-checker';
import { systemEvents } from '../events/system-events';

// Types
export type AdminActionScope =
  | 'STUDENT_MANAGE'
  | 'PAYMENT_CONTROL'
  | 'ALLOCATION_CONTROL'
  | 'HOSTEL_MANAGE'
  | 'SYSTEM_OVERRIDE'
  | 'DASHBOARD_VIEW'
  | 'ALERT_MANAGE';

export interface SystemAlert {
  id: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  status: 'ACTIVE' | 'RESOLVED';
  type: 'ALLOCATION_FAILURE' | 'PAYMENT_BACKLOG' | 'INTEGRITY_ISSUE' | 'SYSTEM_OVERRIDE' | 'CUSTOM';
  createdAt: string;
  resolvedAt?: string;
}

// Global In-Memory Alert Registry
const globalAlertRegistry = globalThis as unknown as {
  systemAlerts: SystemAlert[];
};

if (!globalAlertRegistry.systemAlerts) {
  globalAlertRegistry.systemAlerts = [];
}

/**
 * 2. ADMIN AUTHORIZATION RULE
 * Every admin operation must validate:
 * - Admin user exists
 * - Role is strictly 'admin'
 * - Admin is active and not blocked
 */
export async function validateAdminAccess(adminId: string, actionType: AdminActionScope, tx?: any): Promise<any> {
  const client = tx || prisma;
  
  // STEP 1: Lock admin row to prevent concurrency issues
  if (tx) {
    await tx.$executeRaw`SELECT 1 FROM users WHERE id = ${adminId}::uuid FOR UPDATE`;
  }
  
  const admin = await client.user.findUnique({
    where: { id: adminId },
  });

  if (!admin) {
    throw new Error(`Access Denied: Admin user with ID ${adminId} does not exist.`);
  }

  if (admin.role !== 'admin') {
    throw new Error(`Access Denied: User ${adminId} has insufficient privileges (Role: ${admin.role}).`);
  }

  if (admin.status !== 'ACTIVE') {
    throw new Error(`Access Denied: Admin account ${adminId} is currently deactivated/BLOCKED.`);
  }

  return admin;
}

export class AdminControlService {
  // ==========================================
  // 3. STUDENT MANAGEMENT FUNCTIONS
  // ==========================================

  /**
   * Get all students with optional status, gender, campus, or query filters.
   */
  static async getAllStudents(
    adminId: string,
    filter?: { status?: 'ACTIVE' | 'BLOCKED'; gender?: 'MALE' | 'FEMALE'; campus?: string; query?: string }
  ) {
    await validateAdminAccess(adminId, 'STUDENT_MANAGE');

    const whereClause: any = { role: 'student' };

    if (filter?.status) {
      whereClause.status = filter.status;
    }
    if (filter?.gender) {
      whereClause.gender = filter.gender;
    }
    if (filter?.campus) {
      whereClause.profile = {
        campus: filter.campus,
      };
    }
    if (filter?.query) {
      whereClause.OR = [
        { email: { contains: filter.query, mode: 'insensitive' } },
        { fullName: { contains: filter.query, mode: 'insensitive' } },
        { studentId: { contains: filter.query, mode: 'insensitive' } },
      ];
    }

    return await prisma.user.findMany({
      where: whereClause,
      include: {
        profile: true,
        bookings: {
          orderBy: { createdAt: 'desc' },
          include: {
            payments: true,
            allocations: { where: { revokedAt: null } },
          },
        },
      },
    });
  }

  /**
   * Retrieve full details of a specific student.
   */
  static async getStudentById(adminId: string, studentId: string) {
    await validateAdminAccess(adminId, 'STUDENT_MANAGE');

    const student = await prisma.user.findUnique({
      where: { id: studentId, role: 'student' },
      include: {
        profile: true,
        bookings: {
          orderBy: { createdAt: 'desc' },
          include: {
            payments: { orderBy: { createdAt: 'desc' } },
            allocations: { include: { room: { include: { building: { include: { hostel: true } } } } } },
          },
        },
      },
    });

    if (!student) {
      throw new Error(`Student with ID ${studentId} not found.`);
    }

    return student;
  }

  /**
   * Block a student, cancelling their active bookings and revoking room occupancy.
   */
  static async blockStudent(adminId: string, studentId: string, reason: string) {
    await validateAdminAccess(adminId, 'STUDENT_MANAGE');
    
    // Prevent blocking already blocked users
    const student = await prisma.user.findUnique({ where: { id: studentId } });
    if (!student) {
      throw new Error(`Student not found: ${studentId}`);
    }
    if (student.status === 'BLOCKED') {
      throw new Error(`Conflict: Student ${studentId} is already BLOCKED.`);
    }

    await CampusLinkStateMachine.blockStudent(studentId, adminId, reason);
    
    // Create custom alert for the blocked student
    this.createSystemAlert(
      `Student ${student.fullName} (${student.studentId || studentId}) was blocked. Reason: ${reason}`,
      'WARNING',
      'CUSTOM'
    );
  }

  /**
   * Unblock a student profile.
   */
  static async unblockStudent(adminId: string, studentId: string) {
    await validateAdminAccess(adminId, 'STUDENT_MANAGE');

    return await prisma.$transaction(async (tx) => {
      // Lock student
      await tx.$executeRaw`SELECT 1 FROM users WHERE id = ${studentId}::uuid FOR UPDATE`;

      const student = await tx.user.findUnique({ where: { id: studentId } });
      if (!student) {
        throw new Error(`Student not found: ${studentId}`);
      }
      if (student.status === 'ACTIVE') {
        throw new Error(`Conflict: Student ${studentId} is already ACTIVE.`);
      }

      const priorState = await CampusLinkStateMachine.deriveStudentState(studentId, tx);

      const updatedUser = await tx.user.update({
        where: { id: studentId },
        data: { status: 'ACTIVE' },
      });

      // Audit transition
      await AuditLogService.logStateTransition(
        studentId,
        'student',
        priorState,
        'REGISTERED', // Reset back to clean starting point
        'admin',
        adminId,
        'Student profile unblocked manually'
      );

      // Notify user
      await NotificationService.sendNotification(
        studentId,
        'Account Reactivated',
        'Your CampusLink student portal account has been fully unblocked and reactivated.',
        'INFO'
      );

      return updatedUser;
    });
  }

  /**
   * Hard-reset student's bookings and allocations, resetting them to the clean starting state.
   */
  static async resetStudentBooking(adminId: string, studentId: string, reason: string) {
    await validateAdminAccess(adminId, 'STUDENT_MANAGE');

    return await prisma.$transaction(async (tx) => {
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

      const priorState = await CampusLinkStateMachine.deriveStudentState(studentId, tx);

      // Loop through and revoke active allocations & cancel bookings
      for (const booking of student.bookings) {
        await tx.$executeRaw`SELECT 1 FROM bookings WHERE id = ${booking.id}::uuid FOR UPDATE`;

        for (const allocation of booking.allocations) {
          await tx.$executeRaw`SELECT 1 FROM rooms WHERE id = ${allocation.roomId}::uuid FOR UPDATE`;

          // Revoke allocation
          await tx.allocation.update({
            where: { id: allocation.id },
            data: { revokedAt: new Date(), assignedByAdminId: adminId },
          });

          // Safely decrement room occupancy
          await tx.room.update({
            where: { id: allocation.roomId },
            data: { currentOccupancy: { decrement: 1 } },
          });
        }

        // Set booking to CANCELLED
        await tx.booking.update({
          where: { id: booking.id },
          data: { status: 'CANCELLED', paymentStatus: 'FAILED' },
        });
      }

      // Audit the operation
      await AuditLogService.logAudit({
        entityType: 'student',
        entityId: studentId,
        actionType: 'HARD_RESET_BOOKINGS',
        previousState: priorState,
        newState: 'REGISTERED',
        actor: 'admin',
        actorId: adminId,
        metadata: { reason },
      });

      // Send notification
      await NotificationService.sendNotification(
        studentId,
        'Booking Cycle Reset',
        `Your accommodation selection and booking records were reset by an administrator. Reason: ${reason}`,
        'ALERT'
      );

      return { success: true, priorState };
    });
  }

  // ==========================================
  // 4. PAYMENT CONTROL FUNCTIONS
  // ==========================================

  /**
   * Get all payments currently awaiting review.
   */
  static async getPendingPayments(adminId: string) {
    await validateAdminAccess(adminId, 'PAYMENT_CONTROL');

    return await prisma.payment.findMany({
      where: { status: 'PENDING' },
      include: {
        booking: {
          include: {
            student: {
              include: { profile: true },
            },
            hostel: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Verify a pending payment manually.
   */
  static async verifyPayment(adminId: string, paymentId: string) {
    await validateAdminAccess(adminId, 'PAYMENT_CONTROL');

    return await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT 1 FROM payments WHERE id = ${paymentId}::uuid FOR UPDATE`;
      
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: { booking: true },
      });

      if (!payment) {
        throw new Error(`Payment proof with ID ${paymentId} not found.`);
      }

      if (payment.status !== 'PENDING') {
        throw new Error(`Conflict: Payment is already in ${payment.status} state.`);
      }

      // Delegate to PaymentService to perform state transitions and updates
      return await PaymentService.verifyPayment(payment.bookingId, adminId, 'Verified manually by admin control service', tx);
    });
  }

  /**
   * Reject a payment manually.
   */
  static async rejectPayment(adminId: string, paymentId: string, reason: string) {
    await validateAdminAccess(adminId, 'PAYMENT_CONTROL');

    return await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT 1 FROM payments WHERE id = ${paymentId}::uuid FOR UPDATE`;

      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
      });

      if (!payment) {
        throw new Error(`Payment proof with ID ${paymentId} not found.`);
      }

      if (payment.status !== 'PENDING') {
        throw new Error(`Conflict: Payment is already in ${payment.status} state.`);
      }

      return await PaymentService.rejectPayment(payment.bookingId, adminId, reason, tx);
    });
  }

  /**
   * Force-override payment status directly (with safety state updates).
   */
  static async overridePaymentStatus(
    adminId: string,
    paymentId: string,
    status: 'PENDING' | 'VERIFIED' | 'FAILED',
    reason: string
  ) {
    await validateAdminAccess(adminId, 'PAYMENT_CONTROL');

    return await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT 1 FROM payments WHERE id = ${paymentId}::uuid FOR UPDATE`;

      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: { booking: true },
      });

      if (!payment) {
        throw new Error(`Payment with ID ${paymentId} not found.`);
      }

      const previousStatus = payment.status;
      if (previousStatus === status) {
        return payment;
      }

      // 1. Update Payment status
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: { status },
      });

      // 2. Align Booking state machine & payment status
      await tx.$executeRaw`SELECT 1 FROM bookings WHERE id = ${payment.bookingId}::uuid FOR UPDATE`;
      
      let mappedBookingStatus = payment.booking.status;
      let mappedPaymentStatus = payment.booking.paymentStatus;

      if (status === 'VERIFIED') {
        mappedBookingStatus = 'CONFIRMED';
        mappedPaymentStatus = 'VERIFIED';
      } else if (status === 'FAILED') {
        mappedBookingStatus = 'PENDING_PAYMENT';
        mappedPaymentStatus = 'FAILED';
      } else {
        mappedBookingStatus = 'PENDING_VERIFICATION';
        mappedPaymentStatus = 'PENDING_VERIFICATION';
      }

      await tx.booking.update({
        where: { id: payment.bookingId },
        data: {
          status: mappedBookingStatus,
          paymentStatus: mappedPaymentStatus,
        },
      });

      // 3. Re-derive and force transition studentState
      const studentState = await CampusLinkStateMachine.deriveStudentState(payment.booking.studentId, tx);

      await AuditLogService.logAudit({
        entityType: 'payment',
        entityId: paymentId,
        actionType: 'PAYMENT_STATUS_OVERRIDE',
        previousState: previousStatus,
        newState: status,
        actor: 'admin',
        actorId: adminId,
        metadata: { reason, bookingId: payment.bookingId, studentState },
      });

      // Notify
      await NotificationService.sendNotification(
        payment.booking.studentId,
        'Payment Status Overridden',
        `An administrator has updated your payment record status to ${status}. Reason: ${reason}`,
        status === 'VERIFIED' ? 'SUCCESS' : 'ALERT'
      );

      // If transition to VERIFIED, trigger auto allocation job
      if (status === 'VERIFIED') {
        JobQueue.enqueue('ALLOCATION_ENGINE_JOB', {
          bookingId: payment.bookingId,
          studentId: payment.booking.studentId,
        }, { priority: 'high' });
      }

      return updatedPayment;
    });
  }

  // ==========================================
  // 5. ALLOCATION CONTROL FUNCTIONS
  // ==========================================

  /**
   * Explicitly trigger the automatic room allocation engine.
   */
  static async runAutoAllocation(adminId: string) {
    await validateAdminAccess(adminId, 'ALLOCATION_CONTROL');

    const result = await AllocationService.runAllocationEngine();

    await AuditLogService.logAudit({
      entityType: 'system',
      entityId: 'allocation_engine',
      actionType: 'RUN_AUTO_ALLOCATION',
      previousState: 'IDLE',
      newState: 'RUNNING',
      actor: 'admin',
      actorId: adminId,
      metadata: result,
    });

    return result;
  }

  /**
   * Manually allocate a room to a student under standard constraints.
   */
  static async manualAllocate(adminId: string, studentId: string, roomId: string) {
    await validateAdminAccess(adminId, 'ALLOCATION_CONTROL');

    return await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT 1 FROM users WHERE id = ${studentId}::uuid FOR UPDATE`;

      const student = await tx.user.findUnique({
        where: { id: studentId },
        include: {
          bookings: {
            where: { status: { not: 'CANCELLED' } },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!student) {
        throw new Error(`Student ${studentId} not found.`);
      }

      const activeBooking = student.bookings[0];
      if (!activeBooking) {
        throw new Error(`Precondition Failed: Student has no active/uncancelled booking.`);
      }

      // Delegate to allocation service manually assigning room
      const allocation = await AllocationService.allocateManually(activeBooking.id, roomId, adminId, tx);

      // Audit logs automatically triggered inside State Machine transitions or custom
      await AuditLogService.logAudit({
        entityType: 'allocation',
        entityId: allocation.id,
        actionType: 'MANUAL_ALLOCATION',
        previousState: 'ALLOCATION_QUEUED',
        newState: 'ALLOCATED',
        actor: 'admin',
        actorId: adminId,
        metadata: { studentId, roomId, bookingId: activeBooking.id },
      });

      return allocation;
    });
  }

  /**
   * Reassign a student's active room allocation to a new room atomically.
   */
  static async reassignRoom(adminId: string, allocationId: string, newRoomId: string) {
    await validateAdminAccess(adminId, 'ALLOCATION_CONTROL');

    return await prisma.$transaction(async (tx) => {
      // STEP 1: Lock allocation row
      await tx.$executeRaw`SELECT 1 FROM allocations WHERE id = ${allocationId}::uuid FOR UPDATE`;

      const allocation = await tx.allocation.findUnique({
        where: { id: allocationId },
        include: {
          booking: {
            include: { student: true, hostel: true },
          },
        },
      });

      if (!allocation) {
        throw new Error(`Allocation with ID ${allocationId} not found.`);
      }

      if (allocation.revokedAt) {
        throw new Error('Precondition Failed: Cannot reassign an already inactive/revoked allocation.');
      }

      const oldRoomId = allocation.roomId;
      if (oldRoomId === newRoomId) {
        return allocation;
      }

      // STEP 2: Lock old and new room rows to prevent race conditions
      await tx.$executeRaw`SELECT 1 FROM rooms WHERE id = ${oldRoomId}::uuid FOR UPDATE`;
      await tx.$executeRaw`SELECT 1 FROM rooms WHERE id = ${newRoomId}::uuid FOR UPDATE`;

      const oldRoom = await tx.room.findUnique({ where: { id: oldRoomId } });
      const newRoom = await tx.room.findUnique({ where: { id: newRoomId }, include: { building: true } });

      if (!oldRoom || !newRoom) {
        throw new Error('Room details mismatch (either old or new room was not found).');
      }

      // Validate capacity bounds of new room
      if (newRoom.currentOccupancy >= newRoom.capacity) {
        throw new Error(`Unavailable: New selected room ${newRoom.roomNumber} is at maximum capacity.`);
      }

      // Validate gender rule policy
      const gender = allocation.booking.student.gender;
      const expectedGenderRule = gender === 'MALE' ? 'MALE_ONLY' : 'FEMALE_ONLY';

      if (newRoom.genderRule !== expectedGenderRule) {
        throw new Error(`Gender Rule Policy Mismatch: Room gender rule (${newRoom.genderRule}) does not fit student gender (${gender}).`);
      }

      if (newRoom.building.genderRule !== 'MIXED' && newRoom.building.genderRule !== expectedGenderRule) {
        throw new Error(`Gender Rule Policy Mismatch: Building gender rule (${newRoom.building.genderRule}) does not fit student gender (${gender}).`);
      }

      // STEP 3: Perform updates atomically
      // Decrement old occupancy
      await tx.room.update({
        where: { id: oldRoomId },
        data: { currentOccupancy: { decrement: 1 } },
      });

      // Increment new occupancy
      await tx.room.update({
        where: { id: newRoomId },
        data: { currentOccupancy: { increment: 1 } },
      });

      // Update allocation
      const updatedAllocation = await tx.allocation.update({
        where: { id: allocationId },
        data: {
          roomId: newRoomId,
          assignedByAdminId: adminId,
        },
      });

      // Audit Log
      await AuditLogService.logAudit({
        entityType: 'allocation',
        entityId: allocationId,
        actionType: 'REASSIGN_ROOM',
        previousState: `Room#${oldRoom.roomNumber}`,
        newState: `Room#${newRoom.roomNumber}`,
        actor: 'admin',
        actorId: adminId,
        metadata: { studentId: allocation.booking.studentId, oldRoomId, newRoomId },
      });

      // Notify Student
      await NotificationService.sendNotification(
        allocation.booking.studentId,
        'Room Allocation Reassigned',
        `Your room allocation at ${allocation.booking.hostel.name} was updated. You have been moved to Room ${newRoom.roomNumber}.`,
        'INFO'
      );

      return updatedAllocation;
    });
  }

  /**
   * Revoke an active room allocation safely.
   */
  static async revokeAllocation(adminId: string, allocationId: string, reason: string) {
    await validateAdminAccess(adminId, 'ALLOCATION_CONTROL');
    
    // Prevent double revocation
    const alloc = await prisma.allocation.findUnique({ where: { id: allocationId } });
    if (!alloc) {
      throw new Error(`Allocation with ID ${allocationId} not found.`);
    }
    if (alloc.revokedAt) {
      throw new Error('Conflict: Allocation is already revoked.');
    }

    const updatedAllocation = await AllocationService.revokeAllocation(allocationId, adminId, reason);

    await AuditLogService.logAudit({
      entityType: 'allocation',
      entityId: allocationId,
      actionType: 'REVOKE_ALLOCATION',
      previousState: 'ALLOCATED',
      newState: 'CONFIRMED',
      actor: 'admin',
      actorId: adminId,
      metadata: { reason },
    });

    return updatedAllocation;
  }

  // ==========================================
  // 6. HOSTEL MANAGEMENT FUNCTIONS
  // ==========================================

  /**
   * Register a new hostel in the database.
   */
  static async createHostel(
    adminId: string,
    data: {
      name: string;
      description?: string;
      campus?: string;
      locationArea: string;
      distanceFromCampus?: string;
      genderRule?: 'MIXED' | 'MALE_ONLY' | 'FEMALE_ONLY';
      coverImage?: string;
    }
  ) {
    await validateAdminAccess(adminId, 'HOSTEL_MANAGE');

    const newHostel = await prisma.hostel.create({
      data: {
        name: data.name,
        description: data.description || null,
        campus: data.campus || 'GCTU',
        locationArea: data.locationArea,
        distanceFromCampus: data.distanceFromCampus || null,
        genderRule: data.genderRule || 'MIXED',
        coverImage: data.coverImage || null,
      },
    });

    await AuditLogService.logAudit({
      entityType: 'system',
      entityId: newHostel.id,
      actionType: 'CREATE_HOSTEL',
      previousState: 'NONE',
      newState: 'CREATED',
      actor: 'admin',
      actorId: adminId,
      metadata: data,
    });

    return newHostel;
  }

  /**
   * Update hostel details.
   */
  static async updateHostel(adminId: string, hostelId: string, data: any) {
    await validateAdminAccess(adminId, 'HOSTEL_MANAGE');

    const updated = await prisma.hostel.update({
      where: { id: hostelId },
      data,
    });

    await AuditLogService.logAudit({
      entityType: 'system',
      entityId: hostelId,
      actionType: 'UPDATE_HOSTEL',
      previousState: 'ACTIVE',
      newState: 'UPDATED',
      actor: 'admin',
      actorId: adminId,
      metadata: data,
    });

    return updated;
  }

  /**
   * Disable bookings on a hostel.
   */
  static async disableHostel(adminId: string, hostelId: string) {
    await validateAdminAccess(adminId, 'HOSTEL_MANAGE');

    const updated = await prisma.hostel.update({
      where: { id: hostelId },
      data: { bookingEnabled: false },
    });

    await AuditLogService.logAudit({
      entityType: 'system',
      entityId: hostelId,
      actionType: 'DISABLE_HOSTEL',
      previousState: 'ENABLED',
      newState: 'DISABLED',
      actor: 'admin',
      actorId: adminId,
    });

    return updated;
  }

  /**
   * Enable bookings on a hostel.
   */
  static async enableHostel(adminId: string, hostelId: string) {
    await validateAdminAccess(adminId, 'HOSTEL_MANAGE');

    const updated = await prisma.hostel.update({
      where: { id: hostelId },
      data: { bookingEnabled: true },
    });

    await AuditLogService.logAudit({
      entityType: 'system',
      entityId: hostelId,
      actionType: 'ENABLE_HOSTEL',
      previousState: 'DISABLED',
      newState: 'ENABLED',
      actor: 'admin',
      actorId: adminId,
    });

    return updated;
  }

  /**
   * Update the rules on a specific building structure.
   */
  static async updateBuildingRules(
    adminId: string,
    buildingId: string,
    rules: { genderRule?: 'MIXED' | 'MALE_ONLY' | 'FEMALE_ONLY'; bookingEnabled?: boolean }
  ) {
    await validateAdminAccess(adminId, 'HOSTEL_MANAGE');

    const updated = await prisma.building.update({
      where: { id: buildingId },
      data: rules,
    });

    await AuditLogService.logAudit({
      entityType: 'system',
      entityId: buildingId,
      actionType: 'UPDATE_BUILDING_RULES',
      previousState: 'ACTIVE',
      newState: 'RULES_UPDATED',
      actor: 'admin',
      actorId: adminId,
      metadata: rules,
    });

    return updated;
  }

  // ==========================================
  // 7. SYSTEM OVERRIDE FUNCTIONS (HIGH RISK)
  // ==========================================

  /**
   * Force allocation bypassing capacity rules and gender rule policies.
   */
  static async forceAllocate(adminId: string, studentId: string, roomId: string, reason: string) {
    await validateAdminAccess(adminId, 'SYSTEM_OVERRIDE');

    if (!reason || reason.trim().length < 5) {
      throw new Error('System Override Denied: A detailed overriding reason is strictly required.');
    }

    return await prisma.$transaction(async (tx) => {
      // Lock student
      await tx.$executeRaw`SELECT 1 FROM users WHERE id = ${studentId}::uuid FOR UPDATE`;

      const student = await tx.user.findUnique({
        where: { id: studentId },
        include: {
          bookings: {
            where: { status: { not: 'CANCELLED' } },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!student) {
        throw new Error(`Student ${studentId} not found.`);
      }

      const activeBooking = student.bookings[0];
      if (!activeBooking) {
        throw new Error(`Precondition Failed: Student has no active booking to assign room to.`);
      }

      // Lock room
      await tx.$executeRaw`SELECT 1 FROM rooms WHERE id = ${roomId}::uuid FOR UPDATE`;
      const room = await tx.room.findUnique({ where: { id: roomId } });

      if (!room) {
        throw new Error(`Room with ID ${roomId} not found.`);
      }

      // Revoke any existing active allocations
      const activeAlloc = await tx.allocation.findFirst({
        where: { bookingId: activeBooking.id, revokedAt: null },
      });

      if (activeAlloc) {
        await tx.$executeRaw`SELECT 1 FROM rooms WHERE id = ${activeAlloc.roomId}::uuid FOR UPDATE`;

        await tx.allocation.update({
          where: { id: activeAlloc.id },
          data: { revokedAt: new Date(), assignedByAdminId: adminId },
        });

        await tx.room.update({
          where: { id: activeAlloc.roomId },
          data: { currentOccupancy: { decrement: 1 } },
        });
      }

      // Force increment occupancy (ignores capacity checks!)
      await tx.room.update({
        where: { id: roomId },
        data: { currentOccupancy: { increment: 1 } },
      });

      // Force assign allocation
      const allocation = await tx.allocation.create({
        data: {
          bookingId: activeBooking.id,
          roomId,
          assignedByAdminId: adminId,
        },
      });

      // Force state to ALLOCATED / transition
      await tx.booking.update({
        where: { id: activeBooking.id },
        data: { status: 'ALLOCATED' },
      });

      await CampusLinkStateMachine.transitionStudentState(
        studentId,
        'ALLOCATED',
        { actor: 'admin', actorId: adminId, reason: `CRITICAL FORCE ALLOCATION OVERRIDE: ${reason}` },
        tx
      );

      // Dispatch real time alerts
      this.createSystemAlert(
        `Critical Override: User ${student.fullName} was FORCED into room ${room.roomNumber}. Reason: ${reason}`,
        'CRITICAL',
        'SYSTEM_OVERRIDE'
      );

      return allocation;
    });
  }

  /**
   * Force revoke any active allocation regardless of normal flow restrictions.
   */
  static async forceRevokeAllocation(adminId: string, allocationId: string, reason: string) {
    await validateAdminAccess(adminId, 'SYSTEM_OVERRIDE');

    if (!reason || reason.trim().length < 5) {
      throw new Error('System Override Denied: A detailed overriding reason is strictly required.');
    }

    return await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT 1 FROM allocations WHERE id = ${allocationId}::uuid FOR UPDATE`;

      const allocation = await tx.allocation.findUnique({
        where: { id: allocationId },
        include: { booking: true },
      });

      if (!allocation) {
        throw new Error(`Allocation with ID ${allocationId} not found.`);
      }

      const alreadyRevoked = allocation.revokedAt !== null;

      await tx.$executeRaw`SELECT 1 FROM rooms WHERE id = ${allocation.roomId}::uuid FOR UPDATE`;

      const updated = await tx.allocation.update({
        where: { id: allocationId },
        data: {
          revokedAt: new Date(),
          assignedByAdminId: adminId,
        },
      });

      if (!alreadyRevoked) {
        await tx.room.update({
          where: { id: allocation.roomId },
          data: { currentOccupancy: { decrement: 1 } },
        });
      }

      await tx.$executeRaw`SELECT 1 FROM bookings WHERE id = ${allocation.bookingId}::uuid FOR UPDATE`;

      await tx.booking.update({
        where: { id: allocation.bookingId },
        data: { status: 'CONFIRMED' }, // Set booking back to queue status
      });

      // Audit Override
      await AuditLogService.logAudit({
        entityType: 'allocation',
        entityId: allocationId,
        actionType: 'FORCE_REVOKE_ALLOCATION',
        previousState: alreadyRevoked ? 'REVOKED' : 'ALLOCATED',
        newState: 'REVOKED_FORCE',
        actor: 'admin',
        actorId: adminId,
        metadata: { reason },
      });

      this.createSystemAlert(
        `Critical Override: Allocation ${allocationId} was FORCE revoked. Reason: ${reason}`,
        'WARNING',
        'SYSTEM_OVERRIDE'
      );

      return updated;
    });
  }

  /**
   * Emergency reset system entities (highly high-risk!).
   */
  static async emergencyResetSystem(
    adminId: string,
    entityType: 'allocations' | 'payments' | 'bookings' | 'all',
    reason: string
  ) {
    await validateAdminAccess(adminId, 'SYSTEM_OVERRIDE');

    if (!reason || reason.trim().length < 10) {
      throw new Error('System Override Denied: A comprehensive justification (>10 characters) is required for emergency resets.');
    }

    const report = {
      allocationsRevoked: 0,
      paymentsFailed: 0,
      bookingsCancelled: 0,
      timestamp: new Date().toISOString(),
    };

    await prisma.$transaction(async (tx) => {
      // 1. Reset room allocations
      if (entityType === 'allocations' || entityType === 'all') {
        const activeAllocations = await tx.allocation.findMany({
          where: { revokedAt: null },
        });

        report.allocationsRevoked = activeAllocations.length;

        for (const alloc of activeAllocations) {
          await tx.allocation.update({
            where: { id: alloc.id },
            data: { revokedAt: new Date(), assignedByAdminId: adminId },
          });
        }

        // Set all room occupancies to 0
        await tx.room.updateMany({
          data: { currentOccupancy: 0 },
        });
      }

      // 2. Fail pending payments
      if (entityType === 'payments' || entityType === 'all') {
        const pendingPayments = await tx.payment.findMany({
          where: { status: 'PENDING' },
        });

        report.paymentsFailed = pendingPayments.length;

        await tx.payment.updateMany({
          where: { status: 'PENDING' },
          data: { status: 'FAILED' },
        });
      }

      // 3. Cancel bookings
      if (entityType === 'bookings' || entityType === 'all') {
        const activeBookings = await tx.booking.findMany({
          where: { status: { not: 'CANCELLED' } },
        });

        report.bookingsCancelled = activeBookings.length;

        await tx.booking.updateMany({
          where: { status: { not: 'CANCELLED' } },
          data: { status: 'CANCELLED', paymentStatus: 'FAILED' },
        });
      }

      // Log highly critical audit trail
      await AuditLogService.logAudit({
        entityType: 'system',
        entityId: 'production_database',
        actionType: `EMERGENCY_RESET_${entityType.toUpperCase()}`,
        previousState: 'OPERATIONAL',
        newState: 'SYSTEM_RESET',
        actor: 'admin',
        actorId: adminId,
        metadata: { reason, report },
      });

      this.createSystemAlert(
        `EMERGENCY SYSTEM RESET triggered on '${entityType}'. Stats: ${JSON.stringify(report)}. Reason: ${reason}`,
        'CRITICAL',
        'SYSTEM_OVERRIDE'
      );
    });

    return report;
  }

  // ==========================================
  // 8. DASHBOARD DATA PROVIDERS
  // ==========================================

  /**
   * Return high level counts and key metrics of the system.
   */
  static async getDashboardSummary(adminId: string) {
    await validateAdminAccess(adminId, 'DASHBOARD_VIEW');

    const totalStudents = await prisma.user.count({ where: { role: 'student' } });
    const blockedStudents = await prisma.user.count({ where: { role: 'student', status: 'BLOCKED' } });
    const activeAllocations = await prisma.allocation.count({ where: { revokedAt: null } });
    const pendingPayments = await prisma.payment.count({ where: { status: 'PENDING' } });
    
    const rooms = await prisma.room.findMany({ select: { capacity: true, currentOccupancy: true } });
    const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0);
    const totalOccupied = rooms.reduce((sum, r) => sum + r.currentOccupancy, 0);
    const occupancyPercentage = totalCapacity > 0 ? (totalOccupied / totalCapacity) * 100 : 0;

    const activeAlertsCount = this.getActiveAlertsSync().length;

    return {
      totalStudents,
      blockedStudents,
      activeAllocations,
      pendingPayments,
      occupancyPercentage,
      totalCapacity,
      totalOccupied,
      activeAlertsCount,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Returns precise metrics regarding allocations.
   */
  static async getAllocationMetrics(adminId: string) {
    await validateAdminAccess(adminId, 'DASHBOARD_VIEW');

    const totalAllocationsCreated = await prisma.allocation.count();
    const activeAllocations = await prisma.allocation.count({ where: { revokedAt: null } });
    const revokedCount = totalAllocationsCreated - activeAllocations;
    const allocationRate = totalAllocationsCreated > 0 ? (activeAllocations / totalAllocationsCreated) * 100 : 0;

    const healthMetrics = await SystemHealthMonitor.getHealthMetrics();

    return {
      totalAllocationsCreated,
      activeAllocations,
      revokedCount,
      allocationSuccessRatePercent: allocationRate,
      averageAllocationTimeMs: healthMetrics.averageAllocationTimeMs,
      queueBacklogSize: healthMetrics.queueBacklogSize,
    };
  }

  /**
   * Returns details of money flow and payment actions.
   */
  static async getPaymentMetrics(adminId: string) {
    await validateAdminAccess(adminId, 'DASHBOARD_VIEW');

    const totalPayments = await prisma.payment.count();
    const verifiedCount = await prisma.payment.count({ where: { status: 'VERIFIED' } });
    const pendingCount = await prisma.payment.count({ where: { status: 'PENDING' } });
    const failedCount = await prisma.payment.count({ where: { status: 'FAILED' } });

    const onlinePayments = await prisma.payment.count({ where: { method: 'ONLINE' } });
    const bankPayments = await prisma.payment.count({ where: { method: 'BANK' } });
    const cashPayments = await prisma.payment.count({ where: { method: 'CASH' } });

    const healthMetrics = await SystemHealthMonitor.getHealthMetrics();

    return {
      totalPayments,
      verifiedCount,
      pendingCount,
      failedCount,
      rejectionRatePercent: totalPayments > 0 ? (failedCount / totalPayments) * 100 : 0,
      distribution: {
        online: onlinePayments,
        bank: bankPayments,
        cash: cashPayments,
      },
      averageVerificationTimeMs: healthMetrics.paymentVerificationDelayMs,
    };
  }

  /**
   * Returns detailed occupancy information for every hostel registered.
   */
  static async getHostelOccupancyStats(adminId: string) {
    await validateAdminAccess(adminId, 'DASHBOARD_VIEW');

    const hostels = await prisma.hostel.findMany({
      include: {
        buildings: {
          include: {
            rooms: {
              include: {
                allocations: {
                  where: { revokedAt: null },
                  include: {
                    booking: {
                      include: {
                        student: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return hostels.map((hostel) => {
      let totalCapacity = 0;
      let occupiedRooms = 0;
      let maleOccupants = 0;
      let femaleOccupants = 0;

      for (const building of hostel.buildings) {
        for (const room of building.rooms) {
          totalCapacity += room.capacity;
          occupiedRooms += room.currentOccupancy;

          // Gender segregation distribution
          for (const alloc of room.allocations) {
            if (alloc.booking.student.gender === 'MALE') {
              maleOccupants++;
            } else if (alloc.booking.student.gender === 'FEMALE') {
              femaleOccupants++;
            }
          }
        }
      }

      return {
        hostelId: hostel.id,
        hostelName: hostel.name,
        location: hostel.locationArea,
        genderRule: hostel.genderRule,
        bookingEnabled: hostel.bookingEnabled,
        totalCapacity,
        occupiedRooms,
        occupancyPercentage: totalCapacity > 0 ? (occupiedRooms / totalCapacity) * 100 : 0,
        distribution: {
          male: maleOccupants,
          female: femaleOccupants,
        },
      };
    });
  }

  /**
   * Scans system health and integrity parameters to list alerts.
   */
  static async getSystemAlerts(adminId: string) {
    await validateAdminAccess(adminId, 'DASHBOARD_VIEW');
    return await this.getActiveAlerts(adminId);
  }

  // ==========================================
  // 9. ALERT SYSTEM FOR ADMINS
  // ==========================================

  /**
   * Sync scanner helper.
   */
  private static getActiveAlertsSync(): SystemAlert[] {
    return globalAlertRegistry.systemAlerts.filter((alert) => alert.status === 'ACTIVE');
  }

  /**
   * Retrieves active alerts and automatically runs background integrity scans to inject alerts.
   */
  static async getActiveAlerts(adminId: string): Promise<SystemAlert[]> {
    await validateAdminAccess(adminId, 'ALERT_MANAGE');

    // 1. Run dynamic integrity check
    const checker = await IntegrityChecker.runIntegrityCheck();
    if (!checker.success) {
      for (const issue of checker.issues) {
        const alertMsg = `[INTEGRITY ERROR] ${issue.type} detected on ${issue.affectedEntityId}: ${issue.description}`;
        
        // Prevent duplicate alerts of same entity & type
        const exists = globalAlertRegistry.systemAlerts.some(
          (a) => a.status === 'ACTIVE' && a.message.includes(issue.affectedEntityId) && a.type === 'INTEGRITY_ISSUE'
        );

        if (!exists) {
          this.createSystemAlertInternal(alertMsg, issue.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING', 'INTEGRITY_ISSUE');
        }
      }
    }

    // 2. Check pending payments backlog (older than 24 hours)
    const criticalBacklogLimit = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const delayedPayments = await prisma.payment.findMany({
      where: {
        status: 'PENDING',
        createdAt: { lt: criticalBacklogLimit },
      },
    });

    if (delayedPayments.length > 0) {
      const msg = `Payment Backlog Alert: ${delayedPayments.length} bank verification slip(s) have been pending for > 24 hours.`;
      const exists = globalAlertRegistry.systemAlerts.some(
        (a) => a.status === 'ACTIVE' && a.type === 'PAYMENT_BACKLOG'
      );
      if (!exists) {
        this.createSystemAlertInternal(msg, 'WARNING', 'PAYMENT_BACKLOG');
      }
    }

    return this.getActiveAlertsSync();
  }

  /**
   * Create an alert internally.
   */
  private static createSystemAlertInternal(
    message: string,
    severity: 'INFO' | 'WARNING' | 'CRITICAL',
    type: 'ALLOCATION_FAILURE' | 'PAYMENT_BACKLOG' | 'INTEGRITY_ISSUE' | 'SYSTEM_OVERRIDE' | 'CUSTOM'
  ): SystemAlert {
    const alert: SystemAlert = {
      id: Math.random().toString(36).substring(2, 11),
      message,
      severity,
      status: 'ACTIVE',
      type,
      createdAt: new Date().toISOString(),
    };
    globalAlertRegistry.systemAlerts.push(alert);
    return alert;
  }

  /**
   * Public function to create custom alerts.
   */
  static createSystemAlert(
    message: string,
    severity: 'INFO' | 'WARNING' | 'CRITICAL',
    type: 'ALLOCATION_FAILURE' | 'PAYMENT_BACKLOG' | 'INTEGRITY_ISSUE' | 'SYSTEM_OVERRIDE' | 'CUSTOM' = 'CUSTOM'
  ): SystemAlert {
    // Audit logs for manual creations if needed can be added.
    return this.createSystemAlertInternal(message, severity, type);
  }

  /**
   * Mark an active alert as RESOLVED.
   */
  static async resolveAlert(adminId: string, alertId: string) {
    await validateAdminAccess(adminId, 'ALERT_MANAGE');

    const alert = globalAlertRegistry.systemAlerts.find((a) => a.id === alertId);
    if (!alert) {
      throw new Error(`System Alert with ID ${alertId} not found.`);
    }

    if (alert.status === 'RESOLVED') {
      return alert;
    }

    alert.status = 'RESOLVED';
    alert.resolvedAt = new Date().toISOString();

    await AuditLogService.logAudit({
      entityType: 'system',
      entityId: alertId,
      actionType: 'RESOLVE_ALERT',
      previousState: 'ACTIVE',
      newState: 'RESOLVED',
      actor: 'admin',
      actorId: adminId,
      metadata: { alert },
    });

    return alert;
  }
}

export default AdminControlService;
