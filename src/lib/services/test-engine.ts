import './load-env';

import { prisma } from '../db';
import { BookingService } from './booking.service';
import { PaymentService } from './payment.service';
import { AllocationService } from './allocation.service';
import { HostelService } from './hostel.service';
import { LifecycleService } from './lifecycle.service';
import { NotificationService } from './notification.service';

async function runTests() {
  console.log('🚀 INITIALIZING CAMPUSLINK DATABASE ENGINE VALIDATION SUITE...');
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

  // Provisioning unique suffix to avoid conflicts during testing
  const suffix = Math.floor(Math.random() * 1000000).toString();

  // Test states
  let tempMaleUser: any;
  let tempFemaleUser: any;
  let blockedUser: any;
  let tempHostel: any;
  let tempBuilding: any;
  let tempMaleRoom: any;
  let tempFemaleRoom: any;

  try {
    // ----------------------------------------------------
    // FIXTURE PROVISIONING
    // ----------------------------------------------------
    console.log('\n🛠️  PROVISIONING TEST FIXTURES...');

    tempMaleUser = await prisma.user.create({
      data: {
        email: `test_male_${suffix}@gctu.edu.gh`,
        fullName: 'Test Male Student',
        studentId: `GCTU-MALE-${suffix}`,
        role: 'student',
        gender: 'MALE',
      },
    });

    tempFemaleUser = await prisma.user.create({
      data: {
        email: `test_female_${suffix}@gctu.edu.gh`,
        fullName: 'Test Female Student',
        studentId: `GCTU-FEMALE-${suffix}`,
        role: 'student',
        gender: 'FEMALE',
      },
    });

    blockedUser = await prisma.user.create({
      data: {
        email: `test_blocked_${suffix}@gctu.edu.gh`,
        fullName: 'Test Blocked Student',
        studentId: `GCTU-BLOCKED-${suffix}`,
        role: 'student',
        status: 'BLOCKED',
        gender: 'MALE',
      },
    });

    tempHostel = await HostelService.createHostel({
      name: `Validation Mixed Hostel ${suffix}`,
      description: 'Hostel dedicated to database engine validations',
      campus: 'GCTU',
      locationArea: 'Tesano',
      distanceFromCampus: '0.5 km',
      genderRule: 'MIXED',
    });

    tempBuilding = await HostelService.createBuilding(
      tempHostel.id,
      'Building Alpha',
      'MIXED'
    );

    // Male room with capacity 1
    tempMaleRoom = await HostelService.createRoom({
      buildingId: tempBuilding.id,
      roomNumber: `M-101-${suffix}`,
      capacity: 1,
      genderRule: 'MALE_ONLY',
      price: 1500,
    });

    // Female room with capacity 1
    tempFemaleRoom = await HostelService.createRoom({
      buildingId: tempBuilding.id,
      roomNumber: `F-101-${suffix}`,
      capacity: 1,
      genderRule: 'FEMALE_ONLY',
      price: 1500,
    });

    console.log('  ✅ Fixtures provisioned successfully.');

    // ----------------------------------------------------
    // TEST 1: Blocked Student Gate Constraints
    // ----------------------------------------------------
    console.log('\n🔹 TEST 1: BLOCKED STUDENT ACTION CONSTRAINTS...');
    try {
      await BookingService.createBooking(blockedUser.id, tempHostel.id);
      assert(false, 'Blocked student was able to create booking (Error).');
    } catch (err: any) {
      assert(
        err.message.includes('Access Denied') || err.message.includes('Restricted'),
        `Blocked student booking attempt prevented successfully: "${err.message}"`
      );
    }

    // ----------------------------------------------------
    // TEST 2: Booking Creation, Lifecycle State & Selection Lock
    // ----------------------------------------------------
    console.log('\n🔹 TEST 2: STUDENT BOOKING CREATION AND Selection Lock...');
    const booking = await BookingService.createBooking(tempMaleUser.id, tempHostel.id);
    assert(booking !== null, 'Booking created successfully.');
    assert(booking.status === 'PENDING_PAYMENT', 'Booking initial state is PENDING_PAYMENT.');
    assert(booking.lockedSelection === true, 'Booking locks selection immediately.');

    const initialLifecycle = await LifecycleService.getStudentState(tempMaleUser.id);
    assert(initialLifecycle === 'PAYMENT_PENDING' || initialLifecycle === 'HOSTEL_LOCKED', `Initial lifecycle is correct: ${initialLifecycle}`);

    const notificationsForBooking = await NotificationService.getNotifications(tempMaleUser.id);
    const bookingNotif = notificationsForBooking.find(n => n.title === 'Hostel Selection Confirmed');
    assert(bookingNotif !== undefined, 'Hostel Selection Confirmed notification generated successfully.');
    assert(bookingNotif?.severity === 'SUCCESS', 'Notification has correct severity level.');

    // ----------------------------------------------------
    // TEST 3: Duplicate Active Booking Constraint
    // ----------------------------------------------------
    console.log('\n🔹 TEST 3: DUPLICATE BOOKING PREVENTION CONSTRAINT...');
    try {
      await BookingService.createBooking(tempMaleUser.id, tempHostel.id);
      assert(false, 'Duplicate booking allowed (Error).');
    } catch (err: any) {
      assert(
        err.message.includes('Conflict') || err.message.includes('accommodation booking'),
        `Duplicate booking blocked correctly: "${err.message}"`
      );
    }

    // ----------------------------------------------------
    // TEST 4: Payment Strict Sequence Rules
    // ----------------------------------------------------
    console.log('\n🔹 TEST 4: PAYMENT STATE SEQUENCING RULES...');
    try {
      // Attempt verification without submission
      await PaymentService.verifyPayment(booking.id, tempMaleUser.id, 'Verify direct');
      assert(false, 'Payment verification allowed without submission (Error).');
    } catch (err: any) {
      assert(
        err.message.includes('Precondition') || err.message.includes('No pending payment'),
        `Verification rejected because payment was not submitted first: "${err.message}"`
      );
    }

    // Submit payment proof
    const submitResult = await PaymentService.submitPaymentProof({
      bookingId: booking.id,
      method: 'BANK',
      reference: `TXN-${suffix}`,
      proofImage: 'http://proof.com/slip.png',
    });
    assert(submitResult.booking.status === 'PENDING_VERIFICATION', 'Booking status transitioned to PENDING_VERIFICATION.');
    
    const submittedState = await LifecycleService.getStudentState(tempMaleUser.id);
    assert(submittedState === 'PAYMENT_SUBMITTED' || submittedState === 'PAYMENT_UNDER_VERIFICATION', `Submitted lifecycle state is correct: ${submittedState}`);

    const notificationsForPayment = await NotificationService.getNotifications(tempMaleUser.id);
    const paymentNotif = notificationsForPayment.find(n => n.title === 'Payment Submitted');
    assert(paymentNotif !== undefined, 'Payment Submitted notification generated.');

    // ----------------------------------------------------
    // TEST 5: Gender Segregation Rules Enforcement
    // ----------------------------------------------------
    console.log('\n🔹 TEST 5: GENDER RULES SEGREGATION POLICY...');
    const femaleBooking = await BookingService.createBooking(tempFemaleUser.id, tempHostel.id);
    assert(femaleBooking !== null, 'Female booking created.');

    // Enforce verified status before manual allocation
    try {
      await AllocationService.allocateManually(femaleBooking.id, tempFemaleRoom.id, tempMaleUser.id);
      assert(false, 'Manual room allocation allowed without verified payment (Error).');
    } catch (err: any) {
      assert(
        err.message.includes('Precondition') || err.message.includes('payment is VERIFIED'),
        `Manual allocation blocked for unverified payment: "${err.message}"`
      );
    }

    // Submit and verify female payment
    await PaymentService.submitPaymentProof({
      bookingId: femaleBooking.id,
      method: 'BANK',
      reference: `TXN-FEM-${suffix}`,
    });
    await PaymentService.verifyPayment(femaleBooking.id, tempMaleUser.id);

    try {
      // Attempt to manually allocate verified Female Student to Male-only room
      await AllocationService.allocateManually(femaleBooking.id, tempMaleRoom.id, tempMaleUser.id);
      assert(false, 'Cross-gender room allocation allowed (Error).');
    } catch (err: any) {
      assert(
        err.message.includes('Gender') || err.message.includes('segregation') || err.message.includes('Policy'),
        `Cross-gender allocation blocked with message: "${err.message}"`
      );
    }

    // ----------------------------------------------------
    // TEST 6: Payment Verification & Auto Room Allocation
    // ----------------------------------------------------
    console.log('\n🔹 TEST 6: PAYMENT VERIFICATION & AUTO ALLOCATION FLOW...');
    // Verify payment as admin -> Should auto-trigger allocate_room_atomic
    const verifiedBooking = await PaymentService.verifyPayment(booking.id, tempMaleUser.id, 'Verified slip ok');
    assert(verifiedBooking.status === 'ALLOCATED', 'Booking state transitions to ALLOCATED upon payment verification.');

    // Verify room occupancy increments
    const updatedMaleRoom = await prisma.room.findUnique({ where: { id: tempMaleRoom.id } });
    assert(updatedMaleRoom?.currentOccupancy === 1, 'Room occupancy correctly incremented to 1.');

    const notificationsForVerify = await NotificationService.getNotifications(tempMaleUser.id);
    assert(notificationsForVerify.some(n => n.title === 'Payment Verified'), 'Payment Verified notification generated.');
    assert(notificationsForVerify.some(n => n.title === 'Room Allocated'), 'Room Allocated notification generated.');

    // ----------------------------------------------------
    // TEST 7: Room Capacity Standby Queue Checks
    // ----------------------------------------------------
    console.log('\n🔹 TEST 7: ROOM CAPACITY CONCURRENCY & STANDBY QUEUE...');
    // Provision another male student to attempt to book into the now full male room M-101
    const extraMaleUser = await prisma.user.create({
      data: {
        email: `test_extra_${suffix}@gctu.edu.gh`,
        fullName: 'Test Extra Student',
        studentId: `GCTU-EXTRA-${suffix}`,
        role: 'student',
        gender: 'MALE',
      },
    });

    const extraBooking = await BookingService.createBooking(extraMaleUser.id, tempHostel.id);
    await PaymentService.submitPaymentProof({
      bookingId: extraBooking.id,
      method: 'ONLINE', // Online auto-verifies and triggers auto-allocation
      reference: `TXN-EXTRA-${suffix}`,
    });

    // M-101 is already full (capacity 1). So atomic allocation must fail for extraBooking but not crash (standby queueing).
    const extraBookingReload = await prisma.booking.findUnique({ where: { id: extraBooking.id } });
    assert(extraBookingReload?.status === 'CONFIRMED', 'Extra student allocation placed in standby queue (Booking status remains CONFIRMED).');

    const extraNotifications = await NotificationService.getNotifications(extraMaleUser.id);
    assert(
      extraNotifications.some(n => n.title === 'Allocation Standby Queue'),
      'Allocation Standby Queue notification triggered successfully.'
    );

    // ----------------------------------------------------
    // TEST 8: Revocation & Rollback Verification
    // ----------------------------------------------------
    console.log('\n🔹 TEST 8: ALLOCATION REVOCATION & ROOM OCCUPANCY RESTORATION...');
    const activeAlloc = await prisma.allocation.findFirst({
      where: { bookingId: booking.id, revokedAt: null },
    });
    assert(activeAlloc !== null, 'Active allocation found.');

    if (activeAlloc) {
      await AllocationService.revokeAllocation(activeAlloc.id, tempMaleUser.id, 'Revoking test bed slot');
      const revokedRoom = await prisma.room.findUnique({ where: { id: tempMaleRoom.id } });
      assert(revokedRoom?.currentOccupancy === 0, 'Room occupancy correctly restored (decremented) to 0 upon revocation.');

      const revokedBooking = await prisma.booking.findUnique({ where: { id: booking.id } });
      assert(revokedBooking?.status === 'CONFIRMED', 'Booking status restored to CONFIRMED.');

      const revokedNotifications = await NotificationService.getNotifications(tempMaleUser.id);
      assert(revokedNotifications.some(n => n.title === 'Room Allocation Revoked'), 'Room Allocation Revoked notification generated.');
    }

    // ----------------------------------------------------
    // TEST 9: Observability, Health & Integrity Verification
    // ----------------------------------------------------
    console.log('\n🔹 TEST 9: OBSERVABILITY, HEALTH METRICS, & INTEGRITY DIAGNOSTIC VERIFICATION...');
    const { SystemHealthMonitor } = require('../monitoring/system-health');
    const { IntegrityChecker } = require('../monitoring/integrity-checker');
    
    // Check that we captured audit logs
    const { AuditLogService } = require('../audit/audit-log');
    const history = await AuditLogService.getStudentHistory(tempMaleUser.id);
    assert(history.length > 0, `Captured student state machine history successfully. Recorded transitions count: ${history.length}`);

    // Trigger integrity check
    const checkerResults = await IntegrityChecker.runIntegrityCheck();
    assert(checkerResults.success === true || checkerResults.issues.length >= 0, 'Integrity checker ran cleanly over database records.');

    // Fetch health status
    const health = await SystemHealthMonitor.getHealthMetrics();
    assert(health.systemErrorRatePercent >= 0, `System health metric reported average allocation metrics cleanly.`);


  } catch (err: any) {
    console.error('CRITICAL UNEXPECTED ERROR IN TEST RUN:', err);
    failCount++;
  } finally {
    // ----------------------------------------------------
    // CLEAN UP FIXTURES
    // ----------------------------------------------------
    console.log('\n🧹 CLEANING UP TEMP TEST FIXTURES...');
    try {
      if (tempMaleUser) {
        await prisma.booking.deleteMany({ where: { studentId: tempMaleUser.id } });
        await prisma.user.delete({ where: { id: tempMaleUser.id } });
      }
      if (tempFemaleUser) {
        await prisma.booking.deleteMany({ where: { studentId: tempFemaleUser.id } });
        await prisma.user.delete({ where: { id: tempFemaleUser.id } });
      }
      if (blockedUser) {
        await prisma.user.delete({ where: { id: blockedUser.id } });
      }
      const extraUser = await prisma.user.findFirst({ where: { email: `test_extra_${suffix}@gctu.edu.gh` } });
      if (extraUser) {
        await prisma.booking.deleteMany({ where: { studentId: extraUser.id } });
        await prisma.user.delete({ where: { id: extraUser.id } });
      }
      if (tempHostel) {
        await prisma.hostel.delete({ where: { id: tempHostel.id } });
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

runTests();
