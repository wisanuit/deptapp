"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorAlert } from "@/components/ui/alert";
import {
  ArrowLeft,
  Percent,
  Calendar,
  Clock,
  TrendingUp,
  Info,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export default function NewInterestPolicyPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    mode: "MONTHLY",
    monthlyRate: "",
    dailyRate: "",
    anchorDay: "1",
    graceDays: "0",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
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
      } else {
        body.dailyRate = parseFloat(formData.dailyRate) / 100;
      }

      const res = await fetch(`/api/workspaces/${workspaceId}/interest-policies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "เกิดข้อผิดพลาด");
      }

      router.push(`/workspaces/${workspaceId}/interest-policies`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <Percent className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold">สร้างนโยบายดอกเบี้ย</h1>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-5xl">
        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Policy Name */}
              <Card className="overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-lg">ข้อมูลนโยบาย</h3>
                      <p className="text-green-100 text-sm">ตั้งชื่อและเลือกประเภท</p>
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
                  </div>

                  {/* Summary */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-muted-foreground">ประเภท</span>
                      <span className="font-medium">
                        {formData.mode === "MONTHLY" ? "รายเดือน" : "รายวัน"}
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
                    disabled={loading || !isFormValid}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        กำลังบันทึก...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5" />
                        สร้างนโยบาย
                      </span>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-xl"
                    onClick={() => router.back()}
                    disabled={loading}
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
