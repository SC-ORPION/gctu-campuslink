import { prisma } from '../db';
import { AdminIntelligenceService } from './admin-intelligence.service';
import { AdminControlService } from './admin-control.service';
import { AuditLogService } from '../audit/audit-log';
import { JobQueue } from '../queue/job-queue';
import { CampusLinkStateMachine } from '../state-machine/campuslink-state-machine';

// 2. AUTOPILOT DECISION TYPES
export type AutopilotDecisionType = 'SUGGEST_ONLY' | 'REQUIRES_APPROVAL' | 'AUTO_EXECUTE';

// 12. ACTION PROPOSAL FORMAT
export interface ActionProposal {
  actionType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  affectedEntities: Array<{ type: string; id: string }>;
  recommendedSteps: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  approvalRequired: boolean;
  decisionType: AutopilotDecisionType;
  execute: (adminId?: string) => Promise<{
    success: boolean;
    message: string;
    beforeState?: any;
    afterState?: any;
  }>;
}

export class AdminAutopilotService {
  /**
   * Helper to format action proposal standard output format
   */
  private static createProposal(
    actionType: string,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    description: string,
    affectedEntities: Array<{ type: string; id: string }>,
    recommendedSteps: string[],
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    decisionType: AutopilotDecisionType,
    executeFn: (adminId?: string) => Promise<{ success: boolean; message: string; beforeState?: any; afterState?: any }>
  ): ActionProposal {
    return {
      actionType,
      severity,
      description,
      affectedEntities,
      recommendedSteps,
      riskLevel,
      approvalRequired: decisionType !== 'AUTO_EXECUTE',
      decisionType,
      execute: async (adminId?: string) => {
        // Enforce safe execution rules: adminId is required unless AUTO_EXECUTE is allowed
        if (decisionType !== 'AUTO_EXECUTE' && !adminId) {
          throw new Error(`Approval Required: Action of type '${actionType}' requires explicit adminId for approval and execution.`);
        }

        const actor = decisionType === 'AUTO_EXECUTE' ? 'system' : 'admin';
        const actorId = adminId || 'system';

        const result = await executeFn(adminId);

        // 13. EXECUTION TRACKING (Logged in the audit system)
        await AuditLogService.logAudit({
          entityType: 'system',
          entityId: affectedEntities[0]?.id || 'autopilot',
          actionType: `AUTOPILOT_EXECUTE_${actionType}`,
          previousState: JSON.stringify(result.beforeState || {}),
          newState: JSON.stringify(result.afterState || {}),
          actor,
          actorId,
          metadata: {
            actionType,
            severity,
            riskLevel,
            decisionType,
            success: result.success,
            message: result.message,
          },
        });

        return result;
      },
    };
  }

  // =========================================================
  // 3. PAYMENT BACKLOG AUTOPILOT
  // =========================================================
  static async resolvePaymentBacklog(): Promise<ActionProposal[]> {
    const thresholdDate = new Date(Date.now() - 1 * 60 * 60 * 1000); // 1 hour threshold
    const pendingPayments = await prisma.payment.findMany({
      where: {
        status: 'PENDING',
        createdAt: { lt: thresholdDate },
      },
      include: {
        booking: {
          include: {
            student: true,
            hostel: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (pendingPayments.length === 0) return [];

    // Group pending payments by hostel
    const groupedByHostel: Record<string, typeof pendingPayments> = {};
    pendingPayments.forEach((p) => {
      const hostelName = p.booking.hostel.name;
      if (!groupedByHostel[hostelName]) groupedByHostel[hostelName] = [];
      groupedByHostel[hostelName].push(p);
    });

    const proposals: ActionProposal[] = [];

    for (const [hostelName, payments] of Object.entries(groupedByHostel)) {
      const paymentIds = payments.map((p) => p.id);
      
      // Highlight high risk or high priority students
      const highPriorityStudents: string[] = [];
      const suspiciousPatterns: string[] = [];

      for (const p of payments) {
        const riskReport = await AdminIntelligenceService.calculateStudentRiskProfile(p.booking.studentId);
        if (riskReport.data.riskLevel === 'HIGH') {
          highPriorityStudents.push(p.booking.student.fullName);
        }
        if (riskReport.data.flags.some(f => f.includes('FAILED_PAYMENT_PROOF') || f.includes('STUDENT_BLOCKED_STATUS'))) {
          suspiciousPatterns.push(`Student ${p.booking.student.fullName} flagged with: ${riskReport.data.flags.join(', ')}`);
        }
      }

      const description = `Clear backlog of ${payments.length} pending payments for hostel '${hostelName}' submitted over 1 hour ago.` +
        (highPriorityStudents.length > 0 ? ` Proposes immediate review for high-risk students: ${highPriorityStudents.join(', ')}.` : '') +
        (suspiciousPatterns.length > 0 ? ` Warning: suspicious history detected: ${suspiciousPatterns.join('; ')}.` : '');

      proposals.push(
        this.createProposal(
          'RESOLVE_PAYMENT_BACKLOG_BATCH',
          highPriorityStudents.length > 0 ? 'HIGH' : 'MEDIUM',
          description,
          payments.map((p) => ({ type: 'payment', id: p.id })),
          [
            `Inspect transaction reference codes for ${payments.length} pending payments under ${hostelName}.`,
            'Verify bulk payment slip details manually.',
            'Confirm verified list to trigger automated room allocation loops.'
          ],
          highPriorityStudents.length > 0 ? 'HIGH' : 'MEDIUM',
          'REQUIRES_APPROVAL',
          async (adminId) => {
            const beforeState = payments.map((p) => ({ id: p.id, status: p.status }));
            
            // Safe manual bulk execution
            const executedList: string[] = [];
            for (const p of payments) {
              // Ensure we do not override blocked student records
              const student = await prisma.user.findUnique({ where: { id: p.booking.studentId } });
              if (student?.status === 'BLOCKED') {
                continue;
              }
              await AdminControlService.verifyPayment(adminId!, p.id);
              executedList.push(p.id);
            }

            const afterState = await prisma.payment.findMany({
              where: { id: { in: paymentIds } },
              select: { id: true, status: true },
            });

            return {
              success: true,
              message: `Successfully verified batch of ${executedList.length}/${payments.length} payments.`,
              beforeState,
              afterState,
            };
          }
        )
      );
    }

    return proposals;
  }

  // =========================================================
  // 4. ALLOCATION STUCK AUTOPILOT
  // =========================================================
  static async resolveAllocationBottleneck(): Promise<ActionProposal[]> {
    // Detect students stuck in QUEUED / CONFIRMED state without active allocation
    const stuckBookings = await prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        allocations: { none: {} },
      },
      include: {
        student: true,
        hostel: {
          include: {
            buildings: {
              include: {
                rooms: true,
              },
            },
          },
        },
      },
    });

    if (stuckBookings.length === 0) return [];

    const proposals: ActionProposal[] = [];

    for (const b of stuckBookings) {
      const student = b.student;
      
      // Identify root cause
      let rootCause = 'Unknown bottleneck';
      let proposedRoomId: string | null = null;
      let ruleRelaxationSuggested = false;

      const gender = student.gender;
      const expectedRoomRule = gender === 'MALE' ? 'MALE_ONLY' : 'FEMALE_ONLY';

      let totalRoomsScanned = 0;
      let capacityFilledCount = 0;
      let genderMismatchCount = 0;

      for (const building of b.hostel.buildings) {
        if (!building.bookingEnabled) continue;
        for (const room of building.rooms) {
          if (!room.bookingEnabled) continue;
          totalRoomsScanned++;

          if (room.genderRule !== expectedRoomRule) {
            genderMismatchCount++;
            continue;
          }

          if (room.currentOccupancy >= room.capacity) {
            capacityFilledCount++;
            continue;
          }

          // Found a valid space
          proposedRoomId = room.id;
          break;
        }
      }

      if (!proposedRoomId) {
        if (capacityFilledCount === totalRoomsScanned - genderMismatchCount && totalRoomsScanned > 0) {
          rootCause = 'Room saturation / capacity shortage';
        } else if (genderMismatchCount === totalRoomsScanned && totalRoomsScanned > 0) {
          rootCause = 'Gender rule allocation constraints';
        } else {
          rootCause = 'Capacity constraints or building overrides';
        }
        ruleRelaxationSuggested = true;
      } else {
        rootCause = 'Queue processor delay';
      }

      const description = `Student ${student.fullName} is stuck in confirmed queue state due to: ${rootCause}.`;

      proposals.push(
        this.createProposal(
          'RESOLVE_ALLOCATION_STUCK_CASE',
          ruleRelaxationSuggested ? 'HIGH' : 'MEDIUM',
          description,
          [{ type: 'booking', id: b.id }, { type: 'student', id: student.id }],
          ruleRelaxationSuggested
            ? [
                'Increase room capacities manually or register fresh vacant configurations.',
                'Relax building / gender boundaries under strict admin review.',
                'Trigger administrative manual override allocation bypass.'
              ]
            : [
                'Confirm manual override allocation to allocate room directly.',
                'Trigger the allocation queue worker manually.'
              ],
          ruleRelaxationSuggested ? 'HIGH' : 'LOW',
          'REQUIRES_APPROVAL',
          async (adminId) => {
            const beforeState = { bookingStatus: b.status };

            if (!proposedRoomId) {
              throw new Error(`Cannot automatically execute override: no vacant spaces fit the student profile. Relaxation requires manual configuration changes.`);
            }

            // Perform manual allocate override safely
            const allocation = await AdminControlService.manualAllocate(adminId!, student.id, proposedRoomId);

            const afterState = {
              bookingStatus: 'ALLOCATED',
              allocationId: allocation.id,
              roomId: proposedRoomId,
            };

            return {
              success: true,
              message: `Manually override allocation completed for student ${student.fullName} into Room ID ${proposedRoomId}.`,
              beforeState,
              afterState,
            };
          }
        )
      );
    }

    return proposals;
  }

  // =========================================================
  // 5. ROOM OVERFLOW AUTOPILOT
  // =========================================================
  static async fixRoomOverflowRisk(): Promise<ActionProposal[]> {
    const rooms = await prisma.room.findMany({
      include: {
        building: {
          include: { hostel: true },
        },
        allocations: {
          where: { revokedAt: null },
          include: {
            booking: {
              include: { student: true },
            },
          },
        },
      },
    });

    // Detect rooms exceeding or nearing capacity
    const overflowRooms = rooms.filter((r) => r.capacity > 0 && r.currentOccupancy >= r.capacity);
    if (overflowRooms.length === 0) return [];

    const proposals: ActionProposal[] = [];

    for (const r of overflowRooms) {
      // Propose reallocation candidates & swap strategy
      const candidates = r.allocations.map((a) => a.booking.student);
      if (candidates.length === 0) continue;

      const description = `Room ${r.roomNumber} in ${r.building.name} is saturated (${r.currentOccupancy}/${r.capacity} occupancy). Active allocation swap strategy advised.`;

      proposals.push(
        this.createProposal(
          'REALLOCATE_OVERFLOW_CANDIDATE',
          'HIGH',
          description,
          [{ type: 'room', id: r.id }, ...candidates.map((c) => ({ type: 'student', id: c.id }))],
          [
            'Identify target rooms in adjacent buildings matching same gender profiles.',
            'Confirm reassignRoom action batch to execute safe occupant swaps.',
            'Review building rules to avoid future double-bookings.'
          ],
          'MEDIUM',
          'REQUIRES_APPROVAL',
          async (adminId) => {
            const beforeState = r.allocations.map((a) => ({ id: a.id, roomId: a.roomId }));

            // Find alternative room matching the profile
            const expectedRule = r.genderRule;
            const alternativeRoom = await prisma.room.findFirst({
              where: {
                buildingId: r.buildingId,
                genderRule: expectedRule,
                currentOccupancy: { lt: r.capacity },
                bookingEnabled: true,
                id: { not: r.id },
              },
            });

            if (!alternativeRoom) {
              throw new Error(`Precondition Failed: No alternative room matches gender rule '${expectedRule}' with vacancies in same building.`);
            }

            const allocToMove = r.allocations[0];
            await AdminControlService.reassignRoom(adminId!, allocToMove.id, alternativeRoom.id);

            const afterState = [
              { id: allocToMove.id, roomId: alternativeRoom.id },
            ];

            return {
              success: true,
              message: `Successfully reallocated candidate ${allocToMove.booking.student.fullName} from Room ${r.roomNumber} to Room ${alternativeRoom.roomNumber}.`,
              beforeState,
              afterState,
            };
          }
        )
      );
    }

    return proposals;
  }

  // =========================================================
  // 6. HIGH RISK STUDENT AUTOPILOT
  // =========================================================
  static async resolveHighRiskStudentCases(): Promise<ActionProposal[]> {
    const students = await prisma.user.findMany({
      where: { role: 'student', status: 'ACTIVE' },
    });

    const proposals: ActionProposal[] = [];

    for (const s of students) {
      const riskReport = await AdminIntelligenceService.calculateStudentRiskProfile(s.id);
      if (riskReport.data.riskScore > 50) {
        const description = `Student ${s.fullName} flagged as high-risk (Score: ${riskReport.data.riskScore}) due to: ${riskReport.data.flags.join(', ')}.`;

        proposals.push(
          this.createProposal(
            'CONFIRM_STUDENT_RESTRICTION',
            'HIGH',
            description,
            [{ type: 'student', id: s.id }],
            [
              'Evaluate visual bank transaction proofs and cancellation histories.',
              'Acknowledge profile block or place booking lock limitations.',
              'Initiate direct physical student verification intervention.'
            ],
            'HIGH',
            'REQUIRES_APPROVAL',
            async (adminId) => {
              const beforeState = { status: s.status };
              
              // Safe administrative restriction lock
              await AdminControlService.blockStudent(adminId!, s.id, `Autopilot risk restriction override: ${riskReport.data.flags.join('; ')}`);

              const afterState = { status: 'BLOCKED' };

              return {
                success: true,
                message: `Administrative block executed successfully for student ${s.fullName}.`,
                beforeState,
                afterState,
              };
            }
          )
        );
      }
    }

    return proposals;
  }

  // =========================================================
  // 7. QUEUE FAILURE RECOVERY AUTOPILOT
  // =========================================================
  static async recoverFailedJobs(): Promise<ActionProposal[]> {
    const jobs = JobQueue.getAllJobs();
    const failedJobs = jobs.filter((j) => j.status === 'failed');

    if (failedJobs.length === 0) return [];

    // AUTO_EXECUTE is suitable for queue recovery system (only low-risk retry fixes)
    return [
      this.createProposal(
        'RETRY_FAILED_QUEUE_JOBS',
        'MEDIUM',
        `Processor detected ${failedJobs.length} permanently failed background jobs in the processing queue. Safe retry healing proposed.`,
        failedJobs.map((j) => ({ type: 'job', id: j.id })),
        [
          'Safe AUTO_EXECUTE trigger resets retry limits to 0.',
          'Requeues failed tasks back to pending state.',
          'Escalates to manual admin check if tasks fail repeatedly.'
        ],
        'LOW',
        'AUTO_EXECUTE',
        async () => {
          const beforeState = failedJobs.map((j) => ({ id: j.id, status: j.status, retryCount: j.retryCount }));

          const resetCount = JobQueue.retryFailedJobs();

          const afterState = JobQueue.getAllJobs()
            .filter((j) => beforeState.some((bs) => bs.id === j.id))
            .map((j) => ({ id: j.id, status: j.status, retryCount: j.retryCount }));

          return {
            success: true,
            message: `Successfully recovered and requeued ${resetCount} failed background queue jobs.`,
            beforeState,
            afterState,
          };
        }
      ),
    ];
  }

  // =========================================================
  // 8. PAYMENT VERIFICATION ASSIST AUTOPILOT
  // =========================================================
  static async assistPaymentVerification(): Promise<ActionProposal[]> {
    const anomaliesReport = await AdminIntelligenceService.detectPaymentAnomalies(true);
    const flaggedList = anomaliesReport.data.flaggedPayments;

    const pendingPayments = await prisma.payment.findMany({
      where: { status: 'PENDING' },
      include: {
        booking: {
          include: { student: true, hostel: true },
        },
      },
    });

    if (pendingPayments.length === 0) return [];

    // Clean payments (exclude flagged anomaly lists)
    const cleanPayments = pendingPayments.filter(
      (p) => !flaggedList.some((fp) => fp.paymentId === p.id)
    );

    if (cleanPayments.length === 0) return [];

    const proposals: ActionProposal[] = [];

    // Group candidates for bulk suggestion
    const groupKey = 'CLEAN_VERIFICATION_BATCH';
    const description = `Identified batch of ${cleanPayments.length} verified candidate payments completely clear of duplicate codes or timeline anomalies.`;

    proposals.push(
      this.createProposal(
        'BULK_VERIFY_CLEAN_PAYMENTS',
        'LOW',
        description,
        cleanPayments.map((p) => ({ type: 'payment', id: p.id })),
        [
          'Pre-verify transaction list automatically clustered by anomaly engine.',
          'Execute safe bulk approval to unblock bed allocation queues.'
        ],
        'LOW',
        'REQUIRES_APPROVAL',
        async (adminId) => {
          const beforeState = cleanPayments.map((p) => ({ id: p.id, status: p.status }));

          const verifiedIds: string[] = [];
          for (const p of cleanPayments) {
            // Verify payment
            await AdminControlService.verifyPayment(adminId!, p.id);
            verifiedIds.push(p.id);
          }

          const afterState = await prisma.payment.findMany({
            where: { id: { in: verifiedIds } },
            select: { id: true, status: true },
          });

          return {
            success: true,
            message: `Bulk payment assistant successfully verified ${verifiedIds.length} clear transactions.`,
            beforeState,
            afterState,
          };
        }
      )
    );

    return proposals;
  }

  // =========================================================
  // 9. HOSTEL OPTIMIZATION AUTOPILOT
  // =========================================================
  static async optimizeHostelDistribution(): Promise<ActionProposal[]> {
    const pressureReport = await AdminIntelligenceService.analyzeHostelPressure(true);
    const skewList = pressureReport.data.hostelsPressure;

    const overloaded = skewList.filter((h) => h.pressureStatus === 'OVERFILLED');
    const underused = skewList.filter((h) => h.pressureStatus === 'UNDERUTILIZED');

    if (overloaded.length === 0 && underused.length === 0) return [];

    const proposals: ActionProposal[] = [];

    // Propose temporary booking freeze in overloaded hostels & load balancing strategy
    for (const h of overloaded) {
      const description = `Hostel ${h.hostelName} is experiencing critical occupancy saturation (${h.occupancyRate.toFixed(1)}%). Booking freeze suggested.`;

      proposals.push(
        this.createProposal(
          'FREEZE_HOSTEL_BOOKINGS',
          'HIGH',
          description,
          [{ type: 'hostel', id: h.hostelId }],
          [
            'Temporarily suspend new incoming bookings on overloaded structures.',
            'Redirect prospective allocations to underutilized hostels.',
            'Balance gender/demographic occupancy rules.'
          ],
          'LOW',
          'REQUIRES_APPROVAL',
          async (adminId) => {
            const beforeState = { bookingEnabled: true };

            await AdminControlService.disableHostel(adminId!, h.hostelId);

            const afterState = { bookingEnabled: false };

            return {
              success: true,
              message: `Successfully frozen incoming bookings on overloaded Hostel ${h.hostelName} to optimize load distribution.`,
              beforeState,
              afterState,
            };
          }
        )
      );
    }

    return proposals;
  }
}

export default AdminAutopilotService;
