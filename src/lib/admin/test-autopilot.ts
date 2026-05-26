import '../services/load-env';

import { prisma } from '../db';
import { AdminAutopilotService } from './admin-autopilot.service';
import { AdminControlService } from './admin-control.service';
import { BookingService } from '../services/booking.service';
import { PaymentService } from '../services/payment.service';
import { JobQueue } from '../queue/job-queue';

async function runAutopilotTests() {
  console.log('🚀 INITIALIZING CAMPUSLINK ADMIN AUTOPILOT LAYER VALIDATION SUITE...');
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

  // Test fixtures
  let adminUser: any;
  let studentUser: any;
  let hostel: any;
  let building: any;
  let maleRoom: any;
  let booking: any;
  let payment: any;

  try {
    // ----------------------------------------------------
    // PROVISION FIXTURES
    // ----------------------------------------------------
    console.log('\n🛠️  PROVISIONING AUTOPILOT TEST FIXTURES...');

    adminUser = await prisma.user.create({
      data: {
        email: `autopilot_admin_${suffix}@gctu.edu.gh`,
        fullName: 'Autopilot System Admin',
        studentId: `GCTU-ADMIN-${suffix}`,
        role: 'admin',
        status: 'ACTIVE',
      },
    });

    studentUser = await prisma.user.create({
      data: {
        email: `autopilot_student_${suffix}@gctu.edu.gh`,
        fullName: 'Autopilot Student',
        studentId: `GCTU-STUDENT-${suffix}`,
        role: 'student',
        status: 'ACTIVE',
        gender: 'MALE',
      },
    });

    hostel = await prisma.hostel.create({
      data: {
        name: `Autopilot Hostel ${suffix}`,
        description: 'Hostel dedicated to autopilot test cases',
        campus: 'GCTU',
        locationArea: 'Tesano',
        distanceFromCampus: '0.2 km',
        genderRule: 'MIXED',
      },
    });

    building = await prisma.building.create({
      data: {
        hostelId: hostel.id,
        name: 'Building Gamma',
        genderRule: 'MIXED',
      },
    });

    maleRoom = await prisma.room.create({
      data: {
        buildingId: building.id,
        roomNumber: `M-AUTO-${suffix}`,
        capacity: 2,
        genderRule: 'MALE_ONLY',
        price: 1500,
      },
    });

    console.log('  ✅ Fixtures provisioned successfully.');

    // ----------------------------------------------------
    // TEST 1: Payment Backlog Autopilot
    // ----------------------------------------------------
    console.log('\n🔹 TEST 1: PAYMENT BACKLOG AUTOPILOT...');
    booking = await BookingService.createBooking(studentUser.id, hostel.id);
    payment = await PaymentService.submitPaymentProof({
      bookingId: booking.id,
      method: 'BANK',
      reference: `AUTO-REF-${suffix}`,
      proofImage: 'http://intel.com/slip.png',
    });

    // Artificially age the payment to trigger threshold (>1 hour)
    const agedDate = new Date(Date.now() - 2 * 60 * 60 * 1000);
    await prisma.payment.update({
      where: { id: payment.id },
      data: { createdAt: agedDate },
    });

    const backlogProposals = await AdminAutopilotService.resolvePaymentBacklog();
    assert(backlogProposals.length > 0, 'Autopilot successfully detected payment backlog and proposed batch resolution.');
    
    if (backlogProposals.length > 0) {
      const prop = backlogProposals[0];
      assert(prop.actionType === 'RESOLVE_PAYMENT_BACKLOG_BATCH', 'Proposal actionType is correctly set.');
      assert(prop.approvalRequired === true, 'Autopilot requires approval for manual payment batch overrides.');

      const result = await prop.execute(adminUser.id);
      assert(result.success === true, 'Bulk payment verification executed safely under admin approval authorization.');
      
      const checkPayment = await prisma.payment.findUnique({ where: { id: payment.id } });
      assert(checkPayment?.status === 'VERIFIED', 'Payment status successfully updated to VERIFIED through approval pipeline.');
    }

    // ----------------------------------------------------
    // TEST 2: Allocation Stuck Bottleneck Autopilot
    // ----------------------------------------------------
    console.log('\n🔹 TEST 2: ALLOCATION STUCK AUTOPILOT...');
    // Since payment is verified, the booking status is now CONFIRMED.
    // It should be flagged as stuck since there is no allocation.
    const stuckProposals = await AdminAutopilotService.resolveAllocationBottleneck();
    assert(stuckProposals.length > 0, 'Autopilot successfully identified allocation stall for confirmed booking.');

    if (stuckProposals.length > 0) {
      const prop = stuckProposals[0];
      assert(prop.actionType === 'RESOLVE_ALLOCATION_STUCK_CASE', 'Proposal actionType matches allocation stuck case.');

      const result = await prop.execute(adminUser.id);
      assert(result.success === true, 'Autopilot override allocation proposal executed successfully.');

      const checkAllocation = await prisma.allocation.findFirst({
        where: { bookingId: booking.id, revokedAt: null },
      });
      assert(checkAllocation !== null, 'Room allocation successfully assigned to stuck student.');
    }

    // ----------------------------------------------------
    // TEST 3: Room Overflow Autopilot
    // ----------------------------------------------------
    console.log('\n🔹 TEST 3: ROOM OVERFLOW AUTOPILOT...');
    // Artificially change room currentOccupancy to exceed capacity to trigger overflow
    await prisma.room.update({
      where: { id: maleRoom.id },
      data: { currentOccupancy: 2, capacity: 1 },
    });

    const overflowProposals = await AdminAutopilotService.fixRoomOverflowRisk();
    assert(overflowProposals.length > 0, 'Autopilot successfully detected capacity overflow risk.');

    // Reset room capacity to normal for cleanup safety
    await prisma.room.update({
      where: { id: maleRoom.id },
      data: { capacity: 2 },
    });

    // ----------------------------------------------------
    // TEST 4: Queue Failure Recovery Autopilot
    // ----------------------------------------------------
    console.log('\n🔹 TEST 4: QUEUE FAILURE RECOVERY AUTOPILOT...');
    JobQueue.enqueue('PAYMENT_VERIFICATION_JOB', { studentId: studentUser.id });
    const nextJob = JobQueue.processNext();
    if (nextJob) {
      JobQueue.failJob(nextJob.id, 'Simulated connection crash', 500);
      JobQueue.failJob(nextJob.id, 'Simulated connection crash', 500);
      JobQueue.failJob(nextJob.id, 'Simulated connection crash', 500);
      JobQueue.failJob(nextJob.id, 'Simulated connection crash', 500); // 4th fail marks status: 'failed'
    }

    const failedProposals = await AdminAutopilotService.recoverFailedJobs();
    assert(failedProposals.length > 0, 'Autopilot isolated permanently failed background tasks.');

    if (failedProposals.length > 0) {
      const prop = failedProposals[0];
      assert(prop.decisionType === 'AUTO_EXECUTE', 'Queue recovery triggers AUTO_EXECUTE mode.');
      assert(prop.approvalRequired === false, 'No admin confirmation required for low-risk queue retries.');

      const result = await prop.execute();
      assert(result.success === true, 'Self-healing auto execution retry ran successfully.');
      assert(JobQueue.getAllJobs().filter((j) => j.status === 'failed').length === 0, 'All failed jobs restored to pending.');
    }

    // ----------------------------------------------------
    // TEST 5: Payment Verification Assist Autopilot
    // ----------------------------------------------------
    console.log('\n🔹 TEST 5: PAYMENT VERIFICATION ASSIST AUTOPILOT...');
    // Create clean pending payment
    const studentUser2 = await prisma.user.create({
      data: {
        email: `assist_student_${suffix}@gctu.edu.gh`,
        fullName: 'Clean Assist Student',
        studentId: `GCTU-ASSIST-${suffix}`,
        role: 'student',
        status: 'ACTIVE',
        gender: 'MALE',
      },
    });
    const booking2 = await BookingService.createBooking(studentUser2.id, hostel.id);
    const payment2 = await PaymentService.submitPaymentProof({
      bookingId: booking2.id,
      method: 'BANK',
      reference: `CLEAN-REF-${suffix}`,
    });

    const assistProposals = await AdminAutopilotService.assistPaymentVerification();
    assert(assistProposals.length > 0, 'Payment assistant successfully clustered clean transaction batch.');

    if (assistProposals.length > 0) {
      const prop = assistProposals[0];
      assert(prop.actionType === 'BULK_VERIFY_CLEAN_PAYMENTS', 'Action type matches clean bulk verify proposal.');
      
      const result = await prop.execute(adminUser.id);
      assert(result.success === true, 'Clean payment bulk verification completed successfully.');
    }

    // Cleanup student2 setup
    await prisma.allocation.deleteMany({ where: { bookingId: booking2.id } });
    await prisma.payment.deleteMany({ where: { bookingId: booking2.id } });
    await prisma.booking.delete({ where: { id: booking2.id } });
    await prisma.user.delete({ where: { id: studentUser2.id } });

    // ----------------------------------------------------
    // TEST 6: Hostel Optimization Autopilot
    // ----------------------------------------------------
    console.log('\n🔹 TEST 6: HOSTEL OPTIMIZATION AUTOPILOT...');
    // Mock hostel overfilled rate (>90%)
    const overfilledHostel = await prisma.hostel.create({
      data: {
        name: `Overfilled Hostel ${suffix}`,
        distanceFromCampus: '0.1 km',
        locationArea: 'Tesano',
        genderRule: 'MIXED',
      },
    });
    const overfilledBuilding = await prisma.building.create({
      data: {
        hostelId: overfilledHostel.id,
        name: 'Building Saturated',
      },
    });
    const overfilledRoom = await prisma.room.create({
      data: {
        buildingId: overfilledBuilding.id,
        roomNumber: `O-101-${suffix}`,
        capacity: 1,
        currentOccupancy: 1,
        genderRule: 'MIXED',
      },
    });

    const optimizationProposals = await AdminAutopilotService.optimizeHostelDistribution();
    assert(optimizationProposals.length > 0, 'Hostel optimization engine detected high pressure imbalance occupancy.');

    if (optimizationProposals.length > 0) {
      const prop = optimizationProposals.find((p) => p.description.includes(overfilledHostel.name));
      assert(prop !== undefined, 'Found correct overload freeze proposal.');

      if (prop) {
        const result = await prop.execute(adminUser.id);
        assert(result.success === true, 'Temporary overloaded booking freeze executed successfully.');
        
        const checkHostel = await prisma.hostel.findUnique({ where: { id: overfilledHostel.id } });
        assert(checkHostel?.bookingEnabled === false, 'Hostel booking status successfully disabled.');
      }
    }

    // Cleanup overfilled hostel setup
    await prisma.room.delete({ where: { id: overfilledRoom.id } });
    await prisma.building.delete({ where: { id: overfilledBuilding.id } });
    await prisma.hostel.delete({ where: { id: overfilledHostel.id } });

  } catch (err: any) {
    console.error('CRITICAL UNEXPECTED ERROR IN AUTOPILOT TEST RUN:', err);
    failCount++;
  } finally {
    // ----------------------------------------------------
    // CLEAN UP FIXTURES
    // ----------------------------------------------------
    console.log('\n🧹 CLEANING UP TEMP TEST FIXTURES...');
    try {
      if (booking) {
        await prisma.allocation.deleteMany({ where: { bookingId: booking.id } });
        await prisma.payment.deleteMany({ where: { bookingId: booking.id } });
        await prisma.booking.delete({ where: { id: booking.id } });
      }
      if (studentUser) {
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
    console.log(`🏁 AUTOPILOT VALIDATION COMPLETE. SUCCESS: ${successCount}, FAILED: ${failCount}`);
    console.log('====================================================');
    process.exit(failCount > 0 ? 1 : 0);
  }
}

runAutopilotTests();
