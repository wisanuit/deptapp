import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { calculateAccruedInterest, LoanWithPolicy } from "@/services/interest.service";
import { ArrowLeft, HandCoins, Plus } from "lucide-react";
import DebtsClient from "./DebtsClient";

export const dynamic = "force-dynamic";

interface Props {
    params: { workspaceId: string };
}

export default async function DebtsPage({ params }: Props) {
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

    // ดึงหนี้ที่เราเป็นลูกหนี้ (PAYABLE)
    const debts = await prisma.loan.findMany({
        where: {
            workspaceId: params.workspaceId,
            loanType: "PAYABLE",
        },
        include: {
            borrower: true,
            lender: true,
            interestPolicy: true,
            allocations: {
                include: { payment: true },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    const today = new Date();

    // คำนวณสถิติ
    const openDebts = debts.filter(d => d.status === "OPEN" || d.status === "OVERDUE");
    const overdueDebts = debts.filter(d => {
        if (d.status === "CLOSED") return false;
        if (!d.dueDate) return false;
        return new Date(d.dueDate) < today;
    });

    const totalPrincipal = openDebts.reduce((sum, d) => sum + d.remainingPrincipal, 0);
    const totalInterest = openDebts.reduce((sum, d) => {
        if (!d.interestPolicy) return sum + d.accruedInterest;
        const calculatedInterest = calculateAccruedInterest(d as LoanWithPolicy);
        return sum + Math.max(calculatedInterest, d.accruedInterest);
    }, 0);

    // Prepare data for client component
    const debtsData = debts.map(debt => {
        const calculatedInterest = debt.interestPolicy
            ? calculateAccruedInterest(debt as LoanWithPolicy)
            : debt.accruedInterest;

        return {
            id: debt.id,
            principal: debt.principal,
            remainingPrincipal: debt.remainingPrincipal,
            accruedInterest: debt.accruedInterest,
            calculatedInterest: Math.max(calculatedInterest, debt.accruedInterest),
            startDate: debt.startDate,
            dueDate: debt.dueDate,
            status: debt.status,
            borrower: {
                id: debt.borrower.id,
                name: debt.borrower.name,
                imageUrl: debt.borrower.imageUrl,
            },
            lender: {
                id: debt.lender.id,
                name: debt.lender.name,
                imageUrl: debt.lender.imageUrl,
            },
            interestPolicy: debt.interestPolicy ? {
                name: debt.interestPolicy.name,
                mode: debt.interestPolicy.mode,
                monthlyRate: debt.interestPolicy.monthlyRate,
                dailyRate: debt.interestPolicy.dailyRate,
            } : null,
        };
    });

    return (
        <div className="min-h-screen bg-background">
            {/* Facebook-style Header */}
            <header className="bg-card sticky top-0 z-50 shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-14">
                        <div className="flex items-center gap-3">
                            <Link
                                href={`/workspaces/${params.workspaceId}`}
                                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                            <div className="h-6 w-px bg-border" />
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
                                    <HandCoins className="h-4 w-4 text-white" />
                                </div>
                                <h1 className="text-lg font-bold">หนี้ที่ต้องจ่าย</h1>
                            </div>
                        </div>
                        <Link href={`/workspaces/${params.workspaceId}/debts/new`}>
                            <Button size="sm" className="rounded-full gap-2 shadow-lg bg-red-600 hover:bg-red-700">
                                <Plus className="h-4 w-4" />
                                <span className="hidden sm:inline">เพิ่มหนี้</span>
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-6 max-w-7xl">
                <DebtsClient
                    debts={debtsData}
                    workspaceId={params.workspaceId}
                    totalPrincipal={totalPrincipal}
                    totalInterest={totalInterest}
                    openDebtsCount={openDebts.length}
                    overdueDebtsCount={overdueDebts.length}
                />
            </main>
        </div>
    );
}
