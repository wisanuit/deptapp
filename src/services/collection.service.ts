import { prisma } from "@/lib/prisma";
import type { CollectionStatus, CollectionPriority, ActivityType } from "@prisma/client";

export interface CreateCollectionCaseInput {
  workspaceId: string;
  loanId: string;
  contactId: string;
  totalOutstanding: number;
  principalDue: number;
  interestDue: number;
  daysPastDue: number;
  assignedTo?: string;
  priority?: CollectionPriority;
}

/**
 * สร้างเคสทวงหนี้
 */
export async function createCollectionCase(input: CreateCollectionCaseInput) {
  return prisma.collectionCase.create({
    data: {
      workspaceId: input.workspaceId,
      loanId: input.loanId,
      contactId: input.contactId,
      totalOutstanding: input.totalOutstanding,
      principalDue: input.principalDue,
      interestDue: input.interestDue,
      daysPastDue: input.daysPastDue,
      assignedTo: input.assignedTo,
      priority: input.priority || "NORMAL",
      status: "ACTIVE",
    },
    include: {
      loan: {
        include: {
          borrower: true,
        },
      },
      contact: true,
    },
  });
}

/**
 * บันทึกกิจกรรมทวงหนี้
 */
export async function logCollectionActivity(
  collectionCaseId: string,
  activityType: ActivityType,
  description: string,
  createdBy?: string,
  promisedAmount?: number,
  promisedDate?: Date,
  outcome?: string
) {
  const activity = await prisma.collectionActivity.create({
    data: {
      collectionCaseId,
      activityType,
      description,
      createdBy,
      promisedAmount,
      promisedDate,
      outcome,
    },
  });

  // อัพเดทวันที่ติดต่อล่าสุด
  await prisma.collectionCase.update({
    where: { id: collectionCaseId },
    data: { lastContactDate: new Date() },
  });

  return activity;
}

/**
 * อัพเดทสถานะเคส
 */
export async function updateCaseStatus(
  caseId: string,
  status: CollectionStatus
) {
  return prisma.collectionCase.update({
    where: { id: caseId },
    data: { status },
    include: {
      loan: {
        include: { borrower: true },
      },
      contact: true,
      activities: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });
}

/**
 * ดึงเคสที่รอติดตาม
 */
export async function getPendingCases(workspaceId: string) {
  return prisma.collectionCase.findMany({
    where: {
      workspaceId,
      status: { in: ["ACTIVE", "PROMISED", "PARTIAL"] },
    },
    include: {
      loan: {
        include: { borrower: true },
      },
      contact: true,
      activities: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: [
      { daysPastDue: "desc" },
    ],
  });
}

/**
 * สร้างเคสอัตโนมัติจาก Loan ค้างชำระ
 */
export async function autoCreateCollectionCases(workspaceId: string) {
  const today = new Date();
  
  // หา Loan ที่เลยกำหนดและยังไม่มีเคสทวงหนี้ที่ active
  const overdueLoans = await prisma.loan.findMany({
    where: {
      workspaceId,
      remainingPrincipal: { gt: 0 },
      dueDate: { lt: today },
      collectionCases: { none: { status: { in: ["ACTIVE", "PROMISED", "PARTIAL"] } } },
    },
    include: { borrower: true },
  });

  const newCases = [];

  for (const loan of overdueLoans) {
    if (!loan.dueDate) continue;
    
    const daysPastDue = Math.floor((today.getTime() - loan.dueDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // กำหนด Priority ตามจำนวนวันค้าง
    let priority: CollectionPriority = "LOW";
    if (daysPastDue > 90) priority = "CRITICAL";
    else if (daysPastDue > 60) priority = "HIGH";
    else if (daysPastDue > 30) priority = "NORMAL";

    const newCase = await createCollectionCase({
      workspaceId,
      loanId: loan.id,
      contactId: loan.borrowerId,
      totalOutstanding: Number(loan.remainingPrincipal),
      principalDue: Number(loan.remainingPrincipal),
      interestDue: 0,  // Would need calculation
      daysPastDue,
      priority,
    });

    newCases.push(newCase);
  }

  return newCases;
}

/**
 * ดึงสรุปการทวงหนี้
 */
export async function getCollectionStats(workspaceId: string) {
  const [active, promised, partial, resolved, writtenOff, legal] = await Promise.all([
    prisma.collectionCase.count({ where: { workspaceId, status: "ACTIVE" } }),
    prisma.collectionCase.count({ where: { workspaceId, status: "PROMISED" } }),
    prisma.collectionCase.count({ where: { workspaceId, status: "PARTIAL" } }),
    prisma.collectionCase.count({ where: { workspaceId, status: "RESOLVED" } }),
    prisma.collectionCase.count({ where: { workspaceId, status: "WRITTEN_OFF" } }),
    prisma.collectionCase.count({ where: { workspaceId, status: "LEGAL" } }),
  ]);

  const totalOutstandingAgg = await prisma.collectionCase.aggregate({
    where: { workspaceId, status: { in: ["ACTIVE", "PROMISED", "PARTIAL"] } },
    _sum: { totalOutstanding: true },
  });

  return {
    active,
    promised,
    partial,
    resolved,
    writtenOff,
    legal,
    totalActive: active + promised + partial,
    totalOutstanding: totalOutstandingAgg._sum.totalOutstanding || 0,
  };
}

/**
 * ดึงประวัติกิจกรรมของเคส
 */
export async function getCaseActivities(caseId: string) {
  return prisma.collectionActivity.findMany({
    where: { collectionCaseId: caseId },
    orderBy: { createdAt: "desc" },
  });
}
