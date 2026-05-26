import { prisma } from '../db';

export type NotificationSeverity = 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';

export interface SystemNotification {
  id: string;
  studentId: string;
  title: string;
  message: string;
  timestamp: string;
  severity: NotificationSeverity;
  read: boolean;
}

// In-memory store for simulation & UI fallback, with simple file logging or database integration if models existed.
// Since we don't have a schema table, we use a robust in-memory global registry.
const globalNotifications = globalThis as unknown as {
  notifications: SystemNotification[];
};

if (!globalNotifications.notifications) {
  globalNotifications.notifications = [];
}

export class NotificationService {
  /**
   * Dispatches a new notification event.
   */
  static async sendNotification(
    studentId: string,
    title: string,
    message: string,
    severity: NotificationSeverity = 'INFO'
  ): Promise<SystemNotification> {
    const notification: SystemNotification = {
      id: Math.random().toString(36).substring(2, 11),
      studentId,
      title,
      message,
      timestamp: new Date().toISOString(),
      severity,
      read: false,
    };

    globalNotifications.notifications.push(notification);

    console.log(`[NOTIFICATION_EVENT] [${severity}] To student ${studentId}: ${title} - ${message}`);
    return notification;
  }

  /**
   * Retrieve all notifications for a student.
   */
  static async getNotifications(studentId: string): Promise<SystemNotification[]> {
    return globalNotifications.notifications.filter((n) => n.studentId === studentId);
  }

  /**
   * Mark all notifications as read.
   */
  static async markAsRead(studentId: string): Promise<void> {
    globalNotifications.notifications.forEach((n) => {
      if (n.studentId === studentId) {
        n.read = true;
      }
    });
  }

  /**
   * Clear all notifications for a student.
   */
  static async clearNotifications(studentId: string): Promise<void> {
    globalNotifications.notifications = globalNotifications.notifications.filter(
      (n) => n.studentId !== studentId
    );
  }
}

export default NotificationService;
