import { prisma } from "@/lib/prisma";
import type { Loan, Payment, PaymentAllocation } from "@prisma/client";

export type AllocationMethod = "INTEREST_FIRST" | "PRINCIPAL_FIRST" | "FIFO";

export interface AllocationItem {
  loanId: string;
  principalPaid: number;
  interestPaid: number;
}

export interface LoanWithBalance extends Loan {
  accruedInterest: number;
}

/**
 * Auto-allocate payment ให้หลาย loans
 */
export async function autoAllocatePayment(
  workspaceId: string,
  amount: number,
  method: AllocationMethod
): Promise<AllocationItem[]> {
  // ดึง loans ที่ยังเปิดอยู่
  const loans = await prisma.loan.findMany({
    where: {
      workspaceId,
      status: { in: ["OPEN", "OVERDUE"] },
    },
    orderBy: method === "FIFO" ? { startDate: "asc" } : undefined,
  });

  const allocations: AllocationItem[] = [];
  let remainingAmount = amount;

  for (const loan of loans) {
    if (remainingAmount <= 0) break;

    const loanInterest = loan.accruedInterest;
    const loanPrincipal = loan.remainingPrincipal;

    let interestPaid = 0;
    let principalPaid = 0;

    if (method === "INTEREST_FIRST") {
      // ตัดดอกก่อน
      interestPaid = Math.min(loanInterest, remainingAmount);
      remainingAmount -= interestPaid;

      principalPaid = Math.min(loanPrincipal, remainingAmount);
      remainingAmount -= principalPaid;
    } else if (method === "PRINCIPAL_FIRST") {
      // ตัดต้นก่อน
      principalPaid = Math.min(loanPrincipal, remainingAmount);
      remainingAmount -= principalPaid;

      interestPaid = Math.min(loanInterest, remainingAmount);
      remainingAmount -= interestPaid;
    } else {
      // FIFO - ตัดดอกก่อนแล้วค่อยต้น (เรียงตามวันที่ยืม)
      interestPaid = Math.min(loanInterest, remainingAmount);
      remainingAmount -= interestPaid;

      principalPaid = Math.min(loanPrincipal, remainingAmount);
      remainingAmount -= principalPaid;
    }

    if (interestPaid > 0 || principalPaid > 0) {
      allocations.push({
        loanId: loan.id,
        principalPaid,
        interestPaid,
      });
    }
  }

  return allocations;
}

/**
 * Apply allocations ให้ loans (อัพเดท remainingPrincipal และ accruedInterest)
 */
export async function applyAllocations(
  paymentId: string,
  allocations: AllocationItem[]
): Promise<PaymentAllocation[]> {
  const results: PaymentAllocation[] = [];

  for (const allocation of allocations) {
    // สร้าง allocation record
    const allocationRecord = await prisma.paymentAllocation.create({
      data: {
        paymentId,
        loanId: allocation.loanId,
        principalPaid: allocation.principalPaid,
        interestPaid: allocation.interestPaid,
      },
    });

    // อัพเดท loan
    const loan = await prisma.loan.findUnique({
      where: { id: allocation.loanId },
    });

    if (loan) {
      const newRemainingPrincipal = Math.max(0, loan.remainingPrincipal - allocation.principalPaid);
      const newAccruedInterest = Math.max(0, loan.accruedInterest - allocation.interestPaid);

      await prisma.loan.update({
        where: { id: allocation.loanId },
        data: {
          remainingPrincipal: newRemainingPrincipal,
          accruedInterest: newAccruedInterest,
          status: newRemainingPrincipal <= 0 ? "CLOSED" : "OPEN",
        },
      });
    }

    results.push(allocationRecord);
  }

  return results;
}

/**
 * สร้าง Payment พร้อม Allocations
 */
export async function createPaymentWithAllocations(
  workspaceId: string,
  amount: number,
  paymentDate: Date,
  allocations: AllocationItem[],
  note?: string,
  attachmentUrl?: string
): Promise<Payment> {
  // ตรวจสอบว่ายอด allocations ไม่เกินยอดจ่าย
  const totalAllocated = allocations.reduce(
    (sum, a) => sum + a.principalPaid + a.interestPaid,
    0
  );

  if (totalAllocated > amount) {
    throw new Error("ยอด allocation รวมเกินยอดที่จ่าย");
  }

  // สร้าง payment
  const payment = await prisma.payment.create({
    data: {
      workspaceId,
      amount,
      paymentDate,
      note,
      attachmentUrl,
    },
  });

  // Apply allocations
  await applyAllocations(payment.id, allocations);

  return payment;
}

/**
 * ดึงสรุปการจ่ายเงินของ Loan
 */
export async function getLoanPaymentSummary(loanId: string) {
  const allocations = await prisma.paymentAllocation.findMany({
    where: { loanId },
    include: { payment: true },
    orderBy: { createdAt: "asc" },
  });

  const totalPrincipalPaid = allocations.reduce((sum: number, a: any) => sum + a.principalPaid, 0);
  const totalInterestPaid = allocations.reduce((sum: number, a: any) => sum + a.interestPaid, 0);

  return {
    allocations,
    totalPrincipalPaid,
    totalInterestPaid,
    totalPaid: totalPrincipalPaid + totalInterestPaid,
  };
}
