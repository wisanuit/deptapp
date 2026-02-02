"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  Crown,
  Zap,
  Building2,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface Plan {
  id: string;
  name: string;
  displayName: string;
  description: string;
  price: number;
  yearlyPrice: number;
  limits: Record<string, number>;
}

interface Subscription {
  id: string;
  status: string;
  billingCycle: string;
  startDate: string;
  endDate: string | null;
  plan: {
    id: string;
    name: string;
    displayName: string;
    price: number;
    yearlyPrice: number;
  };
}

interface UsageStats {
  [key: string]: {
    usage: number;
    limit: number;
    percentage: number;
  };
}

const FEATURE_LABELS: Record<string, string> = {
  WORKSPACES: "Workspaces",
  CONTACTS: "ผู้ติดต่อ",
  LOANS: "สัญญาเงินกู้",
  CREDIT_CARDS: "บัตรเครดิต",
  INSTALLMENT_PLANS: "แผนผ่อนชำระ",
  PRODUCTS: "สินค้า",
  STORAGE_MB: "พื้นที่เก็บข้อมูล (MB)",
  TEAM_MEMBERS: "สมาชิกทีม",
};

const PLAN_ICONS: Record<string, React.ReactNode> = {
  FREE: <Zap className="h-6 w-6" />,
  PRO: <Crown className="h-6 w-6" />,
  BUSINESS: <Building2 className="h-6 w-6" />,
};

const PLAN_COLORS: Record<string, string> = {
  FREE: "bg-slate-100 text-slate-700",
  PRO: "bg-gradient-to-r from-amber-400 to-orange-500 text-white",
  BUSINESS: "bg-gradient-to-r from-indigo-600 to-purple-600 text-white",
};

export default function SubscriptionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      const res = await fetch("/api/subscription");
      if (!res.ok) throw new Error("Failed to fetch subscription");
      const data = await res.json();
      setSubscription(data.subscription);
      setUsage(data.usage);
      setPlans(data.plans);
    } catch (err) {
      setError("ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId: string, planName: string) => {
    if (planName === "FREE" || planName === subscription?.plan.name) return;

    setUpgrading(planName);
    try {
      // สร้างคำขอชำระเงิน
      const res = await fetch("/api/subscription/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, billingCycle }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to create payment");
      }

      if (data.requiresPayment) {
        // ถ้าต้องชำระเงิน redirect ไปหน้า payment
        router.push("/subscription/payment");
      } else {
        // ถ้าเป็นแพคเก็จฟรี อัพเกรดได้เลย
        await fetchSubscriptionData();
        alert(`สมัคร ${planName} สำเร็จ!`);
      }
    } catch (err: any) {
      alert(err.message || "เกิดข้อผิดพลาดในการอัพเกรด");
    } finally {
      setUpgrading(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการยกเลิกแผนปัจจุบัน? คุณจะถูกลดเกรดเป็นแผนฟรี")) return;

    setUpgrading("cancel");
    try {
      const res = await fetch("/api/subscription/upgrade", {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to cancel");

      await fetchSubscriptionData();
      alert("ยกเลิกแผนสำเร็จ");
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการยกเลิก");
    } finally {
      setUpgrading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              กลับ
            </Button>
            <div>
              <h1 className="text-xl font-bold">จัดการแผนการใช้งาน</h1>
              <p className="text-sm text-muted-foreground">
                อัพเกรดเพื่อปลดล็อคฟีเจอร์เพิ่มเติม
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Current Plan Card */}
        <Card className="mb-8 border-2 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {PLAN_ICONS[subscription?.plan.name || "FREE"]}
                  แผนปัจจุบัน: {subscription?.plan.displayName}
                </CardTitle>
                <CardDescription>
                  {subscription?.status === "ACTIVE" ? (
                    <Badge variant="outline" className="mt-2 bg-green-50 text-green-700 border-green-200">
                      ใช้งานอยู่
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="mt-2">
                      {subscription?.status}
                    </Badge>
                  )}
                </CardDescription>
              </div>
              {subscription?.plan.name !== "FREE" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={upgrading !== null}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  ยกเลิกแผน
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Usage Stats */}
            <h4 className="font-medium mb-4">การใช้งานปัจจุบัน</h4>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {usage &&
                Object.entries(usage).map(([feature, stats]) => (
                  <div
                    key={feature}
                    className="bg-slate-50 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        {FEATURE_LABELS[feature] || feature}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {stats.limit === -1 ? "ไม่จำกัด" : `${stats.usage}/${stats.limit}`}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          stats.percentage >= 90
                            ? "bg-red-500"
                            : stats.percentage >= 70
                            ? "bg-amber-500"
                            : "bg-green-500"
                        }`}
                        style={{
                          width: stats.limit === -1 ? "5%" : `${Math.min(stats.percentage, 100)}%`,
                        }}
                      />
                    </div>
                    {stats.limit !== -1 && stats.percentage >= 80 && (
                      <p className="text-xs text-amber-600 mt-1">
                        ใกล้ถึงขีดจำกัดแล้ว
                      </p>
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-slate-100 rounded-full p-1 flex">
            <button
              onClick={() => setBillingCycle("MONTHLY")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingCycle === "MONTHLY"
                  ? "bg-white shadow text-slate-900"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              รายเดือน
            </button>
            <button
              onClick={() => setBillingCycle("YEARLY")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingCycle === "YEARLY"
                  ? "bg-white shadow text-slate-900"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              รายปี
              <Badge className="ml-2 bg-green-500 text-white text-xs">
                ประหยัด 17%
              </Badge>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const isCurrentPlan = plan.name === subscription?.plan.name;
            const price = billingCycle === "MONTHLY" ? plan.price : plan.yearlyPrice;
            const monthlyEquivalent =
              billingCycle === "YEARLY" ? Math.round(plan.yearlyPrice / 12) : plan.price;

            return (
              <Card
                key={plan.id}
                className={`relative overflow-hidden transition-all hover:shadow-lg ${
                  isCurrentPlan ? "ring-2 ring-primary" : ""
                } ${plan.name === "PRO" ? "md:-mt-4 md:mb-4" : ""}`}
              >
                {plan.name === "PRO" && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-4 py-1 rounded-bl-lg">
                    แนะนำ
                  </div>
                )}

                <CardHeader className={`${PLAN_COLORS[plan.name]} rounded-t-lg`}>
                  <div className="flex items-center gap-3">
                    {PLAN_ICONS[plan.name]}
                    <div>
                      <CardTitle className="text-lg">{plan.displayName}</CardTitle>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-6">
                  {/* Price */}
                  <div className="text-center mb-6">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold">
                        ฿{monthlyEquivalent.toLocaleString()}
                      </span>
                      <span className="text-muted-foreground">/เดือน</span>
                    </div>
                    {billingCycle === "YEARLY" && plan.price > 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        เรียกเก็บ ฿{price.toLocaleString()}/ปี
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground mt-2">
                      {plan.description}
                    </p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-6">
                    {Object.entries(plan.limits).map(([feature, limit]) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span>
                          {FEATURE_LABELS[feature] || feature}:{" "}
                          <strong>{limit === -1 ? "ไม่จำกัด" : limit}</strong>
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  {isCurrentPlan ? (
                    <Button className="w-full" disabled>
                      แผนปัจจุบัน
                    </Button>
                  ) : plan.name === "FREE" ? (
                    <Button variant="outline" className="w-full" disabled>
                      แผนพื้นฐาน
                    </Button>
                  ) : (
                    <Button
                      className={`w-full ${
                        plan.name === "PRO"
                          ? "bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600"
                          : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                      }`}
                      onClick={() => handleUpgrade(plan.id, plan.name)}
                      disabled={upgrading !== null}
                    >
                      {upgrading === plan.name ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      อัพเกรดเป็น {plan.displayName}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">คำถามที่พบบ่อย</h2>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">เปลี่ยนแผนได้ทุกเมื่อหรือไม่?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  ได้ครับ คุณสามารถอัพเกรดหรือดาวน์เกรดแผนได้ทุกเมื่อ
                  การเปลี่ยนแปลงจะมีผลทันที
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">ถ้าเกิน limit จะเกิดอะไรขึ้น?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  คุณจะไม่สามารถสร้างรายการใหม่ได้จนกว่าจะอัพเกรดแผนหรือลบรายการที่มีอยู่
                  ข้อมูลเดิมจะยังคงอยู่และเข้าถึงได้ตามปกติ
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">รองรับการชำระเงินแบบใด?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  รองรับบัตรเครดิต/เดบิต, PromptPay, และการโอนเงินผ่านธนาคาร
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
