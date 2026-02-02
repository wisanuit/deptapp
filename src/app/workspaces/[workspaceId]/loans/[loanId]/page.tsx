import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, formatDateTime, daysBetween } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExtendDueDateForm } from "./ExtendDueDateForm";
import { LoanEditForm } from "./LoanEditForm";
import { PaymentCalculator } from "./PaymentCalculator";
import { calculateAccruedInterest, calculateAccruedInterestFromPayments, LEGAL_INTEREST_LIMITS, checkInterestRateLegality } from "@/services/interest.service";
import { 
  ArrowLeft, CreditCard, Calendar, User, 
  Wallet, TrendingUp, Clock, Edit, 
  ChevronRight, Receipt, FileText, AlertCircle,
  Calculator, Scale, AlertTriangle, CheckCircle2
} from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  params: { workspaceId: string; loanId: string };
}

// Avatar component
function Avatar({ name, size = "md", imageUrl }: { name: string; size?: "sm" | "md" | "lg" | "xl"; imageUrl?: string | null }) {
  const initials = name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-lg"
  };
  
  if (imageUrl) {
    return (
      <Image src={imageUrl} alt={name} width={64} height={64} className={`${sizeClasses[size]} rounded-full object-cover`} unoptimized />
    );
  }
  
  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-primary to-blue-600 text-white flex items-center justify-center font-semibold`}>
      {initials}
    </div>
  );
}

export default async function LoanDetailPage({ params }: Props) {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const loan = await prisma.loan.findFirst({
    where: {
      id: params.loanId,
      workspaceId: params.workspaceId,
      workspace: {
        members: { some: { userId: session.user.id } },
      },
    },
    include: {
      borrower: true,
      lender: true,
      interestPolicy: true,
      allocations: {
        include: { payment: true },
      },
    },
  });

  if (!loan) {
    notFound();
  }

  // Find current user's contact to determine role (lender or borrower)
  const userContact = await prisma.contact.findFirst({
    where: {
      workspaceId: params.workspaceId,
      userId: session.user.id,
    },
  });

  const isLender = userContact?.id === loan.lenderId;
  const isBorrower = userContact?.id === loan.borrowerId;

  const allocations = loan.allocations
    .map((allocation) => allocation)
    .sort((a, b) => new Date(b.payment.paymentDate).getTime() - new Date(a.payment.paymentDate).getTime());

  const statusConfig: Record<string, { variant: "default" | "success" | "destructive"; label: string; className: string }> = {
    OPEN: { variant: "default", label: "กำลังดำเนินการ", className: "bg-blue-100 text-blue-700" },
    CLOSED: { variant: "success", label: "ปิดแล้ว", className: "bg-green-100 text-green-700" },
    OVERDUE: { variant: "destructive", label: "เกินกำหนด", className: "bg-red-100 text-red-700" },
  };

  const status = statusConfig[loan.status] || statusConfig.OPEN;
  const totalPrincipalPaid = allocations.reduce((sum, item) => sum + item.principalPaid, 0);
  const totalInterestPaid = allocations.reduce((sum, item) => sum + item.interestPaid, 0);

  // คำนวณดอกเบี้ยแบบ realtime ถึงวันนี้
  // *** สำคัญ: เริ่มนับดอกเบี้ยใหม่จากวันที่ชำระเงินล่าสุด ***
  const today = new Date();
  const realtimeInterest = loan.interestPolicy && loan.remainingPrincipal > 0
    ? calculateAccruedInterestFromPayments(loan as any, allocations)
    : loan.accruedInterest;
  
  // หาวันที่ชำระเงินล่าสุด
  const lastPaymentDate = allocations.length > 0 
    ? new Date(allocations[0].payment.paymentDate)
    : null;
  
  // คำนวณจำนวนวันเกินกำหนด
  const dueDate = loan.dueDate ? new Date(loan.dueDate) : null;
  const isOverdue = dueDate && today > dueDate && loan.status !== "CLOSED";
  const overdueDays = isOverdue ? daysBetween(dueDate, today) : 0;
  
  // ดอกเบี้ยที่คำนวณรวมช่วงเกินกำหนด
  const displayInterest = Math.max(realtimeInterest, loan.accruedInterest);

  return (
    <div className="min-h-screen bg-background">
      {/* Facebook-style Header */}
      <header className="bg-card sticky top-0 z-50 shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <Link 
                href={isBorrower ? `/workspaces/${params.workspaceId}/debts` : `/workspaces/${params.workspaceId}/loans`} 
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="h-6 w-px bg-border" />
              <div>
                <h1 className="text-lg font-semibold">
                  {isBorrower ? "หนี้ที่ต้องจ่าย" : "รายการให้กู้ยืม"}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {isBorrower ? `เจ้าหนี้: ${loan.lender.name}` : `ลูกหนี้: ${loan.borrower.name}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.className}`}>
                {status.label}
              </span>
              <Link href={`/workspaces/${params.workspaceId}/payments/new?loanId=${loan.id}`}>
                <Button className="rounded-full gap-2">
                  <Wallet className="h-4 w-4" />
                  {isBorrower ? "ชำระเงิน" : "บันทึกการชำระ"}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Overdue Alert */}
        {isOverdue && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 mb-6">
            <div className="p-2 rounded-full bg-red-100">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="font-semibold text-red-700">เกินกำหนดชำระ {overdueDays} วัน</p>
              <p className="text-sm text-red-600">ครบกำหนด: {formatDate(loan.dueDate!)} - ดอกเบี้ยยังคงคำนวณต่อเนื่อง</p>
            </div>
          </div>
        )}

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Balance Overview Card */}
            <Card className="overflow-hidden">
              <div className={`p-6 text-white ${isBorrower ? 'bg-gradient-to-r from-orange-500 to-red-500' : isOverdue ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-primary to-blue-600'}`}>
                <p className="text-sm opacity-90 mb-1">
                  {isBorrower ? "ยอดหนี้คงเหลือ (ถึงวันนี้)" : "ยอดคงเหลือทั้งหมด (ถึงวันนี้)"}
                </p>
                <p className="text-4xl font-bold">
                  {formatCurrency(loan.remainingPrincipal + displayInterest)}
                </p>
                {isOverdue && (
                  <p className="text-sm opacity-90 mt-2">⚠️ รวมดอกเบี้ยช่วงเกินกำหนด {overdueDays} วัน</p>
                )}
              </div>
              <CardContent className="p-0">
                <div className="grid grid-cols-2 divide-x divide-border">
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-full bg-primary/10">
                        <Wallet className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-sm text-muted-foreground">เงินต้นคงเหลือ</span>
                    </div>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(loan.remainingPrincipal)}</p>
                    <p className="text-xs text-muted-foreground mt-1">จากเงินต้น {formatCurrency(loan.principal)}</p>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-full ${isOverdue ? 'bg-red-100' : isBorrower ? 'bg-orange-100' : 'bg-green-100'}`}>
                        <TrendingUp className={`h-5 w-5 ${isOverdue ? 'text-red-600' : isBorrower ? 'text-orange-600' : 'text-green-600'}`} />
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {isBorrower ? "ดอกเบี้ยค้างจ่าย" : "ดอกเบี้ยค้างรับ"}
                      </span>
                    </div>
                    <p className={`text-2xl font-bold ${isOverdue ? 'text-red-600' : isBorrower ? 'text-orange-600' : 'text-green-600'}`}>
                      {formatCurrency(displayInterest)}
                    </p>
                    {loan.interestPolicy && (
                      <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                        <p>นโยบาย: {loan.interestPolicy.name}</p>
                        <p className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          เริ่มนับจาก: {lastPaymentDate ? formatDate(lastPaymentDate) : formatDate(loan.startDate)}
                          {lastPaymentDate && <span className="text-blue-500">(วันที่ชำระล่าสุด)</span>}
                        </p>
                        {isOverdue && <p className="text-red-500">+{overdueDays} วันเกินกำหนด</p>}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment History */}
            <Card>
              <CardHeader className="pb-3">
                <div className="section-header">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">ประวัติการชำระ</CardTitle>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-right">
                      <p className="text-muted-foreground">ชำระเงินต้น</p>
                      <p className="font-semibold text-primary">{formatCurrency(totalPrincipalPaid)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground">ชำระดอกเบี้ย</p>
                      <p className="font-semibold text-green-600">{formatCurrency(totalInterestPaid)}</p>
                    </div>
                    <Link href={`/workspaces/${params.workspaceId}/payments/new?loanId=${loan.id}`}>
                      <Button size="sm" className="rounded-full gap-1">
                        <Wallet className="h-4 w-4" />
                        {isBorrower ? "ชำระเงิน" : "บันทึกชำระ"}
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {allocations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>ยังไม่มีการชำระเงิน</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allocations.map((allocation) => (
                      <div
                        key={allocation.id}
                        className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="p-3 rounded-full bg-green-100">
                          <Wallet className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold">
                            ชำระ {formatCurrency(allocation.payment.amount)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatDateTime(allocation.payment.paymentDate)}
                          </p>
                          {allocation.payment.note && (
                            <p className="text-sm text-muted-foreground mt-1 truncate">
                              {allocation.payment.note}
                            </p>
                          )}
                        </div>
                        <div className="text-right text-sm">
                          <div className="flex items-center justify-end gap-2 mb-1">
                            <span className="text-muted-foreground">เงินต้น</span>
                            <span className="font-medium">{formatCurrency(allocation.principalPaid)}</span>
                          </div>
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-muted-foreground">ดอกเบี้ย</span>
                            <span className="font-medium text-green-600">{formatCurrency(allocation.interestPaid)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Footer Action */}
            <div className="flex justify-center">
              <Link href={`/workspaces/${params.workspaceId}/payments`}>
                <Button variant="outline" className="rounded-full gap-2">
                  ดูการชำระเงินทั้งหมด
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Payment Calculator */}
            {loan.status !== "CLOSED" && (
              <PaymentCalculator
                remainingPrincipal={loan.remainingPrincipal}
                accruedInterest={displayInterest}
                interestPolicy={loan.interestPolicy ? {
                  mode: loan.interestPolicy.mode,
                  monthlyRate: loan.interestPolicy.monthlyRate,
                  dailyRate: loan.interestPolicy.dailyRate,
                  anchorDay: loan.interestPolicy.anchorDay,
                  graceDays: loan.interestPolicy.graceDays,
                } : null}
                lastPaymentDate={lastPaymentDate?.toISOString() || null}
                loanStartDate={loan.startDate.toISOString()}
                borrowerName={loan.borrower.name}
                lenderName={loan.lender.name}
              />
            )}

            {/* Contract Parties */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">คู่สัญญา</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                  <Avatar name={loan.borrower.name} size="lg" imageUrl={loan.borrower.imageUrl} />
                  <div>
                    <p className="text-xs text-muted-foreground">ลูกหนี้</p>
                    <p className="font-semibold">{loan.borrower.name}</p>
                    {loan.borrower.phone && (
                      <p className="text-sm text-muted-foreground">{loan.borrower.phone}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                  <Avatar name={loan.lender.name} size="lg" imageUrl={loan.lender.imageUrl} />
                  <div>
                    <p className="text-xs text-muted-foreground">เจ้าหนี้</p>
                    <p className="font-semibold">{loan.lender.name}</p>
                    {loan.lender.phone && (
                      <p className="text-sm text-muted-foreground">{loan.lender.phone}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contract Details */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">รายละเอียดสัญญา</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" /> วันที่เริ่ม
                    </span>
                    <span className="font-medium text-sm">{formatDate(loan.startDate)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4" /> ครบกำหนด
                    </span>
                    <span className={`font-medium text-sm ${isOverdue ? 'text-red-600' : ''}`}>
                      {loan.dueDate ? formatDate(loan.dueDate) : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" /> นโยบายดอกเบี้ย
                    </span>
                    <span className="font-medium text-sm">{loan.interestPolicy ? loan.interestPolicy.name : "-"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calculator className="h-4 w-4" /> เริ่มนับดอกเบี้ยจาก
                    </span>
                    <div className="text-right">
                      <span className={`font-medium text-sm ${lastPaymentDate ? 'text-blue-600' : ''}`}>
                        {lastPaymentDate ? formatDate(lastPaymentDate) : formatDate(loan.startDate)}
                      </span>
                      {lastPaymentDate && (
                        <p className="text-xs text-blue-500">วันที่ชำระล่าสุด</p>
                      )}
                    </div>
                  </div>
                  {loan.note && (
                    <div className="py-2">
                      <span className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                        <Edit className="h-4 w-4" /> หมายเหตุ
                      </span>
                      <p className="text-sm bg-muted/50 rounded-lg p-2">{loan.note}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Edit Contract */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Edit className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">แก้ไขรายละเอียด</CardTitle>
                </div>
                <CardDescription>ปรับสถานะ หมายเหตุ และนโยบายดอกเบี้ย</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <LoanEditForm
                  workspaceId={params.workspaceId}
                  loanId={loan.id}
                  defaultStatus={loan.status}
                  defaultNote={loan.note}
                  defaultInterestPolicyId={loan.interestPolicyId}
                />
              </CardContent>
            </Card>

            {/* Extend Due Date */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">ขยายวันครบกำหนด</CardTitle>
                </div>
                <CardDescription>เลื่อนวันครบกำหนดให้อยู่หลังวันเดิม</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <ExtendDueDateForm
                  workspaceId={params.workspaceId}
                  loanId={loan.id}
                  currentDueDate={loan.dueDate ? loan.dueDate.toISOString() : null}
                />
              </CardContent>
            </Card>


            {/* Legal Info Card */}
            <Card className="border-amber-200 bg-amber-50/50">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-amber-600" />
                  <CardTitle className="text-sm text-amber-800">ข้อมูลกฎหมาย</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-xs text-amber-700 space-y-1">
                  <p>📜 พ.ร.บ. ห้ามเรียกดอกเบี้ยเกินอัตรา พ.ศ. 2560</p>
                  <p>• สูงสุด 15% ต่อปี (1.25% ต่อเดือน)</p>
                  <p>• ฝ่าฝืน: จำคุก 2 ปี ปรับ 200,000 บาท</p>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </main>
    </div>
  );
}