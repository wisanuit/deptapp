import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Home, Percent, Plus, ChevronRight, Calendar,
  Clock, FileText, TrendingUp, Settings, ArrowLeft,
  AlertTriangle, Scale
} from "lucide-react";

export const dynamic = "force-dynamic";

// กฎหมายกำหนดอัตราดอกเบี้ยสูงสุด
const LEGAL_LIMITS = {
  PERSONAL_YEARLY: 0.15, // 15% ต่อปี
  PERSONAL_MONTHLY: 0.0125, // 1.25% ต่อเดือน
  PERSONAL_DAILY: 0.00041, // 0.041% ต่อวัน
};

interface Props {
  params: { workspaceId: string };
}

export default async function InterestPoliciesPage({ params }: Props) {
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

  const policies = await prisma.interestPolicy.findMany({
    where: { workspaceId: params.workspaceId },
    include: {
      _count: { select: { loans: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const formatRate = (rate: number | null, mode: string) => {
    if (rate === null) return "-";
    const percent = (rate * 100).toFixed(2);
    return `${percent}%`;
  };

  const formatRateWithUnit = (rate: number | null, mode: string) => {
    if (rate === null) return "-";
    const percent = (rate * 100).toFixed(2);
    return `${percent}%${mode === "MONTHLY" ? "/เดือน" : "/วัน"}`;
  };

  // ตรวจสอบอัตราดอกเบี้ยเกินกฎหมาย
  const checkLegalRate = (rate: number | null, mode: string): { isLegal: boolean; yearlyRate: number } => {
    if (rate === null) return { isLegal: true, yearlyRate: 0 };
    const yearlyRate = mode === "MONTHLY" ? rate * 12 : rate * 365;
    return {
      isLegal: yearlyRate <= LEGAL_LIMITS.PERSONAL_YEARLY,
      yearlyRate,
    };
  };

  // สถิติ
  const totalPolicies = policies.length;
  const monthlyPolicies = policies.filter(p => p.mode === "MONTHLY").length;
  const dailyPolicies = policies.filter(p => p.mode === "DAILY").length;
  const totalLoansUsing = policies.reduce((sum, p) => sum + p._count.loans, 0);

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
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <Percent className="h-4 w-4 text-white" />
                </div>
                <h1 className="text-lg font-bold">นโยบายดอกเบี้ย</h1>
              </div>
            </div>
            <Link href={`/workspaces/${params.workspaceId}/interest-policies/new`}>
              <Button size="sm" className="rounded-full gap-2 shadow-lg">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">เพิ่มนโยบาย</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Summary Stats - Facebook Style Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-xs font-medium mb-1">นโยบายทั้งหมด</p>
                  <p className="text-2xl font-bold text-white">{totalPolicies}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Settings className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-xs font-medium mb-1">แบบรายเดือน</p>
                  <p className="text-2xl font-bold text-white">{monthlyPolicies}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-xs font-medium mb-1">แบบรายวัน</p>
                  <p className="text-2xl font-bold text-white">{dailyPolicies}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-xs font-medium mb-1">สัญญาที่ใช้งาน</p>
                  <p className="text-2xl font-bold text-white">{totalLoansUsing}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Policy List */}
        <Card className="overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Percent className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-lg">รายการนโยบายดอกเบี้ย</h3>
                <p className="text-green-100 text-sm">กำหนดอัตราดอกเบี้ยสำหรับสัญญาเงินกู้</p>
              </div>
            </div>
          </div>

          <CardContent className="p-0">
            {policies.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <Percent className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">ยังไม่มีนโยบายดอกเบี้ย</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  สร้างนโยบายดอกเบี้ยเพื่อใช้กับสัญญาเงินกู้ สามารถกำหนดได้ทั้งแบบรายเดือนและรายวัน
                </p>
                <Link href={`/workspaces/${params.workspaceId}/interest-policies/new`}>
                  <Button className="rounded-full gap-2">
                    <Plus className="h-4 w-4" />
                    สร้างนโยบายแรก
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {policies.map((policy) => {
                  const rate = policy.mode === "MONTHLY" ? policy.monthlyRate : policy.dailyRate;
                  const isMonthly = policy.mode === "MONTHLY";
                  const legalCheck = checkLegalRate(rate, policy.mode);
                  
                  return (
                    <Link
                      key={policy.id}
                      href={`/workspaces/${params.workspaceId}/interest-policies/${policy.id}`}
                      className={`flex items-center gap-4 p-4 hover:bg-muted/50 transition-all group ${
                        !legalCheck.isLegal ? 'bg-red-50/50' : ''
                      }`}
                    >
                      {/* Icon */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        !legalCheck.isLegal
                          ? 'bg-gradient-to-br from-red-500 to-red-600'
                          : isMonthly 
                            ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                            : 'bg-gradient-to-br from-purple-500 to-purple-600'
                      }`}>
                        {!legalCheck.isLegal ? (
                          <AlertTriangle className="h-6 w-6 text-white" />
                        ) : isMonthly ? (
                          <Calendar className="h-6 w-6 text-white" />
                        ) : (
                          <Clock className="h-6 w-6 text-white" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold truncate">{policy.name}</h3>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              !legalCheck.isLegal
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : isMonthly 
                                  ? 'bg-green-50 text-green-700 border-green-200' 
                                  : 'bg-purple-50 text-purple-700 border-purple-200'
                            }`}
                          >
                            {isMonthly ? 'รายเดือน' : 'รายวัน'}
                          </Badge>
                          {!legalCheck.isLegal && (
                            <Badge variant="destructive" className="text-xs gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              เกินกฎหมาย
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-3.5 w-3.5" />
                            {formatRateWithUnit(rate, policy.mode)}
                            <span className="text-xs text-muted-foreground">
                              ({(legalCheck.yearlyRate * 100).toFixed(2)}%/ปี)
                            </span>
                          </span>
                          {isMonthly && policy.anchorDay && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              วันที่ {policy.anchorDay}
                            </span>
                          )}
                          {policy.graceDays && policy.graceDays > 0 && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              ผ่อนผัน {policy.graceDays} วัน
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <FileText className="h-3.5 w-3.5" />
                            {policy._count.loans} สัญญา
                          </span>
                        </div>
                      </div>

                      {/* Rate Display */}
                      <div className="text-right hidden sm:block">
                        <p className={`text-2xl font-bold ${
                          !legalCheck.isLegal
                            ? 'text-red-600'
                            : isMonthly ? 'text-green-600' : 'text-purple-600'
                        }`}>
                          {formatRate(rate, policy.mode)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isMonthly ? 'ต่อเดือน' : 'ต่อวัน'}
                        </p>
                      </div>

                      <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Legal Info Card */}
        <Card className="mt-6 border-amber-200 bg-amber-50/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Scale className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <h4 className="font-medium mb-1 text-amber-800">📜 ข้อกำหนดทางกฎหมาย</h4>
                <p className="text-sm text-amber-700">
                  ตาม <strong>พ.ร.บ. ห้ามเรียกดอกเบี้ยเกินอัตรา พ.ศ. 2560</strong> กำหนดอัตราดอกเบี้ยสูงสุดไว้ที่{" "}
                  <strong>15% ต่อปี</strong> (1.25% ต่อเดือน หรือ 0.041% ต่อวัน)<br />
                  <span className="text-amber-600">โทษฝ่าฝืน: จำคุกไม่เกิน 2 ปี ปรับไม่เกิน 200,000 บาท หรือทั้งจำทั้งปรับ</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tips Card */}
        <Card className="mt-4 border-dashed">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium mb-1">เกี่ยวกับนโยบายดอกเบี้ย</h4>
                <p className="text-sm text-muted-foreground">
                  <strong>รายเดือน:</strong> คำนวณดอกเบี้ยแบบ prorate ตามจำนวนวันในเดือน เหมาะสำหรับสัญญาระยะยาว<br />
                  <strong>รายวัน:</strong> คำนวณดอกเบี้ยทุกวัน เหมาะสำหรับสัญญาระยะสั้นหรือต้องการความแม่นยำสูง
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
