import { prisma } from '../db';
import { BookingService } from './booking.service';
import { PaymentService } from './payment.service';
import { AllocationService } from './allocation.service';
import { HostelService } from './hostel.service';

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
    // TEST 1: Booking Creation
    // ----------------------------------------------------
    console.log('\n🔹 TEST 1: STUDENT BOOKING CREATION AND Selection Lock...');
    const booking = await BookingService.createBooking(tempMaleUser.id, tempHostel.id);
    assert(booking !== null, 'Booking created successfully.');
    assert(booking.status === 'PENDING_PAYMENT', 'Booking initial state is PENDING_PAYMENT.');
    assert(booking.lockedSelection === true, 'Booking locks selection immediately.');

    // ----------------------------------------------------
    // TEST 2: Only One Active Booking Constraint
    // ----------------------------------------------------
    console.log('\n🔹 TEST 2: DUPLICATE BOOKING PREVENTION CONSTRAINT...');
    try {
      await BookingService.createBooking(tempMaleUser.id, tempHostel.id);
      assert(false, 'Duplicate booking allowed (Error).');
    } catch (err: any) {
      assert(
        err.message.includes('Conflict') || err.message.includes('active booking'),
        `Duplicate booking blocked correctly with message: "${err.message}"`
      );
    }

    // ----------------------------------------------------
    // TEST 3: Gender Segregation Rules Enforcement
    // ----------------------------------------------------
    console.log('\n🔹 TEST 3: GENDER RULES SEGREGATION POLICY...');
    // Create female booking
    const femaleBooking = await BookingService.createBooking(tempFemaleUser.id, tempHostel.id);
    assert(femaleBooking !== null, 'Female booking created.');

    try {
      // Attempt to manually allocate Male Student to Female-only room
      await AllocationService.allocateManually(booking.id, tempFemaleRoom.id, tempMaleUser.id);
      assert(false, 'Cross-gender room allocation allowed (Error).');
    } catch (err: any) {
      assert(
        err.message.includes('Gender') || err.message.includes('segregation') || err.message.includes('Policy'),
        `Cross-gender allocation blocked with policy message: "${err.message}"`
      );
    }

    // ----------------------------------------------------
    // TEST 4: Payment Verification & Auto Room Allocation
    // ----------------------------------------------------
    console.log('\n🔹 TEST 4: PAYMENT VERIFICATION & AUTO ALLOCATION FLOW...');
    // Submit payment proof
    const submitResult = await PaymentService.submitPaymentProof({
      bookingId: booking.id,
      method: 'BANK',
      reference: `TXN-${suffix}`,
      proofImage: 'http://proof.com/slip.png',
    });
    assert(submitResult.booking.status === 'PENDING_VERIFICATION', 'Booking status transitioned to PENDING_VERIFICATION.');

    // Verify payment as admin -> Should auto-trigger allocate_room_atomic
    const verifiedBooking = await PaymentService.verifyPayment(booking.id, tempMaleUser.id, 'Verified slip ok');
    assert(verifiedBooking.status === 'ALLOCATED', 'Booking state transitions to ALLOCATED upon payment verification.');

    // Verify room occupancy increments
    const updatedMaleRoom = await prisma.room.findUnique({ where: { id: tempMaleRoom.id } });
    assert(updatedMaleRoom?.currentOccupancy === 1, 'Room occupancy correctly incremented to 1.');

    // ----------------------------------------------------
    // TEST 5: Room Concurrency Allocation Bounds Checks
    // ----------------------------------------------------
    console.log('\n🔹 TEST 5: ROOM CAPACITY CONCURRENCY BOUNDS...');
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
      method: 'ONLINE', // Online auto-verifies and auto-allocates
      reference: `TXN-EXTRA-${suffix}`,
    });

    // M-101 is already full (capacity 1). So atomic allocation must fail for extraBooking.
    const extraBookingReload = await prisma.booking.findUnique({ where: { id: extraBooking.id } });
    assert(extraBookingReload?.status === 'CONFIRMED', 'Extra student allocation stood by (status PENDING/CONFIRMED queue) because room was full.');

    // ----------------------------------------------------
    // TEST 6: Revocation & Rollback Verification
    // ----------------------------------------------------
    console.log('\n🔹 TEST 6: ALLOCATION REVOCATION & ROOM OCCUPANCY RESTORATION...');
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
    }

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
