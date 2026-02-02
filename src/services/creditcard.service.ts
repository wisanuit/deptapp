import { prisma } from "@/lib/prisma";
import type { CreditCardStatement } from "@prisma/client";
import { getDaysInMonth } from "@/lib/utils";

/**
 * สร้าง statement อัตโนมัติสำหรับบัตรเครดิต
 */
export async function generateStatement(
  creditCardId: string,
  statementDate?: Date
): Promise<CreditCardStatement> {
  const card = await prisma.creditCard.findUnique({
    where: { id: creditCardId },
  });

  if (!card) {
    throw new Error("ไม่พบบัตรเครดิต");
  }

  const today = statementDate || new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  // กำหนดวันตัดรอบ
  const cutDay = Math.min(card.statementCutDay, getDaysInMonth(year, month));
  const statementCutDate = new Date(year, month, cutDay);

  // กำหนดวันครบกำหนดชำระ
  const dueDate = new Date(statementCutDate);
  dueDate.setDate(dueDate.getDate() + card.paymentDueDays);

  // ดึง statement ก่อนหน้า
  const previousStatement = await prisma.creditCardStatement.findFirst({
    where: { creditCardId },
    orderBy: { statementDate: "desc" },
  });

  const openingBalance = previousStatement?.closingBalance || 0;

  // คำนวณดอกเบี้ย (ถ้ายอดก่อนหน้ายังไม่ได้ชำระเต็ม)
  let interestCharged = 0;
  if (previousStatement && !previousStatement.isPaid) {
    const unpaidAmount = previousStatement.closingBalance - previousStatement.totalPaid;
    if (unpaidAmount > 0) {
      // คิดดอกเบี้ยแบบ prorate ถ้าจ่ายกลางเดือน
      interestCharged = calculateCreditCardInterest(
        unpaidAmount,
        card.interestRate,
        previousStatement.dueDate,
        statementCutDate
      );
    }
  }

  const closingBalance = card.currentBalance + interestCharged;

  // คำนวณยอดชำระขั้นต่ำ
  const minimumPayment = calculateMinimumPayment(
    closingBalance,
    card.minPaymentPercent,
    card.minPaymentFixed
  );

  const statement = await prisma.creditCardStatement.create({
    data: {
      creditCardId,
      statementDate: statementCutDate,
      dueDate,
      openingBalance,
      closingBalance,
      minimumPayment,
      interestCharged,
    },
  });

  return statement;
}

/**
 * คำนวณดอกเบี้ยบัตรเครดิต
 * คิด prorate รายวันตามช่วงเวลา
 */
export function calculateCreditCardInterest(
  unpaidAmount: number,
  monthlyRate: number,
  fromDate: Date,
  toDate: Date
): number {
  const days = Math.ceil(
    (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  const year = fromDate.getFullYear();
  const month = fromDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const dailyRate = monthlyRate / daysInMonth;

  return unpaidAmount * dailyRate * days;
}

/**
 * คำนวณยอดชำระขั้นต่ำ
 */
export function calculateMinimumPayment(
  balance: number,
  percentRate: number,
  fixedAmount?: number | null
): number {
  const percentMinimum = balance * percentRate;
  
  if (fixedAmount && fixedAmount > percentMinimum) {
    return Math.min(fixedAmount, balance);
  }
  
  return Math.min(percentMinimum, balance);
}

/**
 * จ่ายเงินบัตรเครดิต
 */
export async function payCreditCardStatement(
  statementId: string,
  amount: number,
  paymentDate: Date,
  note?: string
) {
  const statement = await prisma.creditCardStatement.findUnique({
    where: { id: statementId },
    include: { creditCard: true },
  });

  if (!statement) {
    throw new Error("ไม่พบใบแจ้งยอด");
  }

  // สร้าง allocation record
  const allocation = await prisma.creditCardPaymentAllocation.create({
    data: {
      statementId,
      amount,
      paymentDate,
      note,
    },
  });

  // อัพเดท statement
  const newTotalPaid = statement.totalPaid + amount;
  const isPaid = newTotalPaid >= statement.closingBalance;

  await prisma.creditCardStatement.update({
    where: { id: statementId },
    data: {
      totalPaid: newTotalPaid,
      isPaid,
    },
  });

  // อัพเดท current balance ของบัตร
  await prisma.creditCard.update({
    where: { id: statement.creditCardId },
    data: {
      currentBalance: {
        decrement: amount,
      },
    },
  });

  return allocation;
}

/**
 * ดึงสรุปบัตรเครดิต
 */
export async function getCreditCardSummary(creditCardId: string) {
  const card = await prisma.creditCard.findUnique({
    where: { id: creditCardId },
  });

  if (!card) {
    throw new Error("ไม่พบบัตรเครดิต");
  }

  const statements = await prisma.creditCardStatement.findMany({
    where: { creditCardId },
    orderBy: { statementDate: "desc" },
    take: 12,
  });

  const unpaidStatements = statements.filter((s: any) => !s.isPaid);
  const totalUnpaid = unpaidStatements.reduce(
    (sum: number, s: any) => sum + (s.closingBalance - s.totalPaid),
    0
  );

  return {
    card,
    statements,
    unpaidStatements,
    totalUnpaid,
    availableCredit: card.creditLimit - card.currentBalance,
  };
}

/**
 * เพิ่มรายการใช้จ่ายในบัตร
 */
export async function addCreditCardTransaction(
  creditCardId: string,
  amount: number
) {
  const card = await prisma.creditCard.findUnique({
    where: { id: creditCardId },
  });

  if (!card) {
    throw new Error("ไม่พบบัตรเครดิต");
  }

  const newBalance = card.currentBalance + amount;

  if (newBalance > card.creditLimit) {
    throw new Error("เกินวงเงินบัตร");
  }

  await prisma.creditCard.update({
    where: { id: creditCardId },
    data: {
      currentBalance: newBalance,
    },
  });

  return { newBalance, availableCredit: card.creditLimit - newBalance };
}
