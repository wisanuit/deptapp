import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package } from "lucide-react";
import { CreateButton } from "@/components/ui/create-button";
import InstallmentsClient from "./InstallmentsClient";

export const dynamic = "force-dynamic";

interface Props {
  params: { workspaceId: string };
}

export default async function InstallmentsPage({ params }: Props) {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const workspace = await prisma.workspace.findFirst({
    where: {
      id: params.workspaceId,
      members: { some: { userId: session.user.id } },
    },
  });

  if (!workspace) {
    notFound();
  }

  const installmentPlans = await prisma.installmentPlan.findMany({
    where: { workspaceId: params.workspaceId },
    include: {
      contact: true,
      installments: {
        orderBy: { termNumber: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Summary stats
  const today = new Date();
  
  // คำนวณข้อมูลสำหรับแต่ละแผน
  const installmentsData = installmentPlans.map(plan => {
    const paidTerms = plan.installments.filter(i => i.status === "PAID").length;
    const overdueTerms = plan.installments.filter(i => {
      if (i.status === "PAID") return false;
      return new Date(i.dueDate) < today;
    }).length;
    
    const totalPaid = plan.installments.reduce((sum, i) => sum + i.paidAmount, 0);
    const financeAmount = plan.totalAmount - plan.downPayment;
    const remainingAmount = plan.installments
      .filter(i => i.status !== "PAID")
      .reduce((sum, i) => sum + (i.amount - i.paidAmount), 0);
    
    // หางวดถัดไปที่ยังไม่ได้ชำระ
    const nextInstallment = plan.installments.find(i => i.status !== "PAID");
    
    return {
      id: plan.id,
      itemName: plan.itemName,
      itemDescription: plan.itemDescription,
      itemImageUrl: plan.itemImageUrl,
      totalAmount: plan.totalAmount,
      downPayment: plan.downPayment,
      numberOfTerms: plan.numberOfTerms,
      termAmount: plan.termAmount,
      interestRate: plan.interestRate,
      startDate: plan.startDate,
      status: plan.status,
      contact: {
        id: plan.contact.id,
        name: plan.contact.name,
        imageUrl: plan.contact.imageUrl,
      },
      paidTerms,
      totalTerms: plan.installments.length,
      overdueTerms,
      totalPaid,
      remainingAmount,
      nextDueDate: nextInstallment?.dueDate || null,
    };
  });

  // สถิติรวม
  const activePlans = installmentPlans.filter(p => p.status === "ACTIVE");
  const plansWithOverdue = installmentsData.filter(p => p.overdueTerms > 0);
  
  const totalFinanceAmount = activePlans.reduce((sum, p) => {
    const financeAmount = p.totalAmount - p.downPayment;
    // คำนวณยอดรวมที่ต้องรับ (รวมดอกเบี้ย)
    return sum + p.installments.reduce((s, i) => s + i.amount, 0);
  }, 0);
  
  const totalPaidAmount = activePlans.reduce((sum, p) => {
    return sum + p.installments.reduce((s, i) => s + i.paidAmount, 0);
  }, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Facebook-style Header */}
      <header className="bg-card sticky top-0 z-50 shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <Link 
                href={`/workspaces/${params.workspaceId}`} 
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <h1 className="text-lg font-semibold">ระบบผ่อนสินค้า</h1>
              </div>
            </div>
            <CreateButton
              feature="INSTALLMENT_PLANS"
              href={`/workspaces/${params.workspaceId}/installments/new`}
              className="rounded-full gap-2"
            >
              สร้างแผนผ่อน
            </CreateButton>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <InstallmentsClient 
          installments={installmentsData}
          workspaceId={params.workspaceId}
          totalFinanceAmount={totalFinanceAmount}
          totalPaidAmount={totalPaidAmount}
          activePlansCount={activePlans.length}
          overduePlansCount={plansWithOverdue.length}
        />
      </main>
    </div>
  );
}
