import { prisma } from "@/lib/prisma";

export interface CreateInstallmentPlanInput {
  workspaceId: string;
  contactId: string;
  itemName: string;
  itemDescription?: string;
  itemImageUrl?: string;
  totalAmount: number;
  downPayment?: number;
  numberOfTerms: number;
  interestRate?: number;
  startDate: Date;
}

/**
 * สร้าง Installment Plan พร้อมงวดผ่อน
 */
export async function createInstallmentPlan(input: CreateInstallmentPlanInput) {
  const {
    workspaceId,
    contactId,
    itemName,
    itemDescription,
    itemImageUrl,
    totalAmount,
    downPayment = 0,
    numberOfTerms,
    interestRate = 0,
    startDate,
  } = input;

  // คำนวณยอดหลังหักเงินดาวน์
  const amountToFinance = totalAmount - downPayment;

  // คำนวณดอกเบี้ยรวม (simple interest)
  const totalInterest = amountToFinance * (interestRate / 100) * (numberOfTerms / 12);
  const totalWithInterest = amountToFinance + totalInterest;

  // คำนวณยอดต่องวด
  const termAmount = Math.ceil(totalWithInterest / numberOfTerms);
  const principalPerTerm = amountToFinance / numberOfTerms;
  const interestPerTerm = totalInterest / numberOfTerms;

  // สร้าง Plan
  const plan = await prisma.installmentPlan.create({
    data: {
      workspaceId,
      contactId,
      itemName,
      itemDescription,
      itemImageUrl,
      totalAmount,
      downPayment,
      numberOfTerms,
      termAmount,
      interestRate,
      startDate,
    },
  });

  // สร้างงวดผ่อน
  const installments = [];
  for (let i = 1; i <= numberOfTerms; i++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i);

    installments.push({
      installmentPlanId: plan.id,
      termNumber: i,
      dueDate,
      amount: termAmount,
      principalAmount: principalPerTerm,
      interestAmount: interestPerTerm,
    });
  }

  await prisma.installment.createMany({
    data: installments,
  });

  return prisma.installmentPlan.findUnique({
    where: { id: plan.id },
    include: {
      installments: { orderBy: { termNumber: "asc" } },
      contact: true,
    },
  });
}

/**
 * บันทึกการชำระงวด
 */
export async function payInstallment(installmentId: string, amount: number, paymentDate: Date, slipImageUrl?: string) {
  const installment = await prisma.installment.findUnique({
    where: { id: installmentId },
    include: { plan: true },
  });

  if (!installment) {
    throw new Error("ไม่พบข้อมูลงวดผ่อน");
  }

  const newPaidAmount = installment.paidAmount + amount;
  const status =
    newPaidAmount >= installment.amount
      ? "PAID"
      : newPaidAmount > 0
      ? "PARTIAL"
      : "PENDING";

  await prisma.installment.update({
    where: { id: installmentId },
    data: {
      paidAmount: newPaidAmount,
      paidDate: paymentDate,
      slipImageUrl: slipImageUrl || installment.slipImageUrl,
      status,
    },
  });

  // ตรวจสอบว่าจ่ายครบทุกงวดหรือยัง
  const allInstallments = await prisma.installment.findMany({
    where: { installmentPlanId: installment.installmentPlanId },
  });

  const allPaid = allInstallments.every((inst) => inst.status === "PAID");
  if (allPaid) {
    await prisma.installmentPlan.update({
      where: { id: installment.installmentPlanId },
      data: { status: "COMPLETED" },
    });
  }

  return prisma.installment.findUnique({
    where: { id: installmentId },
    include: { plan: true },
  });
}

/**
 * แก้ไขข้อมูลการชำระงวด (สำหรับ edit ที่จ่ายไปแล้ว)
 */
export async function updateInstallment(
  installmentId: string, 
  amount: number, 
  paymentDate: Date, 
  slipImageUrl?: string
) {
  const installment = await prisma.installment.findUnique({
    where: { id: installmentId },
    include: { plan: true },
  });

  if (!installment) {
    throw new Error("ไม่พบข้อมูลงวดผ่อน");
  }

  // สำหรับ edit: replace ค่าเดิมแทนที่จะบวกเพิ่ม
  const status =
    amount >= installment.amount
      ? "PAID"
      : amount > 0
      ? "PARTIAL"
      : "PENDING";

  await prisma.installment.update({
    where: { id: installmentId },
    data: {
      paidAmount: amount, // Replace ไม่ใช่บวกเพิ่ม
      paidDate: paymentDate,
      slipImageUrl: slipImageUrl !== undefined ? slipImageUrl : installment.slipImageUrl,
      status,
    },
  });

  // ตรวจสอบว่าจ่ายครบทุกงวดหรือยัง
  const allInstallments = await prisma.installment.findMany({
    where: { installmentPlanId: installment.installmentPlanId },
  });

  const allPaid = allInstallments.every((inst) => 
    inst.id === installmentId ? status === "PAID" : inst.status === "PAID"
  );
  
  await prisma.installmentPlan.update({
    where: { id: installment.installmentPlanId },
    data: { status: allPaid ? "COMPLETED" : "ACTIVE" },
  });

  return prisma.installment.findUnique({
    where: { id: installmentId },
    include: { plan: true },
  });
}

/**
 * ดึงสรุป Installment Plan
 */
export async function getInstallmentSummary(planId: string) {
  const plan = await prisma.installmentPlan.findUnique({
    where: { id: planId },
    include: {
      installments: { orderBy: { termNumber: "asc" } },
      contact: true,
    },
  });

  if (!plan) return null;

  const totalPaid = plan.installments.reduce((sum, inst) => sum + inst.paidAmount, 0);
  const totalDue = plan.installments.reduce((sum, inst) => sum + inst.amount, 0);
  const paidCount = plan.installments.filter((inst) => inst.status === "PAID").length;
  const overdueCount = plan.installments.filter(
    (inst) => inst.status !== "PAID" && new Date(inst.dueDate) < new Date()
  ).length;

  return {
    ...plan,
    totalPaid,
    totalDue,
    remainingAmount: totalDue - totalPaid,
    paidCount,
    overdueCount,
    progress: Math.round((paidCount / plan.numberOfTerms) * 100),
  };
}

/**
 * อัพเดทสถานะงวดที่เลยกำหนด
 */
export async function updateOverdueInstallments(workspaceId: string) {
  const today = new Date();

  return prisma.installment.updateMany({
    where: {
      plan: { workspaceId },
      status: { in: ["PENDING", "PARTIAL"] },
      dueDate: { lt: today },
    },
    data: { status: "OVERDUE" },
  });
}
