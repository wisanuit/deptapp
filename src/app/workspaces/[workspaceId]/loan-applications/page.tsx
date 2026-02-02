import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, FileText } from "lucide-react";
import LoanApplicationsClient from "./LoanApplicationsClient";

export const dynamic = "force-dynamic";

interface Props {
  params: { workspaceId: string };
}

export default async function LoanApplicationsPage({ params }: Props) {
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

  const applications = await prisma.loanApplication.findMany({
    where: { workspaceId: params.workspaceId },
    include: {
      contact: true,
      interestPolicy: true,
    },
    orderBy: { submittedAt: "desc" },
  });

  // Prepare data for client component
  const applicationsData = applications.map(app => ({
    id: app.id,
    requestedAmount: app.requestedAmount,
    approvedAmount: app.approvedAmount,
    purpose: app.purpose,
    term: app.term,
    status: app.status,
    submittedAt: app.submittedAt,
    reviewedAt: app.reviewedAt,
    contact: {
      id: app.contact.id,
      name: app.contact.name,
      imageUrl: app.contact.imageUrl,
    },
    interestPolicy: app.interestPolicy ? {
      id: app.interestPolicy.id,
      name: app.interestPolicy.name,
      mode: app.interestPolicy.mode,
      monthlyRate: app.interestPolicy.monthlyRate,
      dailyRate: app.interestPolicy.dailyRate,
    } : null,
  }));

  // Calculate stats
  const stats = {
    pending: applications.filter(a => a.status === "PENDING").length,
    reviewing: applications.filter(a => a.status === "REVIEWING").length,
    approved: applications.filter(a => a.status === "APPROVED").length,
    rejected: applications.filter(a => a.status === "REJECTED").length,
    disbursed: applications.filter(a => a.status === "DISBURSED").length,
    totalRequested: applications.reduce((sum, a) => sum + a.requestedAmount, 0),
    totalApproved: applications
      .filter(a => a.status === "APPROVED" || a.status === "DISBURSED")
      .reduce((sum, a) => sum + (a.approvedAmount || 0), 0),
  };

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
                <h1 className="text-lg font-semibold">ใบสมัครสินเชื่อ</h1>
              </div>
            </div>
            <Link href={`/workspaces/${params.workspaceId}/loan-applications/new`}>
              <Button className="rounded-full gap-2">
                <Plus className="h-4 w-4" />
                สร้างใบสมัคร
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <LoanApplicationsClient 
          applications={applicationsData}
          workspaceId={params.workspaceId}
          stats={stats}
        />
      </main>
    </div>
  );
}
