import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@prisma/client";

/**
 * สร้าง Notification ใหม่
 */
export async function createNotification(
  workspaceId: string,
  type: NotificationType,
  title: string,
  message: string,
  referenceId?: string,
  referenceType?: string,
  dueDate?: Date
) {
  return prisma.notification.create({
    data: {
      workspaceId,
      type,
      title,
      message,
      referenceId,
      referenceType,
      dueDate,
    },
  });
}

/**
 * ดึง Notifications ของ Workspace
 */
export async function getNotifications(workspaceId: string, unreadOnly = false) {
  return prisma.notification.findMany({
    where: {
      workspaceId,
      ...(unreadOnly ? { isRead: false } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string) {
  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(workspaceId: string) {
  return prisma.notification.updateMany({
    where: { workspaceId, isRead: false },
    data: { isRead: true },
  });
}

/**
 * Dismiss notification (delete it)
 */
export async function dismissNotification(notificationId: string) {
  return prisma.notification.delete({
    where: { id: notificationId },
  });
}

/**
 * ตรวจสอบและสร้าง notifications สำหรับสัญญาที่ใกล้ครบกำหนด
 */
export async function checkDuePayments(workspaceId: string, daysInAdvance = 7) {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + daysInAdvance);

  // หา loans ที่ใกล้ครบกำหนด
  const loans = await prisma.loan.findMany({
    where: {
      workspaceId,
      status: "OPEN",
      dueDate: {
        gte: today,
        lte: futureDate,
      },
    },
    include: {
      borrower: true,
    },
  });

  const notifications = [];

  for (const loan of loans) {
    // ตรวจสอบว่ามี notification แล้วหรือยัง
    const existing = await prisma.notification.findFirst({
      where: {
        workspaceId,
        referenceId: loan.id,
        referenceType: "LOAN",
        type: "PAYMENT_DUE",
        createdAt: {
          gte: new Date(today.setHours(0, 0, 0, 0)),
        },
      },
    });

    if (!existing && loan.dueDate) {
      const daysUntilDue = Math.ceil(
        (loan.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      const notification = await createNotification(
        workspaceId,
        "PAYMENT_DUE",
        `สัญญาใกล้ครบกำหนด`,
        `สัญญากับ ${loan.borrower.name} จะครบกำหนดใน ${daysUntilDue} วัน (ยอดคงเหลือ ${loan.remainingPrincipal.toLocaleString()} บาท)`,
        loan.id,
        "LOAN",
        loan.dueDate
      );
      notifications.push(notification);
    }
  }

  return notifications;
}

/**
 * ตรวจสอบและสร้าง notifications สำหรับสัญญาที่เลยกำหนด
 */
export async function checkOverdueLoans(workspaceId: string) {
  const today = new Date();

  const loans = await prisma.loan.findMany({
    where: {
      workspaceId,
      status: "OPEN",
      dueDate: {
        lt: today,
      },
    },
    include: {
      borrower: true,
    },
  });

  const notifications = [];

  for (const loan of loans) {
    const existing = await prisma.notification.findFirst({
      where: {
        workspaceId,
        referenceId: loan.id,
        referenceType: "LOAN",
        type: "LOAN_OVERDUE",
        createdAt: {
          gte: new Date(today.setHours(0, 0, 0, 0)),
        },
      },
    });

    if (!existing && loan.dueDate) {
      const daysOverdue = Math.ceil(
        (new Date().getTime() - loan.dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // อัพเดทสถานะ loan
      await prisma.loan.update({
        where: { id: loan.id },
        data: { status: "OVERDUE" },
      });

      const notification = await createNotification(
        workspaceId,
        "LOAN_OVERDUE",
        `สัญญาเลยกำหนดชำระ`,
        `สัญญากับ ${loan.borrower.name} เลยกำหนด ${daysOverdue} วัน (ยอดค้าง ${loan.remainingPrincipal.toLocaleString()} บาท)`,
        loan.id,
        "LOAN"
      );
      notifications.push(notification);
    }
  }

  return notifications;
}

/**
 * ตรวจสอบบัตรเครดิตใกล้ครบกำหนด
 */
export async function checkCreditCardDue(workspaceId: string, daysInAdvance = 7) {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + daysInAdvance);

  const statements = await prisma.creditCardStatement.findMany({
    where: {
      creditCard: { workspaceId },
      isPaid: false,
      dueDate: {
        gte: today,
        lte: futureDate,
      },
    },
    include: {
      creditCard: true,
    },
  });

  const notifications = [];

  for (const statement of statements) {
    const existing = await prisma.notification.findFirst({
      where: {
        workspaceId,
        referenceId: statement.id,
        referenceType: "CREDIT_CARD_STATEMENT",
        type: "CREDIT_CARD_DUE",
        createdAt: {
          gte: new Date(today.setHours(0, 0, 0, 0)),
        },
      },
    });

    if (!existing) {
      const daysUntilDue = Math.ceil(
        (statement.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      const notification = await createNotification(
        workspaceId,
        "CREDIT_CARD_DUE",
        `บัตรเครดิตใกล้ครบกำหนด`,
        `บัตร ${statement.creditCard.name} ครบกำหนดใน ${daysUntilDue} วัน (ยอดขั้นต่ำ ${statement.minimumPayment.toLocaleString()} บาท)`,
        statement.id,
        "CREDIT_CARD_STATEMENT",
        statement.dueDate
      );
      notifications.push(notification);
    }
  }

  return notifications;
}

/**
 * รันการตรวจสอบทั้งหมด
 */
export async function runAllNotificationChecks(workspaceId: string) {
  const [duePayments, overdueLoans, creditCardDue] = await Promise.all([
    checkDuePayments(workspaceId),
    checkOverdueLoans(workspaceId),
    checkCreditCardDue(workspaceId),
  ]);

  return {
    duePayments: duePayments.length,
    overdueLoans: overdueLoans.length,
    creditCardDue: creditCardDue.length,
    total: duePayments.length + overdueLoans.length + creditCardDue.length,
  };
}
