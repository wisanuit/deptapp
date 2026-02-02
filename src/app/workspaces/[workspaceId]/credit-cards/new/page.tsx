"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import {
  ArrowLeft,
  CreditCard,
  Save,
  X,
  Calendar,
  Percent,
  Wallet,
  Building2,
  Hash,
  Info,
} from "lucide-react";

// Bank options for card issuer
const BANK_OPTIONS = [
  { value: "kbank", label: "กสิกรไทย (KBank)", color: "bg-green-500" },
  { value: "scb", label: "ไทยพาณิชย์ (SCB)", color: "bg-purple-600" },
  { value: "bbl", label: "กรุงเทพ (BBL)", color: "bg-blue-700" },
  { value: "ktb", label: "กรุงไทย (KTB)", color: "bg-sky-500" },
  { value: "bay", label: "กรุงศรี (BAY)", color: "bg-yellow-500" },
  { value: "tmb", label: "ทหารไทยธนชาต (TTB)", color: "bg-orange-500" },
  { value: "uob", label: "UOB", color: "bg-blue-500" },
  { value: "citi", label: "Citibank", color: "bg-blue-600" },
  { value: "other", label: "อื่นๆ", color: "bg-gray-500" },
];

export default function NewCreditCardPage() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const workspaceId = params.workspaceId as string;

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    cardNumber: "",
    creditLimit: "",
    statementCutDay: "25",
    paymentDueDays: "10",
    minPaymentPercent: "5",
    interestRate: "1.5",
    bank: "",
    note: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/credit-cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          cardNumber: formData.cardNumber || undefined,
          creditLimit: parseFloat(formData.creditLimit),
          statementCutDay: parseInt(formData.statementCutDay),
          paymentDueDays: parseInt(formData.paymentDueDays),
          minPaymentPercent: parseFloat(formData.minPaymentPercent) / 100,
          interestRate: parseFloat(formData.interestRate) / 100,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "เกิดข้อผิดพลาด");
      }

      toast.success("เพิ่มบัตรเครดิตสำเร็จ");
      router.push(`/workspaces/${workspaceId}/credit-cards`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return "฿0";
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
    }).format(num);
  };

  const selectedBank = BANK_OPTIONS.find((b) => b.value === formData.bank);

  // Calculate minimum payment
  const minPayment =
    formData.creditLimit && formData.minPaymentPercent
      ? (parseFloat(formData.creditLimit) *
          parseFloat(formData.minPaymentPercent)) /
        100
      : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Facebook-style Header */}
      <header className="bg-card sticky top-0 z-50 shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <Link
                href={`/workspaces/${workspaceId}/credit-cards`}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-purple-600" />
                <h1 className="text-lg font-semibold">เพิ่มบัตรเครดิต</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
                className="rounded-full gap-2"
              >
                <X className="h-4 w-4" />
                ยกเลิก
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || !formData.name || !formData.creditLimit}
                className="rounded-full gap-2 bg-purple-600 hover:bg-purple-700"
              >
                <Save className="h-4 w-4" />
                {loading ? "กำลังบันทึก..." : "เพิ่มบัตร"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit}>
              {/* Card Info */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-purple-600" />
                    ข้อมูลบัตร
                    <span className="text-red-500">*</span>
                  </h3>

                  <div className="space-y-4">
                    {/* Bank Selection */}
                    <div className="space-y-2">
                      <Label>ธนาคารผู้ออกบัตร</Label>
                      <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                        {BANK_OPTIONS.map((bank) => (
                          <button
                            key={bank.value}
                            type="button"
                            className={`p-3 rounded-xl border-2 transition-all text-center ${
                              formData.bank === bank.value
                                ? "border-purple-500 bg-purple-50 dark:bg-purple-950/30"
                                : "border-border hover:border-purple-300"
                            }`}
                            onClick={() =>
                              setFormData({ ...formData, bank: bank.value })
                            }
                          >
                            <div
                              className={`w-8 h-8 rounded-full ${bank.color} mx-auto mb-1`}
                            />
                            <p className="text-xs font-medium truncate">
                              {bank.label.split(" ")[0]}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Card Name */}
                    <div className="space-y-2">
                      <Label htmlFor="name">ชื่อบัตร *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="เช่น KBank Platinum, SCB M Card"
                        className="rounded-lg"
                        required
                      />
                    </div>

                    {/* Card Number */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cardNumber" className="flex items-center gap-2">
                          <Hash className="h-4 w-4" />
                          เลข 4 หลักสุดท้าย
                        </Label>
                        <Input
                          id="cardNumber"
                          maxLength={4}
                          value={formData.cardNumber}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              cardNumber: e.target.value.replace(/\D/g, ""),
                            })
                          }
                          placeholder="1234"
                          className="rounded-lg text-center text-xl tracking-widest"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="creditLimit" className="flex items-center gap-2">
                          <Wallet className="h-4 w-4" />
                          วงเงิน (บาท) *
                        </Label>
                        <div className="relative">
                          <Input
                            id="creditLimit"
                            type="number"
                            min="0"
                            value={formData.creditLimit}
                            onChange={(e) =>
                              setFormData({ ...formData, creditLimit: e.target.value })
                            }
                            placeholder="100000"
                            className="rounded-lg pl-8"
                            required
                          />
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            ฿
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Statement Cycle */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-purple-600" />
                    รอบบัตร
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="statementCutDay">วันตัดรอบ (1-31) *</Label>
                      <div className="relative">
                        <Input
                          id="statementCutDay"
                          type="number"
                          min="1"
                          max="31"
                          value={formData.statementCutDay}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              statementCutDay: e.target.value,
                            })
                          }
                          className="rounded-lg text-center text-xl"
                          required
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                          ของเดือน
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        วันที่สรุปยอดใช้จ่ายในแต่ละรอบ
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="paymentDueDays">ระยะชำระ (วัน) *</Label>
                      <div className="relative">
                        <Input
                          id="paymentDueDays"
                          type="number"
                          min="1"
                          max="60"
                          value={formData.paymentDueDays}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              paymentDueDays: e.target.value,
                            })
                          }
                          className="rounded-lg text-center text-xl"
                          required
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                          วัน
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        จำนวนวันหลังตัดรอบที่ต้องชำระ
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Interest & Min Payment */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Percent className="h-5 w-5 text-purple-600" />
                    อัตราดอกเบี้ยและการชำระขั้นต่ำ
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="interestRate">ดอกเบี้ย/เดือน (%) *</Label>
                      <div className="relative">
                        <Input
                          id="interestRate"
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={formData.interestRate}
                          onChange={(e) =>
                            setFormData({ ...formData, interestRate: e.target.value })
                          }
                          className="rounded-lg text-center text-xl"
                          required
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          %
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        ปกติ 1.25% - 1.5% ต่อเดือน
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="minPaymentPercent">ชำระขั้นต่ำ (%) *</Label>
                      <div className="relative">
                        <Input
                          id="minPaymentPercent"
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={formData.minPaymentPercent}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              minPaymentPercent: e.target.value,
                            })
                          }
                          className="rounded-lg text-center text-xl"
                          required
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          %
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        ปกติ 5% - 10% ของยอดคงค้าง
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Note */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Info className="h-5 w-5 text-purple-600" />
                    หมายเหตุ
                  </h3>

                  <Textarea
                    value={formData.note}
                    onChange={(e) =>
                      setFormData({ ...formData, note: e.target.value })
                    }
                    placeholder="หมายเหตุเพิ่มเติม เช่น สิทธิพิเศษ, โปรโมชั่น..."
                    className="rounded-lg"
                    rows={3}
                  />
                </CardContent>
              </Card>

              {/* Mobile Submit Button */}
              <div className="lg:hidden flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                  className="flex-1 h-12 rounded-xl gap-2"
                >
                  <X className="h-4 w-4" />
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !formData.name || !formData.creditLimit}
                  className="flex-1 h-12 rounded-xl gap-2 bg-purple-600 hover:bg-purple-700"
                >
                  <Save className="h-4 w-4" />
                  {loading ? "กำลังบันทึก..." : "เพิ่มบัตร"}
                </Button>
              </div>
            </form>
          </div>

          {/* Right Column - Preview Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              {/* Credit Card Preview */}
              <Card className="mb-6 overflow-hidden">
                <div
                  className={`p-6 text-white ${
                    selectedBank?.color || "bg-gradient-to-br from-gray-700 to-gray-900"
                  }`}
                >
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <p className="text-white/70 text-sm">
                        {selectedBank?.label || "Credit Card"}
                      </p>
                      <p className="font-semibold text-lg">
                        {formData.name || "ชื่อบัตร"}
                      </p>
                    </div>
                    <CreditCard className="h-8 w-8 text-white/50" />
                  </div>

                  <div className="mb-6">
                    <p className="text-2xl tracking-widest font-mono">
                      •••• •••• ••••{" "}
                      {formData.cardNumber ? formData.cardNumber : "••••"}
                    </p>
                  </div>

                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-white/70 text-xs">วงเงิน</p>
                      <p className="font-semibold">
                        {formData.creditLimit
                          ? formatCurrency(formData.creditLimit)
                          : "฿0"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/70 text-xs">ตัดรอบ</p>
                      <p className="font-semibold">
                        วันที่ {formData.statementCutDay || "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Summary */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Info className="h-5 w-5 text-purple-600" />
                    สรุปข้อมูลบัตร
                  </h3>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">วงเงิน</span>
                      <span className="font-medium">
                        {formData.creditLimit
                          ? formatCurrency(formData.creditLimit)
                          : "-"}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">วันตัดรอบ</span>
                      <span className="font-medium">
                        วันที่ {formData.statementCutDay} ของเดือน
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">วันครบกำหนด</span>
                      <span className="font-medium">
                        +{formData.paymentDueDays} วันหลังตัดรอบ
                      </span>
                    </div>

                    <div className="h-px bg-border my-2" />

                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">ดอกเบี้ย/เดือน</span>
                      <span className="font-medium text-orange-600">
                        {formData.interestRate}%
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">ดอกเบี้ย/ปี</span>
                      <span className="font-medium text-orange-600">
                        {(parseFloat(formData.interestRate || "0") * 12).toFixed(2)}%
                      </span>
                    </div>

                    <div className="h-px bg-border my-2" />

                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">ชำระขั้นต่ำ</span>
                      <span className="font-medium">
                        {formData.minPaymentPercent}% ของยอด
                      </span>
                    </div>

                    {minPayment > 0 && (
                      <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl">
                        <p className="text-xs text-muted-foreground mb-1">
                          ถ้าใช้วงเงินเต็ม ขั้นต่ำ
                        </p>
                        <p className="text-xl font-bold text-purple-600">
                          {formatCurrency(minPayment.toString())}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
