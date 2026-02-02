"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Shield,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  FileCheck,
  Receipt,
  User,
  X,
} from "lucide-react";

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  slipImage: string | null;
  promptPayId: string;
  transRef: string | null;
  senderName: string | null;
  senderBank: string | null;
  slipAmount: number | null;
  transDate: string | null;
  transTime: string | null;
  rejectedReason: string | null;
  createdAt: string;
  expiresAt: string;
  invoice: {
    id: string;
    invoiceNumber: string;
    amount: number;
    description: string;
  };
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  requestedPlan: string;
}

export default function AdminPaymentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("UPLOADED");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("");
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/payments?status=${filter}`);
      
      if (res.status === 403) {
        setError("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
        return;
      }
      
      if (!res.ok) throw new Error("Failed to fetch");
      
      const data = await res.json();
      setPayments(data.payments);
      setStats(data.stats);
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleApprove = async (paymentId: string) => {
    if (!confirm("ยืนยันอนุมัติการชำระเงินนี้?")) return;

    setProcessing(paymentId);
    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentRequestId: paymentId,
          action: "approve",
        }),
      });

      const data = await res.json();
      if (data.success) {
        fetchPayments();
      } else {
        alert(data.error || "เกิดข้อผิดพลาด");
      }
    } catch (err) {
      alert("เกิดข้อผิดพลาด");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (paymentId: string) => {
    setProcessing(paymentId);
    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentRequestId: paymentId,
          action: "reject",
          reason: rejectReason || "สลิปไม่ถูกต้อง",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowRejectModal(null);
        setRejectReason("");
        fetchPayments();
      } else {
        alert(data.error || "เกิดข้อผิดพลาด");
      }
    } catch (err) {
      alert("เกิดข้อผิดพลาด");
    } finally {
      setProcessing(null);
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
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="border-slate-500 text-slate-300">รอชำระ</Badge>;
      case "UPLOADED":
        return <Badge className="bg-amber-500 text-white">รอตรวจสอบ</Badge>;
      case "VERIFYING":
        return <Badge className="bg-blue-500 text-white">กำลังตรวจสอบ</Badge>;
      case "VERIFIED":
        return <Badge className="bg-green-500 text-white">อนุมัติแล้ว</Badge>;
      case "REJECTED":
        return <Badge className="bg-red-500 text-white">ถูกปฏิเสธ</Badge>;
      case "EXPIRED":
        return <Badge variant="outline" className="border-red-500 text-red-400">หมดอายุ</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading && payments.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Card className="bg-slate-800 border-slate-700 max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">ไม่มีสิทธิ์เข้าถึง</h2>
            <p className="text-slate-400 mb-4">{error}</p>
            <Button onClick={() => router.push("/dashboard")}>กลับหน้าหลัก</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/admin")} className="text-slate-300 hover:text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              กลับ
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Receipt className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">ตรวจสอบการชำระเงิน</h1>
                <p className="text-xs text-slate-400">ตรวจสอบและอนุมัติสลิปการโอนเงิน</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 text-amber-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{stats.UPLOADED || 0}</p>
              <p className="text-xs text-slate-400">รอตรวจสอบ</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-6 w-6 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{stats.VERIFIED || 0}</p>
              <p className="text-xs text-slate-400">อนุมัติแล้ว</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4 text-center">
              <XCircle className="h-6 w-6 text-red-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{stats.REJECTED || 0}</p>
              <p className="text-xs text-slate-400">ถูกปฏิเสธ</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4 text-center">
              <FileCheck className="h-6 w-6 text-slate-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{stats.PENDING || 0}</p>
              <p className="text-xs text-slate-400">รอชำระ</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { value: "UPLOADED", label: "รอตรวจสอบ", count: stats.UPLOADED },
            { value: "VERIFIED", label: "อนุมัติแล้ว", count: stats.VERIFIED },
            { value: "REJECTED", label: "ถูกปฏิเสธ", count: stats.REJECTED },
            { value: "PENDING", label: "รอชำระ", count: stats.PENDING },
          ].map((tab) => (
            <Button
              key={tab.value}
              variant={filter === tab.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(tab.value)}
              className={filter === tab.value ? "bg-purple-600" : "border-slate-600 text-slate-300"}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <Badge className="ml-2 bg-slate-600 text-white text-xs">{tab.count}</Badge>
              )}
            </Button>
          ))}
        </div>

        {/* Payment List */}
        {payments.length === 0 ? (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-8 text-center">
              <Receipt className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">ไม่มีรายการในหมวดนี้</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {payments.map((payment) => (
              <Card key={payment.id} className="bg-slate-800 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Slip Image */}
                    <div className="flex-shrink-0">
                      {payment.slipImage ? (
                        <div
                          className="relative w-32 h-40 rounded-lg overflow-hidden bg-slate-700 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setSelectedImage(payment.slipImage)}
                        >
                          <Image
                            src={payment.slipImage}
                            alt="Slip"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
                            <Eye className="h-6 w-6 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-32 h-40 rounded-lg bg-slate-700 flex items-center justify-center">
                          <Receipt className="h-8 w-8 text-slate-500" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-grow space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {getStatusBadge(payment.status)}
                            <span className="text-xs text-slate-400">
                              {payment.invoice.invoiceNumber}
                            </span>
                          </div>
                          <p className="text-lg font-bold text-white">{formatAmount(payment.amount)}</p>
                          <p className="text-sm text-slate-400">{payment.requestedPlan}</p>
                        </div>
                      </div>

                      {/* User Info */}
                      <div className="flex items-center gap-2">
                        {payment.user.image ? (
                          <Image src={payment.user.image} alt="" width={24} height={24} className="rounded-full" unoptimized />
                        ) : (
                          <User className="w-6 h-6 text-slate-400" />
                        )}
                        <div>
                          <p className="text-sm text-white">{payment.user.name || "ไม่ระบุชื่อ"}</p>
                          <p className="text-xs text-slate-400">{payment.user.email}</p>
                        </div>
                      </div>

                      {/* Slip Info (if verified by SlipOK) */}
                      {payment.senderName && (
                        <div className="p-2 bg-slate-700 rounded text-xs space-y-1">
                          <p className="text-slate-300">
                            ผู้โอน: <span className="text-white">{payment.senderName}</span>
                            {payment.senderBank && ` (${payment.senderBank})`}
                          </p>
                          {payment.slipAmount && (
                            <p className="text-slate-300">
                              ยอดในสลิป: <span className="text-white">{formatAmount(payment.slipAmount)}</span>
                            </p>
                          )}
                          {payment.transRef && (
                            <p className="text-slate-300">
                              Ref: <span className="text-white font-mono">{payment.transRef}</span>
                            </p>
                          )}
                        </div>
                      )}

                      {/* Rejected Reason */}
                      {payment.rejectedReason && (
                        <div className="p-2 bg-red-500/20 border border-red-500/50 rounded text-xs text-red-200">
                          เหตุผล: {payment.rejectedReason}
                        </div>
                      )}

                      <p className="text-xs text-slate-500">
                        สร้างเมื่อ: {formatDate(payment.createdAt)}
                      </p>
                    </div>

                    {/* Actions */}
                    {payment.status === "UPLOADED" && (
                      <div className="flex flex-col gap-2 md:ml-4">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleApprove(payment.id)}
                          disabled={processing === payment.id}
                        >
                          {processing === payment.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              อนุมัติ
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500 text-red-400 hover:bg-red-500/20"
                          onClick={() => setShowRejectModal(payment.id)}
                          disabled={processing === payment.id}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          ปฏิเสธ
                        </Button>
                        {payment.slipImage && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-slate-400"
                            onClick={() => setSelectedImage(payment.slipImage)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            ดูสลิป
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <Button
            size="sm"
            variant="ghost"
            className="absolute top-4 right-4 text-white"
            onClick={() => setSelectedImage(null)}
          >
            <X className="h-6 w-6" />
          </Button>
          <Image
            src={selectedImage}
            alt="Slip"
            width={800}
            height={1000}
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
            unoptimized
          />
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="bg-slate-800 border-slate-700 w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-white">ปฏิเสธการชำระเงิน</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 block mb-2">เหตุผลในการปฏิเสธ</label>
                <Input
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="เช่น สลิปไม่ชัด, ยอดเงินไม่ตรง"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  onClick={() => handleReject(showRejectModal)}
                  disabled={processing === showRejectModal}
                >
                  {processing === showRejectModal ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "ยืนยันปฏิเสธ"
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-slate-600"
                  onClick={() => {
                    setShowRejectModal(null);
                    setRejectReason("");
                  }}
                >
                  ยกเลิก
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
