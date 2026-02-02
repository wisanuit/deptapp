"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Loader2,
  Save,
  RefreshCw,
  Users,
  Crown,
  Settings,
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
  plan: {
    name: string;
    displayName: string;
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

export default function AdminSubscriptionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/subscription");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setPlans(data.plans);
      setSubscription(data.subscription);
      setUsage(data.usage);
    } catch (err) {
      setError("ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  };

  const initializePlans = async () => {
    setInitializing(true);
    try {
      const res = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "initialize" }),
      });

      if (!res.ok) throw new Error("Failed to initialize");

      alert("สร้างแผนสำเร็จ!");
      await fetchData();
    } catch (err) {
      alert("เกิดข้อผิดพลาด");
    } finally {
      setInitializing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                กลับ
              </Button>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Admin: จัดการแผนการใช้งาน
                </h1>
                <p className="text-sm text-muted-foreground">
                  ตั้งค่าแผนและ Limits
                </p>
              </div>
            </div>
            <Button onClick={initializePlans} disabled={initializing}>
              {initializing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              สร้าง/รีเซ็ตแผน
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        {/* Current Status */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500" />
                แผนปัจจุบัน
              </CardTitle>
            </CardHeader>
            <CardContent>
              {subscription ? (
                <div className="space-y-2">
                  <p className="text-2xl font-bold">{subscription.plan.displayName}</p>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    {subscription.status}
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    รอบบิล: {subscription.billingCycle === "MONTHLY" ? "รายเดือน" : "รายปี"}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground">ยังไม่มี subscription</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                สรุปการใช้งาน
              </CardTitle>
            </CardHeader>
            <CardContent>
              {usage ? (
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(usage).slice(0, 4).map(([feature, stats]) => (
                    <div key={feature} className="text-sm">
                      <span className="text-muted-foreground">{FEATURE_LABELS[feature]}:</span>
                      <span className="font-medium ml-1">
                        {stats.limit === -1 ? stats.usage : `${stats.usage}/${stats.limit}`}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">ไม่มีข้อมูล</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Plans Table */}
        <Card>
          <CardHeader>
            <CardTitle>แผนทั้งหมด ({plans.length})</CardTitle>
            <CardDescription>
              รายละเอียดแผนและขีดจำกัดแต่ละประเภท
            </CardDescription>
          </CardHeader>
          <CardContent>
            {plans.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">ยังไม่มีแผน</h3>
                <p className="text-muted-foreground mb-4">
                  กดปุ่ม สร้าง/รีเซ็ตแผน ด้านบนเพื่อสร้างแผนเริ่มต้น
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">แผน</th>
                      <th className="text-right py-3 px-4 font-medium">ราคา/เดือน</th>
                      <th className="text-right py-3 px-4 font-medium">ราคา/ปี</th>
                      {Object.keys(FEATURE_LABELS).map((feature) => (
                        <th key={feature} className="text-center py-3 px-4 font-medium text-xs">
                          {FEATURE_LABELS[feature]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {plans.map((plan) => (
                      <tr key={plan.id} className="border-b hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <div className="font-semibold">{plan.displayName}</div>
                          <div className="text-xs text-muted-foreground">{plan.name}</div>
                        </td>
                        <td className="text-right py-3 px-4">฿{plan.price.toLocaleString()}</td>
                        <td className="text-right py-3 px-4">฿{plan.yearlyPrice.toLocaleString()}</td>
                        {Object.keys(FEATURE_LABELS).map((feature) => (
                          <td key={feature} className="text-center py-3 px-4">
                            <Badge
                              variant="outline"
                              className={
                                plan.limits[feature] === -1
                                  ? "bg-green-50 text-green-700"
                                  : "bg-slate-50"
                              }
                            >
                              {plan.limits[feature] === -1 ? "∞" : plan.limits[feature]}
                            </Badge>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">วิธีใช้งาน</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>
                <strong>สร้างแผน:</strong> กดปุ่ม สร้าง/รีเซ็ตแผน เพื่อสร้างแผน FREE, PRO, BUSINESS
              </li>
              <li>
                <strong>ผู้ใช้ใหม่:</strong> จะได้รับแผน FREE โดยอัตโนมัติเมื่อสมัครใช้งาน
              </li>
              <li>
                <strong>อัพเกรด:</strong> ผู้ใช้สามารถอัพเกรดแผนได้จากหน้า /subscription
              </li>
              <li>
                <strong>ตรวจสอบ Limit:</strong> ระบบจะตรวจสอบ limit ก่อนสร้างข้อมูลใหม่
              </li>
            </ol>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
