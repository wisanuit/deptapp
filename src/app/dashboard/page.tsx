import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { calculateAccruedInterest, LoanWithPolicy } from "@/services/interest.service";

type LoanType = {
  id: string;
  remainingPrincipal: number;
  accruedInterest: number;
  dueDate: Date | null;
  status: string;
};
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, daysBetween } from "@/lib/utils";
import {
  Wallet, FileText, TrendingUp, Users,
  Plus, Building2, ChevronRight,
  CreditCard, Receipt, AlertCircle, Crown
} from "lucide-react";
import { LogoutButton } from "@/components/logout-button";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  // ดึง workspaces ของ user
  const workspaces = await prisma.workspace.findMany({
    where: {
      members: {
        some: { userId: session.user.id },
      },
    },
    include: {
      members: { include: { user: true } },
      _count: {
        select: { contacts: true, loans: true, payments: true, creditCards: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // ดึงสรุปยอดรวม
  const allLoans = await prisma.loan.findMany({
    where: {
      workspace: {
        members: { some: { userId: session.user.id } },
      },
      status: { in: ["OPEN", "OVERDUE"] },
    },
    include: { interestPolicy: true },
  });

  const today = new Date();

  // แยกประเภท RECEIVABLE (เราเป็นเจ้าหนี้) และ PAYABLE (เราเป็นลูกหนี้)
  const receivableLoans = allLoans.filter((l: any) => l.loanType === "RECEIVABLE" || !l.loanType);
  const payableLoans = allLoans.filter((l: any) => l.loanType === "PAYABLE");

  // สรุปรายการให้กู้ยืม (RECEIVABLE)
  const totalLent = receivableLoans.reduce((sum: number, loan: LoanType) => sum + loan.remainingPrincipal, 0);
  const totalReceivableInterest = receivableLoans.reduce((sum: number, loan: any) => {
    if (!loan.interestPolicy) return sum + loan.accruedInterest;
    const calculatedInterest = calculateAccruedInterest(loan as LoanWithPolicy);
    return sum + Math.max(calculatedInterest, loan.accruedInterest);
  }, 0);

  // สรุปหนี้ที่ต้องจ่าย (PAYABLE)
  const totalDebt = payableLoans.reduce((sum: number, loan: LoanType) => sum + loan.remainingPrincipal, 0);
  const totalPayableInterest = payableLoans.reduce((sum: number, loan: any) => {
    if (!loan.interestPolicy) return sum + loan.accruedInterest;
    const calculatedInterest = calculateAccruedInterest(loan as LoanWithPolicy);
    return sum + Math.max(calculatedInterest, loan.accruedInterest);
  }, 0);

  // เพื่อ backward compatibility
  const totalInterest = totalReceivableInterest;

  // คำนวณสัญญาเกินกำหนด (เฉพาะ receivable)
  const overdueLoans = receivableLoans.filter((loan: LoanType) => {
    if (!loan.dueDate) return false;
    return new Date(loan.dueDate) < today;
  });

  // คำนวณหนี้ที่ใกล้ครบกำหนด (payable)
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const upcomingPayableLoans = payableLoans.filter((loan: LoanType) => {
    if (!loan.dueDate) return false;
    const dueDate = new Date(loan.dueDate);
    return dueDate >= today && dueDate <= nextWeek;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Facebook-style Header */}
      <header className="bg-card sticky top-0 z-50 shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-primary">Debt Manager</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/subscription">
                <Button variant="outline" size="sm" className="rounded-full gap-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200">
                  <Crown className="h-4 w-4" />
                  <span className="hidden md:inline">แผนการใช้งาน</span>
                </Button>
              </Link>
              <span className="text-sm text-muted-foreground hidden md:block">{session.user.email}</span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-3 gap-6">


          {/* Right Column - Summary Sidebar */}
          <div className="space-y-6">
            {/* สรุปรายการให้กู้ยืม */}
            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2 text-green-700">
                  <TrendingUp className="h-5 w-5" />
                  รายการให้กู้ยืม
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-green-200">
                    <span className="text-sm text-green-600 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      สัญญาที่เปิดอยู่
                    </span>
                    <span className="text-xl font-bold text-green-700">{receivableLoans.length}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-green-200">
                    <span className="text-sm text-green-600">เงินต้นคงเหลือ</span>
                    <span className="text-lg font-bold text-green-700">{formatCurrency(totalLent)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-green-200">
                    <span className="text-sm text-green-600">ดอกเบี้ยค้างรับ</span>
                    <span className="text-lg font-bold text-green-700">{formatCurrency(totalReceivableInterest)}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 bg-green-100 rounded-lg px-3 -mx-1">
                    <span className="text-sm font-semibold text-green-700">รวมที่ต้องได้รับ</span>
                    <span className="text-xl font-bold text-green-700">{formatCurrency(totalLent + totalReceivableInterest)}</span>
                  </div>
                  {overdueLoans.length > 0 && (
                    <div className="flex justify-between items-center py-2 text-amber-600">
                      <span className="text-sm flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        เกินกำหนด
                      </span>
                      <span className="font-bold">{overdueLoans.length} สัญญา</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* สรุปหนี้ที่ต้องจ่าย */}
            <Card className="border-red-200 bg-red-50/50">
              <CardContent className="p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2 text-red-700">
                  <Receipt className="h-5 w-5" />
                  หนี้ที่ต้องจ่าย
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-red-200">
                    <span className="text-sm text-red-600 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      สัญญาที่เปิดอยู่
                    </span>
                    <span className="text-xl font-bold text-red-700">{payableLoans.length}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-red-200">
                    <span className="text-sm text-red-600">เงินต้นคงเหลือ</span>
                    <span className="text-lg font-bold text-red-700">{formatCurrency(totalDebt)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-red-200">
                    <span className="text-sm text-red-600">ดอกเบี้ยค้างจ่าย</span>
                    <span className="text-lg font-bold text-red-700">{formatCurrency(totalPayableInterest)}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 bg-red-100 rounded-lg px-3 -mx-1">
                    <span className="text-sm font-semibold text-red-700">รวมที่ต้องจ่าย</span>
                    <span className="text-xl font-bold text-red-700">{formatCurrency(totalDebt + totalPayableInterest)}</span>
                  </div>
                  {upcomingPayableLoans.length > 0 && (
                    <div className="flex justify-between items-center py-2 text-amber-600">
                      <span className="text-sm flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        ครบกำหนดใน 7 วัน
                      </span>
                      <span className="font-bold">{upcomingPayableLoans.length} สัญญา</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Summary Stats */}
            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  ภาพรวม
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Workspaces
                    </span>
                    <span className="text-xl font-bold">{workspaces.length}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      สัญญาทั้งหมด
                    </span>
                    <span className="text-xl font-bold">{allLoans.length}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 bg-muted/50 rounded-lg px-3 -mx-1">
                    <span className="text-sm font-semibold">ยอดสุทธิ (ได้รับ - ต้องจ่าย)</span>
                    <span className={`text-xl font-bold ${(totalLent + totalReceivableInterest) - (totalDebt + totalPayableInterest) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency((totalLent + totalReceivableInterest) - (totalDebt + totalPayableInterest))}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold mb-4">การดำเนินการ</h3>
                <div className="space-y-2">
                  <Link href="/workspaces/new" className="block">
                    <Button className="w-full rounded-lg gap-2">
                      <Plus className="h-4 w-4" />
                      สร้าง Workspace ใหม่
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Left Column - Workspaces */}
          <div className="lg:col-span-2">
            {/* Workspaces Section */}
            <div className="section-header mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <h2 className="section-title">Workspaces ของคุณ</h2>
              </div>
              <Link href="/workspaces/new">
                <Button className="rounded-full gap-2">
                  <Plus className="h-4 w-4" />
                  สร้าง Workspace
                </Button>
              </Link>
            </div>

            {workspaces.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-lg text-muted-foreground mb-4">
                    คุณยังไม่มี Workspace กรุณาสร้าง Workspace แรกของคุณ
                  </p>
                  <Link href="/workspaces/new">
                    <Button className="rounded-full gap-2">
                      <Plus className="h-4 w-4" />
                      สร้าง Workspace
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {workspaces.map((workspace: typeof workspaces[0]) => (
                  <Link key={workspace.id} href={`/workspaces/${workspace.id}`}>
                    <Card className="hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all cursor-pointer group h-full">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                              {workspace.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <CardTitle className="text-lg">{workspace.name}</CardTitle>
                              <CardDescription className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {workspace.members.length} สมาชิก
                              </CardDescription>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex justify-between pt-3 border-t border-border">
                          <div className="text-center flex-1">
                            <p className="text-lg font-bold text-primary">{workspace._count.contacts}</p>
                            <p className="text-xs text-muted-foreground">ผู้ติดต่อ</p>
                          </div>
                          <div className="w-px bg-border" />
                          <div className="text-center flex-1">
                            <p className="text-lg font-bold text-primary">{workspace._count.loans}</p>
                            <p className="text-xs text-muted-foreground">สัญญา</p>
                          </div>
                          <div className="w-px bg-border" />
                          <div className="text-center flex-1">
                            <p className="text-lg font-bold text-green-600">{workspace._count.payments}</p>
                            <p className="text-xs text-muted-foreground">การชำระ</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
