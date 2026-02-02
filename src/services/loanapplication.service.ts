import { prisma } from "@/lib/prisma";
import type { LoanApplicationStatus } from "@prisma/client";

export interface CreateLoanApplicationInput {
  workspaceId: string;
  contactId: string;
  requestedAmount: number;
  purpose?: string;
  term?: number;
  interestPolicyId?: string;
}

/**
 * สร้างใบสมัครสินเชื่อ
 */
export async function createLoanApplication(input: CreateLoanApplicationInput) {
  return prisma.loanApplication.create({
    data: {
      workspaceId: input.workspaceId,
      contactId: input.contactId,
      requestedAmount: input.requestedAmount,
      purpose: input.purpose,
      term: input.term,
      interestPolicyId: input.interestPolicyId,
      status: "PENDING",
    },
    include: {
      contact: true,
      interestPolicy: true,
    },
  });
}

/**
 * อัพเดทสถานะใบสมัคร
 */
export async function updateApplicationStatus(
  applicationId: string,
  status: LoanApplicationStatus,
  reviewedBy: string,
  approvedAmount?: number,
  note?: string
) {
  const data: any = {
    status,
    reviewedAt: new Date(),
    reviewedBy,
  };

  if (status === "APPROVED") {
    data.approvedAmount = approvedAmount;
    data.approvalNote = note;
  } else if (status === "REJECTED") {
    data.rejectionReason = note;
  }

  return prisma.loanApplication.update({
    where: { id: applicationId },
    data,
    include: {
      contact: true,
      interestPolicy: true,
    },
  });
}

/**
 * อนุมัติและสร้าง Loan จากใบสมัคร
 */
export async function approveAndDisburse(
  applicationId: string,
  reviewedBy: string,
  approvedAmount: number,
  lenderUser: { id: string; name?: string | null; email?: string | null },
  startDate: Date,
  dueDate?: Date,
  note?: string
) {
  const application = await prisma.loanApplication.findUnique({
    where: { id: applicationId },
    include: { contact: true },
  });

  if (!application) {
    throw new Error("ไม่พบใบสมัครสินเชื่อ");
  }

  if (application.status !== "PENDING" && application.status !== "REVIEWING" && application.status !== "APPROVED") {
    throw new Error("สถานะใบสมัครไม่สามารถเบิกจ่ายได้");
  }

  // สร้าง Loan
  const lenderContact = await prisma.contact.findFirst({
    where: {
      workspaceId: application.workspaceId,
      userId: lenderUser.id,
    },
  });

  const contact =
    lenderContact ||
    (await prisma.contact.create({
      data: {
        workspaceId: application.workspaceId,
        userId: lenderUser.id,
        name: lenderUser.name || lenderUser.email || "บัญชีของฉัน",
        email: lenderUser.email || undefined,
        type: "LENDER",
      },
    }));

  const loan = await prisma.loan.create({
    data: {
      workspaceId: application.workspaceId,
      borrowerId: application.contactId,
      lenderId: contact.id,
      principal: approvedAmount,
      remainingPrincipal: approvedAmount,
      startDate,
      dueDate,
      interestPolicyId: application.interestPolicyId,
      applicationId,
      note,
    },
  });

  // อัพเดทใบสมัคร
  await prisma.loanApplication.update({
    where: { id: applicationId },
    data: {
      status: "DISBURSED",
      approvedAmount,
      reviewedAt: new Date(),
      reviewedBy,
      approvalNote: note,
    },
  });

  return loan;
}

/**
 * ดึงใบสมัครที่รอดำเนินการ
 */
export async function getPendingApplications(workspaceId: string) {
  return prisma.loanApplication.findMany({
    where: {
      workspaceId,
      status: { in: ["PENDING", "REVIEWING"] },
    },
    include: {
      contact: true,
      interestPolicy: true,
    },
    orderBy: { submittedAt: "asc" },
  });
}

/**
 * ดึงสรุปใบสมัคร
 */
export async function getApplicationStats(workspaceId: string) {
  const [pending, approved, rejected, disbursed] = await Promise.all([
    prisma.loanApplication.count({ where: { workspaceId, status: "PENDING" } }),
    prisma.loanApplication.count({ where: { workspaceId, status: "APPROVED" } }),
    prisma.loanApplication.count({ where: { workspaceId, status: "REJECTED" } }),
    prisma.loanApplication.count({ where: { workspaceId, status: "DISBURSED" } }),
  ]);

  const totalRequested = await prisma.loanApplication.aggregate({
    where: { workspaceId },
    _sum: { requestedAmount: true },
  });

  const totalApproved = await prisma.loanApplication.aggregate({
    where: { workspaceId, status: { in: ["APPROVED", "DISBURSED"] } },
    _sum: { approvedAmount: true },
  });

  return {
    pending,
    approved,
    rejected,
    disbursed,
    totalRequested: totalRequested._sum.requestedAmount || 0,
    totalApproved: totalApproved._sum.approvedAmount || 0,
  };
}
