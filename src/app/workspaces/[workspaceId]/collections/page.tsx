import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import CollectionsClient from "./CollectionsClient";

export const dynamic = "force-dynamic";

interface Props {
  params: { workspaceId: string };
}

export default async function CollectionsPage({ params }: Props) {
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

  const collectionCases = await prisma.collectionCase.findMany({
    where: { workspaceId: params.workspaceId },
    include: {
      contact: true,
      loan: true,
      activities: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: [
      { priority: "desc" },
      { daysPastDue: "desc" },
    ],
  });

  // Prepare data for client component
  const casesData = collectionCases.map(c => ({
    id: c.id,
    totalOutstanding: c.totalOutstanding,
    principalDue: c.principalDue,
    interestDue: c.interestDue,
    daysPastDue: c.daysPastDue,
    status: c.status,
    priority: c.priority,
    lastContactDate: c.lastContactDate,
    nextFollowUpDate: c.nextFollowUpDate,
    contact: {
      id: c.contact.id,
      name: c.contact.name,
      phone: c.contact.phone,
      imageUrl: c.contact.imageUrl,
    },
    loan: {
      id: c.loan.id,
      principal: c.loan.principal,
      remainingPrincipal: c.loan.remainingPrincipal,
    },
    lastActivity: c.activities[0] ? {
      activityType: c.activities[0].activityType,
      description: c.activities[0].description,
      createdAt: c.activities[0].createdAt,
    } : null,
  }));

  // Calculate stats
  const stats = {
    active: collectionCases.filter(c => c.status === "ACTIVE").length,
    promised: collectionCases.filter(c => c.status === "PROMISED").length,
    resolved: collectionCases.filter(c => c.status === "RESOLVED").length,
    legal: collectionCases.filter(c => c.status === "LEGAL").length,
    totalOutstanding: collectionCases
      .filter(c => c.status !== "RESOLVED" && c.status !== "WRITTEN_OFF")
      .reduce((sum, c) => sum + c.totalOutstanding, 0),
    totalCases: collectionCases.length,
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
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <h1 className="text-lg font-semibold">การทวงหนี้</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {stats.active + stats.promised} เคสที่ต้องติดตาม
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <CollectionsClient 
          cases={casesData}
          workspaceId={params.workspaceId}
          stats={stats}
        />
      </main>
    </div>
  );
}
