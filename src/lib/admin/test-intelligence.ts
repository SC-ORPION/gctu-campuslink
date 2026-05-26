import '../services/load-env';

import { prisma } from '../db';
import { AdminIntelligenceService } from './admin-intelligence.service';
import { BookingService } from '../services/booking.service';
import { PaymentService } from '../services/payment.service';
import { JobQueue } from '../queue/job-queue';

async function runIntelligenceTests() {
  console.log('🚀 INITIALIZING CAMPUSLINK ADMIN INTELLIGENCE LAYER VALIDATION SUITE...');
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
  let studentUser: any;
  let hostel: any;
  let building: any;
  let maleRoom: any;
  let booking: any;
  let payment: any;

  try {
    // ----------------------------------------------------
    // FIXTURE PROVISIONING
    // ----------------------------------------------------
    console.log('\n🛠️  PROVISIONING TEST FIXTURES...');

    studentUser = await prisma.user.create({
      data: {
        email: `intel_student_${suffix}@gctu.edu.gh`,
        fullName: 'Intelligence Verification Student',
        studentId: `GCTU-INTEL-${suffix}`,
        role: 'student',
        status: 'ACTIVE',
        gender: 'MALE',
      },
    });

    hostel = await prisma.hostel.create({
      data: {
        name: `Intel Validation Hostel ${suffix}`,
        description: 'Hostel dedicated to analytical validation',
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
        roomNumber: `M-INTEL-${suffix}`,
        capacity: 2,
        genderRule: 'MALE_ONLY',
        price: 1500,
      },
    });

    // Create a mock queue job to simulate background workloads
    JobQueue.enqueue('PAYMENT_VERIFICATION_JOB', { studentId: studentUser.id }, { priority: 'high' });
    const mockJob = JobQueue.processNext();
    if (mockJob) {
      JobQueue.failJob(mockJob.id, 'Connection timeout simulating workload retry', 1000);
    }

    console.log('  ✅ Fixtures provisioned successfully.');

    // ----------------------------------------------------
    // TEST 1: System Risk Scoring
    // ----------------------------------------------------
    console.log('\n🔹 TEST 1: SYSTEM HEALTH RISK SCORING...');
    const riskReport = await AdminIntelligenceService.calculateSystemRiskScore(true);
    assert(riskReport.timestamp !== undefined, 'Standard Output format includes timestamp.');
    assert(riskReport.category === 'SYSTEM_HEALTH_RISK', 'Category is correctly mapped.');
    assert(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(riskReport.severity), `Severity parsed successfully: ${riskReport.severity}`);
    assert(riskReport.data.riskScore >= 0 && riskReport.data.riskScore <= 100, `Calculated Risk Score is in bounds: ${riskReport.data.riskScore}`);
    assert(riskReport.recommendation.length > 0, 'Recommendation engine generated suggestions.');

    // ----------------------------------------------------
    // TEST 2: Payment Anomaly Detection
    // ----------------------------------------------------
    console.log('\n🔹 TEST 2: PAYMENT ANOMALY DETECTION...');
    
    // Create an anomaly scenario (booking created, payment submitted)
    booking = await BookingService.createBooking(studentUser.id, hostel.id);
    payment = await PaymentService.submitPaymentProof({
      bookingId: booking.id,
      method: 'BANK',
      reference: `DUPLICATE-REF-${suffix}`,
      proofImage: 'http://intel.com/slip.png',
    });

    // Create a duplicate reference slip to test duplicate detection
    const dummyStudent = await prisma.user.create({
      data: {
        email: `dummy_${suffix}@gctu.edu.gh`,
        fullName: 'Dummy Student',
        studentId: `GCTU-DUMMY-${suffix}`,
        role: 'student',
        status: 'ACTIVE',
        gender: 'MALE',
      },
    });
    const dummyBooking = await BookingService.createBooking(dummyStudent.id, hostel.id);
    await prisma.payment.create({
      data: {
        bookingId: dummyBooking.id,
        method: 'BANK',
        status: 'PENDING',
        reference: `DUPLICATE-REF-${suffix}`,
      },
    });

    const anomalyReport = await AdminIntelligenceService.detectPaymentAnomalies(true);
    assert(anomalyReport.category === 'PAYMENT_ANOMALY', 'Category is mapped correctly.');
    const hasDuplicate = anomalyReport.data.flaggedPayments.some((p) => p.reference === `DUPLICATE-REF-${suffix}`);
    assert(hasDuplicate, 'Successfully detected duplicate transactional reference code across bookings.');

    // Clean up dummy student
    await prisma.payment.deleteMany({ where: { bookingId: dummyBooking.id } });
    await prisma.booking.deleteMany({ where: { id: dummyBooking.id } });
    await prisma.user.delete({ where: { id: dummyStudent.id } });

    // ----------------------------------------------------
    // TEST 3: Allocation Bottleneck Detection
    // ----------------------------------------------------
    console.log('\n🔹 TEST 3: ALLOCATION BOTTLENECK DETECTION...');
    const bottleneckReport = await AdminIntelligenceService.detectAllocationBottlenecks(true);
    assert(bottleneckReport.category === 'ALLOCATION_BOTTLENECK', 'Category matches.');
    assert(Array.isArray(bottleneckReport.data.roomsNearCapacity), 'Rooms near capacity returned as array.');
    assert(Array.isArray(bottleneckReport.data.stuckStudents), 'Stuck students queue is analyzed.');

    // ----------------------------------------------------
    // TEST 4: Student Risk Profile
    // ----------------------------------------------------
    console.log('\n🔹 TEST 4: STUDENT RISK PROFILE...');
    const studentRisk = await AdminIntelligenceService.calculateStudentRiskProfile(studentUser.id);
    assert(studentRisk.data.studentId === studentUser.id, 'Risk profile calculates specifically for the given student.');
    assert(['LOW', 'MEDIUM', 'HIGH'].includes(studentRisk.data.riskLevel), `Student Risk Level evaluates successfully: ${studentRisk.data.riskLevel}`);

    // ----------------------------------------------------
    // TEST 5: Hostel Occupancy Pressure Analysis
    // ----------------------------------------------------
    console.log('\n🔹 TEST 5: HOSTEL OCCUPANCY PRESSURE ANALYSIS...');
    const pressureReport = await AdminIntelligenceService.analyzeHostelPressure(true);
    assert(pressureReport.category === 'HOSTEL_PRESSURE', 'Hostel pressure analysis category matches.');
    assert(pressureReport.data.hostelsPressure.length > 0, 'Occupancy statistics successfully analyzed for hostels.');

    // ----------------------------------------------------
    // TEST 6: Recommendation Engine & Alert System
    // ----------------------------------------------------
    console.log('\n🔹 TEST 6: INTEGRATED RECOMMENDATIONS & ALERT GENERATION...');
    const recsReport = await AdminIntelligenceService.generateAdminRecommendations(true);
    assert(recsReport.data.length > 0, 'Recommendation engine generated consolidated intelligence recommendations.');

    const alertsReport = await AdminIntelligenceService.generateSystemAlerts(true);
    assert(alertsReport.category === 'SYSTEM_ALERTS', 'Structured alert system outputs alerts matching format guidelines.');

    // ----------------------------------------------------
    // TEST 7: Queue Behavior Analysis
    // ----------------------------------------------------
    console.log('\n🔹 TEST 7: QUEUE BEHAVIOR DIAGNOSIS...');
    const queueReport = await AdminIntelligenceService.analyzeQueueHealth();
    assert(queueReport.data.backlogCount >= 0, 'Backlog job queue metrics are operational.');
    assert(Array.isArray(queueReport.data.stuckJobs), 'Stuck jobs scanner returned structured array.');

    // ----------------------------------------------------
    // TEST 8: Simple Heuristic Forecasting
    // ----------------------------------------------------
    console.log('\n🔹 TEST 8: SIMPLE HEURISTIC DEMAND FORECASTING...');
    const forecastReport = await AdminIntelligenceService.forecastAllocationDemand(true);
    assert(forecastReport.data.expectedPeakBookingLoad >= 0, 'Forecast estimated expected peak booking load.');
    assert(forecastReport.data.expectedRoomExhaustionDays >= 0, 'Forecast estimated room vacancy exhaustion rate.');

    // ----------------------------------------------------
    // TEST 9: Auto-Priority Scoring Engine
    // ----------------------------------------------------
    console.log('\n🔹 TEST 9: AUTO-PRIORITY MATRICES...');
    const priorityReport = await AdminIntelligenceService.getPriorityScores();
    assert(Array.isArray(priorityReport.data.studentsPriority), 'Student prioritization queue generated.');
    assert(Array.isArray(priorityReport.data.paymentsPriority), 'Payment verification prioritization queue generated.');

  } catch (err: any) {
    console.error('CRITICAL UNEXPECTED ERROR IN INTEL TEST RUN:', err);
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

runIntelligenceTests();
