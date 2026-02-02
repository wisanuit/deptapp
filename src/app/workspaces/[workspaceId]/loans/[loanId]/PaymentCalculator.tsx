"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { toThailandDateString } from "@/lib/utils";
import { Calculator, Calendar, TrendingUp, Wallet, ArrowRight, CheckCircle2, Copy, Mail, Share2 } from "lucide-react";

interface PaymentCalculatorProps {
  remainingPrincipal: number;
  accruedInterest: number;
  interestPolicy: {
    mode: string;
    monthlyRate: number | null;
    dailyRate: number | null;
    anchorDay: number | null;
    graceDays: number | null;
  } | null;
  lastPaymentDate: string | null;
  loanStartDate: string;
  borrowerName?: string;
  lenderName?: string;
}

// Helper: จำนวนวันในเดือน
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// Helper: จำนวนวันระหว่างสองวัน
function daysBetween(from: Date, to: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.max(0, Math.round((to.getTime() - from.getTime()) / oneDay));
}

// คำนวณดอกเบี้ยตาม mode
function calculateInterestToDate(
  principal: number,
  policy: PaymentCalculatorProps["interestPolicy"],
  fromDate: Date,
  toDate: Date
): number {
  if (!policy || principal <= 0) return 0;
  
  // ถ้าวันคำนวณ <= วันเริ่มนับ ไม่มีดอกเบี้ย
  if (toDate <= fromDate) return 0;
  
  const days = daysBetween(fromDate, toDate);
  if (days <= 0) return 0;
  
  // DAILY Mode: ง่ายๆ คือ principal × dailyRate × days
  if (policy.mode === "DAILY" && policy.dailyRate) {
    return principal * policy.dailyRate * days;
  }
  
  // MONTHLY Mode: คำนวณแบบ prorate ตามวันจริงของเดือน
  if (policy.mode === "MONTHLY" && policy.monthlyRate) {
    let totalInterest = 0;
    let currentDate = new Date(fromDate);
    
    while (currentDate < toDate) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const daysInThisMonth = getDaysInMonth(year, month);
      
      // คำนวณ daily rate จาก monthly rate
      const dailyRate = policy.monthlyRate / daysInThisMonth;
      
      // หาวันสุดท้ายของช่วงนี้ (วันสิ้นเดือน หรือ toDate ถ้าอยู่ในเดือนเดียวกัน)
      const endOfMonth = new Date(year, month + 1, 0); // วันสุดท้ายของเดือน
      endOfMonth.setHours(23, 59, 59, 999);
      
      const periodEnd = endOfMonth < toDate ? new Date(year, month + 1, 1) : toDate; // วันถัดไปหลังสิ้นเดือน หรือ toDate
      
      // นับจำนวนวันในช่วงนี้
      const daysInPeriod = daysBetween(currentDate, periodEnd);
      
      if (daysInPeriod > 0) {
        // ดอกเบี้ยช่วงนี้
        totalInterest += principal * dailyRate * daysInPeriod;
      }
      
      // ไปเดือนถัดไป
      currentDate = periodEnd;
    }
    
    return totalInterest;
  }
  
  return 0;
}

export function PaymentCalculator({
  remainingPrincipal,
  accruedInterest,
  interestPolicy,
  lastPaymentDate,
  loanStartDate,
  borrowerName = "",
  lenderName = "",
}: PaymentCalculatorProps) {
  const toast = useToast();
  // วันที่เริ่มนับดอกเบี้ย
  const interestStartDate = lastPaymentDate || loanStartDate;
  
  // Default วันที่ชำระ = วันนี้ (เวลาไทย GMT+7)
  const today = toThailandDateString();
  const [paymentDate, setPaymentDate] = useState(today);
  const [paymentAmount, setPaymentAmount] = useState("");

  // คำนวณดอกเบี้ยถึงวันที่เลือก
  const calculatedInterest = useMemo(() => {
    if (!interestPolicy) return accruedInterest;
    
    const fromDate = new Date(interestStartDate);
    const toDate = new Date(paymentDate);
    
    return calculateInterestToDate(remainingPrincipal, interestPolicy, fromDate, toDate);
  }, [paymentDate, remainingPrincipal, interestPolicy, interestStartDate, accruedInterest]);

  // ยอดรวมที่ต้องชำระ
  const totalDue = remainingPrincipal + calculatedInterest;

  // วิเคราะห์การจัดสรร
  const allocation = useMemo(() => {
    const amount = parseFloat(paymentAmount) || 0;
    
    // จ่ายดอกเบี้ยก่อน
    const interestPaid = Math.min(amount, calculatedInterest);
    const remainingAfterInterest = amount - interestPaid;
    
    // ที่เหลือจ่ายเงินต้น
    const principalPaid = Math.min(remainingAfterInterest, remainingPrincipal);
    
    // เงินต้นคงเหลือหลังชำระ
    const newRemainingPrincipal = remainingPrincipal - principalPaid;
    
    // ดอกเบี้ยค้างจ่าย
    const outstandingInterest = calculatedInterest - interestPaid;
    
    return {
      interestPaid,
      principalPaid,
      newRemainingPrincipal,
      outstandingInterest,
      isFullPayment: amount >= totalDue,
      isPrincipalClear: newRemainingPrincipal === 0,
    };
  }, [paymentAmount, calculatedInterest, remainingPrincipal, totalDue]);

  // Quick amount buttons
  const quickAmounts = [
    { label: "ดอกเบี้ย", value: calculatedInterest },
    { label: "ครึ่งหนึ่ง", value: totalDue / 2 },
    { label: "ทั้งหมด", value: totalDue },
  ];

  // สร้างข้อความสรุป
  const generateSummaryText = () => {
    const payAmount = parseFloat(paymentAmount) || 0;
    const formattedDate = new Date(paymentDate).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    let text = `📋 รายละเอียดการชำระเงิน\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    if (borrowerName) text += `👤 ลูกหนี้: ${borrowerName}\n`;
    if (lenderName) text += `🏦 เจ้าหนี้: ${lenderName}\n`;
    text += `📅 วันที่ชำระ: ${formattedDate}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `💰 เงินต้นคงเหลือ: ฿${remainingPrincipal.toLocaleString("th-TH", { minimumFractionDigits: 2 })}\n`;
    text += `📈 ดอกเบี้ยถึงวันนี้: ฿${calculatedInterest.toLocaleString("th-TH", { minimumFractionDigits: 2 })}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `💵 ยอดรวมทั้งหมด: ฿${totalDue.toLocaleString("th-TH", { minimumFractionDigits: 2 })}\n`;

    if (payAmount > 0) {
      text += `\n💳 จำนวนที่ชำระ: ฿${payAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}\n`;
      text += `━━━━━━━━━━━━━━━━━━━━\n`;
      text += `📊 การจัดสรร (ดอกเบี้ยก่อน):\n`;
      text += `   • จ่ายดอกเบี้ย: ฿${allocation.interestPaid.toLocaleString("th-TH", { minimumFractionDigits: 2 })}\n`;
      text += `   • จ่ายเงินต้น: ฿${allocation.principalPaid.toLocaleString("th-TH", { minimumFractionDigits: 2 })}\n`;
      text += `━━━━━━━━━━━━━━━━━━━━\n`;
      text += `📌 หลังชำระ:\n`;
      text += `   • เงินต้นคงเหลือ: ฿${allocation.newRemainingPrincipal.toLocaleString("th-TH", { minimumFractionDigits: 2 })}\n`;
      if (allocation.outstandingInterest > 0) {
        text += `   • ดอกเบี้ยค้าง: ฿${allocation.outstandingInterest.toLocaleString("th-TH", { minimumFractionDigits: 2 })}\n`;
      }
      if (allocation.isFullPayment) {
        text += `\n✅ ชำระครบถ้วน!\n`;
      }
    }

    return text;
  };

  // คัดลอกไปยัง clipboard
  const handleCopy = async () => {
    try {
      const text = generateSummaryText();
      await navigator.clipboard.writeText(text);
      toast.success("คัดลอกรายละเอียดแล้ว");
    } catch {
      toast.error("ไม่สามารถคัดลอกได้");
    }
  };

  // ส่งอีเมล
  const handleEmail = () => {
    const subject = encodeURIComponent(`แจ้งยอดชำระเงิน - ${borrowerName || "ลูกหนี้"}`);
    const body = encodeURIComponent(generateSummaryText());
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };

  // แชร์ (ใช้ Web Share API ถ้ารองรับ)
  const handleShare = async () => {
    const text = generateSummaryText();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "รายละเอียดการชำระเงิน",
          text: text,
        });
      } catch {
        // User cancelled or error - fallback to copy
        handleCopy();
      }
    } else {
      // Fallback to copy
      handleCopy();
    }
  };

  return (
    <Card className="overflow-hidden border-primary/20">
      <CardHeader className="bg-gradient-to-r from-primary to-blue-600 text-white pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/20">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">คำนวณยอดชำระ</CardTitle>
            <p className="text-sm text-white/80">เลือกวันที่และจำนวนเงิน</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* วันที่ชำระ */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-primary" />
            วันที่ชำระ
          </Label>
          <Input
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            className="h-11"
            min={interestStartDate.split("T")[0]}
          />
          <p className="text-xs text-muted-foreground">
            นับดอกเบี้ยตั้งแต่: {new Date(interestStartDate).toLocaleDateString("th-TH", { 
              day: "numeric", month: "short", year: "numeric" 
            })}
          </p>
        </div>

        {/* ยอดดอกเบี้ยคำนวณ */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-amber-700 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              ดอกเบี้ยถึงวันที่เลือก
            </span>
            <Badge variant="secondary" className="bg-amber-100 text-amber-700">
              คำนวณอัตโนมัติ
            </Badge>
          </div>
          <p className="text-2xl font-bold text-amber-600">
            ฿{calculatedInterest.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* ยอดรวม */}
        <div className="bg-gradient-to-r from-primary/5 to-blue-50 rounded-xl p-4 border border-primary/20">
          <div className="grid grid-cols-2 gap-2 text-sm mb-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">เงินต้น:</span>
              <span className="font-medium">฿{remainingPrincipal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">ดอกเบี้ย:</span>
              <span className="font-medium text-amber-600">฿{calculatedInterest.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-primary/10">
            <span className="font-medium">ยอดรวมทั้งหมด:</span>
            <span className="text-xl font-bold text-primary">
              ฿{totalDue.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* จำนวนเงินที่จะชำระ */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm">
            <Wallet className="h-4 w-4 text-primary" />
            จำนวนเงินที่จะชำระ
          </Label>
          <Input
            type="number"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            placeholder="0.00"
            className="h-12 text-lg font-semibold"
            min="0"
            step="0.01"
          />
          {/* Quick amount buttons */}
          <div className="flex flex-wrap gap-2">
            {quickAmounts.map((qa) => (
              <button
                key={qa.label}
                type="button"
                onClick={() => setPaymentAmount(qa.value.toFixed(2))}
                className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                  parseFloat(paymentAmount) === qa.value
                    ? "bg-primary text-white border-primary"
                    : "border-gray-200 hover:border-primary/50 text-gray-600"
                }`}
              >
                {qa.label}: ฿{qa.value.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </button>
            ))}
          </div>
        </div>

        {/* การจัดสรรเงิน */}
        {parseFloat(paymentAmount) > 0 && (
          <div className="bg-muted/50 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ArrowRight className="h-4 w-4 text-primary" />
              การจัดสรรเงิน (ดอกเบี้ยก่อน)
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">จ่ายดอกเบี้ย:</span>
                <span className={allocation.interestPaid > 0 ? "font-medium text-amber-600" : "text-muted-foreground"}>
                  ฿{allocation.interestPaid.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">จ่ายเงินต้น:</span>
                <span className={allocation.principalPaid > 0 ? "font-medium text-primary" : "text-muted-foreground"}>
                  ฿{allocation.principalPaid.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                </span>
              </div>
              
              <div className="border-t pt-2 mt-2 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">เงินต้นคงเหลือ:</span>
                  <span className={allocation.isPrincipalClear ? "font-medium text-green-600" : "font-medium"}>
                    ฿{allocation.newRemainingPrincipal.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                    {allocation.isPrincipalClear && " ✓"}
                  </span>
                </div>
                {allocation.outstandingInterest > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">ดอกเบี้ยค้าง:</span>
                    <span className="font-medium text-red-600">
                      ฿{allocation.outstandingInterest.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {allocation.isFullPayment && (
              <div className="bg-green-100 text-green-700 rounded-lg p-3 flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">ชำระครบถ้วน! สามารถปิดสัญญาได้</span>
              </div>
            )}
          </div>
        )}

        {/* Share/Copy/Email Buttons */}
        <div className="border-t pt-4 mt-2">
          <p className="text-xs text-muted-foreground mb-2">ส่งรายละเอียดให้ลูกหนี้:</p>
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-1.5 text-xs"
            >
              <Copy className="h-3.5 w-3.5" />
              คัดลอก
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleEmail}
              className="gap-1.5 text-xs"
            >
              <Mail className="h-3.5 w-3.5" />
              อีเมล
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="gap-1.5 text-xs"
            >
              <Share2 className="h-3.5 w-3.5" />
              แชร์
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
