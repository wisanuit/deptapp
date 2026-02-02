"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ErrorAlert } from "@/components/ui/alert";
import { useToast } from "@/components/ui/toast";
import {
  ArrowLeft,
  Percent,
  Calendar,
  Clock,
  TrendingUp,
  Info,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
  Scale,
  Calculator,
  Trash2,
  FileText,
} from "lucide-react";

// อัตราดอกเบี้ยสูงสุดตามกฎหมาย
const LEGAL_LIMITS = {
  PERSONAL_YEARLY: 15,      // 15% ต่อปี
  PERSONAL_MONTHLY: 1.25,   // 1.25% ต่อเดือน
  PERSONAL_DAILY: 0.041,    // 0.041% ต่อวัน
};

interface InterestPolicy {
  id: string;
  name: string;
  mode: string;
  monthlyRate: number | null;
  dailyRate: number | null;
  anchorDay: number | null;
  graceDays: number | null;
  _count?: { loans: number };
}

export default function EditInterestPolicyPage() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const workspaceId = params.workspaceId as string;
  const policyId = params.policyId as string;

  const [policy, setPolicy] = useState<InterestPolicy | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    mode: "MONTHLY",
    monthlyRate: "",
    dailyRate: "",
    anchorDay: "1",
    graceDays: "0",
  });

  // ตรวจสอบอัตราดอกเบี้ยตามกฎหมาย
  const legalCheck = useMemo(() => {
    const rate = formData.mode === "MONTHLY" 
      ? parseFloat(formData.monthlyRate) || 0
      : parseFloat(formData.dailyRate) || 0;
    
    const limit = formData.mode === "MONTHLY" 
      ? LEGAL_LIMITS.PERSONAL_MONTHLY 
      : LEGAL_LIMITS.PERSONAL_DAILY;
    
    const yearlyRate = formData.mode === "MONTHLY" 
      ? rate * 12 
      : rate * 365;

    const isLegal = yearlyRate <= LEGAL_LIMITS.PERSONAL_YEARLY;
    
    return { rate, limit, yearlyRate, isLegal };
  }, [formData.mode, formData.monthlyRate, formData.dailyRate]);

  const fetchPolicy = useCallback(async () => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/interest-policies`);
      if (!res.ok) throw new Error("ไม่สามารถโหลดข้อมูลได้");
      const policies = await res.json();
      const found = policies.find((p: InterestPolicy) => p.id === policyId);
      
      if (!found) {
        throw new Error("ไม่พบนโยบายดอกเบี้ย");
      }

      setPolicy(found);
      setFormData({
        name: found.name || "",
        mode: found.mode || "MONTHLY",
        monthlyRate: found.monthlyRate ? (found.monthlyRate * 100).toString() : "",
        dailyRate: found.dailyRate ? (found.dailyRate * 100).toString() : "",
        anchorDay: found.anchorDay?.toString() || "1",
        graceDays: found.graceDays?.toString() || "0",
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPageLoading(false);
    }
  }, [workspaceId, policyId]);

  useEffect(() => {
    fetchPolicy();
  }, [fetchPolicy]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const body: any = {
        name: formData.name,
        mode: formData.mode,
        graceDays: parseInt(formData.graceDays) || 0,
      };

      if (formData.mode === "MONTHLY") {
        body.monthlyRate = parseFloat(formData.monthlyRate) / 100;
        body.anchorDay = parseInt(formData.anchorDay);
        body.dailyRate = null;
      } else {
        body.dailyRate = parseFloat(formData.dailyRate) / 100;
        body.monthlyRate = null;
        body.anchorDay = null;
      }

      const res = await fetch(`/api/workspaces/${workspaceId}/interest-policies/${policyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "เกิดข้อผิดพลาด");
      }

      toast.success("บันทึกนโยบายสำเร็จ");
      router.push(`/workspaces/${workspaceId}/interest-policies`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (policy?._count?.loans && policy._count.loans > 0) {
      toast.warning("ไม่สามารถลบได้ เนื่องจากมีสัญญาเงินกู้ใช้งานนโยบายนี้อยู่");
      return;
    }

    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบนโยบายดอกเบี้ยนี้?")) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/interest-policies/${policyId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "เกิดข้อผิดพลาด");
      }

      toast.success("ลบนโยบายสำเร็จ");
      router.push(`/workspaces/${workspaceId}/interest-policies`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  // คำนวณตัวอย่างดอกเบี้ย
  const examplePrincipal = 10000;
  const calculateExampleInterest = () => {
    if (formData.mode === "MONTHLY") {
      const rate = parseFloat(formData.monthlyRate) || 0;
      return (examplePrincipal * rate) / 100;
    } else {
      const rate = parseFloat(formData.dailyRate) || 0;
      return (examplePrincipal * rate * 30) / 100;
    }
  };

  const exampleInterest = calculateExampleInterest();
  const isFormValid = formData.name.trim() && 
    ((formData.mode === "MONTHLY" && formData.monthlyRate) || 
     (formData.mode === "DAILY" && formData.dailyRate));

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <p className="text-destructive font-medium">{error || "ไม่พบนโยบายดอกเบี้ย"}</p>
            <Button
              className="mt-4"
              onClick={() => router.push(`/workspaces/${workspaceId}/interest-policies`)}
            >
              กลับ
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Facebook-style Header */}
      <header className="bg-card sticky top-0 z-50 shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <Link 
                href={`/workspaces/${workspaceId}/interest-policies`}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  formData.mode === "MONTHLY" 
                    ? "bg-gradient-to-br from-green-500 to-emerald-600" 
                    : "bg-gradient-to-br from-purple-500 to-purple-600"
                }`}>
                  <Percent className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold">แก้ไขนโยบายดอกเบี้ย</h1>
                </div>
              </div>
            </div>
            <Badge variant={policy.mode === "MONTHLY" ? "default" : "secondary"}>
              {policy.mode === "MONTHLY" ? "รายเดือน" : "รายวัน"}
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Legal Information Banner */}
        <Card className="mb-6 border-amber-200 bg-amber-50/50 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Scale className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                  <span>กฎหมายเกี่ยวกับดอกเบี้ยในประเทศไทย</span>
                </h3>
                <div className="text-sm text-amber-700 space-y-1">
                  <p><strong>พ.ร.บ. ห้ามเรียกดอกเบี้ยเกินอัตรา พ.ศ. 2560:</strong></p>
                  <ul className="list-disc list-inside ml-2 space-y-0.5">
                    <li>บุคคลธรรมดา: สูงสุด <strong>15% ต่อปี</strong> (1.25% ต่อเดือน)</li>
                    <li>หากเกินถือว่าผิดกฎหมาย ดอกเบี้ยเป็นโมฆะทั้งหมด</li>
                  </ul>
                  <p className="mt-2 text-xs text-amber-600">
                    ⚠️ หมายเหตุ: ระบบนี้ใช้สำหรับบันทึกข้อมูลเท่านั้น ผู้ใช้ต้องรับผิดชอบในการตั้งอัตราดอกเบี้ยที่ถูกต้องตามกฎหมาย
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calculation Formula Info */}
        <Card className="mb-6 border-blue-200 bg-blue-50/50 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Calculator className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-800 mb-2">สูตรการคำนวณดอกเบี้ย</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-700">
                  <div className="bg-white/60 rounded-lg p-3">
                    <p className="font-medium mb-1">📅 รายเดือน (Monthly)</p>
                    <p className="text-xs font-mono bg-blue-100 px-2 py-1 rounded">
                      ดอกเบี้ย = เงินต้น × อัตรา/เดือน
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      ตัวอย่าง: 10,000 × 5% = 500 บาท/เดือน
                    </p>
                  </div>
                  <div className="bg-white/60 rounded-lg p-3">
                    <p className="font-medium mb-1">🕐 รายวัน (Daily)</p>
                    <p className="text-xs font-mono bg-blue-100 px-2 py-1 rounded">
                      ดอกเบี้ย = เงินต้น × อัตรา/วัน × วัน
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      ตัวอย่าง: 10,000 × 0.05% × 30 = 150 บาท
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Legal Warning if rate exceeds limit */}
              {legalCheck.rate > 0 && !legalCheck.isLegal && (
                <Card className="border-red-300 bg-red-50 overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-red-800 mb-1">⚠️ อัตราดอกเบี้ยเกินกฎหมาย!</h3>
                        <p className="text-sm text-red-700">
                          อัตราที่ตั้ง ({legalCheck.rate}%{formData.mode === "MONTHLY" ? "/เดือน" : "/วัน"}) 
                          คิดเป็น <strong>{legalCheck.yearlyRate.toFixed(2)}% ต่อปี</strong> ซึ่งเกินกว่าที่กฎหมายกำหนด (15% ต่อปี)
                        </p>
                        <p className="text-xs text-red-600 mt-1">
                          ตาม พ.ร.บ. ห้ามเรียกดอกเบี้ยเกินอัตรา พ.ศ. 2560 หากเกิน 15% ต่อปี ดอกเบี้ยทั้งหมดจะเป็นโมฆะ
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Legal OK notification */}
              {legalCheck.rate > 0 && legalCheck.isLegal && (
                <Card className="border-green-300 bg-green-50 overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-green-800 mb-1">✅ อัตราดอกเบี้ยอยู่ในกรอบกฎหมาย</h3>
                        <p className="text-sm text-green-700">
                          อัตราที่ตั้ง ({legalCheck.rate}%{formData.mode === "MONTHLY" ? "/เดือน" : "/วัน"}) 
                          คิดเป็น <strong>{legalCheck.yearlyRate.toFixed(2)}% ต่อปี</strong> ไม่เกินเกณฑ์ที่กฎหมายกำหนด (15% ต่อปี)
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Policy Name */}
              <Card className="overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-lg">ข้อมูลนโยบาย</h3>
                      <p className="text-green-100 text-sm">แก้ไขชื่อและประเภท</p>
                    </div>
                  </div>
                </div>
                <CardContent className="p-5 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2">
                      ชื่อนโยบาย <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="เช่น ดอกเบี้ย 1.5% ต่อเดือน"
                      className="h-12 text-base"
                      required
                    />
                  </div>

                  {/* Mode Selection - Visual Cards */}
                  <div className="space-y-3">
                    <Label>ประเภทการคำนวณ</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, mode: "MONTHLY" })}
                        className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                          formData.mode === "MONTHLY"
                            ? "border-green-500 bg-green-50"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                      >
                        {formData.mode === "MONTHLY" && (
                          <CheckCircle2 className="absolute top-2 right-2 h-5 w-5 text-green-600" />
                        )}
                        <div className={`w-10 h-10 rounded-xl mb-2 flex items-center justify-center ${
                          formData.mode === "MONTHLY" 
                            ? "bg-green-100" 
                            : "bg-gray-100"
                        }`}>
                          <Calendar className={`h-5 w-5 ${
                            formData.mode === "MONTHLY" ? "text-green-600" : "text-gray-500"
                          }`} />
                        </div>
                        <p className={`font-semibold ${
                          formData.mode === "MONTHLY" ? "text-green-700" : "text-gray-700"
                        }`}>รายเดือน</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          คำนวณ % ต่อเดือน พร้อม prorate
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, mode: "DAILY" })}
                        className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                          formData.mode === "DAILY"
                            ? "border-purple-500 bg-purple-50"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                      >
                        {formData.mode === "DAILY" && (
                          <CheckCircle2 className="absolute top-2 right-2 h-5 w-5 text-purple-600" />
                        )}
                        <div className={`w-10 h-10 rounded-xl mb-2 flex items-center justify-center ${
                          formData.mode === "DAILY" 
                            ? "bg-purple-100" 
                            : "bg-gray-100"
                        }`}>
                          <Clock className={`h-5 w-5 ${
                            formData.mode === "DAILY" ? "text-purple-600" : "text-gray-500"
                          }`} />
                        </div>
                        <p className={`font-semibold ${
                          formData.mode === "DAILY" ? "text-purple-700" : "text-gray-700"
                        }`}>รายวัน</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          คำนวณ % ต่อวัน แม่นยำสูง
                        </p>
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Interest Rate */}
              <Card className="overflow-hidden">
                <div className={`px-5 py-4 ${
                  formData.mode === "MONTHLY" 
                    ? "bg-gradient-to-r from-green-600 to-emerald-600" 
                    : "bg-gradient-to-r from-purple-600 to-purple-700"
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-lg">อัตราดอกเบี้ย</h3>
                      <p className="text-white/80 text-sm">
                        {formData.mode === "MONTHLY" ? "กำหนดอัตราต่อเดือน" : "กำหนดอัตราต่อวัน"}
                      </p>
                    </div>
                  </div>
                </div>
                <CardContent className="p-5 space-y-4">
                  {formData.mode === "MONTHLY" ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="monthlyRate" className="flex items-center gap-2">
                          อัตราดอกเบี้ย (%/เดือน) <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="monthlyRate"
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={formData.monthlyRate}
                            onChange={(e) => setFormData({ ...formData, monthlyRate: e.target.value })}
                            placeholder="1.5"
                            className="h-12 text-xl font-semibold pr-16"
                            required
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                            % / เดือน
                          </span>
                        </div>
                        {/* Quick Select Rates */}
                        <div className="flex flex-wrap gap-2 pt-2">
                          {[0.5, 1, 1.5, 2, 3, 5].map((rate) => (
                            <button
                              key={rate}
                              type="button"
                              onClick={() => setFormData({ ...formData, monthlyRate: rate.toString() })}
                              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                                formData.monthlyRate === rate.toString()
                                  ? "bg-green-100 border-green-500 text-green-700"
                                  : "border-gray-200 hover:border-green-300 text-gray-600"
                              }`}
                            >
                              {rate}%
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="anchorDay" className="flex items-center gap-2">
                          วันครบรอบ (Anchor Day) <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="anchorDay"
                            type="number"
                            min="1"
                            max="31"
                            value={formData.anchorDay}
                            onChange={(e) => setFormData({ ...formData, anchorDay: e.target.value })}
                            className="h-12 text-lg pr-20"
                            required
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                            ของเดือน
                          </span>
                        </div>
                        {/* Quick Select Days */}
                        <div className="flex flex-wrap gap-2 pt-2">
                          {[1, 5, 10, 15, 25, 28].map((day) => (
                            <button
                              key={day}
                              type="button"
                              onClick={() => setFormData({ ...formData, anchorDay: day.toString() })}
                              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                                formData.anchorDay === day.toString()
                                  ? "bg-green-100 border-green-500 text-green-700"
                                  : "border-gray-200 hover:border-green-300 text-gray-600"
                              }`}
                            >
                              วันที่ {day}
                            </button>
                          ))}
                        </div>
                        <div className="flex items-start gap-2 mt-2 p-3 bg-blue-50 rounded-lg">
                          <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-blue-700">
                            วันที่ใช้เป็นจุดเริ่มต้นคำนวณดอกเบี้ยแต่ละเดือน หากไม่ครบเดือนจะคำนวณแบบ prorate ตามจำนวนวันจริง
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="dailyRate" className="flex items-center gap-2">
                        อัตราดอกเบี้ย (%/วัน) <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="dailyRate"
                          type="number"
                          min="0"
                          max="100"
                          step="0.001"
                          value={formData.dailyRate}
                          onChange={(e) => setFormData({ ...formData, dailyRate: e.target.value })}
                          placeholder="0.05"
                          className="h-12 text-xl font-semibold pr-16"
                          required
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                          % / วัน
                        </span>
                      </div>
                      {/* Quick Select Rates */}
                      <div className="flex flex-wrap gap-2 pt-2">
                        {[0.03, 0.05, 0.1, 0.15, 0.2].map((rate) => (
                          <button
                            key={rate}
                            type="button"
                            onClick={() => setFormData({ ...formData, dailyRate: rate.toString() })}
                            className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                              formData.dailyRate === rate.toString()
                                ? "bg-purple-100 border-purple-500 text-purple-700"
                                : "border-gray-200 hover:border-purple-300 text-gray-600"
                            }`}
                          >
                            {rate}%
                          </button>
                        ))}
                      </div>
                      <div className="flex items-start gap-2 mt-2 p-3 bg-purple-50 rounded-lg">
                        <Info className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-purple-700">
                          คำนวณดอกเบี้ยทุกวัน เหมาะสำหรับสัญญาระยะสั้นหรือต้องการความแม่นยำสูง
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Grace Period */}
              <Card className="overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-lg">วันผ่อนผัน</h3>
                      <p className="text-orange-100 text-sm">ระยะเวลาไม่คิดดอกเบี้ย (ไม่บังคับ)</p>
                    </div>
                  </div>
                </div>
                <CardContent className="p-5">
                  <div className="space-y-2">
                    <Label htmlFor="graceDays">จำนวนวันผ่อนผัน</Label>
                    <div className="relative">
                      <Input
                        id="graceDays"
                        type="number"
                        min="0"
                        value={formData.graceDays}
                        onChange={(e) => setFormData({ ...formData, graceDays: e.target.value })}
                        className="h-12 text-lg pr-12"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                        วัน
                      </span>
                    </div>
                    {/* Quick Select Days */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {[0, 3, 5, 7, 14, 30].map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => setFormData({ ...formData, graceDays: day.toString() })}
                          className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                            formData.graceDays === day.toString()
                              ? "bg-orange-100 border-orange-500 text-orange-700"
                              : "border-gray-200 hover:border-orange-300 text-gray-600"
                          }`}
                        >
                          {day === 0 ? "ไม่มี" : `${day} วัน`}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Usage Info */}
              <Card className="overflow-hidden border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-blue-800">การใช้งาน</p>
                      <p className="text-sm text-blue-700">
                        นโยบายนี้ถูกใช้งานใน{" "}
                        <span className="font-bold">{policy._count?.loans || 0}</span>{" "}
                        สัญญาเงินกู้
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="overflow-hidden border-red-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                        <Trash2 className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium text-red-800">ลบนโยบาย</p>
                        <p className="text-sm text-red-600">
                          {policy._count?.loans && policy._count.loans > 0
                            ? "ไม่สามารถลบ - มีสัญญาเงินกู้ใช้งานอยู่"
                            : "การลบจะไม่สามารถกู้คืนได้"}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleDelete}
                      disabled={saving || deleting || Boolean(policy._count?.loans && policy._count.loans > 0)}
                      className="rounded-full"
                    >
                      {deleting ? "กำลังลบ..." : "ลบ"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {error && (
                <ErrorAlert message={error} onClose={() => setError("")} />
              )}
            </div>

            {/* Right Column - Preview & Summary */}
            <div className="lg:col-span-1 space-y-6">
              {/* Preview Card */}
              <Card className="sticky top-20 overflow-hidden">
                <div className={`p-5 ${
                  formData.mode === "MONTHLY"
                    ? "bg-gradient-to-br from-green-500 to-emerald-600"
                    : "bg-gradient-to-br from-purple-500 to-purple-600"
                }`}>
                  <div className="text-center text-white">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-3">
                      <Percent className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-bold mb-1">
                      {formData.name || "ชื่อนโยบาย"}
                    </h3>
                    <p className="text-white/80 text-sm">
                      {formData.mode === "MONTHLY" ? "คำนวณแบบรายเดือน" : "คำนวณแบบรายวัน"}
                    </p>
                  </div>
                </div>
                <CardContent className="p-5 space-y-4">
                  {/* Rate Display */}
                  <div className="text-center py-4 border-b">
                    <p className={`text-4xl font-bold ${
                      formData.mode === "MONTHLY" ? "text-green-600" : "text-purple-600"
                    }`}>
                      {formData.mode === "MONTHLY" 
                        ? (formData.monthlyRate || "0") 
                        : (formData.dailyRate || "0")}%
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formData.mode === "MONTHLY" ? "ต่อเดือน" : "ต่อวัน"}
                    </p>
                    {legalCheck.rate > 0 && (
                      <p className={`text-xs mt-2 ${legalCheck.isLegal ? "text-green-600" : "text-red-600"}`}>
                        ≈ {legalCheck.yearlyRate.toFixed(2)}% ต่อปี
                        {!legalCheck.isLegal && " (เกินกฎหมาย!)"}
                      </p>
                    )}
                  </div>

                  {/* Summary */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-muted-foreground">ประเภท</span>
                      <span className="font-medium">
                        {formData.mode === "MONTHLY" ? "รายเดือน" : "รายวัน"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-muted-foreground">อัตราต่อปี</span>
                      <span className={`font-medium ${legalCheck.isLegal ? "text-green-600" : "text-red-600"}`}>
                        {legalCheck.yearlyRate.toFixed(2)}%
                      </span>
                    </div>
                    {formData.mode === "MONTHLY" && (
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-muted-foreground">วันครบรอบ</span>
                        <span className="font-medium">วันที่ {formData.anchorDay}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-muted-foreground">วันผ่อนผัน</span>
                      <span className="font-medium">
                        {parseInt(formData.graceDays) > 0 ? `${formData.graceDays} วัน` : "ไม่มี"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-muted-foreground">สถานะกฎหมาย</span>
                      <span className={`font-medium flex items-center gap-1 ${legalCheck.isLegal ? "text-green-600" : "text-red-600"}`}>
                        {legalCheck.isLegal ? (
                          <><CheckCircle2 className="h-4 w-4" /> ถูกกฎหมาย</>
                        ) : (
                          <><AlertTriangle className="h-4 w-4" /> เกินกฎหมาย</>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Example Calculation */}
                  <div className="bg-muted/50 rounded-xl p-4 mt-4">
                    <p className="text-xs text-muted-foreground mb-2">ตัวอย่างการคำนวณ</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>เงินต้น</span>
                        <span>฿{examplePrincipal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>ดอกเบี้ย{formData.mode === "MONTHLY" ? "/เดือน" : "/30วัน"}</span>
                        <span className={formData.mode === "MONTHLY" ? "text-green-600" : "text-purple-600"}>
                          +฿{exampleInterest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm border-t pt-1 mt-1">
                        <span>ดอกเบี้ย/ปี (โดยประมาณ)</span>
                        <span className="text-muted-foreground">
                          ฿{(exampleInterest * (formData.mode === "MONTHLY" ? 12 : 365/30)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button 
                    type="submit" 
                    className={`w-full h-12 rounded-xl text-base font-medium ${
                      formData.mode === "MONTHLY"
                        ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                        : "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                    }`}
                    disabled={saving || !isFormValid}
                  >
                    {saving ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        กำลังบันทึก...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5" />
                        บันทึกการแก้ไข
                      </span>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-xl"
                    onClick={() => router.back()}
                    disabled={saving}
                  >
                    ยกเลิก
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
