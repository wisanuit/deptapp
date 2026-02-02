import Link from "next/link";
import { getAuthSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";
import {
  BarChart3,
  CreditCard,
  Wallet,
  CheckCircle2,
  Users,
  ShieldCheck,
  LayoutDashboard,
  PieChart,
  ArrowUpRight,
  Plus,
  TrendingUp,
  ChevronRight,
  ShoppingBag,
  Landmark,
  FileCheck,
  AlertTriangle,
  AlertCircle,
  Package,
  Receipt,
  Crown,
  Sparkles,
  Zap,
  Building2,
} from "lucide-react";
import { HomeClientWrapper, HeroButtons, HeaderButtons, PricingButton } from "@/components/home-client-wrapper";
import { getAllPlans } from "@/services/subscription.service";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getAuthSession();

  if (session) {
    redirect("/dashboard");
  }

  // ดึงแผนราคาจากฐานข้อมูล
  const plans = await getAllPlans();

  return (
    <HomeClientWrapper>
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] overflow-x-hidden">
      {/* Header - Transparent to solid feel */}
      <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-white/70 backdrop-blur-md supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-sm">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Debt Manager
            </span>
          </div>
          <div className="flex items-center gap-4">
            <HeaderButtons />
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section - Premium Feel */}
        <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
          {/* Background Gradients */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-[-1]">
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-100/60 rounded-full mix-blend-multiply filter blur-[80px] opacity-70 animate-blob"></div>
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-100/60 rounded-full mix-blend-multiply filter blur-[80px] opacity-70 animate-blob animation-delay-2000"></div>
          </div>

          <div className="container mx-auto px-4 text-center">
            {/* Badge */}
            <div className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 mb-8 shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-indigo-600 mr-2 relative">
                 <span className="absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75 animate-ping"></span>
              </span>
              Smart Finance Platform 2026
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 text-slate-900 leading-[1.1]">
              ควบคุมทุกหนี้สินและการเงิน
              <br />
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent">
                ในแพลตฟอร์มเดียว
              </span>
            </h1>

            <p className="text-xl text-slate-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              ระบบจัดการสัญญาเงินกู้ คำนวณดอกเบี้ยที่ซับซ้อน และวางแผนการจ่ายบัตรเครดิต
              ออกแบบมาเพื่อให้คุณเห็นภาพรวมและวางแผนการเงินได้ดีขึ้น
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-20">
              <HeroButtons />
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-10 rounded-full text-lg border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all"
              >
                ดูวิดีโอแนะนำ
              </Button>
            </div>

            {/* CSS-based Dashboard Mockup (More realistic) */}
            <div className="relative mx-auto max-w-6xl">
               {/* Glow effect behind mockup */}
              <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-[2rem] opacity-10 blur-2xl"></div>
              
              <div className="relative bg-white rounded-[1.5rem] border border-slate-200/60 shadow-2xl overflow-hidden">
                {/* Mockup Browser Bar */}
                <div className="h-8 bg-slate-50 border-b border-slate-100 flex items-center px-4 gap-2">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-400/80"></div>
                        <div className="w-3 h-3 rounded-full bg-amber-400/80"></div>
                        <div className="w-3 h-3 rounded-full bg-green-400/80"></div>
                    </div>
                    <div className="flex-1 flex justify-center">
                      <div className="bg-slate-100 rounded-md px-3 py-1 text-xs text-slate-500 font-medium">
                        debtmanager.app/workspaces/my-workspace
                      </div>
                    </div>
                </div>

                {/* Mockup Header - Like Workspace Page */}
                <div className="bg-white border-b border-slate-100">
                  <div className="px-4 md:px-6">
                    <div className="flex items-center justify-between h-12">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                          <Wallet className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-lg font-bold text-indigo-600">ธุรกิจของฉัน</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                          <Users className="h-4 w-4 text-slate-500" />
                        </div>
                      </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex gap-1 -mb-px overflow-x-auto">
                      <div className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 border-indigo-500 text-indigo-600">
                        <LayoutDashboard className="h-3.5 w-3.5" />
                        <span>ภาพรวม</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 border-transparent text-slate-500">
                        <Users className="h-3.5 w-3.5" />
                        <span>ผู้ติดต่อ</span>
                        <span className="bg-slate-100 text-[10px] px-1.5 rounded-full">12</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 border-transparent text-slate-500">
                        <Wallet className="h-3.5 w-3.5" />
                        <span>สัญญา</span>
                        <span className="bg-slate-100 text-[10px] px-1.5 rounded-full">8</span>
                      </div>
                      <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 border-transparent text-slate-500">
                        <CreditCard className="h-3.5 w-3.5" />
                        <span>บัตร</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mockup Content - Skeleton Structure Only */}
                <div className="bg-slate-50/80 p-4 md:p-6">
                  <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
                    {/* Main Content - Left Side */}
                    <div className="lg:col-span-2 space-y-4">
                      {/* Loan Card with Gradient Header */}
                      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                                <BarChart3 className="h-4 w-4 text-white" />
                              </div>
                              <div>
                                <div className="h-4 w-20 bg-white/30 rounded animate-pulse"></div>
                                <div className="h-3 w-28 bg-white/20 rounded mt-1 animate-pulse"></div>
                              </div>
                            </div>
                            <div className="bg-white/90 text-indigo-600 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
                              <Plus className="h-3 w-3" /> <span className="h-3 w-12 bg-indigo-100 rounded animate-pulse"></span>
                            </div>
                          </div>
                        </div>
                        <div className="divide-y divide-slate-100">
                          {/* Skeleton Loan Items */}
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-3 p-3">
                              <div className="w-10 h-10 rounded-full bg-slate-200 animate-pulse"></div>
                              <div className="flex-1 min-w-0">
                                <div className="h-4 w-24 bg-slate-200 rounded animate-pulse mb-1"></div>
                                <div className="h-3 w-32 bg-slate-100 rounded animate-pulse"></div>
                              </div>
                              <div className="text-right">
                                <div className="h-4 w-16 bg-slate-200 rounded animate-pulse mb-1"></div>
                                <div className="h-3 w-12 bg-slate-100 rounded animate-pulse"></div>
                              </div>
                              <ChevronRight className="h-4 w-4 text-slate-300" />
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-center gap-1 p-2 text-xs font-medium text-indigo-400 border-t border-slate-100">
                          <div className="h-3 w-24 bg-indigo-100 rounded animate-pulse"></div>
                        </div>
                      </div>

                      {/* Installment Card - Purple Gradient */}
                      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
                        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                                <ShoppingBag className="h-4 w-4 text-white" />
                              </div>
                              <div>
                                <div className="h-4 w-24 bg-white/30 rounded animate-pulse"></div>
                                <div className="h-3 w-20 bg-white/20 rounded mt-1 animate-pulse"></div>
                              </div>
                            </div>
                            <div className="bg-white/90 text-purple-600 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
                              <Plus className="h-3 w-3" /> <span className="h-3 w-16 bg-purple-100 rounded animate-pulse"></span>
                            </div>
                          </div>
                        </div>
                        <div className="divide-y divide-slate-100">
                          {/* Skeleton Installment Items */}
                          {[1, 2].map((i) => (
                            <div key={i} className="flex items-center gap-3 p-3">
                              <div className="w-12 h-12 rounded-xl bg-slate-200 animate-pulse"></div>
                              <div className="flex-1 min-w-0">
                                <div className="h-4 w-28 bg-slate-200 rounded animate-pulse mb-1"></div>
                                <div className="h-3 w-36 bg-slate-100 rounded animate-pulse mb-2"></div>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-purple-300 to-pink-300 rounded-full animate-pulse" style={{ width: `${30 + i * 20}%` }} />
                                  </div>
                                  <div className="h-3 w-12 bg-slate-100 rounded animate-pulse"></div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="h-4 w-14 bg-slate-200 rounded animate-pulse mb-1"></div>
                                <div className="h-3 w-10 bg-slate-100 rounded animate-pulse"></div>
                              </div>
                              <ChevronRight className="h-4 w-4 text-slate-300" />
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-center gap-1 p-2 text-xs font-medium text-purple-400 border-t border-slate-100">
                          <div className="h-3 w-24 bg-purple-100 rounded animate-pulse"></div>
                        </div>
                      </div>

                      {/* Contacts Card - Emerald Gradient */}
                      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
                        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                                <Users className="h-4 w-4 text-white" />
                              </div>
                              <div>
                                <div className="h-4 w-20 bg-white/30 rounded animate-pulse"></div>
                                <div className="h-3 w-24 bg-white/20 rounded mt-1 animate-pulse"></div>
                              </div>
                            </div>
                            <div className="bg-white/90 text-emerald-600 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
                              <Plus className="h-3 w-3" /> <span className="h-3 w-14 bg-emerald-100 rounded animate-pulse"></span>
                            </div>
                          </div>
                        </div>
                        <div className="divide-y divide-slate-100">
                          {/* Skeleton Contact Items */}
                          {[1, 2].map((i) => (
                            <div key={i} className="flex items-center gap-3 p-3">
                              <div className="w-10 h-10 rounded-full bg-slate-200 animate-pulse"></div>
                              <div className="flex-1 min-w-0">
                                <div className="h-4 w-28 bg-slate-200 rounded animate-pulse mb-1"></div>
                                <div className="h-3 w-24 bg-slate-100 rounded animate-pulse"></div>
                              </div>
                              <div className="h-5 w-14 bg-slate-100 rounded-full animate-pulse"></div>
                              <ChevronRight className="h-4 w-4 text-slate-300" />
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-center gap-1 p-2 text-xs font-medium text-emerald-400 border-t border-slate-100">
                          <div className="h-3 w-24 bg-emerald-100 rounded animate-pulse"></div>
                        </div>
                      </div>
                    </div>

                    {/* Right Sidebar */}
                    <div className="space-y-4">
                      {/* Receivable Summary - Green Skeleton */}
                      <div className="bg-green-50/50 border border-green-200 rounded-xl p-4">
                        <h3 className="font-semibold text-green-700 flex items-center gap-2 text-sm mb-3">
                          <TrendingUp className="h-4 w-4" />
                          <div className="h-4 w-24 bg-green-200 rounded animate-pulse"></div>
                        </h3>
                        <div className="space-y-2">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="flex justify-between items-center py-1.5 border-b border-green-200">
                              <div className="h-3 w-20 bg-green-200 rounded animate-pulse"></div>
                              <div className="h-5 w-16 bg-green-300 rounded animate-pulse"></div>
                            </div>
                          ))}
                          <div className="flex justify-between items-center py-2 bg-green-100 rounded-lg px-2 -mx-1">
                            <div className="h-3 w-24 bg-green-200 rounded animate-pulse"></div>
                            <div className="h-5 w-20 bg-green-300 rounded animate-pulse"></div>
                          </div>
                        </div>
                      </div>

                      {/* Payable Summary - Red Skeleton */}
                      <div className="bg-red-50/50 border border-red-200 rounded-xl p-4">
                        <h3 className="font-semibold text-red-700 flex items-center gap-2 text-sm mb-3">
                          <CreditCard className="h-4 w-4" />
                          <div className="h-4 w-20 bg-red-200 rounded animate-pulse"></div>
                        </h3>
                        <div className="space-y-2">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="flex justify-between items-center py-1.5 border-b border-red-200">
                              <div className="h-3 w-20 bg-red-200 rounded animate-pulse"></div>
                              <div className="h-5 w-16 bg-red-300 rounded animate-pulse"></div>
                            </div>
                          ))}
                          <div className="flex justify-between items-center py-2 bg-red-100 rounded-lg px-2 -mx-1">
                            <div className="h-3 w-20 bg-red-200 rounded animate-pulse"></div>
                            <div className="h-5 w-20 bg-red-300 rounded animate-pulse"></div>
                          </div>
                        </div>
                      </div>

                      {/* Net Balance Skeleton */}
                      <div className="bg-white border border-slate-200 rounded-xl p-4">
                        <div className="flex justify-between items-center mb-1">
                          <div className="h-4 w-16 bg-slate-200 rounded animate-pulse"></div>
                          <div className="h-6 w-24 bg-green-200 rounded animate-pulse"></div>
                        </div>
                        <div className="h-3 w-32 bg-slate-100 rounded animate-pulse"></div>
                      </div>

                      {/* Module Stats Skeleton */}
                      <div className="bg-white border border-slate-200 rounded-xl p-4">
                        <h3 className="font-semibold text-slate-700 flex items-center gap-2 text-sm mb-3">
                          <Package className="h-4 w-4" />
                          <div className="h-4 w-16 bg-slate-200 rounded animate-pulse"></div>
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { icon: ShoppingBag, color: 'purple' },
                            { icon: Landmark, color: 'blue' },
                            { icon: FileCheck, color: 'green' },
                            { icon: AlertTriangle, color: 'red' }
                          ].map((item, i) => (
                            <div key={i} className="flex flex-col items-center p-2.5 bg-slate-50 rounded-lg">
                              <item.icon className={`h-5 w-5 text-${item.color}-400 mb-1`} />
                              <div className="h-5 w-8 bg-slate-200 rounded animate-pulse mb-1"></div>
                              <div className="h-2 w-12 bg-slate-100 rounded animate-pulse"></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section - Cleaner Cards */}
        <section className="container mx-auto px-4 py-24 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-slate-900">
              ฟีเจอร์ที่ออกแบบมาเพื่อความชัดเจนทางการเงิน
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              ลดความยุ่งยากในการจัดการตัวเลข ให้ระบบช่วยดูแลรายละเอียด
              เพื่อให้คุณโฟกัสกับภาพรวมได้เต็มที่
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="border-0 shadow-lg shadow-slate-200/40 bg-white hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group">
              <CardHeader>
                <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-2 group-hover:bg-indigo-600 transition-colors">
                  <Wallet className="h-7 w-7 text-indigo-600 group-hover:text-white transition-colors" />
                </div>
                <CardTitle className="text-xl font-bold text-slate-900">จัดการสัญญาเงินกู้</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-6">
                  บันทึกและติดตามสัญญาเงินกู้ทุกประเภท รองรับการคำนวณที่ซับซ้อน
                </p>
                <ul className="space-y-3 text-sm text-slate-700 font-medium">
                  <li className="flex items-center gap-3">
                    <div className="rounded-full bg-green-100 p-1"><CheckCircle2 className="h-3.5 w-3.5 text-green-600" /></div> คิดดอกเบี้ยรายเดือน/รายวัน
                  </li>
                  <li className="flex items-center gap-3">
                     <div className="rounded-full bg-green-100 p-1"><CheckCircle2 className="h-3.5 w-3.5 text-green-600" /></div> ระบบ Prorate รอบแรกอัตโนมัติ
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="border-0 shadow-lg shadow-slate-200/40 bg-white hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group">
              <CardHeader>
                 <div className="h-14 w-14 rounded-2xl bg-purple-50 flex items-center justify-center mb-2 group-hover:bg-purple-600 transition-colors">
                  <CreditCard className="h-7 w-7 text-purple-600 group-hover:text-white transition-colors" />
                </div>
                <CardTitle className="text-xl font-bold text-slate-900">จัดการบัตรเครดิต</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-6">
                  ไม่พลาดทุกรอบบิล รู้ยอดจ่ายขั้นต่ำและดอกเบี้ยที่จะเกิดขึ้นล่วงหน้า
                </p>
                <ul className="space-y-3 text-sm text-slate-700 font-medium">
                  <li className="flex items-center gap-3">
                    <div className="rounded-full bg-green-100 p-1"><CheckCircle2 className="h-3.5 w-3.5 text-green-600" /></div> แจ้งเตือนวันตัดรอบ/ครบกำหนด
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="rounded-full bg-green-100 p-1"><CheckCircle2 className="h-3.5 w-3.5 text-green-600" /></div> สร้าง Statement จำลอง
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="border-0 shadow-lg shadow-slate-200/40 bg-white hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group">
              <CardHeader>
                <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-2 group-hover:bg-blue-600 transition-colors">
                  <BarChart3 className="h-7 w-7 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <CardTitle className="text-xl font-bold text-slate-900">Dashboard สรุปภาพรวม</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-6">
                  เห็นสถานะการเงินที่แท้จริงของคุณในหน้าเดียว พร้อมกราฟวิเคราะห์
                </p>
                <ul className="space-y-3 text-sm text-slate-700 font-medium">
                  <li className="flex items-center gap-3">
                    <div className="rounded-full bg-green-100 p-1"><CheckCircle2 className="h-3.5 w-3.5 text-green-600" /></div> สรุปยอดหนี้สินคงเหลือ
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="rounded-full bg-green-100 p-1"><CheckCircle2 className="h-3.5 w-3.5 text-green-600" /></div> ปฏิทินการชำระเงิน
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 bg-gradient-to-b from-white to-slate-50 relative overflow-hidden scroll-mt-20">
          {/* Background decoration */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-100/50 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-100/50 rounded-full blur-3xl"></div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 mb-6">
                <Sparkles className="h-4 w-4 mr-2" />
                แผนราคา
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-slate-900">
                เลือกแผนที่เหมาะกับคุณ
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                เริ่มต้นฟรี ไม่มีบัตรเครดิต อัปเกรดเมื่อพร้อม
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {plans.map((plan, index) => {
                const isPro = plan.name === "PRO";
                const isBusiness = plan.name === "BUSINESS";
                const planLimits = plan.limits as { feature: string; limit: number }[];
                const workspacesLimit = planLimits.find((l) => l.feature === "WORKSPACES")?.limit ?? 0;
                const contactsLimit = planLimits.find((l) => l.feature === "CONTACTS")?.limit ?? 0;
                const loansLimit = planLimits.find((l) => l.feature === "LOANS")?.limit ?? 0;
                const teamLimit = planLimits.find((l) => l.feature === "TEAM_MEMBERS")?.limit ?? 0;
                const storageLimit = planLimits.find((l) => l.feature === "STORAGE_MB")?.limit ?? 0;

                return (
                  <Card
                    key={plan.id}
                    className={`relative border-0 shadow-xl transition-all duration-300 hover:-translate-y-2 ${
                      isPro
                        ? "bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-indigo-500/30"
                        : isBusiness
                        ? "bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-slate-500/30"
                        : "bg-white shadow-slate-200/50"
                    }`}
                  >
                    {isPro && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-bold px-4 py-1 rounded-full shadow-lg flex items-center gap-1">
                          <Crown className="h-4 w-4" />
                          ยอดนิยม
                        </div>
                      </div>
                    )}
                    <CardHeader className="text-center pt-8 pb-4">
                      <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${
                        isPro
                          ? "bg-white/20"
                          : isBusiness
                          ? "bg-white/10"
                          : "bg-indigo-50"
                      }`}>
                        {plan.name === "FREE" && <Zap className="h-8 w-8 text-indigo-600" />}
                        {isPro && <Crown className="h-8 w-8 text-white" />}
                        {isBusiness && <Building2 className="h-8 w-8 text-white" />}
                      </div>
                      <CardTitle className={`text-2xl font-bold mb-2 ${
                        isPro || isBusiness ? "text-white" : "text-slate-900"
                      }`}>
                        {plan.displayName}
                      </CardTitle>
                      <p className={`text-sm ${
                        isPro ? "text-indigo-200" : isBusiness ? "text-slate-400" : "text-slate-500"
                      }`}>
                        {plan.description}
                      </p>
                    </CardHeader>
                    <CardContent className="pb-8">
                      <div className="text-center mb-6">
                        <div className="flex items-baseline justify-center gap-1">
                          <span className={`text-4xl font-bold ${
                            isPro || isBusiness ? "text-white" : "text-slate-900"
                          }`}>
                            ฿{plan.price.toLocaleString()}
                          </span>
                          <span className={isPro || isBusiness ? "text-white/70" : "text-slate-500"}>/เดือน</span>
                        </div>
                        {plan.yearlyPrice && plan.yearlyPrice > 0 && (
                          <p className={`text-sm mt-1 ${
                            isPro ? "text-indigo-200" : isBusiness ? "text-slate-400" : "text-slate-500"
                          }`}>
                            หรือ ฿{plan.yearlyPrice.toLocaleString()}/ปี (ประหยัด 17%)
                          </p>
                        )}
                      </div>

                      <ul className="space-y-3 mb-8">
                        <li className="flex items-center gap-3">
                          <CheckCircle2 className={`h-5 w-5 ${
                            isPro ? "text-indigo-200" : isBusiness ? "text-green-400" : "text-green-600"
                          }`} />
                          <span className={isPro || isBusiness ? "text-white/90" : "text-slate-700"}>
                            {workspacesLimit === -1 ? "ไม่จำกัด" : workspacesLimit} Workspaces
                          </span>
                        </li>
                        <li className="flex items-center gap-3">
                          <CheckCircle2 className={`h-5 w-5 ${
                            isPro ? "text-indigo-200" : isBusiness ? "text-green-400" : "text-green-600"
                          }`} />
                          <span className={isPro || isBusiness ? "text-white/90" : "text-slate-700"}>
                            {contactsLimit === -1 ? "ไม่จำกัด" : contactsLimit} ผู้ติดต่อ
                          </span>
                        </li>
                        <li className="flex items-center gap-3">
                          <CheckCircle2 className={`h-5 w-5 ${
                            isPro ? "text-indigo-200" : isBusiness ? "text-green-400" : "text-green-600"
                          }`} />
                          <span className={isPro || isBusiness ? "text-white/90" : "text-slate-700"}>
                            {loansLimit === -1 ? "ไม่จำกัด" : loansLimit} สัญญา
                          </span>
                        </li>
                        <li className="flex items-center gap-3">
                          <CheckCircle2 className={`h-5 w-5 ${
                            isPro ? "text-indigo-200" : isBusiness ? "text-green-400" : "text-green-600"
                          }`} />
                          <span className={isPro || isBusiness ? "text-white/90" : "text-slate-700"}>
                            {teamLimit === -1 ? "ไม่จำกัด" : teamLimit} สมาชิกทีม
                          </span>
                        </li>
                        <li className="flex items-center gap-3">
                          <CheckCircle2 className={`h-5 w-5 ${
                            isPro ? "text-indigo-200" : isBusiness ? "text-green-400" : "text-green-600"
                          }`} />
                          <span className={isPro || isBusiness ? "text-white/90" : "text-slate-700"}>
                            {storageLimit === -1 ? "10 GB" : storageLimit >= 1024 ? `${(storageLimit / 1024).toFixed(0)} GB` : `${storageLimit} MB`} พื้นที่เก็บข้อมูล
                          </span>
                        </li>
                      </ul>

                      <PricingButton 
                        planName={plan.name} 
                        isPro={isPro} 
                        isBusiness={isBusiness} 
                      />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Multi-tenant Section - Modern Dark Theme */}
        <section className="py-24 bg-[#0F172A] relative overflow-hidden">
           {/* Subtle grid pattern overlay */}
           <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10"></div>
           
          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-16">
              <div className="md:w-1/2">
                <div className="inline-flex items-center rounded-lg bg-slate-800/80 border border-slate-700 px-3 py-1 text-sm font-medium text-indigo-400 mb-6">
                  <Users className="mr-2 h-4 w-4" /> For Business & Personal
                </div>
                <h3 className="text-3xl md:text-4xl font-bold mb-6 text-white leading-tight">
                  แยกข้อมูลอย่างเป็นสัดส่วน<br/>ด้วยระบบ Workspaces
                </h3>
                <p className="text-slate-400 mb-8 text-lg leading-relaxed">
                  จัดการบัญชีส่วนตัวและบัญชีธุรกิจได้ในที่เดียวโดยข้อมูลไม่ปะปนกัน
                  สร้าง Workspace ได้ไม่จำกัดเพื่อตอบโจทย์การใช้งานที่หลากหลาย
                </p>
                <div className="flex flex-col sm:flex-row gap-5">
                  <div className="flex items-center gap-3 text-slate-300">
                    <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center">
                        <ShieldCheck className="h-5 w-5 text-green-400" />
                    </div>
                     <span className="font-medium">ความปลอดภัยระดับสูง</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300">
                     <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center">
                        <ArrowUpRight className="h-5 w-5 text-blue-400" />
                    </div>
                    <span className="font-medium">ขยายได้ไม่จำกัด</span>
                  </div>
                </div>
              </div>

              {/* Abstract Visual for Workspace Swapping */}
              <div className="md:w-1/2 w-full relative">
                 {/* Decorative floating elements */}
                 <div className="absolute top-0 right-0 -mt-10 -mr-10 h-32 w-32 bg-indigo-500/20 rounded-full blur-2xl animate-pulse"></div>
                 <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-32 w-32 bg-purple-500/20 rounded-full blur-2xl animate-pulse delay-1000"></div>

                 <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700/50 backdrop-blur-sm relative z-10 shadow-2xl">
                     <div className="text-sm text-slate-400 mb-4 font-medium flex justify-between items-center">
                        <span>Select Workspace</span>
                     </div>
                     <div className="space-y-3">
                        {/* Active Workspace */}
                        <div className="flex items-center justify-between gap-4 bg-indigo-600/10 p-4 rounded-xl border border-indigo-500/50 shadow-sm transition-all cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">P</div>
                                <div>
                                    <div className="text-white font-semibold">Personal Finances</div>
                                    <div className="text-indigo-300 text-sm">Last active just now</div>
                                </div>
                            </div>
                            <CheckCircle2 className="h-5 w-5 text-indigo-400" />
                        </div>
                        {/* Inactive Workspace */}
                         <div className="flex items-center gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group opacity-75 hover:opacity-100">
                            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold text-lg group-hover:bg-orange-500 group-hover:text-white transition-all">B</div>
                            <div>
                                <div className="text-slate-300 font-semibold group-hover:text-white">Business Corp.</div>
                                <div className="text-slate-500 text-sm">3 members</div>
                            </div>
                        </div>
                     </div>
                  </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer - Clean & Simple */}
      <footer className="border-t border-slate-100 py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-sm">
                <Wallet className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-lg text-slate-900">Debt Manager</span>
            </div>
            <div className="flex gap-8 text-sm text-slate-500 font-medium">
                <Link href="#" className="hover:text-indigo-600 transition-colors">ฟีเจอร์</Link>
                <Link href="#pricing" className="hover:text-indigo-600 transition-colors">ราคา</Link>
                <Link href="#" className="hover:text-indigo-600 transition-colors">ติดต่อเรา</Link>
            </div>
          </div>
            <div className="mt-8 pt-8 border-t border-slate-100 text-center text-sm text-slate-500">
              <p>© 2026 Debt Manager. Built with Next.js, Tailwind & Prisma.</p>
            </div>
        </div>
      </footer>
    </div>
    </HomeClientWrapper>
  );
}