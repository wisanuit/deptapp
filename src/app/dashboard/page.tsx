import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { calculateAccruedInterest, LoanWithPolicy } from "@/services/interest.service";
import { getCurrentPlan, getFeatureLimit, getCurrentUsage } from "@/services/subscription.service";

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
  Plus, Building2, ChevronRight, ArrowUpRight, ArrowDownRight,
  CreditCard, Receipt, AlertCircle, Crown, BarChart3, Sparkles, Shield
} from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import { CreateButton } from "@/components/ui/create-button";

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

  // ยอดสุทธิ
  const netBalance = (totalLent + totalReceivableInterest) - (totalDebt + totalPayableInterest);

  // ดึงข้อมูลแผนปัจจุบัน
  const currentPlan = await getCurrentPlan(session.user.id);
  const workspacesLimit = await getFeatureLimit(session.user.id, "WORKSPACES");
  const workspacesUsage = await getCurrentUsage(session.user.id, "WORKSPACES");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* Modern Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Debt Manager
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/subscription">
                <Button variant="outline" size="sm" className="rounded-full gap-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200">
                  <Crown className="h-4 w-4" />
                  <span className="hidden md:inline">แผนการใช้งาน</span>
                </Button>
              </Link>
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-sm text-slate-600">{session.user.email}</span>
              </div>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">
            สวัสดี, {session.user.name || 'ผู้ใช้'}! 👋
          </h2>
          <p className="text-slate-500">นี่คือภาพรวมการเงินของคุณ</p>
        </div>

        {/* Stats Cards - Horizontal Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* ยอดให้กู้ */}
          <Card className="relative overflow-hidden border-0 shadow-lg shadow-green-500/10">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600"></div>
            <CardContent className="relative p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                  <ArrowUpRight className="h-5 w-5 text-white" />
                </div>
                <Badge className="bg-white/20 text-white border-0 text-xs">
                  {receivableLoans.length} สัญญา
                </Badge>
              </div>
              <p className="text-green-100 text-sm mb-1">รวมที่ต้องได้รับ</p>
              <p className="text-xl md:text-2xl font-bold text-white">
                {formatCurrency(totalLent + totalReceivableInterest)}
              </p>
              {overdueLoans.length > 0 && (
                <div className="mt-2 flex items-center gap-1 text-amber-200 text-xs">
                  <AlertCircle className="h-3 w-3" />
                  <span>เกินกำหนด {overdueLoans.length} สัญญา</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ยอดหนี้ */}
          <Card className="relative overflow-hidden border-0 shadow-lg shadow-red-500/10">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-rose-600"></div>
            <CardContent className="relative p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                  <ArrowDownRight className="h-5 w-5 text-white" />
                </div>
                <Badge className="bg-white/20 text-white border-0 text-xs">
                  {payableLoans.length} สัญญา
                </Badge>
              </div>
              <p className="text-red-100 text-sm mb-1">รวมที่ต้องจ่าย</p>
              <p className="text-xl md:text-2xl font-bold text-white">
                {formatCurrency(totalDebt + totalPayableInterest)}
              </p>
              {upcomingPayableLoans.length > 0 && (
                <div className="mt-2 flex items-center gap-1 text-amber-200 text-xs">
                  <AlertCircle className="h-3 w-3" />
                  <span>ครบกำหนด 7 วัน {upcomingPayableLoans.length}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ยอดสุทธิ */}
          <Card className="relative overflow-hidden border-0 shadow-lg shadow-blue-500/10">
            <div className={`absolute inset-0 bg-gradient-to-br ${netBalance >= 0 ? 'from-blue-500 to-indigo-600' : 'from-orange-500 to-red-600'}`}></div>
            <CardContent className="relative p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
              </div>
              <p className="text-white/80 text-sm mb-1">ยอดสุทธิ</p>
              <p className="text-xl md:text-2xl font-bold text-white">
                {formatCurrency(netBalance)}
              </p>
              <p className="text-white/60 text-xs mt-1">
                {netBalance >= 0 ? 'กำไร' : 'ขาดทุน'}
              </p>
            </CardContent>
          </Card>

          {/* Workspaces */}
          <Card className="relative overflow-hidden border-0 shadow-lg shadow-purple-500/10">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-violet-600"></div>
            <CardContent className="relative p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
              </div>
              <p className="text-purple-100 text-sm mb-1">Workspaces</p>
              <p className="text-xl md:text-2xl font-bold text-white">
                {workspaces.length}
              </p>
              <p className="text-white/60 text-xs mt-1">
                สัญญาทั้งหมด {allLoans.length} รายการ
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Workspaces (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-xl shadow-slate-200/50">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Workspaces ของคุณ</CardTitle>
                      <CardDescription>จัดการธุรกิจและสัญญาของคุณ</CardDescription>
                    </div>
                  </div>
                  <CreateButton
                    href="/workspaces/new"
                    feature="WORKSPACES"
                    size="sm"
                    className="rounded-full gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">สร้างใหม่</span>
                  </CreateButton>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {workspaces.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                      <Building2 className="h-10 w-10 text-slate-400" />
                    </div>
                    <p className="text-lg font-medium text-slate-600 mb-2">ยังไม่มี Workspace</p>
                    <p className="text-slate-400 mb-6">สร้าง Workspace แรกเพื่อเริ่มจัดการหนี้สิน</p>
                    <CreateButton href="/workspaces/new" feature="WORKSPACES" className="rounded-full gap-2">
                      <Plus className="h-4 w-4" />
                      สร้าง Workspace
                    </CreateButton>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {workspaces.map((workspace: typeof workspaces[0]) => (
                      <Link key={workspace.id} href={`/workspaces/${workspace.id}`}>
                        <div className="group p-4 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/10 transition-all bg-white">
                          <div className="flex items-start gap-3 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/25">
                              {workspace.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                                {workspace.name}
                              </h3>
                              <p className="text-sm text-slate-400 flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {workspace.members.length} สมาชิก
                              </p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="text-center p-2 rounded-lg bg-slate-50">
                              <p className="text-lg font-bold text-blue-600">{workspace._count.contacts}</p>
                              <p className="text-[10px] text-slate-400 uppercase tracking-wide">ผู้ติดต่อ</p>
                            </div>
                            <div className="text-center p-2 rounded-lg bg-slate-50">
                              <p className="text-lg font-bold text-indigo-600">{workspace._count.loans}</p>
                              <p className="text-[10px] text-slate-400 uppercase tracking-wide">สัญญา</p>
                            </div>
                            <div className="text-center p-2 rounded-lg bg-slate-50">
                              <p className="text-lg font-bold text-green-600">{workspace._count.payments}</p>
                              <p className="text-[10px] text-slate-400 uppercase tracking-wide">การชำระ</p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            {/* รายละเอียดให้กู้ยืม */}
            <Card className="border-0 shadow-xl shadow-slate-200/50 overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-green-500 to-emerald-500"></div>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-base text-green-700">รายการให้กู้ยืม</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">เงินต้นคงเหลือ</span>
                    <span className="font-semibold text-slate-700">{formatCurrency(totalLent)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">ดอกเบี้ยค้างรับ</span>
                    <span className="font-semibold text-green-600">{formatCurrency(totalReceivableInterest)}</span>
                  </div>
                  <div className="h-px bg-slate-100"></div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-green-50">
                    <span className="font-medium text-green-700">รวมทั้งหมด</span>
                    <span className="text-lg font-bold text-green-700">{formatCurrency(totalLent + totalReceivableInterest)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* รายละเอียดหนี้ */}
            <Card className="border-0 shadow-xl shadow-slate-200/50 overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-red-500 to-rose-500"></div>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-red-600" />
                  <CardTitle className="text-base text-red-700">หนี้ที่ต้องจ่าย</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">เงินต้นคงเหลือ</span>
                    <span className="font-semibold text-slate-700">{formatCurrency(totalDebt)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">ดอกเบี้ยค้างจ่าย</span>
                    <span className="font-semibold text-red-600">{formatCurrency(totalPayableInterest)}</span>
                  </div>
                  <div className="h-px bg-slate-100"></div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-red-50">
                    <span className="font-medium text-red-700">รวมทั้งหมด</span>
                    <span className="text-lg font-bold text-red-700">{formatCurrency(totalDebt + totalPayableInterest)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* แผนการใช้งานปัจจุบัน */}
            <Card className="border-0 shadow-xl shadow-slate-200/50 overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500"></div>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-600" />
                  <CardTitle className="text-base text-amber-700">แผนการใช้งาน</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      currentPlan?.name === 'FREE' 
                        ? 'bg-slate-100' 
                        : currentPlan?.name === 'PRO' 
                          ? 'bg-gradient-to-br from-amber-400 to-orange-500' 
                          : 'bg-gradient-to-br from-purple-500 to-indigo-600'
                    }`}>
                      <Crown className={`h-6 w-6 ${
                        currentPlan?.name === 'FREE' ? 'text-slate-500' : 'text-white'
                      }`} />
                    </div>
                    <div>
                      <p className="font-bold text-lg text-slate-800">{currentPlan?.displayName || 'Free'}</p>
                      <p className="text-sm text-slate-500">{currentPlan?.name === 'FREE' ? 'แผนเริ่มต้น' : 'แผนพรีเมียม'}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Workspaces</span>
                      <span className="font-medium text-slate-700">
                        {workspacesUsage} / {workspacesLimit === -1 ? '∞' : workspacesLimit}
                      </span>
                    </div>
                    {workspacesLimit !== -1 && (
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            workspacesUsage / workspacesLimit > 0.8 
                              ? 'bg-red-500' 
                              : workspacesUsage / workspacesLimit > 0.5 
                                ? 'bg-amber-500' 
                                : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min((workspacesUsage / workspacesLimit) * 100, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {currentPlan?.name === 'FREE' && (
                    <Link href="/subscription" className="block">
                      <Button className="w-full rounded-xl gap-2 h-11 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                        <Crown className="h-4 w-4" />
                        อัปเกรดเพื่อปลดล็อค
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0 shadow-xl shadow-slate-200/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">การดำเนินการด่วน</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                <CreateButton href="/workspaces/new" feature="WORKSPACES" className="w-full rounded-xl gap-2 h-11">
                  <Plus className="h-4 w-4" />
                  สร้าง Workspace ใหม่
                </CreateButton>
                <Link href="/subscription" className="block">
                  <Button variant="outline" className="w-full rounded-xl gap-2 h-11 border-amber-200 text-amber-600 hover:bg-amber-50">
                    <Crown className="h-4 w-4" />
                    อัปเกรดแผน
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/50 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-slate-500">
              <Wallet className="h-4 w-4" />
              <span className="text-sm">© {new Date().getFullYear()} Debt Manager. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/terms" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
                <FileText className="h-4 w-4" />
                <span>เงื่อนไขการใช้งาน</span>
              </Link>
              <Link href="/privacy" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
                <Shield className="h-4 w-4" />
                <span>นโยบายความเป็นส่วนตัว</span>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
