import { prisma } from '../db';
import { JobQueue, Job } from '../queue/job-queue';
import { SystemHealthMonitor } from '../monitoring/system-health';
import { AuditLogService } from '../audit/audit-log';
import { IntegrityChecker } from '../monitoring/integrity-checker';

// =========================================================
// 12. INTELLIGENCE OUTPUT FORMAT STANDARD
// =========================================================
export interface IntelligenceStandardOutput<T = any> {
  timestamp: string;
  category: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  data: T;
  recommendation: string[];
}

// Interface for cache entries
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

// In-memory cache for intelligence reports to comply with Rule 13 (non-blocking, cached)
const globalIntelligenceCache = globalThis as unknown as {
  cache: Record<string, CacheEntry<any>>;
};

if (!globalIntelligenceCache.cache) {
  globalIntelligenceCache.cache = {};
}

/**
 * Cache retrieval/insertion helper.
 * Standard TTL is 5 seconds for fast real-time analytics without DB thrashing.
 */
function getOrSetCache<T>(key: string, fetchFn: () => Promise<T>, ttlMs: number = 5000): Promise<T> {
  const now = Date.now();
  const cached = globalIntelligenceCache.cache[key];
  if (cached && cached.expiresAt > now) {
    return Promise.resolve(cached.value);
  }
  return fetchFn().then((val) => {
    globalIntelligenceCache.cache[key] = {
      value: val,
      expiresAt: Date.now() + ttlMs,
    };
    return val;
  });
}

export class AdminIntelligenceService {
  /**
   * Helper to format any data payload into the Standard Output requirement (Section 12)
   */
  private static format<T>(
    category: string,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    data: T,
    recommendation: string[]
  ): IntelligenceStandardOutput<T> {
    return {
      timestamp: new Date().toISOString(),
      category,
      severity,
      data,
      recommendation,
    };
  }

  // =========================================================
  // 2. SYSTEM HEALTH RISK SCORING
  // =========================================================
  /**
   * Calculates a system-wide risk score between 0 and 100 based on operational health metrics.
   */
  static async calculateSystemRiskScore(bypassCache: boolean = false): Promise<IntelligenceStandardOutput<{
    riskScore: number;
    level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    reasons: string[];
  }>> {
    const fetchFn = async () => {
      const jobs = JobQueue.getAllJobs();
      
      // Inputs
      const backlogSize = jobs.filter((j) => j.status === 'pending' || j.status === 'running').length;
      const failedJobCount = jobs.filter((j) => j.status === 'failed').length;
      const pendingPayments = await prisma.payment.count({ where: { status: 'PENDING' } });
      const allocationDelays = await prisma.booking.count({
        where: { status: 'CONFIRMED', allocations: { none: {} } },
      });

      let riskScore = 0;
      const reasons: string[] = [];

      // Scoring heuristic
      // Queue backlog weight (Max 25 pts)
      if (backlogSize > 0) {
        const pts = Math.min(25, backlogSize * 3);
        riskScore += pts;
        if (backlogSize > 5) {
          reasons.push(`High background job queue backlog: ${backlogSize} jobs currently pending or running.`);
        }
      }

      // Failed jobs weight (Max 30 pts)
      if (failedJobCount > 0) {
        const pts = Math.min(30, failedJobCount * 10);
        riskScore += pts;
        reasons.push(`Failed background jobs: ${failedJobCount} jobs have failed permanently and require manual retry.`);
      }

      // Pending payments backlog (Max 25 pts)
      if (pendingPayments > 0) {
        const pts = Math.min(25, pendingPayments * 2);
        riskScore += pts;
        if (pendingPayments > 5) {
          reasons.push(`High manual payment verification queue: ${pendingPayments} student payments pending review.`);
        }
      }

      // Allocation delays backlog (Max 20 pts)
      if (allocationDelays > 0) {
        const pts = Math.min(20, allocationDelays * 4);
        riskScore += pts;
        reasons.push(`Allocation bottleneck: ${allocationDelays} student bookings verified but pending room assignment.`);
      }

      // Ensure score is capped properly
      riskScore = Math.min(100, Math.max(0, riskScore));

      // Level determination
      let level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
      if (riskScore > 75) level = 'CRITICAL';
      else if (riskScore > 50) level = 'HIGH';
      else if (riskScore > 25) level = 'MEDIUM';

      const data = { riskScore, level, reasons };

      // Recommendations matching section 7 rules
      const recs: string[] = [];
      if (failedJobCount > 0) recs.push('Trigger JobQueue.retryFailedJobs() to reset and rerun crashed workflows.');
      if (pendingPayments > 5) recs.push(`Verify ${pendingPayments} pending payments to unblock student booking queue.`);
      if (allocationDelays > 0) recs.push('Run the room allocation engine to assign pending students to rooms.');
      if (riskScore > 50) recs.push('Enable manual allocation override or audit locks due to critical bottleneck pressure.');
      if (recs.length === 0) recs.push('System running smoothly. No emergency administrative interventions required.');

      return this.format('SYSTEM_HEALTH_RISK', level, data, recs);
    };

    return bypassCache ? fetchFn() : getOrSetCache('systemRiskScore', fetchFn, 3000);
  }

  // =========================================================
  // 3. PAYMENT ANOMALY DETECTION
  // =========================================================
  /**
   * Scans transaction records to isolate payment anomalies such as duplicates, delays, and verification spam.
   */
  static async detectPaymentAnomalies(bypassCache: boolean = false): Promise<IntelligenceStandardOutput<{
    flaggedPayments: Array<{
      paymentId: string;
      bookingId: string;
      studentId: string;
      studentName: string;
      reason: string;
      severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      reference: string | null;
    }>;
  }>> {
    const fetchFn = async () => {
      const payments = await prisma.payment.findMany({
        include: {
          booking: {
            include: {
              student: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const flaggedPayments: Array<{
        paymentId: string;
        bookingId: string;
        studentId: string;
        studentName: string;
        reason: string;
        severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        reference: string | null;
      }> = [];

      const referenceCountMap: Record<string, number> = {};
      const studentFailedCountMap: Record<string, number> = {};

      // Build index counts for duplicates and verification loops
      payments.forEach((p) => {
        if (p.reference) {
          const refUpper = p.reference.trim().toUpperCase();
          referenceCountMap[refUpper] = (referenceCountMap[refUpper] || 0) + 1;
        }
        if (p.status === 'FAILED') {
          const studentId = p.booking.studentId;
          studentFailedCountMap[studentId] = (studentFailedCountMap[studentId] || 0) + 1;
        }
      });

      const now = new Date();

      // Core detection loops
      for (const p of payments) {
        const student = p.booking.student;
        const refUpper = p.reference ? p.reference.trim().toUpperCase() : null;

        // 1. Duplicate reference code verification
        if (refUpper && referenceCountMap[refUpper] > 1) {
          flaggedPayments.push({
            paymentId: p.id,
            bookingId: p.bookingId,
            studentId: student.id,
            studentName: student.fullName,
            reason: `Duplicate transaction reference code discovered: '${p.reference}' used in multiple payment records.`,
            severity: 'CRITICAL',
            reference: p.reference,
          });
          continue;
        }

        // 2. Repeated failed verification tracking
        const failedCount = studentFailedCountMap[student.id] || 0;
        if (failedCount >= 2 && p.status === 'PENDING') {
          flaggedPayments.push({
            paymentId: p.id,
            bookingId: p.bookingId,
            studentId: student.id,
            studentName: student.fullName,
            reason: `High risk: Student has history of ${failedCount} failed payment verifications. Action strongly flagged for fraud check.`,
            severity: 'HIGH',
            reference: p.reference,
          });
          continue;
        }

        // 3. Unusually large payment delay checks
        const bookingAgeHrs = (p.createdAt.getTime() - p.booking.createdAt.getTime()) / (1000 * 60 * 60);
        if (bookingAgeHrs > 24) {
          flaggedPayments.push({
            paymentId: p.id,
            bookingId: p.bookingId,
            studentId: student.id,
            studentName: student.fullName,
            reason: `Unusual payment delay: Verification proof submitted ${bookingAgeHrs.toFixed(1)} hours after booking selection.`,
            severity: 'LOW',
            reference: p.reference,
          });
          continue;
        }

        // Delay in admin verification (pending > 48h)
        if (p.status === 'PENDING') {
          const pendingAgeHrs = (now.getTime() - p.createdAt.getTime()) / (1000 * 60 * 60);
          if (pendingAgeHrs > 48) {
            flaggedPayments.push({
              paymentId: p.id,
              bookingId: p.bookingId,
              studentId: student.id,
              studentName: student.fullName,
              reason: `Stale verification pipeline: Payment has been pending administrative action for ${pendingAgeHrs.toFixed(1)} hours.`,
              severity: 'MEDIUM',
              reference: p.reference,
            });
            continue;
          }
        }

        // 4. Mismatched student-payment patterns
        if (p.status === 'VERIFIED' && !p.proofImage && p.method !== 'ONLINE') {
          flaggedPayments.push({
            paymentId: p.id,
            bookingId: p.bookingId,
            studentId: student.id,
            studentName: student.fullName,
            reason: `Mismatched verification parameters: Payment verified without attached visual proof image or receipt files.`,
            severity: 'HIGH',
            reference: p.reference,
          });
          continue;
        }

        if (p.booking.status === 'CANCELLED' && p.status === 'VERIFIED') {
          flaggedPayments.push({
            paymentId: p.id,
            bookingId: p.bookingId,
            studentId: student.id,
            studentName: student.fullName,
            reason: `Inconsistent state mismatch: Payment verified but linked hostel booking holds status 'CANCELLED'.`,
            severity: 'HIGH',
            reference: p.reference,
          });
        }
      }

      // Compile recommendations
      const recs: string[] = [];
      const criticalCount = flaggedPayments.filter((f) => f.severity === 'CRITICAL').length;
      if (criticalCount > 0) {
        recs.push(`Suspend or audit ${criticalCount} payments immediately due to critical duplicate references.`);
      }
      if (flaggedPayments.length > 0) {
        recs.push(`Review the ${flaggedPayments.length} flagged transaction anomalies in the admin finance panel.`);
      } else {
        recs.push('No transactional anomalies detected.');
      }

      const overallSeverity = criticalCount > 0 ? 'CRITICAL' : flaggedPayments.length > 0 ? 'HIGH' : 'LOW';

      return this.format('PAYMENT_ANOMALY', overallSeverity, { flaggedPayments }, recs);
    };

    return bypassCache ? fetchFn() : getOrSetCache('paymentAnomalies', fetchFn, 5000);
  }

  // =========================================================
  // 4. ALLOCATION BOTTLENECK DETECTION
  // =========================================================
  /**
   * Scans rooms, capacity rules, and gender parameters to isolate issues causing student allocation stalls.
   */
  static async detectAllocationBottlenecks(bypassCache: boolean = false): Promise<IntelligenceStandardOutput<{
    roomsNearCapacity: Array<{
      roomId: string;
      roomNumber: string;
      buildingName: string;
      hostelName: string;
      occupancy: number;
      capacity: number;
    }>;
    genderImbalances: Array<{
      hostelId: string;
      hostelName: string;
      genderRule: string;
      maleCapacity: number;
      femaleCapacity: number;
      maleOccupancy: number;
      femaleOccupancy: number;
      imbalanceRatio: number;
    }>;
    stuckBuildings: Array<{
      buildingId: string;
      buildingName: string;
      hostelName: string;
      stuckReason: string;
    }>;
    stuckStudents: Array<{
      studentId: string;
      studentName: string;
      gender: string;
      bookingId: string;
      queuedDurationHrs: number;
    }>;
  }>> {
    const fetchFn = async () => {
      const now = Date.now();

      // Retrieve all room entities
      const rooms = await prisma.room.findMany({
        include: {
          building: {
            include: { hostel: true },
          },
        },
      });

      // Retrieve all stuck student bookings (status = CONFIRMED, i.e., verified payment but no allocation yet)
      const stuckBookings = await prisma.booking.findMany({
        where: {
          status: 'CONFIRMED',
          allocations: { none: {} },
        },
        include: {
          student: true,
          hostel: true,
        },
      });

      const hostels = await prisma.hostel.findMany({
        include: {
          buildings: {
            include: {
              rooms: true,
            },
          },
        },
      });

      // 1. Rooms near capacity (Occupancy >= capacity - 1)
      const roomsNearCapacity = rooms
        .filter((r) => r.capacity > 0 && r.currentOccupancy >= r.capacity - 1)
        .map((r) => ({
          roomId: r.id,
          roomNumber: r.roomNumber,
          buildingName: r.building.name,
          hostelName: r.building.hostel.name,
          occupancy: r.currentOccupancy,
          capacity: r.capacity,
        }));

      // 2. Gender imbalances blocking allocation
      const genderImbalances: Array<{
        hostelId: string;
        hostelName: string;
        genderRule: string;
        maleCapacity: number;
        femaleCapacity: number;
        maleOccupancy: number;
        femaleOccupancy: number;
        imbalanceRatio: number;
      }> = [];

      hostels.forEach((h) => {
        let maleCap = 0;
        let femaleCap = 0;
        let maleOcc = 0;
        let femaleOcc = 0;

        h.buildings.forEach((b) => {
          b.rooms.forEach((r) => {
            const rule = r.genderRule;
            if (rule === 'MALE_ONLY') {
              maleCap += r.capacity;
              maleOcc += r.currentOccupancy;
            } else if (rule === 'FEMALE_ONLY') {
              femaleCap += r.capacity;
              femaleOcc += r.currentOccupancy;
            } else {
              // Mixed split based on rules or active occupants
              maleCap += Math.ceil(r.capacity / 2);
              femaleCap += Math.floor(r.capacity / 2);
              maleOcc += Math.ceil(r.currentOccupancy / 2); // heuristic
              femaleOcc += Math.floor(r.currentOccupancy / 2);
            }
          });
        });

        const totalCap = maleCap + femaleCap;
        const totalOcc = maleOcc + femaleOcc;
        const imbalanceRatio = totalCap > 0 ? Math.abs(maleOcc / (maleCap || 1) - femaleOcc / (femaleCap || 1)) : 0;

        // If significant skewness detected
        if (imbalanceRatio > 0.3) {
          genderImbalances.push({
            hostelId: h.id,
            hostelName: h.name,
            genderRule: h.genderRule,
            maleCapacity: maleCap,
            femaleCapacity: femaleCap,
            maleOccupancy: maleOcc,
            femaleOccupancy: femaleOcc,
            imbalanceRatio,
          });
        }
      });

      // 3. Stuck buildings (booking enabled but no available rooms or disabled completely)
      const stuckBuildings: Array<{
        buildingId: string;
        buildingName: string;
        hostelName: string;
        stuckReason: string;
      }> = [];

      hostels.forEach((h) => {
        h.buildings.forEach((b) => {
          const totalRooms = b.rooms.length;
          const disabledRooms = b.rooms.filter((r) => !r.bookingEnabled).length;
          const fullRooms = b.rooms.filter((r) => r.currentOccupancy >= r.capacity).length;

          if (!b.bookingEnabled) {
            stuckBuildings.push({
              buildingId: b.id,
              buildingName: b.name,
              hostelName: h.name,
              stuckReason: 'Building bookings disabled entirely by administrative lock rules.',
            });
          } else if (fullRooms === totalRooms && totalRooms > 0) {
            stuckBuildings.push({
              buildingId: b.id,
              buildingName: b.name,
              hostelName: h.name,
              stuckReason: `Hostel building is fully saturated (100% capacity). All ${totalRooms} rooms are occupied.`,
            });
          } else if (disabledRooms > totalRooms / 2 && totalRooms > 0) {
            stuckBuildings.push({
              buildingId: b.id,
              buildingName: b.name,
              hostelName: h.name,
              stuckReason: `Critical building bottleneck: over 50% of available rooms (${disabledRooms}/${totalRooms}) are disabled.`,
            });
          }
        });
      });

      // 4. Students stuck in QUEUED state too long (> 1 hour)
      const stuckStudents = stuckBookings
        .map((b) => {
          const ageHrs = (now - b.createdAt.getTime()) / (1000 * 60 * 60);
          return {
            studentId: b.studentId,
            studentName: b.student.fullName,
            gender: b.student.gender || 'MALE',
            bookingId: b.id,
            queuedDurationHrs: ageHrs,
          };
        })
        .filter((s) => s.queuedDurationHrs > 1.0); // Stuck for more than 1 hour

      // Recommendation aggregation
      const recs: string[] = [];
      if (stuckStudents.length > 0) {
        recs.push(`Trigger the room allocation queue to unblock the ${stuckStudents.length} students stuck over 1 hour.`);
      }
      stuckBuildings.forEach((sb) => {
        if (sb.stuckReason.includes('saturated')) {
          recs.push(`Suspend bookings temporarily or increase manual allocation overrides for building '${sb.buildingName}' inside ${sb.hostelName}.`);
        }
      });
      if (genderImbalances.length > 0) {
        recs.push('Redistribute gender allocation rules across buildings to balance demographic vacancies.');
      }

      const severity = stuckStudents.length > 10 ? 'CRITICAL' : stuckStudents.length > 0 ? 'HIGH' : 'LOW';

      const data = {
        roomsNearCapacity,
        genderImbalances,
        stuckBuildings,
        stuckStudents,
      };

      return this.format('ALLOCATION_BOTTLENECK', severity, data, recs);
    };

    return bypassCache ? fetchFn() : getOrSetCache('allocationBottlenecks', fetchFn, 5000);
  }

  // =========================================================
  // 5. STUDENT RISK SCORING
  // =========================================================
  /**
   * Generates a risk profile with flags and riskLevel for a specific student based on database operations.
   */
  static async calculateStudentRiskProfile(studentId: string): Promise<IntelligenceStandardOutput<{
    studentId: string;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    riskScore: number;
    flags: string[];
  }>> {
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: {
        bookings: {
          include: {
            payments: true,
            allocations: true,
          },
        },
      },
    });

    if (!student) {
      throw new Error(`Student user record with ID ${studentId} not found.`);
    }

    const flags: string[] = [];
    let riskScore = 0;

    // Risk Factor 1: Active status block
    if (student.status === 'BLOCKED') {
      riskScore += 50;
      flags.push('STUDENT_BLOCKED_STATUS: Student is currently administrative-blocked.');
    }

    // Risk Factor 2: Repeated failed bookings (cancelled bookings count)
    const cancelledCount = student.bookings.filter((b) => b.status === 'CANCELLED').length;
    if (cancelledCount > 0) {
      const scoreAdded = Math.min(30, cancelledCount * 15);
      riskScore += scoreAdded;
      flags.push(`REPEATED_CANCELLATIONS: Student has ${cancelledCount} cancelled booking attempts.`);
    }

    // Risk Factor 3: Payment delays / verification failure spam
    let totalFailedPayments = 0;
    student.bookings.forEach((b) => {
      totalFailedPayments += b.payments.filter((p) => p.status === 'FAILED').length;
    });

    if (totalFailedPayments > 0) {
      const scoreAdded = Math.min(30, totalFailedPayments * 15);
      riskScore += scoreAdded;
      flags.push(`FAILED_PAYMENT_PROOF: Student submitted ${totalFailedPayments} payment references that failed verification.`);
    }

    // Risk Factor 4: Allocation revocations
    let revokedAllocations = 0;
    student.bookings.forEach((b) => {
      revokedAllocations += b.allocations.filter((a) => a.revokedAt !== null).length;
    });

    if (revokedAllocations > 0) {
      const scoreAdded = Math.min(40, revokedAllocations * 20);
      riskScore += scoreAdded;
      flags.push(`REVOCATION_HISTORY: Student has ${revokedAllocations} room allocation revocations in their audit timeline.`);
    }

    // Risk Factor 5: Inactivity after booking
    const activeBookingPending = student.bookings.find((b) => b.status === 'PENDING_PAYMENT');
    if (activeBookingPending) {
      const now = Date.now();
      const ageHours = (now - activeBookingPending.createdAt.getTime()) / (1000 * 60 * 60);
      if (ageHours > 12) {
        riskScore += 15;
        flags.push(`INACTIVE_PENDING_PAYMENT: Active selection locked but payment unsubmitted for ${ageHours.toFixed(1)} hours.`);
      }
    }

    riskScore = Math.min(100, Math.max(0, riskScore));

    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (riskScore > 60) riskLevel = 'HIGH';
    else if (riskScore > 30) riskLevel = 'MEDIUM';

    const data = {
      studentId,
      riskLevel,
      riskScore,
      flags,
    };

    const recs: string[] = [];
    if (riskLevel === 'HIGH') {
      recs.push(`Flag student account ${student.fullName} (${student.studentId || studentId}) for manual administrative audit.`);
    } else {
      recs.push('Student risk profile within normal operational parameters.');
    }

    return this.format('STUDENT_RISK_PROFILE', riskLevel === 'HIGH' ? 'HIGH' : riskLevel === 'MEDIUM' ? 'MEDIUM' : 'LOW', data, recs);
  }

  // =========================================================
  // 6. HOSTEL OCCUPANCY PRESSURE ANALYSIS
  // =========================================================
  /**
   * Evaluates occupancy percentages, underutilization, zones, and demographic supply vs demand across all hostels.
   */
  static async analyzeHostelPressure(bypassCache: boolean = false): Promise<IntelligenceStandardOutput<{
    hostelsPressure: Array<{
      hostelId: string;
      hostelName: string;
      occupancyRate: number;
      capacity: number;
      occupancy: number;
      pressureStatus: 'OVERFILLED' | 'UNDERUTILIZED' | 'STABLE';
      genderRule: string;
    }>;
    genderPressure: {
      MALE: { supply: number; demand: number; ratio: number };
      FEMALE: { supply: number; demand: number; ratio: number };
    };
  }>> {
    const fetchFn = async () => {
      const hostels = await prisma.hostel.findMany({
        include: {
          buildings: {
            include: {
              rooms: true,
            },
          },
        },
      });

      // Active student queue demand by gender
      const queuedBookings = await prisma.booking.findMany({
        where: { status: 'CONFIRMED', allocations: { none: {} } },
        include: { student: true },
      });

      const maleQueueCount = queuedBookings.filter((b) => b.student.gender === 'MALE').length;
      const femaleQueueCount = queuedBookings.filter((b) => b.student.gender === 'FEMALE').length;

      let totalMaleBeds = 0;
      let totalFemaleBeds = 0;

      const hostelsPressure = hostels.map((h) => {
        let capacity = 0;
        let occupancy = 0;

        h.buildings.forEach((b) => {
          b.rooms.forEach((r) => {
            capacity += r.capacity;
            occupancy += r.currentOccupancy;

            if (r.genderRule === 'MALE_ONLY') {
              totalMaleBeds += (r.capacity - r.currentOccupancy);
            } else if (r.genderRule === 'FEMALE_ONLY') {
              totalFemaleBeds += (r.capacity - r.currentOccupancy);
            } else {
              // Mixed room split heuristic
              const vac = r.capacity - r.currentOccupancy;
              totalMaleBeds += Math.ceil(vac / 2);
              totalFemaleBeds += Math.floor(vac / 2);
            }
          });
        });

        const occupancyRate = capacity > 0 ? (occupancy / capacity) * 100 : 0;
        let pressureStatus: 'OVERFILLED' | 'UNDERUTILIZED' | 'STABLE' = 'STABLE';

        if (occupancyRate > 90) pressureStatus = 'OVERFILLED';
        else if (occupancyRate < 30 && capacity > 0) pressureStatus = 'UNDERUTILIZED';

        return {
          hostelId: h.id,
          hostelName: h.name,
          occupancyRate,
          capacity,
          occupancy,
          pressureStatus,
          genderRule: h.genderRule,
        };
      });

      // Supply-Demand ratios
      const maleRatio = totalMaleBeds > 0 ? maleQueueCount / totalMaleBeds : maleQueueCount > 0 ? 999 : 0;
      const femaleRatio = totalFemaleBeds > 0 ? femaleQueueCount / totalFemaleBeds : femaleQueueCount > 0 ? 999 : 0;

      const genderPressure = {
        MALE: { supply: totalMaleBeds, demand: maleQueueCount, ratio: maleRatio },
        FEMALE: { supply: totalFemaleBeds, demand: femaleQueueCount, ratio: femaleRatio },
      };

      // Compile suggestions
      const recs: string[] = [];
      hostelsPressure.forEach((hp) => {
        if (hp.pressureStatus === 'OVERFILLED') {
          recs.push(`Pause new bookings or prioritize outbound transfers from overfilled Hostel '${hp.hostelName}'.`);
        } else if (hp.pressureStatus === 'UNDERUTILIZED') {
          recs.push(`Redistribute student allocations to fill vacancies in underutilized Hostel '${hp.hostelName}'.`);
        }
      });

      if (maleRatio > 1.2) recs.push(`High male demand: Male backlog exceeds vacancy by ${(maleRatio * 100 - 100).toFixed(1)}%. Allocate more male rooms.`);
      if (femaleRatio > 1.2) recs.push(`High female demand: Female backlog exceeds vacancy by ${(femaleRatio * 100 - 100).toFixed(1)}%. Allocate more female rooms.`);

      const overallSeverity = (maleRatio > 1.5 || femaleRatio > 1.5) ? 'HIGH' : 'LOW';

      return this.format('HOSTEL_PRESSURE', overallSeverity, { hostelsPressure, genderPressure }, recs);
    };

    return bypassCache ? fetchFn() : getOrSetCache('hostelPressure', fetchFn, 5000);
  }

  // =========================================================
  // 7. SYSTEM RECOMMENDATION ENGINE
  // =========================================================
  /**
   * Synthesizes global real-time operational context into detailed admin interventions.
   */
  static async generateAdminRecommendations(bypassCache: boolean = false): Promise<IntelligenceStandardOutput<string[]>> {
    const fetchFn = async () => {
      const recommendations: string[] = [];

      // 1. Fetch system risk
      const risk = await this.calculateSystemRiskScore(true);
      recommendations.push(...risk.recommendation);

      // 2. Fetch payment anomalies
      const pAnomalies = await this.detectPaymentAnomalies(true);
      recommendations.push(...pAnomalies.recommendation);

      // 3. Fetch bottlenecks
      const bottlenecks = await this.detectAllocationBottlenecks(true);
      recommendations.push(...bottlenecks.recommendation);

      // 4. Fetch hostel pressure
      const hPressure = await this.analyzeHostelPressure(true);
      recommendations.push(...hPressure.recommendation);

      // De-duplicate recommendations and filter generic placeholders
      const uniqueRecs = Array.from(new Set(recommendations))
        .filter((r) => !r.includes('No transactional anomalies') && !r.includes('normal operational parameters') && !r.includes('smoothly'));

      if (uniqueRecs.length === 0) {
        uniqueRecs.push('System operations are pristine. Maintain standard background worker configurations.');
      }

      const severity = risk.severity === 'CRITICAL' || risk.severity === 'HIGH' ? risk.severity : 'LOW';

      return this.format('ADMIN_RECOMMENDATIONS', severity, uniqueRecs, uniqueRecs);
    };

    return bypassCache ? fetchFn() : getOrSetCache('adminRecommendations', fetchFn, 5000);
  }

  // =========================================================
  // 8. ALERT GENERATION SYSTEM
  // =========================================================
  /**
   * Generates highly structured operational system alerts based on active bottlenecks, failures, and risks.
   */
  static async generateSystemAlerts(bypassCache: boolean = false): Promise<IntelligenceStandardOutput<Array<{
    type: 'PAYMENT_BACKLOG' | 'ALLOCATION_STUCK' | 'ROOM_OVERFLOW_RISK' | 'HIGH_RISK_STUDENT_ACTIVITY' | 'SYSTEM_OVERLOAD';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message: string;
    affectedEntities: Array<{ type: string; id: string }>;
    suggestedAction: string;
  }>>> {
    const fetchFn = async () => {
      const alerts: Array<{
        type: 'PAYMENT_BACKLOG' | 'ALLOCATION_STUCK' | 'ROOM_OVERFLOW_RISK' | 'HIGH_RISK_STUDENT_ACTIVITY' | 'SYSTEM_OVERLOAD';
        severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        message: string;
        affectedEntities: Array<{ type: string; id: string }>;
        suggestedAction: string;
      }> = [];

      // 1. Check pending payments backlog
      const pendingPayments = await prisma.payment.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'asc' },
      });

      if (pendingPayments.length > 5) {
        alerts.push({
          type: 'PAYMENT_BACKLOG',
          severity: pendingPayments.length > 15 ? 'CRITICAL' : 'HIGH',
          message: `Transactional queue backlog detected: ${pendingPayments.length} student transaction bank proofs are awaiting administrative review.`,
          affectedEntities: pendingPayments.map((p) => ({ type: 'payment', id: p.id })),
          suggestedAction: 'Deploy administrative staff to clear payment verification backlog in the finance portal.',
        });
      }

      // 2. Check allocation queues and stuck students
      const stuckBookings = await prisma.booking.findMany({
        where: { status: 'CONFIRMED', allocations: { none: {} } },
      });

      if (stuckBookings.length > 0) {
        alerts.push({
          type: 'ALLOCATION_STUCK',
          severity: stuckBookings.length > 10 ? 'HIGH' : 'MEDIUM',
          message: `Allocation queue stall: ${stuckBookings.length} student bookings are confirmed but have no active room assigned.`,
          affectedEntities: stuckBookings.map((b) => ({ type: 'booking', id: b.id })),
          suggestedAction: 'Execute background allocation engine task manually or enable administrator room assignment overrides.',
        });
      }

      // 3. Check room overflow risks
      const rooms = await prisma.room.findMany({
        include: { building: { include: { hostel: true } } },
      });

      const fullRooms = rooms.filter((r) => r.capacity > 0 && r.currentOccupancy >= r.capacity);
      if (fullRooms.length > 0) {
        alerts.push({
          type: 'ROOM_OVERFLOW_RISK',
          severity: 'HIGH',
          message: `Saturated capacity threat: ${fullRooms.length} rooms have reached 100% maximum capacity occupancy constraints.`,
          affectedEntities: fullRooms.map((r) => ({ type: 'room', id: r.id })),
          suggestedAction: 'Review building rules or temporarily freeze room selections in affected corridors.',
        });
      }

      // 4. Check system overload metrics (queue backlog & failed jobs)
      const jobs = JobQueue.getAllJobs();
      const failedJobs = jobs.filter((j) => j.status === 'failed');
      const backlogSize = jobs.filter((j) => j.status === 'pending' || j.status === 'running').length;

      if (failedJobs.length > 0 || backlogSize > 10) {
        alerts.push({
          type: 'SYSTEM_OVERLOAD',
          severity: failedJobs.length > 3 ? 'CRITICAL' : 'HIGH',
          message: `Background processor overload: job execution queue contains ${backlogSize} jobs, with ${failedJobs.length} permanent failures.`,
          affectedEntities: failedJobs.map((j) => ({ type: 'job', id: j.id })),
          suggestedAction: 'Invoke manual JobQueue retry loop and inspect system event loop locks.',
        });
      }

      const recs = alerts.map((a) => a.suggestedAction);
      const maxSeverity = alerts.some((a) => a.severity === 'CRITICAL')
        ? 'CRITICAL'
        : alerts.some((a) => a.severity === 'HIGH')
        ? 'HIGH'
        : alerts.some((a) => a.severity === 'MEDIUM')
        ? 'MEDIUM'
        : 'LOW';

      return this.format('SYSTEM_ALERTS', maxSeverity, alerts, recs);
    };

    return bypassCache ? fetchFn() : getOrSetCache('systemAlertsReport', fetchFn, 4000);
  }

  // =========================================================
  // 9. QUEUE BEHAVIOR ANALYSIS
  // =========================================================
  /**
   * Diagnoses memory job queue performance, isolating retries, execution lags, and stuck processes.
   */
  static async analyzeQueueHealth(): Promise<IntelligenceStandardOutput<{
    backlogCount: number;
    completedCount: number;
    failedCount: number;
    stuckJobs: Array<{ id: string; type: string; elapsedMinutes: number }>;
    spamLoops: Array<{ id: string; type: string; retryCount: number; maxRetries: number }>;
    longExecutionJobs: Array<{ id: string; type: string; durationMs: number }>;
    failedClusters: Record<string, number>;
  }>> {
    const jobs = JobQueue.getAllJobs();
    const now = Date.now();

    const backlogCount = jobs.filter((j) => j.status === 'pending' || j.status === 'running').length;
    const completedCount = jobs.filter((j) => j.status === 'completed').length;
    const failedCount = jobs.filter((j) => j.status === 'failed').length;

    const stuckJobs: Array<{ id: string; type: string; elapsedMinutes: number }> = [];
    const spamLoops: Array<{ id: string; type: string; retryCount: number; maxRetries: number }> = [];
    const longExecutionJobs: Array<{ id: string; type: string; durationMs: number }> = [];
    const failedClusters: Record<string, number> = {};

    jobs.forEach((j) => {
      // 1. Stuck jobs detection (running for > 5 minutes)
      if (j.status === 'running' && j.startedAt) {
        const elapsedMin = (now - j.startedAt.getTime()) / (1000 * 60);
        if (elapsedMin > 5.0) {
          stuckJobs.push({ id: j.id, type: j.type, elapsedMinutes: elapsedMin });
        }
      }

      // 2. Retry spam loops (retryCount > 2)
      if (j.retryCount > 2) {
        spamLoops.push({ id: j.id, type: j.type, retryCount: j.retryCount, maxRetries: j.maxRetries });
      }

      // 3. Long execution times (> 10 seconds / 10000ms)
      if (j.executionDuration && j.executionDuration > 10000) {
        longExecutionJobs.push({ id: j.id, type: j.type, durationMs: j.executionDuration });
      }

      // 4. Failed clusters by job type
      if (j.status === 'failed') {
        failedClusters[j.type] = (failedClusters[j.type] || 0) + 1;
      }
    });

    const data = {
      backlogCount,
      completedCount,
      failedCount,
      stuckJobs,
      spamLoops,
      longExecutionJobs,
      failedClusters,
    };

    const recs: string[] = [];
    if (stuckJobs.length > 0) recs.push(`Kill and restart ${stuckJobs.length} stuck running background threads.`);
    if (spamLoops.length > 0) recs.push(`Review parameters of ${spamLoops.length} jobs caught in high retry spam loops.`);
    if (Object.keys(failedClusters).length > 0) recs.push('Acknowledge failed background clusters and clear queue cache.');

    const severity = stuckJobs.length > 0 ? 'CRITICAL' : spamLoops.length > 0 ? 'HIGH' : 'LOW';

    return this.format('QUEUE_BEHAVIOR', severity, data, recs);
  }

  // =========================================================
  // 10. FORECASTING MODULE (SIMPLE HEURISTIC)
  // =========================================================
  /**
   * Applies heuristic forecasting to predict booking surges, room saturation times, and manual verifications queues.
   */
  static async forecastAllocationDemand(bypassCache: boolean = false): Promise<IntelligenceStandardOutput<{
    expectedPeakBookingLoad: number;
    expectedRoomExhaustionDays: number;
    expectedVerificationBacklogGrowth: number;
  }>> {
    const fetchFn = async () => {
      // 1. Expected peak load
      const totalStudents = await prisma.user.count({ where: { role: 'student' } });
      const activeBookings = await prisma.booking.count({ where: { status: { not: 'CANCELLED' } } });
      
      // Heuristic: students registered who have not booking selections represent potential near-future booking load
      const potentialStudentsNoBooking = Math.max(0, totalStudents - activeBookings);
      const expectedPeakBookingLoad = Math.ceil(potentialStudentsNoBooking * 0.75); // expect 75% peak booking rate

      // 2. Expected room exhaustion time
      const rooms = await prisma.room.findMany();
      const totalCapacity = rooms.reduce((acc, r) => acc + r.capacity, 0);
      const currentOccupancy = rooms.reduce((acc, r) => acc + r.currentOccupancy, 0);
      const vacantBeds = Math.max(0, totalCapacity - currentOccupancy);

      // Estimate rate of change based on last 7 days of allocations (simulate rate if database has low volume)
      const recentAllocations = await prisma.allocation.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          revokedAt: null,
        },
      });

      const allocationRatePerDay = Math.max(1.0, recentAllocations / 7); // minimum rate of 1 per day for stability
      const expectedRoomExhaustionDays = Math.round((vacantBeds / allocationRatePerDay) * 10) / 10;

      // 3. Expected verification backlog growth
      const payments = await prisma.payment.findMany({
        where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      });

      const newPaymentsPerDay = payments.length / 7;
      const verifiedPayments = payments.filter((p) => p.status === 'VERIFIED').length;
      const verificationsPerDay = verifiedPayments / 7;

      // Growth rate per day
      const expectedVerificationBacklogGrowth = Math.max(0, Math.round((newPaymentsPerDay - verificationsPerDay) * 10) / 10);

      const data = {
        expectedPeakBookingLoad,
        expectedRoomExhaustionDays,
        expectedVerificationBacklogGrowth,
      };

      const recs: string[] = [];
      if (expectedRoomExhaustionDays < 5.0) {
        recs.push(`CRITICAL: Bed capacity runs out in ${expectedRoomExhaustionDays} days. Expand room list immediately.`);
      } else {
        recs.push(`Hostel capacity is stable. Room exhaustion estimated in ${expectedRoomExhaustionDays} days.`);
      }
      if (expectedVerificationBacklogGrowth > 2.0) {
        recs.push(`Verification backlog growing at +${expectedVerificationBacklogGrowth} transactions/day. Increase review rate.`);
      }

      const severity = expectedRoomExhaustionDays < 3.0 ? 'CRITICAL' : expectedRoomExhaustionDays < 7.0 ? 'HIGH' : 'LOW';

      return this.format('DEMAND_FORECAST', severity, data, recs);
    };

    return bypassCache ? fetchFn() : getOrSetCache('demandForecast', fetchFn, 8000);
  }

  // =========================================================
  // 11. AUTO-PRIORITY SYSTEM
  // =========================================================
  /**
   * Assigns numeric and weighted prioritization matrices to system actors to streamline high-volume operations.
   */
  static async getPriorityScores(): Promise<IntelligenceStandardOutput<{
    studentsPriority: Array<{ studentId: string; studentName: string; score: number; reason: string }>;
    paymentsPriority: Array<{ paymentId: string; reference: string | null; score: number; reason: string }>;
    allocationJobsPriority: Array<{ jobId: string; type: string; score: number; reason: string }>;
  }>> {
    const now = Date.now();

    // 1. Students prioritization (Waiting duration vs Student risk)
    const stuckBookings = await prisma.booking.findMany({
      where: { status: 'CONFIRMED', allocations: { none: {} } },
      include: { student: true },
    });

    const studentsPriority = await Promise.all(
      stuckBookings.map(async (b) => {
        const student = b.student;
        const waitingHrs = (now - b.createdAt.getTime()) / (1000 * 60 * 60);

        // Fetch risk score
        const riskReport = await this.calculateStudentRiskProfile(student.id);
        const riskScore = riskReport.data.riskScore;

        // Formula: Priority rises with waiting duration but decreases if student represents massive anomaly risk
        const score = Math.round(Math.max(0, (waitingHrs * 15) - (riskScore * 0.4)));

        let reason = `Stuck in allocation queue for ${waitingHrs.toFixed(1)} hours.`;
        if (riskScore > 50) {
          reason += ' Weighted lower due to highlighted risk parameters.';
        }

        return {
          studentId: student.id,
          studentName: student.fullName,
          score,
          reason,
        };
      })
    );

    studentsPriority.sort((a, b) => b.score - a.score);

    // 2. Payments prioritization (Pending duration vs system load backlog impact)
    const pendingPayments = await prisma.payment.findMany({
      where: { status: 'PENDING' },
      include: { booking: { include: { student: true } } },
    });

    const paymentsPriority = pendingPayments.map((p) => {
      const pAgeHrs = (now - p.createdAt.getTime()) / (1000 * 60 * 60);
      const score = Math.round(pAgeHrs * 12);

      return {
        paymentId: p.id,
        reference: p.reference,
        score,
        reason: `Pending manual review for ${pAgeHrs.toFixed(1)} hours.`,
      };
    });

    paymentsPriority.sort((a, b) => b.score - a.score);

    // 3. Allocation jobs prioritization (High/Medium/Low tags vs queue backlog age)
    const jobs = JobQueue.getAllJobs().filter((j) => j.status === 'pending' || j.status === 'running');
    const allocationJobsPriority = jobs.map((j) => {
      const ageMin = (now - j.createdAt.getTime()) / (1000 * 60);
      const pWeight = j.priority === 'high' ? 50 : j.priority === 'medium' ? 25 : 10;
      const score = Math.round(pWeight + ageMin * 2.5);

      return {
        jobId: j.id,
        type: j.type,
        score,
        reason: `Job of priority level '${j.priority}' active in queue for ${ageMin.toFixed(1)} minutes.`,
      };
    });

    allocationJobsPriority.sort((a, b) => b.score - a.score);

    const data = {
      studentsPriority,
      paymentsPriority,
      allocationJobsPriority,
    };

    const recs: string[] = [];
    if (studentsPriority.length > 0) {
      recs.push(`Prioritize manual allocation overrides for top student: '${studentsPriority[0].studentName}' (Score: ${studentsPriority[0].score}).`);
    }
    if (paymentsPriority.length > 0) {
      recs.push(`Review highest age payment transaction reference: '${paymentsPriority[0].reference}' (Score: ${paymentsPriority[0].score}).`);
    }

    if (recs.length === 0) {
      recs.push('Auto-priority queues are completely cleared.');
    }

    return this.format('PRIORITY_SCORES', 'LOW', data, recs);
  }
}
export default AdminIntelligenceService;
