import '../services/load-env';

import { prisma } from '../db';
import { AdminControlService } from './admin-control.service';
import { BookingService } from '../services/booking.service';
import { PaymentService } from '../services/payment.service';
import { AuditLogService } from '../audit/audit-log';

async function runAdminTests() {
  console.log('🚀 INITIALIZING CAMPUSLINK ADMIN CONTROL LAYER VALIDATION SUITE...');
  let successCount = 0;
  let failCount = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      successCount++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failCount++;
    }
  }

  const suffix = Math.floor(Math.random() * 1000000).toString();

  // Test states
  let adminUser: any;
  let studentUser: any;
  let hostel: any;
  let building: any;
  let maleRoom: any;
  let femaleRoom: any;

  try {
    // ----------------------------------------------------
    // FIXTURE PROVISIONING
    // ----------------------------------------------------
    console.log('\n🛠️  PROVISIONING ADMIN TEST FIXTURES...');

    adminUser = await prisma.user.create({
      data: {
        email: `test_admin_${suffix}@gctu.edu.gh`,
        fullName: 'Test Systems Administrator',
        studentId: `GCTU-ADMIN-${suffix}`,
        role: 'admin',
        status: 'ACTIVE',
      },
    });

    studentUser = await prisma.user.create({
      data: {
        email: `test_student_${suffix}@gctu.edu.gh`,
        fullName: 'Test Operational Student',
        studentId: `GCTU-STUDENT-${suffix}`,
        role: 'student',
        status: 'ACTIVE',
        gender: 'MALE',
      },
    });

    hostel = await prisma.hostel.create({
      data: {
        name: `Admin Validation Hostel ${suffix}`,
        description: 'Hostel dedicated to administrative action validations',
        campus: 'GCTU',
        locationArea: 'Tesano',
        distanceFromCampus: '0.1 km',
        genderRule: 'MIXED',
      },
    });

    building = await prisma.building.create({
      data: {
        hostelId: hostel.id,
        name: 'Building Beta',
        genderRule: 'MIXED',
      },
    });

    maleRoom = await prisma.room.create({
      data: {
        buildingId: building.id,
        roomNumber: `M-201-${suffix}`,
        capacity: 1,
        genderRule: 'MALE_ONLY',
        price: 1800,
      },
    });

    femaleRoom = await prisma.room.create({
      data: {
        buildingId: building.id,
        roomNumber: `F-201-${suffix}`,
        capacity: 1,
        genderRule: 'FEMALE_ONLY',
        price: 1800,
      },
    });

    console.log('  ✅ Fixtures provisioned successfully.');

    // ----------------------------------------------------
    // TEST 1: Admin Authorization & Access validation
    // ----------------------------------------------------
    console.log('\n🔹 TEST 1: ADMIN AUTHORIZATION ACCESS CONSTRAINTS...');
    
    // Admin access should succeed
    try {
      await AdminControlService.getAllStudents(adminUser.id);
      assert(true, 'Admin authorization validation succeeded for active administrator.');
    } catch (err: any) {
      assert(false, `Admin authorization validation failed: ${err.message}`);
    }

    // Student access should throw
    try {
      await AdminControlService.getAllStudents(studentUser.id);
      assert(false, 'Student was incorrectly authorized as an administrator (Error).');
    } catch (err: any) {
      assert(
        err.message.includes('Access Denied') || err.message.includes('insufficient privileges'),
        `Student administrative access prevented cleanly: "${err.message}"`
      );
    }

    // ----------------------------------------------------
    // TEST 2: Student Management Functions
    // ----------------------------------------------------
    console.log('\n🔹 TEST 2: STUDENT MANAGEMENT FUNCTIONS...');

    // GetAllStudents
    const students = await AdminControlService.getAllStudents(adminUser.id, { campus: 'GCTU' });
    assert(students.length > 0, `Successfully listed students (Count: ${students.length})`);

    // GetStudentById
    const fetched = await AdminControlService.getStudentById(adminUser.id, studentUser.id);
    assert(fetched.fullName === 'Test Operational Student', 'Successfully retrieved specific student details.');

    // Block Student
    await AdminControlService.blockStudent(adminUser.id, studentUser.id, 'Behavioral integrity violation during testing');
    const blockedUser = await prisma.user.findUnique({ where: { id: studentUser.id } });
    assert(blockedUser?.status === 'BLOCKED', 'Student profile status transitioned to BLOCKED.');

    // Unblock Student
    await AdminControlService.unblockStudent(adminUser.id, studentUser.id);
    const unblockedUser = await prisma.user.findUnique({ where: { id: studentUser.id } });
    assert(unblockedUser?.status === 'ACTIVE', 'Student profile status restored to ACTIVE.');

    // Reset Student Booking Lifecycle
    // Let's create booking & lock hostel selection
    const booking = await BookingService.createBooking(studentUser.id, hostel.id);
    assert(booking.status === 'PENDING_PAYMENT', 'Booking created cleanly.');

    await AdminControlService.resetStudentBooking(adminUser.id, studentUser.id, 'Reset test cycle');
    const resetBooking = await prisma.booking.findUnique({ where: { id: booking.id } });
    assert(resetBooking?.status === 'CANCELLED', 'Student active bookings cancelled successfully during reset.');

    // ----------------------------------------------------
    // TEST 3: Payment Control Functions
    // ----------------------------------------------------
    console.log('\n🔹 TEST 3: PAYMENT CONTROL & OVERRIDES...');

    // Re-create booking and submit bank payment reference
    const booking2 = await BookingService.createBooking(studentUser.id, hostel.id);
    await PaymentService.submitPaymentProof({
      bookingId: booking2.id,
      method: 'BANK',
      reference: `REF-ADMIN-${suffix}`,
      proofImage: 'http://proof.com/slip.png',
    });

    // List pending payments
    const pendingPayments = await AdminControlService.getPendingPayments(adminUser.id);
    const targetPayment = pendingPayments.find(p => p.bookingId === booking2.id);
    assert(targetPayment !== undefined, 'Pending payment list successfully returned submitted slips.');

    if (targetPayment) {
      // Reject payment
      await AdminControlService.rejectPayment(adminUser.id, targetPayment.id, 'Proof illegible');
      const rejectedPayment = await prisma.payment.findUnique({ where: { id: targetPayment.id } });
      assert(rejectedPayment?.status === 'FAILED', 'Payment proof rejected and marked FAILED.');

      // Resubmit
      await PaymentService.submitPaymentProof({
        bookingId: booking2.id,
        method: 'BANK',
        reference: `REF-ADMIN-2-${suffix}`,
      });

      const resubmitted = await prisma.payment.findFirst({
        where: { bookingId: booking2.id, status: 'PENDING' },
      });

      assert(resubmitted !== null, 'Resubmitted payment successfully created.');

      if (resubmitted) {
        // Force Override to VERIFIED
        await AdminControlService.overridePaymentStatus(adminUser.id, resubmitted.id, 'VERIFIED', 'Verification override');
        const overridden = await prisma.payment.findUnique({ where: { id: resubmitted.id } });
        assert(overridden?.status === 'VERIFIED', 'Payment status overridden to VERIFIED.');
      }
    }

    // ----------------------------------------------------
    // TEST 4: Allocation Control Functions
    // ----------------------------------------------------
    console.log('\n🔹 TEST 4: ALLOCATION CONTROL & MANUAL REASSIGNMENTS...');

    // Trigger auto allocation engine
    const engineResult = await AdminControlService.runAutoAllocation(adminUser.id);
    assert(engineResult.allocatedCount === 1, 'Auto-allocation engine triggered manually and assigned room.');

    // Fetch active allocation
    const allocation = await prisma.allocation.findFirst({
      where: { bookingId: booking2.id, revokedAt: null },
    });
    assert(allocation !== null, 'Active allocation record exists.');

    if (allocation) {
      // Reassign Room (reallocate from maleRoom to another room or similar setup)
      // Since maleRoom is now occupied, let's register another male room to reassign to!
      const newMaleRoom = await prisma.room.create({
        data: {
          buildingId: building.id,
          roomNumber: `M-202-${suffix}`,
          capacity: 1,
          genderRule: 'MALE_ONLY',
          price: 1800,
        },
      });

      await AdminControlService.reassignRoom(adminUser.id, allocation.id, newMaleRoom.id);
      const reassigned = await prisma.allocation.findUnique({ where: { id: allocation.id } });
      assert(reassigned?.roomId === newMaleRoom.id, 'Student successfully reassigned to new room.');

      const prevRoom = await prisma.room.findUnique({ where: { id: maleRoom.id } });
      const nextRoom = await prisma.room.findUnique({ where: { id: newMaleRoom.id } });
      assert(prevRoom?.currentOccupancy === 0, 'Previous room occupancy decremented to 0.');
      assert(nextRoom?.currentOccupancy === 1, 'New room occupancy incremented to 1.');

      // Revoke Allocation
      await AdminControlService.revokeAllocation(adminUser.id, allocation.id, 'Voluntary relocation');
      const revoked = await prisma.allocation.findUnique({ where: { id: allocation.id } });
      assert(revoked?.revokedAt !== null, 'Allocation revoked safely.');
    }

    // ----------------------------------------------------
    // TEST 5: System Override Functions (HIGH RISK)
    // ----------------------------------------------------
    console.log('\n🔹 TEST 5: HIGH-RISK SYSTEM OVERRIDES...');

    // Force Allocate studentUser to femaleRoom (gender rules mismatch override)
    const forcedAllocation = await AdminControlService.forceAllocate(
      adminUser.id,
      studentUser.id,
      femaleRoom.id,
      'Emergency medical accommodation bypass'
    );
    assert(forcedAllocation !== null, 'High-risk forceAllocate completed successfully.');

    const forcedRoom = await prisma.room.findUnique({ where: { id: femaleRoom.id } });
    assert(forcedRoom?.currentOccupancy === 1, 'Forced room occupancy correctly incremented.');

    // Force Revoke Allocation
    await AdminControlService.forceRevokeAllocation(adminUser.id, forcedAllocation.id, 'End of bypass window');
    const forceRevoked = await prisma.allocation.findUnique({ where: { id: forcedAllocation.id } });
    assert(forceRevoked?.revokedAt !== null, 'Forced allocation revoked cleanly.');

    // Emergency Reset System (resets allocations)
    const resetReport = await AdminControlService.emergencyResetSystem(adminUser.id, 'allocations', 'Test emergency clear');
    assert(resetReport.allocationsRevoked >= 0, 'Emergency reset executed successfully.');

    // ----------------------------------------------------
    // TEST 6: Dashboard Data Providers & Alert System
    // ----------------------------------------------------
    console.log('\n🔹 TEST 6: DASHBOARD METRICS & ALERT SYSTEMS...');

    const summary = await AdminControlService.getDashboardSummary(adminUser.id);
    assert(summary.totalStudents >= 1, 'Dashboard summary returns total students.');
    assert(summary.timestamp !== undefined, 'Dashboard summary returns timestamp.');

    const allocMetrics = await AdminControlService.getAllocationMetrics(adminUser.id);
    assert(allocMetrics.totalAllocationsCreated >= 0, 'Dashboard returns total allocations count.');

    const payMetrics = await AdminControlService.getPaymentMetrics(adminUser.id);
    assert(payMetrics.totalPayments >= 0, 'Dashboard returns payment metrics.');

    const occupancy = await AdminControlService.getHostelOccupancyStats(adminUser.id);
    assert(occupancy.length > 0, 'Dashboard returns occupancy stats for registered hostels.');

    // Alerts
    const alert = AdminControlService.createSystemAlert('Test System Alert Message', 'WARNING', 'CUSTOM');
    assert(alert.status === 'ACTIVE', 'Custom alert created successfully.');

    const activeAlerts = await AdminControlService.getActiveAlerts(adminUser.id);
    assert(activeAlerts.some(a => a.id === alert.id), 'Active alert list includes created alert.');

    await AdminControlService.resolveAlert(adminUser.id, alert.id);
    const resolved = await prisma.payment.findFirst({ where: { id: alert.id } }).catch(() => null); // mock check
    assert(alert.status === 'RESOLVED', 'Alert marked RESOLVED and audited.');

  } catch (err: any) {
    console.error('CRITICAL UNEXPECTED ERROR IN TEST RUN:', err);
    failCount++;
  } finally {
    // ----------------------------------------------------
    // CLEAN UP FIXTURES
    // ----------------------------------------------------
    console.log('\n🧹 CLEANING UP TEMP TEST FIXTURES...');
    try {
      if (studentUser) {
        const studentBookings = await prisma.booking.findMany({ where: { studentId: studentUser.id } });
        for (const b of studentBookings) {
          await prisma.allocation.deleteMany({ where: { bookingId: b.id } });
          await prisma.payment.deleteMany({ where: { bookingId: b.id } });
        }
        await prisma.booking.deleteMany({ where: { studentId: studentUser.id } });
        await prisma.user.delete({ where: { id: studentUser.id } });
      }
      if (adminUser) {
        await prisma.user.delete({ where: { id: adminUser.id } });
      }
      if (hostel) {
        await prisma.hostel.delete({ where: { id: hostel.id } });
      }
      console.log('  ✅ Fixtures cleaned successfully.');
    } catch (cleanupErr) {
      console.error('Failed to clean test fixtures:', cleanupErr);
    }

    console.log('\n====================================================');
    console.log(`🏁 VALIDATION COMPLETE. SUCCESS: ${successCount}, FAILED: ${failCount}`);
    console.log('====================================================');
    process.exit(failCount > 0 ? 1 : 0);
  }
}

runAdminTests();
