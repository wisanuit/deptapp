"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Upload,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  CreditCard,
  Copy,
  Check,
  QrCode,
} from "lucide-react";
import { QRCodeSVG } from 'qrcode.react';

interface PaymentPageProps {
  paymentRequest: {
    id: string;
    amount: number;
    currency: string;
    promptPayId: string;
    promptPayName: string;
    bankName?: string;
    expiresAt: string;
    status: string;
    slipImage?: string;
  };
  invoice: {
    id: string;
    invoiceNumber: string;
    dueDate: string;
    description: string;
  };
  plan: {
    id: string;
    name: string;
    displayName: string;
  };
  billingCycle: string;
}

export default function PaymentPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [payment, setPayment] = useState<PaymentPageProps | null>(null);
  const [autoVerify, setAutoVerify] = useState(false); // มี SlipOK หรือไม่
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{
    success: boolean;
    message: string;
    autoVerified?: boolean;
  } | null>(null);

  useEffect(() => {
    fetchPayment();
  }, []);

  const fetchPayment = async () => {
    try {
      const res = await fetch("/api/subscription/payment");
      const data = await res.json();
      
      if (data.paymentRequest) {
        setPayment({
          paymentRequest: data.paymentRequest,
          invoice: data.invoice,
          plan: { id: "", name: "", displayName: "" },
          billingCycle: "MONTHLY",
        });
        setAutoVerify(data.autoVerify || false);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !payment) return;

    // Check file type
    if (!file.type.startsWith("image/")) {
      setError("กรุณาเลือกไฟล์รูปภาพ");
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("ไฟล์ใหญ่เกินไป (สูงสุด 5MB)");
      return;
    }

    setUploading(true);
    setError("");
    setVerifyResult(null);

    try {
      // Convert to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Upload and verify
      const res = await fetch("/api/subscription/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentRequestId: payment.paymentRequest.id,
          slipImage: base64,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setVerifyResult({
          success: true,
          message: data.message,
          autoVerified: data.autoVerified,
        });

        // ถ้าอนุมัติอัตโนมัติ redirect ไปหน้า subscription
        if (data.autoVerified) {
          setTimeout(() => {
            router.push("/subscription");
          }, 3000);
        }
      } else {
        setVerifyResult({
          success: false,
          message: data.message || "ไม่สามารถตรวจสอบสลิปได้",
          autoVerified: false,
        });
      }
    } catch (error) {
      setError("เกิดข้อผิดพลาดในการอัปโหลด");
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = async (text: string, type: "id" | "amount") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "id") {
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2000);
      } else {
        setCopiedAmount(true);
        setTimeout(() => setCopiedAmount(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Generate PromptPay payload for QR
  const generatePromptPayPayload = (id: string, amount: number) => {
    // This is a simplified version - for production use promptpay-qr library
    const cleanId = id.replace(/[-\s]/g, "");
    const amountStr = amount.toFixed(2);
    
    // Basic EMVCo QR format for PromptPay
    return `00020101021129370016A000000677010111${cleanId.length === 13 ? '02' : '01'}${cleanId.length.toString().padStart(2, '0')}${cleanId}5802TH5303764${amount > 0 ? `54${amountStr.length.toString().padStart(2, '0')}${amountStr}` : ''}6304`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <Card className="bg-slate-800 border-slate-700 max-w-md w-full mx-4">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-white mb-2">ไม่พบรายการชำระเงิน</h2>
            <p className="text-sm text-slate-400 mb-4">
              คุณอาจยังไม่ได้สมัคร Package หรือการชำระเงินเสร็จสิ้นแล้ว
            </p>
            <Button onClick={() => router.push("/subscription")} className="w-full">
              ไปหน้า Subscription
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { paymentRequest, invoice } = payment;
  const isExpired = new Date(paymentRequest.expiresAt) < new Date();
  const isPending = paymentRequest.status === "PENDING";
  const isUploaded = paymentRequest.status === "UPLOADED" || paymentRequest.status === "VERIFYING";
  const isVerified = paymentRequest.status === "VERIFIED";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/subscription")} className="text-slate-300 hover:text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              กลับ
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">ชำระเงิน</h1>
                <p className="text-xs text-slate-400">Invoice: {invoice?.invoiceNumber}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto space-y-6">
          {/* Status Banner */}
          {isExpired && (
            <div className="p-4 rounded-lg bg-red-500/20 border border-red-500 flex items-center gap-3">
              <XCircle className="h-5 w-5 text-red-400" />
              <span className="text-sm text-red-200">คำขอชำระเงินหมดอายุแล้ว</span>
            </div>
          )}

          {isVerified && (
            <div className="p-4 rounded-lg bg-green-500/20 border border-green-500 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span className="text-sm text-green-200">ชำระเงินสำเร็จแล้ว!</span>
            </div>
          )}

          {verifyResult && (
            <div className={`p-4 rounded-lg flex items-start gap-3 ${
              verifyResult.success 
                ? "bg-green-500/20 border border-green-500" 
                : "bg-red-500/20 border border-red-500"
            }`}>
              {verifyResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-400 shrink-0" />
              ) : (
                <XCircle className="h-5 w-5 text-red-400 shrink-0" />
              )}
              <div>
                <p className={`text-sm ${verifyResult.success ? "text-green-200" : "text-red-200"}`}>
                  {verifyResult.message}
                </p>
                {verifyResult.autoVerified && (
                  <p className="text-xs text-green-300 mt-1">กำลังนำคุณไปหน้า Subscription...</p>
                )}
              </div>
            </div>
          )}

          {/* QR Code Card */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-white">สแกนเพื่อชำระเงิน</CardTitle>
              <CardDescription className="text-slate-400">
                {invoice?.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* QR Code */}
              <div className="bg-white p-4 rounded-lg mx-auto w-fit">
                <QRCodeSVG
                  value={generatePromptPayPayload(paymentRequest.promptPayId, paymentRequest.amount)}
                  size={200}
                  level="M"
                  includeMargin
                />
              </div>

              {/* PromptPay Info */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                  <div>
                    <p className="text-xs text-slate-400">PromptPay</p>
                    <p className="text-white font-mono">{paymentRequest.promptPayId}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(paymentRequest.promptPayId, "id")}
                    className="text-slate-400 hover:text-white"
                  >
                    {copiedId ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                  <div>
                    <p className="text-xs text-slate-400">ยอดชำระ</p>
                    <p className="text-2xl font-bold text-white">{formatAmount(paymentRequest.amount)}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(paymentRequest.amount.toString(), "amount")}
                    className="text-slate-400 hover:text-white"
                  >
                    {copiedAmount ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>

                <div className="p-3 bg-slate-700 rounded-lg">
                  <p className="text-xs text-slate-400">ชื่อบัญชี</p>
                  <p className="text-white">{paymentRequest.promptPayName}</p>
                  {paymentRequest.bankName && (
                    <p className="text-xs text-slate-400">{paymentRequest.bankName}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Clock className="h-3 w-3" />
                  <span>หมดอายุ: {formatDate(paymentRequest.expiresAt)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upload Slip */}
          {!isExpired && !isVerified && (
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  อัปโหลดสลิป
                </CardTitle>
                <CardDescription className="text-slate-400">
                  {autoVerify 
                    ? "หลังโอนเงินแล้ว กรุณาอัปโหลดสลิปเพื่อยืนยันอัตโนมัติ"
                    : "หลังโอนเงินแล้ว กรุณาอัปโหลดสลิป แล้วรอ Admin ตรวจสอบ"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {error && (
                  <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-200 text-sm">
                    {error}
                  </div>
                )}

                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || isExpired}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {autoVerify ? "กำลังตรวจสอบ..." : "กำลังอัปโหลด..."}
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      เลือกรูปสลิป
                    </>
                  )}
                </Button>

                {isUploaded && !verifyResult && (
                  <div className="mt-4 p-3 rounded-lg bg-amber-500/20 flex items-center gap-3">
                    <Clock className="h-4 w-4 text-amber-400" />
                    <span className="text-sm text-amber-200">
                      {autoVerify ? "รอการตรวจสอบอัตโนมัติ" : "รอผู้ดูแลระบบตรวจสอบสลิป"}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Help Text */}
          <p className="text-xs text-center text-slate-500">
            หากมีปัญหาในการชำระเงิน กรุณาติดต่อผู้ดูแลระบบ
          </p>
        </div>
      </main>
    </div>
  );
}
