import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Image from "next/image";
import { calculateAccruedInterest, LoanWithPolicy } from "@/services/interest.service";

type LoanType = {
  id: string;
  remainingPrincipal: number;
  accruedInterest: number;
  dueDate: Date | null;
  status: string;
  interestPolicy?: any;
  startDate?: Date;
};
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, daysBetween } from "@/lib/utils";
import {
  Users, FileText, CreditCard, Wallet,
  Plus, ChevronRight, TrendingUp, Clock,
  Settings, Home, AlertCircle, Calendar,
  ShoppingBag, FileCheck, AlertTriangle, Landmark,
  BarChart3, Package, HandCoins
} from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  params: { workspaceId: string };
}

// Avatar component with initials
function Avatar({ name, size = "md", imageUrl }: { name: string; size?: "sm" | "md" | "lg"; imageUrl?: string | null }) {
  const initials = name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base"
  };

  if (imageUrl) {
    return (
      <Image src={imageUrl} alt={name} width={48} height={48} className={`${sizeClasses[size]} rounded-full object-cover`} unoptimized />
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-primary to-blue-600 text-white flex items-center justify-center font-semibold`}>
      {initials}
    </div>
  );
}

export default async function WorkspacePage({ params }: Props) {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const workspace = await prisma.workspace.findFirst({
    where: {
      id: params.workspaceId,
      members: { some: { userId: session.user.id } },
    },
    include: {
      members: { include: { user: true } },
      contacts: { take: 5, orderBy: { createdAt: "desc" } },
      loans: {
        where: { status: "OPEN" },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { borrower: true, lender: true, interestPolicy: true },
      },
      creditCards: { take: 5, orderBy: { createdAt: "desc" } },
      installmentPlans: {
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { 
          contact: true,
          _count: {
            select: {
              installments: { where: { status: "PAID" } }
            }
          }
        }
      },
      loanApplications: {
        where: { status: "PENDING" },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { contact: true }
      },
      collectionCases: {
        where: { status: { in: ["ACTIVE", "PROMISED"] } },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { contact: true, loan: true }
      },
      customerCredits: {
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { contact: true }
      },
      _count: {
        select: {
          contacts: true,
          loans: true,
          payments: true,
          creditCards: true,
          installmentPlans: true,
          loanApplications: true,
          collectionCases: true,
          customerCredits: true,
          products: true,
        },
      },
    },
  });

  if (!workspace) {
    notFound();
  }

  // คำนวณสรุป
  const allLoans = await prisma.loan.findMany({
    where: { workspaceId: workspace.id },
    include: { interestPolicy: true },
  });

  // แยกประเภท RECEIVABLE (เราเป็นเจ้าหนี้) และ PAYABLE (เราเป็นลูกหนี้)
  const receivableLoans = allLoans.filter((l: any) => l.loanType === "RECEIVABLE" || !l.loanType);
  const payableLoans = allLoans.filter((l: any) => l.loanType === "PAYABLE");

  const today = new Date();

  // === สรุปรายการให้กู้ยืม (RECEIVABLE) ===
  const openReceivableLoans = receivableLoans.filter((l: LoanType) => l.status === "OPEN" || l.status === "OVERDUE");
  const totalReceivablePrincipal = openReceivableLoans.reduce((sum: number, l: LoanType) => sum + l.remainingPrincipal, 0);
  const totalReceivableInterest = openReceivableLoans.reduce((sum: number, l: any) => {
    if (!l.interestPolicy) return sum + l.accruedInterest;
    const calculatedInterest = calculateAccruedInterest(l as LoanWithPolicy);
    return sum + Math.max(calculatedInterest, l.accruedInterest);
  }, 0);

  // === สรุปหนี้ที่ต้องจ่าย (PAYABLE) ===
  const openPayableLoans = payableLoans.filter((l: LoanType) => l.status === "OPEN" || l.status === "OVERDUE");
  const totalPayablePrincipal = openPayableLoans.reduce((sum: number, l: LoanType) => sum + l.remainingPrincipal, 0);
  const totalPayableInterest = openPayableLoans.reduce((sum: number, l: any) => {
    if (!l.interestPolicy) return sum + l.accruedInterest;
    const calculatedInterest = calculateAccruedInterest(l as LoanWithPolicy);
    return sum + Math.max(calculatedInterest, l.accruedInterest);
  }, 0);

  // เพื่อ backward compatibility
  const openLoans = openReceivableLoans;
  const totalPrincipal = totalReceivablePrincipal;
  const totalInterest = totalReceivableInterest;

  // คำนวณสัญญาเกินกำหนดจริง (เฉพาะที่เราเป็นเจ้าหนี้)
  const overdueLoans = receivableLoans.filter((loan: LoanType) => {
    if (loan.status === "CLOSED") return false;
    if (!loan.dueDate) return false;
    return new Date(loan.dueDate) < today;
  });

  // คำนวณหนี้ที่ใกล้ครบกำหนด (payable)
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const upcomingPayableLoans = payableLoans.filter((loan: LoanType) => {
    if (loan.status === "CLOSED") return false;
    if (!loan.dueDate) return false;
    const dueDate = new Date(loan.dueDate);
    return dueDate >= today && dueDate <= nextWeek;
  });

  // นับข้อมูลเพิ่มเติม
  const pendingApplications = workspace.loanApplications?.length || 0;
  const activeCollections = workspace.collectionCases?.length || 0;
  const activeInstallments = workspace.installmentPlans?.filter((p: any) => p.status === "ACTIVE")?.length || 0;
  const totalCredits = workspace.customerCredits?.length || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Facebook-style Header */}
      <header className="bg-card sticky top-0 z-50 shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <Home className="h-5 w-5" />
              </Link>
              <div className="h-6 w-px bg-border" />
              <h1 className="text-xl font-bold text-primary">{workspace.name}</h1>
            </div>
            <Link href={`/workspaces/${workspace.id}/settings`}>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
          </div>

          {/* Navigation Tabs - Mobile Optimized */}
          <nav className="flex gap-0.5 -mb-px overflow-x-auto scrollbar-hide pb-px">
            {[
              { href: `/workspaces/${workspace.id}`, label: "ภาพรวม", icon: Home, active: true },
              { href: `/workspaces/${workspace.id}/contacts`, label: "ผู้ติดต่อ", icon: Users, count: workspace._count.contacts },
              { href: `/workspaces/${workspace.id}/loans`, label: "สัญญา", icon: FileText, count: receivableLoans.length },
              { href: `/workspaces/${workspace.id}/debts`, label: "หนี้สิน", icon: HandCoins, count: payableLoans.length },
              { href: `/workspaces/${workspace.id}/payments`, label: "การชำระ", icon: Wallet, count: workspace._count.payments },
              { href: `/workspaces/${workspace.id}/installments`, label: "ผ่อน", icon: ShoppingBag, count: workspace._count.installmentPlans },
              { href: `/workspaces/${workspace.id}/products`, label: "สินค้า", icon: Package, count: workspace._count.products },
              { href: `/workspaces/${workspace.id}/customer-credits`, label: "สินเชื่อ", icon: Landmark, count: workspace._count.customerCredits },
              { href: `/workspaces/${workspace.id}/collections`, label: "ทวง", icon: AlertTriangle, count: workspace._count.collectionCases },
              { href: `/workspaces/${workspace.id}/credit-cards`, label: "บัตร", icon: CreditCard, count: workspace._count.creditCards },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${item.active
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden xs:inline sm:inline">{item.label}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span className="bg-muted text-muted-foreground text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full min-w-[18px] text-center">
                    {item.count > 99 ? '99+' : item.count}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Loans */}
            <Card className="overflow-hidden">
              {/* Gradient Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-lg">สัญญาล่าสุด</h3>
                      <p className="text-blue-100 text-sm">สัญญาที่ยังเปิดอยู่</p>
                    </div>
                  </div>
                  <Link href={`/workspaces/${workspace.id}/loans/new`}>
                    <Button size="sm" variant="secondary" className="rounded-full gap-1 shadow-lg">
                      <Plus className="h-4 w-4" />
                      สร้างสัญญา
                    </Button>
                  </Link>
                </div>
              </div>
              <CardContent className="p-0">
                {workspace.loans.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-8 w-8 opacity-50" />
                    </div>
                    <p className="font-medium">ยังไม่มีสัญญา</p>
                    <p className="text-sm mt-1">เริ่มสร้างสัญญาแรกของคุณ</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {workspace.loans.map((loan: typeof workspace.loans[0], index: number) => {
                      const loanDueDate = loan.dueDate ? new Date(loan.dueDate) : null;
                      const isLoanOverdue = loanDueDate && today > loanDueDate;
                      const loanOverdueDays = isLoanOverdue ? daysBetween(loanDueDate, today) : 0;
                      // คำนวณดอกเบี้ย real-time สำหรับแต่ละสัญญา
                      const loanInterest = loan.interestPolicy
                        ? Math.max(calculateAccruedInterest(loan as LoanWithPolicy), loan.accruedInterest)
                        : loan.accruedInterest;
                      return (
                        <Link
                          key={loan.id}
                          href={`/workspaces/${workspace.id}/loans/${loan.id}`}
                          className={`flex items-center gap-4 p-4 hover:bg-muted/50 transition-all group ${isLoanOverdue ? 'bg-red-50/50' : ''
                            }`}
                        >
                          <div className="relative">
                            <Avatar name={loan.borrower.name} size="lg" />
                            {isLoanOverdue && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                                <AlertCircle className="h-3 w-3 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold truncate">{loan.borrower.name}</p>
                              {isLoanOverdue && (
                                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium animate-pulse">
                                  เกิน {loanOverdueDays} วัน
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                              เจ้าหนี้: {loan.lender.name}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-bold ${isLoanOverdue ? 'text-red-600' : 'text-primary'}`}>
                              {formatCurrency(loan.remainingPrincipal)}
                            </p>
                            <p className={`text-sm ${loanInterest > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                              +{formatCurrency(loanInterest)}
                            </p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </Link>
                      );
                    })}
                  </div>
                )}
                {/* View All Link */}
                {workspace.loans.length > 0 && (
                  <Link
                    href={`/workspaces/${workspace.id}/loans`}
                    className="flex items-center justify-center gap-2 p-3 text-sm font-medium text-primary hover:bg-primary/5 border-t border-border transition-colors"
                  >
                    ดูสัญญาทั้งหมด
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                )}
              </CardContent>
            </Card>

            {/* Recent Installment Plans */}
            <Card className="overflow-hidden">
              {/* Gradient Header */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <ShoppingBag className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-lg">การผ่อนสินค้าล่าสุด</h3>
                      <p className="text-purple-100 text-sm">รายการผ่อนชำระ</p>
                    </div>
                  </div>
                  <Link href={`/workspaces/${workspace.id}/installments/new`}>
                    <Button size="sm" variant="secondary" className="rounded-full gap-1 shadow-lg">
                      <Plus className="h-4 w-4" />
                      สร้างการผ่อน
                    </Button>
                  </Link>
                </div>
              </div>
              <CardContent className="p-0">
                {workspace.installmentPlans.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                      <ShoppingBag className="h-8 w-8 opacity-50" />
                    </div>
                    <p className="font-medium">ยังไม่มีการผ่อนสินค้า</p>
                    <p className="text-sm mt-1">เริ่มสร้างการผ่อนชำระแรก</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {workspace.installmentPlans.map((plan: typeof workspace.installmentPlans[0]) => {
                      const paidTerms = (plan as any)._count?.installments || 0;
                      const progress = plan.numberOfTerms > 0 ? (paidTerms / plan.numberOfTerms) * 100 : 0;
                      const isActive = plan.status === "ACTIVE";

                      return (
                        <Link
                          key={plan.id}
                          href={`/workspaces/${workspace.id}/installments/${plan.id}`}
                          className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-all group"
                        >
                          {/* Product Image */}
                          <div className="w-14 h-14 rounded-xl bg-muted/50 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {plan.itemImageUrl ? (
                              <Image src={plan.itemImageUrl} alt={plan.itemName} width={56} height={56} className="w-full h-full object-cover" unoptimized />
                            ) : (
                              <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold truncate">{plan.itemName}</p>
                              <Badge
                                variant="outline"
                                className={`text-xs ${isActive
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : 'bg-gray-50 text-gray-700 border-gray-200'
                                  }`}
                              >
                                {isActive ? 'กำลังผ่อน' : plan.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              ลูกค้า: {plan.contact.name}
                            </p>
                            {/* Progress Bar */}
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {paidTerms}/{plan.numberOfTerms} งวด
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-lg font-bold text-purple-600">
                              {formatCurrency(plan.termAmount)}
                            </p>
                            <p className="text-xs text-muted-foreground">ต่องวด</p>
                          </div>

                          <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </Link>
                      );
                    })}
                  </div>
                )}
                {/* View All Link */}
                {workspace.installmentPlans.length > 0 && (
                  <Link
                    href={`/workspaces/${workspace.id}/installments`}
                    className="flex items-center justify-center gap-2 p-3 text-sm font-medium text-purple-600 hover:bg-purple-50 border-t border-border transition-colors"
                  >
                    ดูการผ่อนทั้งหมด
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                )}
              </CardContent>
            </Card>
            {/* Recent Contacts */}
            <Card className="overflow-hidden">
              {/* Gradient Header */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-lg">ผู้ติดต่อล่าสุด</h3>
                      <p className="text-emerald-100 text-sm">เจ้าหนี้และลูกหนี้</p>
                    </div>
                  </div>
                  <Link href={`/workspaces/${workspace.id}/contacts/new`}>
                    <Button size="sm" variant="secondary" className="rounded-full gap-1 shadow-lg">
                      <Plus className="h-4 w-4" />
                      เพิ่มผู้ติดต่อ
                    </Button>
                  </Link>
                </div>
              </div>
              <CardContent className="p-0">
                {workspace.contacts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                      <Users className="h-8 w-8 opacity-50" />
                    </div>
                    <p className="font-medium">ยังไม่มีผู้ติดต่อ</p>
                    <p className="text-sm mt-1">เพิ่มเจ้าหนี้หรือลูกหนี้คนแรก</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {workspace.contacts.map((contact: typeof workspace.contacts[0]) => (
                      <Link
                        key={contact.id}
                        href={`/workspaces/${workspace.id}/contacts/${contact.id}`}
                        className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-all group"
                      >
                        <div className="relative">
                          <Avatar name={contact.name} size="lg" imageUrl={contact.imageUrl} />
                          <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white ${contact.type === 'LENDER' ? 'bg-blue-500' : 'bg-orange-500'
                            }`}></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate mb-1">{contact.name}</p>
                          <p className="text-sm text-muted-foreground truncate flex items-center gap-2">
                            {contact.phone && (
                              <span className="flex items-center gap-1">
                                📱 {contact.phone}
                              </span>
                            )}
                            {contact.email && (
                              <span className="flex items-center gap-1">
                                ✉️ {contact.email}
                              </span>
                            )}
                            {!contact.phone && !contact.email && "-"}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-xs font-medium ${contact.type === 'LENDER'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-orange-50 text-orange-700 border-orange-200'
                            }`}
                        >
                          {contact.type === 'LENDER' ? 'เจ้าหนี้' : 'ลูกหนี้'}
                        </Badge>
                        <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </Link>
                    ))}
                  </div>
                )}
                {/* View All Link */}
                {workspace.contacts.length > 0 && (
                  <Link
                    href={`/workspaces/${workspace.id}/contacts`}
                    className="flex items-center justify-center gap-2 p-3 text-sm font-medium text-emerald-600 hover:bg-emerald-50 border-t border-border transition-colors"
                  >
                    ดูผู้ติดต่อทั้งหมด
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                )}
              </CardContent>
            </Card>

          </div>

          {/* Right Column - Sidebar */}
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
                    <span className="text-sm text-green-600">สัญญาที่เปิดอยู่</span>
                    <span className="text-xl font-bold text-green-700">{openReceivableLoans.length}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-green-200">
                    <span className="text-sm text-green-600">เงินต้นคงเหลือ</span>
                    <span className="text-lg font-bold text-green-700">{formatCurrency(totalReceivablePrincipal)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-green-200">
                    <span className="text-sm text-green-600">ดอกเบี้ยค้างรับ</span>
                    <span className="text-lg font-bold text-green-700">{formatCurrency(totalReceivableInterest)}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 bg-green-100 rounded-lg px-3 -mx-1">
                    <span className="text-sm font-semibold text-green-700">รวมที่ต้องได้รับ</span>
                    <span className="text-xl font-bold text-green-700">{formatCurrency(totalReceivablePrincipal + totalReceivableInterest)}</span>
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
                  <Wallet className="h-5 w-5" />
                  หนี้ที่ต้องจ่าย
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-red-200">
                    <span className="text-sm text-red-600">สัญญาที่เปิดอยู่</span>
                    <span className="text-xl font-bold text-red-700">{openPayableLoans.length}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-red-200">
                    <span className="text-sm text-red-600">เงินต้นคงเหลือ</span>
                    <span className="text-lg font-bold text-red-700">{formatCurrency(totalPayablePrincipal)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-red-200">
                    <span className="text-sm text-red-600">ดอกเบี้ยค้างจ่าย</span>
                    <span className="text-lg font-bold text-red-700">{formatCurrency(totalPayableInterest)}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 bg-red-100 rounded-lg px-3 -mx-1">
                    <span className="text-sm font-semibold text-red-700">รวมที่ต้องจ่าย</span>
                    <span className="text-xl font-bold text-red-700">{formatCurrency(totalPayablePrincipal + totalPayableInterest)}</span>
                  </div>
                  {upcomingPayableLoans.length > 0 && (
                    <div className="flex justify-between items-center py-2 text-amber-600">
                      <span className="text-sm flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        ครบกำหนดใน 7 วัน
                      </span>
                      <span className="font-bold">{upcomingPayableLoans.length} สัญญา</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* ยอดสุทธิ */}
            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  ยอดสุทธิ
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">สัญญาทั้งหมด</span>
                    <span className="text-xl font-bold">{allLoans.filter((l: LoanType) => l.status !== "CLOSED").length}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 bg-muted/50 rounded-lg px-3 -mx-1">
                    <span className="text-sm font-semibold">ยอดสุทธิ (ได้รับ - ต้องจ่าย)</span>
                    <span className={`text-xl font-bold ${(totalReceivablePrincipal + totalReceivableInterest) - (totalPayablePrincipal + totalPayableInterest) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency((totalReceivablePrincipal + totalReceivableInterest) - (totalPayablePrincipal + totalPayableInterest))}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>



            {/* Overdue Alert */}
            {overdueLoans.length > 0 && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <h3 className="font-semibold text-red-700">สัญญาเกินกำหนด</h3>
                  </div>
                  <p className="text-sm text-red-600 mb-3">
                    มี {overdueLoans.length} สัญญาที่เกินกำหนดชำระ
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-red-600">เงินต้นค้าง</span>
                      <span className="font-semibold text-red-700">
                        {formatCurrency(overdueLoans.reduce((sum: number, l: LoanType) => sum + l.remainingPrincipal, 0))}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-red-600">ดอกเบี้ยค้าง</span>
                      <span className="font-semibold text-red-700">
                        {formatCurrency(overdueLoans.reduce((sum: number, l: any) => {
                          if (!l.interestPolicy) return sum + l.accruedInterest;
                          const calculatedInterest = calculateAccruedInterest(l as LoanWithPolicy);
                          return sum + Math.max(calculatedInterest, l.accruedInterest);
                        }, 0))}
                      </span>
                    </div>
                  </div>
                  <Link href={`/workspaces/${workspace.id}/loans`} className="block mt-3">
                    <Button variant="destructive" size="sm" className="w-full rounded-lg">
                      ดูสัญญาทั้งหมด
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
