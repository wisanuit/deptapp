"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Package,
  Loader2,
  Check,
  X,
  DollarSign,
  Users,
  Save,
  Eye,
  EyeOff,
} from "lucide-react";

interface PlanLimit {
  feature: string;
  limit: number;
}

interface Plan {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  price: number;
  yearlyPrice: number | null;
  isActive: boolean;
  sortOrder: number;
  limits: PlanLimit[];
  _count: { subscriptions: number };
}

const FEATURE_OPTIONS = [
  { key: "WORKSPACES", label: "Workspaces" },
  { key: "CONTACTS", label: "ผู้ติดต่อ" },
  { key: "LOANS", label: "สัญญาเงินกู้" },
  { key: "CREDIT_CARDS", label: "บัตรเครดิต" },
  { key: "INSTALLMENT_PLANS", label: "แผนผ่อนชำระ" },
  { key: "PRODUCTS", label: "สินค้า" },
  { key: "STORAGE_MB", label: "พื้นที่เก็บข้อมูล (MB)" },
  { key: "TEAM_MEMBERS", label: "สมาชิกทีม" },
];

export default function AdminPlansPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    displayName: "",
    description: "",
    price: 0,
    yearlyPrice: 0,
    isActive: true,
    sortOrder: 0,
    limits: {} as Record<string, number>,
  });

  const fetchPlans = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/plans");
      if (res.status === 403) {
        router.push("/admin");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch plans");
      const data = await res.json();
      setPlans(data.plans);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const startEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setIsCreating(false);
    setFormData({
      name: plan.name,
      displayName: plan.displayName,
      description: plan.description || "",
      price: plan.price,
      yearlyPrice: plan.yearlyPrice || 0,
      isActive: plan.isActive,
      sortOrder: plan.sortOrder,
      limits: plan.limits.reduce((acc, l) => {
        acc[l.feature] = l.limit;
        return acc;
      }, {} as Record<string, number>),
    });
  };

  const startCreate = () => {
    setEditingPlan(null);
    setIsCreating(true);
    setFormData({
      name: "",
      displayName: "",
      description: "",
      price: 0,
      yearlyPrice: 0,
      isActive: true,
      sortOrder: plans.length,
      limits: FEATURE_OPTIONS.reduce((acc, f) => {
        acc[f.key] = 0;
        return acc;
      }, {} as Record<string, number>),
    });
  };

  const cancelEdit = () => {
    setEditingPlan(null);
    setIsCreating(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = "/api/admin/plans";
      const method = isCreating ? "POST" : "PUT";
      const body = isCreating
        ? formData
        : { id: editingPlan?.id, ...formData };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "เกิดข้อผิดพลาด");
        return;
      }

      await fetchPlans();
      cancelEdit();
      alert(isCreating ? "สร้าง Package สำเร็จ" : "แก้ไข Package สำเร็จ");
    } catch (error) {
      alert("เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (planId: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบ Package นี้?")) return;

    try {
      const res = await fetch(`/api/admin/plans?planId=${planId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "ไม่สามารถลบได้");
        return;
      }

      await fetchPlans();
      alert("ลบ Package สำเร็จ");
    } catch (error) {
      alert("เกิดข้อผิดพลาด");
    }
  };

  const toggleActive = async (plan: Plan) => {
    try {
      await fetch("/api/admin/plans", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: plan.id,
          isActive: !plan.isActive,
        }),
      });
      await fetchPlans();
    } catch (error) {
      alert("เกิดข้อผิดพลาด");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push("/admin")} className="text-slate-300 hover:text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />
                กลับ
              </Button>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">จัดการ Package</h1>
                  <p className="text-xs text-slate-400">สร้าง แก้ไข เปิด/ปิด Packages</p>
                </div>
              </div>
            </div>
            <Button onClick={startCreate} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              สร้าง Package ใหม่
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Plans List */}
          <div className="lg:col-span-2 space-y-4">
            {plans.map((plan) => (
              <Card key={plan.id} className={`bg-slate-800 border-slate-700 ${!plan.isActive ? "opacity-60" : ""}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">{plan.displayName}</h3>
                        <Badge variant="outline" className="border-slate-600 text-slate-400">
                          {plan.name}
                        </Badge>
                        {plan.isActive ? (
                          <Badge className="bg-green-600">เปิดใช้งาน</Badge>
                        ) : (
                          <Badge className="bg-slate-600">ปิดใช้งาน</Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-400 mb-4">{plan.description || "ไม่มีคำอธิบาย"}</p>
                      
                      <div className="flex items-center gap-6 mb-4">
                        <div>
                          <span className="text-2xl font-bold text-white">฿{plan.price.toLocaleString()}</span>
                          <span className="text-slate-400">/เดือน</span>
                        </div>
                        {plan.yearlyPrice && (
                          <div>
                            <span className="text-lg text-slate-300">฿{plan.yearlyPrice.toLocaleString()}</span>
                            <span className="text-slate-400">/ปี</span>
                          </div>
                        )}
                        <Badge variant="outline" className="border-slate-600 text-slate-400">
                          <Users className="h-3 w-3 mr-1" />
                          {plan._count.subscriptions} สมาชิก
                        </Badge>
                      </div>

                      {/* Limits */}
                      <div className="flex flex-wrap gap-2">
                        {plan.limits.map((limit) => (
                          <Badge key={limit.feature} variant="outline" className="border-slate-600 text-slate-300 text-xs">
                            {FEATURE_OPTIONS.find((f) => f.key === limit.feature)?.label || limit.feature}:{" "}
                            {limit.limit === -1 ? "∞" : limit.limit}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleActive(plan)}
                        className="text-slate-400 hover:text-white"
                      >
                        {plan.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEdit(plan)}
                        className="text-slate-400 hover:text-white"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(plan.id)}
                        className="text-slate-400 hover:text-red-400"
                        disabled={plan._count.subscriptions > 0}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {plans.length === 0 && (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-12 text-center">
                  <Package className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                  <p className="text-slate-400">ยังไม่มี Package กดปุ่มด้านบนเพื่อสร้าง</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Edit Form */}
          {(editingPlan || isCreating) && (
            <div className="lg:col-span-1">
              <Card className="bg-slate-800 border-slate-700 sticky top-24">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    {isCreating ? <Plus className="h-5 w-5" /> : <Edit className="h-5 w-5" />}
                    {isCreating ? "สร้าง Package ใหม่" : "แก้ไข Package"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-slate-300">ชื่อ (ภาษาอังกฤษ)</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                      placeholder="PRO"
                      className="bg-slate-900 border-slate-600 text-white"
                      disabled={!isCreating}
                    />
                  </div>

                  <div>
                    <Label className="text-slate-300">ชื่อแสดง (ภาษาไทย)</Label>
                    <Input
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      placeholder="โปร"
                      className="bg-slate-900 border-slate-600 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-300">คำอธิบาย</Label>
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="สำหรับผู้ใช้งานจริงจัง"
                      className="bg-slate-900 border-slate-600 text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-300">ราคา/เดือน (บาท)</Label>
                      <Input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                        className="bg-slate-900 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">ราคา/ปี (บาท)</Label>
                      <Input
                        type="number"
                        value={formData.yearlyPrice}
                        onChange={(e) => setFormData({ ...formData, yearlyPrice: Number(e.target.value) })}
                        className="bg-slate-900 border-slate-600 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-slate-300 mb-2 block">Limits (-1 = ไม่จำกัด)</Label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {FEATURE_OPTIONS.map((feature) => (
                        <div key={feature.key} className="flex items-center justify-between gap-2">
                          <span className="text-sm text-slate-400">{feature.label}</span>
                          <Input
                            type="number"
                            value={formData.limits[feature.key] || 0}
                            onChange={(e) => setFormData({
                              ...formData,
                              limits: { ...formData.limits, [feature.key]: Number(e.target.value) },
                            })}
                            className="w-24 bg-slate-900 border-slate-600 text-white text-right"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={cancelEdit} variant="outline" className="flex-1 border-slate-600 text-slate-300">
                      <X className="h-4 w-4 mr-2" />
                      ยกเลิก
                    </Button>
                    <Button onClick={handleSave} disabled={saving} className="flex-1 bg-purple-600 hover:bg-purple-700">
                      {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      บันทึก
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
