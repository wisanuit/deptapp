import { prisma } from "@/lib/prisma";
import type { RiskLevel, CreditChangeType } from "@prisma/client";

export interface CreateCustomerCreditInput {
  workspaceId: string;
  contactId: string;
  creditLimit: number;
  riskLevel?: RiskLevel;
  note?: string;
}

/**
 * สร้าง/ตั้งค่าวงเงินเครดิตลูกค้า
 */
export async function createCustomerCredit(input: CreateCustomerCreditInput) {
  // ตรวจสอบว่ามีอยู่แล้วหรือไม่
  const existing = await prisma.customerCredit.findFirst({
    where: {
      workspaceId: input.workspaceId,
      contactId: input.contactId,
    },
  });

  if (existing) {
    throw new Error("ลูกค้านี้มีการตั้งค่าวงเงินอยู่แล้ว");
  }

  const credit = await prisma.customerCredit.create({
    data: {
      workspaceId: input.workspaceId,
      contactId: input.contactId,
      creditLimit: input.creditLimit,
      availableCredit: input.creditLimit,
      usedCredit: 0,
      riskLevel: input.riskLevel || "MEDIUM",
    },
    include: { contact: true },
  });

  // บันทึกประวัติ
  await logCreditHistory(credit.id, "INCREASE", input.creditLimit, "ตั้งค่าวงเงินเริ่มต้น");

  return credit;
}

/**
 * อัพเดทวงเงินเครดิต
 */
export async function updateCreditLimit(
  creditId: string,
  newLimit: number,
  reason: string,
  changedBy: string
) {
  const credit = await prisma.customerCredit.findUnique({
    where: { id: creditId },
  });

  if (!credit) {
    throw new Error("ไม่พบข้อมูลวงเงินลูกค้า");
  }

  const previousLimit = Number(credit.creditLimit);
  const changeAmount = newLimit - previousLimit;
  
  // คำนวณ available credit ใหม่
  const usedCredit = Number(credit.usedCredit);
  const newAvailable = Math.max(0, newLimit - usedCredit);

  const updated = await prisma.customerCredit.update({
    where: { id: creditId },
    data: {
      creditLimit: newLimit,
      availableCredit: newAvailable,
    },
    include: { contact: true },
  });

  // บันทึกประวัติ
  const changeType = changeAmount > 0 ? "INCREASE" : "DECREASE";
  await logCreditHistory(
    creditId,
    changeType as CreditChangeType,
    Math.abs(changeAmount),
    reason,
    changedBy,
    previousLimit,
    newLimit
  );

  return updated;
}

/**
 * ใช้วงเงิน (เมื่อปล่อยกู้)
 */
export async function applyCredit(
  creditId: string,
  amount: number,
  reference?: string
) {
  const credit = await prisma.customerCredit.findUnique({
    where: { id: creditId },
  });

  if (!credit) {
    throw new Error("ไม่พบข้อมูลวงเงินลูกค้า");
  }

  const availableCredit = Number(credit.availableCredit);
  
  if (amount > availableCredit) {
    throw new Error(`วงเงินไม่เพียงพอ (เหลือ ${availableCredit.toLocaleString()} บาท)`);
  }

  const updated = await prisma.customerCredit.update({
    where: { id: creditId },
    data: {
      usedCredit: { increment: amount },
      availableCredit: { decrement: amount },
    },
  });

  // บันทึกประวัติ
  await logCreditHistory(creditId, "DECREASE", amount, reference || "ใช้วงเงิน");

  return updated;
}

/**
 * คืนวงเงิน (เมื่อชำระหนี้)
 */
export async function restoreCredit(
  creditId: string,
  amount: number,
  reference?: string
) {
  const credit = await prisma.customerCredit.findUnique({
    where: { id: creditId },
  });

  if (!credit) {
    throw new Error("ไม่พบข้อมูลวงเงินลูกค้า");
  }

  const usedCredit = Number(credit.usedCredit);
  const restoreAmount = Math.min(amount, usedCredit); // ไม่คืนเกินที่ใช้ไป

  const updated = await prisma.customerCredit.update({
    where: { id: creditId },
    data: {
      usedCredit: { decrement: restoreAmount },
      availableCredit: { increment: restoreAmount },
    },
  });

  // บันทึกประวัติ
  await logCreditHistory(creditId, "INCREASE", restoreAmount, reference || "คืนวงเงิน");

  return updated;
}

/**
 * บันทึกประวัติการเปลี่ยนแปลงวงเงิน
 */
async function logCreditHistory(
  customerCreditId: string,
  changeType: CreditChangeType,
  amount: number,
  reason: string,
  changedBy?: string,
  previousLimit?: number,
  newLimit?: number
) {
  return prisma.creditHistory.create({
    data: {
      customerCreditId,
      changeType,
      reason,
      changedBy,
      previousLimit: previousLimit ?? amount,
      newLimit: newLimit ?? amount,
    },
  });
}

/**
 * ประเมินความเสี่ยงลูกค้า
 */
export async function assessRiskLevel(creditId: string): Promise<RiskLevel> {
  const credit = await prisma.customerCredit.findUnique({
    where: { id: creditId },
    include: {
      contact: {
        include: {
          loansAsBorrower: true,
        },
      },
    },
  });

  if (!credit) {
    throw new Error("ไม่พบข้อมูลวงเงินลูกค้า");
  }

  const loans = credit.contact.loansAsBorrower;
  
  // คำนวณคะแนนความเสี่ยง
  let riskScore = 50; // เริ่มต้นที่ 50

  // ดูประวัติการชำระ
  for (const loan of loans) {
    if (loan.dueDate && new Date() > loan.dueDate && Number(loan.remainingPrincipal) > 0) {
      // มี Loan ค้างชำระ
      riskScore -= 15;
    }
    if (Number(loan.remainingPrincipal) === 0) {
      // ชำระหมดแล้ว
      riskScore += 5;
    }
  }

  // อัตราการใช้วงเงิน
  const utilizationRate = Number(credit.usedCredit) / Number(credit.creditLimit);
  if (utilizationRate > 0.9) riskScore -= 10;
  else if (utilizationRate > 0.7) riskScore -= 5;
  else if (utilizationRate < 0.3) riskScore += 5;

  // แปลงเป็น Risk Level
  let riskLevel: RiskLevel;
  if (riskScore >= 70) riskLevel = "LOW";
  else if (riskScore >= 50) riskLevel = "MEDIUM";
  else if (riskScore >= 30) riskLevel = "HIGH";
  else riskLevel = "CRITICAL";

  // อัพเดท
  await prisma.customerCredit.update({
    where: { id: creditId },
    data: {
      riskLevel,
      lastReviewDate: new Date(),
    },
  });

  return riskLevel;
}

/**
 * ดึงสรุปวงเงินทั้ง Workspace
 */
export async function getCreditStats(workspaceId: string) {
  const stats = await prisma.customerCredit.aggregate({
    where: { workspaceId },
    _sum: {
      creditLimit: true,
      usedCredit: true,
      availableCredit: true,
    },
    _count: true,
  });

  const byRisk = await prisma.customerCredit.groupBy({
    by: ["riskLevel"],
    where: { workspaceId },
    _count: true,
    _sum: { creditLimit: true },
  });

  return {
    totalCustomers: stats._count,
    totalCreditLimit: stats._sum.creditLimit || 0,
    totalUsedCredit: stats._sum.usedCredit || 0,
    totalAvailableCredit: stats._sum.availableCredit || 0,
    byRisk,
  };
}

/**
 * ดึงประวัติวงเงินลูกค้า
 */
export async function getCreditHistory(creditId: string) {
  return prisma.creditHistory.findMany({
    where: { customerCreditId: creditId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * ดึงวงเงินของ Contact
 */
export async function getContactCredit(workspaceId: string, contactId: string) {
  return prisma.customerCredit.findFirst({
    where: { workspaceId, contactId },
    include: {
      contact: true,
      history: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });
}
