import { prisma } from '../db';
import { NotificationService } from './notification.service';
import { CampusLinkStateMachine, StudentState as SMStudentState } from '../state-machine/campuslink-state-machine';

export type StudentState = SMStudentState;

export class LifecycleService {
  /**
   * Derive the current lifecycle state of a student based on actual database records.
   */
  static async getStudentState(studentId: string): Promise<StudentState> {
    return await CampusLinkStateMachine.deriveStudentState(studentId);
  }

  /**
   * Validate that a state transition is allowed under strict transition rules.
   */
  static validateTransition(currentState: StudentState, targetState: StudentState): boolean {
    const { VALID_TRANSITIONS } = require('../state-machine/campuslink-state-machine');
    const allowed = VALID_TRANSITIONS[currentState]?.includes(targetState);
    if (!allowed && currentState !== targetState) {
      throw new Error(`Invalid State Transition: Cannot transition student from ${currentState} to ${targetState}.`);
    }
    return true;
  }

  /**
   * Enforce system-wide global constraint rules.
   */
  static async verifyGlobalConstraints(studentId: string) {
    const user = await prisma.user.findUnique({
      where: { id: studentId },
    });

    if (!user) {
      throw new Error('Student profile not found.');
    }

    if (user.status === 'BLOCKED') {
      throw new Error('Access Denied: Restricted profiles cannot perform bookings, payments, or allocations.');
    }
  }
}

export default LifecycleService;
