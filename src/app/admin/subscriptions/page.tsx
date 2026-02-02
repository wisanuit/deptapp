"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  FileCheck,
  Loader2,
  Check,
  X,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Package,
  Calendar,
  MessageSquare,
  AlertCircle,
} from "lucide-react";

interface Subscription {
  id: string;
  status: string;
  billingCycle: string;
  startDate: string;
  requestNote: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    createdAt: string;
  };
  plan: {
    id: string;
    name: string;
    displayName: string;
    price: number;
  };
}

interface Stats {
  pending: number;
  active: number;
  cancelled: number;
  expired: number;
}

export default function AdminSubscriptionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [activeTab, setActiveTab] = useState<string>("PENDING");
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("");
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/subscriptions?status=${activeTab}`);
      if (res.status === 403) {
        router.push("/admin");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setSubscriptions(data.subscriptions);
      setStats(data.stats);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, router]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const handleApprove = async (subscriptionId: string) => {
    if (!confirm("ยืนยันการอนุมัติคำขอนี้?")) return;
    
    setProcessing(subscriptionId);
    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionId,
          action: "approve",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "เกิดข้อผิดพลาด");
        return;
      }

      await fetchSubscriptions();
      alert("อนุมัติสำเร็จ");
    } catch (error) {
      alert("เกิดข้อผิดพลาด");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (subscriptionId: string) => {
    setProcessing(subscriptionId);
    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionId,
          action: "reject",
          rejectedReason: rejectReason,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "เกิดข้อผิดพลาด");
        return;
      }

      await fetchSubscriptions();
      setShowRejectModal(null);
      setRejectReason("");
      alert("ปฏิเสธสำเร็จ");
    } catch (error) {
      alert("เกิดข้อผิดพลาด");
    } finally {
      setProcessing(null);
    }
  };

  const tabs = [
    { key: "PENDING", label: "รออนุมัติ", count: stats?.pending, icon: Clock, color: "text-amber-400" },
    { key: "ACTIVE", label: "ใช้งานอยู่", count: stats?.active, icon: CheckCircle, color: "text-green-400" },
    { key: "CANCELLED", label: "ยกเลิก", count: stats?.cancelled, icon: XCircle, color: "text-red-400" },
    { key: "EXPIRED", label: "หมดอายุ", count: stats?.expired, icon: AlertCircle, color: "text-slate-400" },
  ];

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
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <FileCheck className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">คำขอสมัคร Package</h1>
                <p className="text-xs text-slate-400">ตรวจสอบและอนุมัติคำขอ</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? "bg-slate-700 text-white"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <Icon className={`h-4 w-4 ${tab.color}`} />
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <Badge className="bg-slate-600 text-white text-xs">
                    {tab.count}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>

        {/* Subscriptions List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        ) : subscriptions.length === 0 ? (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-12 text-center">
              <FileCheck className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">ไม่มีรายการในหมวดนี้</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {subscriptions.map((sub) => (
              <Card key={sub.id} className="bg-slate-800 border-slate-700">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* User Info */}
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-slate-700 flex items-center justify-center">
                        {sub.user.image ? (
                          <Image src={sub.user.image} alt="" width={48} height={48} className="rounded-full" unoptimized />
                        ) : (
                          <User className="h-6 w-6 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{sub.user.name || "ไม่ระบุชื่อ"}</p>
                        <p className="text-sm text-slate-400">{sub.user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="h-3 w-3 text-slate-500" />
                          <span className="text-xs text-slate-500">
                            สมัครเมื่อ {new Date(sub.createdAt).toLocaleDateString("th-TH")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Plan Info */}
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-purple-400" />
                          <span className="font-semibold text-white">{sub.plan.displayName}</span>
                        </div>
                        <p className="text-sm text-slate-400">
                          ฿{sub.plan.price.toLocaleString()}/{sub.billingCycle === "YEARLY" ? "ปี" : "เดือน"}
                        </p>
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex items-center gap-3">
                      {sub.status === "PENDING" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(sub.id)}
                            disabled={processing === sub.id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {processing === sub.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Check className="h-4 w-4 mr-1" />
                                อนุมัติ
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowRejectModal(sub.id)}
                            disabled={processing === sub.id}
                            className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                          >
                            <X className="h-4 w-4 mr-1" />
                            ปฏิเสธ
                          </Button>
                        </>
                      )}
                      {sub.status === "ACTIVE" && (
                        <Badge className="bg-green-600">ใช้งานอยู่</Badge>
                      )}
                      {sub.status === "CANCELLED" && (
                        <Badge className="bg-red-600">ยกเลิกแล้ว</Badge>
                      )}
                      {sub.status === "EXPIRED" && (
                        <Badge className="bg-slate-600">หมดอายุ</Badge>
                      )}
                    </div>
                  </div>

                  {/* Request Note */}
                  {sub.requestNote && (
                    <div className="mt-4 p-3 bg-slate-900 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
                        <MessageSquare className="h-4 w-4" />
                        หมายเหตุจากผู้ขอ
                      </div>
                      <p className="text-slate-300">{sub.requestNote}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-slate-800 border-slate-700 w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-white">ปฏิเสธคำขอ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-2 block">เหตุผลในการปฏิเสธ (ถ้ามี)</label>
                <Textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="ระบุเหตุผล..."
                  className="bg-slate-900 border-slate-600 text-white"
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectModal(null);
                    setRejectReason("");
                  }}
                  className="flex-1 border-slate-600 text-slate-300"
                >
                  ยกเลิก
                </Button>
                <Button
                  onClick={() => handleReject(showRejectModal)}
                  disabled={processing !== null}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {processing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "ยืนยันปฏิเสธ"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
