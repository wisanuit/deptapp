import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, FileText } from "lucide-react";
import { calculateAccruedInterest, LoanWithPolicy } from "@/services/interest.service";
import LoansClient from "./LoansClient";

export const dynamic = "force-dynamic";

interface Props {
  params: { workspaceId: string };
}

export default async function LoansPage({ params }: Props) {
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

  // Find the current user's contact in this workspace
  const userContact = await prisma.contact.findFirst({
    where: {
      workspaceId: params.workspaceId,
      userId: session.user.id,
    },
  });

  // Filter loans where current user is the lender (showing borrowers/debtors)
  const loans = await prisma.loan.findMany({
    where: { 
      workspaceId: params.workspaceId,
      ...(userContact ? { lenderId: userContact.id } : {}),
    },
    include: {
      borrower: true,
      lender: true,
      interestPolicy: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Summary stats
  const today = new Date();
  const openLoans = loans.filter(l => l.status === "OPEN" || l.status === "OVERDUE");
  
  // คำนวณสัญญาเกินกำหนด (ไม่นับที่ปิดแล้ว)
  const overdueLoans = loans.filter(l => {
    if (l.status === "CLOSED") return false;
    if (!l.dueDate) return false;
    return new Date(l.dueDate) < today;
  });
  
  const totalPrincipal = openLoans.reduce((sum, l) => sum + l.remainingPrincipal, 0);
  const totalInterest = openLoans.reduce((sum, l) => {
    if (!l.interestPolicy) return sum + l.accruedInterest;
    const calculatedInterest = calculateAccruedInterest(l as LoanWithPolicy);
    return sum + Math.max(calculatedInterest, l.accruedInterest);
  }, 0);
  
  // Helper function to calculate real-time interest for a loan
  const getRealTimeInterest = (loan: typeof loans[0]) => {
    if (!loan.interestPolicy) return loan.accruedInterest;
    const calculatedInterest = calculateAccruedInterest(loan as LoanWithPolicy);
    return Math.max(calculatedInterest, loan.accruedInterest);
  };

  // Prepare loans data for client component
  const loansData = loans.map(loan => ({
    id: loan.id,
    principal: loan.principal,
    remainingPrincipal: loan.remainingPrincipal,
    accruedInterest: loan.accruedInterest,
    calculatedInterest: getRealTimeInterest(loan),
    startDate: loan.startDate,
    dueDate: loan.dueDate,
    status: loan.status,
    borrower: {
      id: loan.borrower.id,
      name: loan.borrower.name,
      imageUrl: loan.borrower.imageUrl,
    },
    lender: {
      id: loan.lender.id,
      name: loan.lender.name,
    },
    interestPolicy: loan.interestPolicy ? {
      name: loan.interestPolicy.name,
      mode: loan.interestPolicy.mode,
      monthlyRate: loan.interestPolicy.monthlyRate,
      dailyRate: loan.interestPolicy.dailyRate,
    } : null,
  }));

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
                <FileText className="h-5 w-5 text-primary" />
                <h1 className="text-lg font-semibold">สัญญาเงินกู้</h1>
              </div>
            </div>
            <Link href={`/workspaces/${params.workspaceId}/loans/new`}>
              <Button className="rounded-full gap-2">
                <Plus className="h-4 w-4" />
                สร้างสัญญา
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <LoansClient 
          loans={loansData}
          workspaceId={params.workspaceId}
          totalPrincipal={totalPrincipal}
          totalInterest={totalInterest}
          openLoansCount={openLoans.length}
          overdueLoansCount={overdueLoans.length}
        />
      </main>
    </div>
  );
}
