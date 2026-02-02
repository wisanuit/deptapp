"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, CheckCircle, XCircle, Banknote, FileText, Clock } from "lucide-react";

interface LoanApplication {
  id: string;
  requestedAmount: number;
  approvedAmount?: number;
  purpose?: string;
  term?: number;
  status: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  approvalNote?: string;
  rejectionReason?: string;
  contact: { id: string; name: string; phone?: string; email?: string };
  interestPolicy?: { id: string; name: string; rate: number };
  loan?: { id: string };
}

export default function LoanApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const applicationId = params.applicationId as string;

  const [application, setApplication] = useState<LoanApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [showDisburse, setShowDisburse] = useState(false);

  const [approveData, setApproveData] = useState({ amount: "", note: "" });
  const [rejectData, setRejectData] = useState({ reason: "" });
  const [disburseData, setDisburseData] = useState({
    amount: "",
    startDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    note: "",
  });

  const fetchApplication = useCallback(async () => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/loan-applications/${applicationId}`);
      const data = await res.json();
      setApplication(data);
      if (data.requestedAmount) {
        setApproveData((prev) => ({ ...prev, amount: String(data.requestedAmount) }));
        setDisburseData((prev) => ({ ...prev, amount: String(data.approvedAmount || data.requestedAmount) }));
      }
    } catch (error) {
      console.error("Error fetching application:", error);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, applicationId]);

  useEffect(() => {
    fetchApplication();
  }, [fetchApplication]);

  const handleApprove = async () => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/loan-applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "APPROVED",
          approvedAmount: parseFloat(approveData.amount),
          note: approveData.note,
        }),
      });
      if (res.ok) {
        setShowApprove(false);
        fetchApplication();
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/loan-applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "REJECTED",
          note: rejectData.reason,
        }),
      });
      if (res.ok) {
        setShowReject(false);
        fetchApplication();
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setProcessing(false);
    }
  };

  const handleDisburse = async () => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/loan-applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "disburse",
          approvedAmount: parseFloat(disburseData.amount),
          startDate: disburseData.startDate,
          dueDate: disburseData.dueDate || null,
          note: disburseData.note,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/workspaces/${workspaceId}/loans/${data.loan.id}`);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; label: string }> = {
      PENDING: { color: "bg-yellow-100 text-yellow-800", label: "รอพิจารณา" },
      REVIEWING: { color: "bg-blue-100 text-blue-800", label: "กำลังพิจารณา" },
      APPROVED: { color: "bg-green-100 text-green-800", label: "อนุมัติ" },
      REJECTED: { color: "bg-red-100 text-red-800", label: "ปฏิเสธ" },
      DISBURSED: { color: "bg-purple-100 text-purple-800", label: "เบิกจ่ายแล้ว" },
      CANCELLED: { color: "bg-gray-100 text-gray-800", label: "ยกเลิก" },
    };
    return badges[status] || { color: "bg-gray-100 text-gray-800", label: status };
  };

  if (loading) {
    return <div className="container mx-auto py-10 text-center">กำลังโหลด...</div>;
  }

  if (!application) {
    return <div className="container mx-auto py-10 text-center">ไม่พบข้อมูล</div>;
  }

  const status = getStatusBadge(application.status);
  const canApprove = application.status === "PENDING" || application.status === "REVIEWING";
  const canDisburse = application.status === "APPROVED";

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        ย้อนกลับ
      </Button>

      {/* Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-6 w-6" />
                ใบสมัครสินเชื่อ
              </CardTitle>
              <p className="text-gray-500 mt-1">
                ยื่นเมื่อ {new Date(application.submittedAt).toLocaleDateString("th-TH", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <span className={`px-3 py-1 rounded text-sm font-medium ${status.color}`}>
              {status.label}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">ข้อมูลผู้ขอ</h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-500">ชื่อ:</span> {application.contact.name}</p>
                {application.contact.phone && (
                  <p><span className="text-gray-500">โทร:</span> {application.contact.phone}</p>
                )}
                {application.contact.email && (
                  <p><span className="text-gray-500">อีเมล:</span> {application.contact.email}</p>
                )}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3">รายละเอียดการขอกู้</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-gray-500">ยอดที่ขอ:</span>{" "}
                  <span className="font-bold text-lg">
                    ฿{Number(application.requestedAmount).toLocaleString()}
                  </span>
                </p>
                {application.approvedAmount && (
                  <p>
                    <span className="text-gray-500">ยอดอนุมัติ:</span>{" "}
                    <span className="font-bold text-green-600">
                      ฿{Number(application.approvedAmount).toLocaleString()}
                    </span>
                  </p>
                )}
                {application.term && (
                  <p><span className="text-gray-500">ระยะเวลา:</span> {application.term} เดือน</p>
                )}
                {application.interestPolicy && (
                  <p>
                    <span className="text-gray-500">ดอกเบี้ย:</span>{" "}
                    {application.interestPolicy.name} ({Number(application.interestPolicy.rate)}%)
                  </p>
                )}
              </div>
            </div>
          </div>

          {application.purpose && (
            <div className="mt-4 pt-4 border-t">
              <h3 className="font-semibold mb-2">วัตถุประสงค์</h3>
              <p className="text-gray-700">{application.purpose}</p>
            </div>
          )}

          {application.approvalNote && (
            <div className="mt-4 pt-4 border-t bg-green-50 p-3 rounded">
              <h3 className="font-semibold mb-2 text-green-800">หมายเหตุการอนุมัติ</h3>
              <p className="text-green-700">{application.approvalNote}</p>
            </div>
          )}

          {application.rejectionReason && (
            <div className="mt-4 pt-4 border-t bg-red-50 p-3 rounded">
              <h3 className="font-semibold mb-2 text-red-800">เหตุผลที่ปฏิเสธ</h3>
              <p className="text-red-700">{application.rejectionReason}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      {canApprove && (
        <div className="flex gap-4 mb-6">
          <Button className="flex-1" onClick={() => setShowApprove(true)}>
            <CheckCircle className="h-4 w-4 mr-2" />
            อนุมัติ
          </Button>
          <Button variant="destructive" className="flex-1" onClick={() => setShowReject(true)}>
            <XCircle className="h-4 w-4 mr-2" />
            ปฏิเสธ
          </Button>
        </div>
      )}

      {canDisburse && (
        <Button className="w-full mb-6" onClick={() => setShowDisburse(true)}>
          <Banknote className="h-4 w-4 mr-2" />
          เบิกจ่ายเงินกู้
        </Button>
      )}

      {application.loan && (
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Banknote className="h-6 w-6 text-purple-600" />
                <div>
                  <p className="font-semibold">เบิกจ่ายแล้ว</p>
                  <p className="text-sm text-gray-600">สร้างรายการให้กู้ยืมเรียบร้อย</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push(`/workspaces/${workspaceId}/loans/${application.loan?.id}`)}
              >
                ดูรายการให้กู้ยืม
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approve Modal */}
      {showApprove && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>อนุมัติใบสมัคร</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>ยอดที่อนุมัติ (บาท)</Label>
                <Input
                  type="number"
                  value={approveData.amount}
                  onChange={(e) => setApproveData({ ...approveData, amount: e.target.value })}
                />
              </div>
              <div>
                <Label>หมายเหตุ</Label>
                <Textarea
                  value={approveData.note}
                  onChange={(e) => setApproveData({ ...approveData, note: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={handleApprove} disabled={processing}>
                  {processing ? "กำลังดำเนินการ..." : "ยืนยันอนุมัติ"}
                </Button>
                <Button variant="outline" onClick={() => setShowApprove(false)}>
                  ยกเลิก
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reject Modal */}
      {showReject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>ปฏิเสธใบสมัคร</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>เหตุผลที่ปฏิเสธ</Label>
                <Textarea
                  value={rejectData.reason}
                  onChange={(e) => setRejectData({ reason: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="destructive" className="flex-1" onClick={handleReject} disabled={processing}>
                  {processing ? "กำลังดำเนินการ..." : "ยืนยันปฏิเสธ"}
                </Button>
                <Button variant="outline" onClick={() => setShowReject(false)}>
                  ยกเลิก
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Disburse Modal */}
      {showDisburse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>เบิกจ่ายเงินกู้</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>ยอดเบิกจ่าย (บาท)</Label>
                <Input
                  type="number"
                  value={disburseData.amount}
                  onChange={(e) => setDisburseData({ ...disburseData, amount: e.target.value })}
                />
              </div>
              <div>
                <Label>ผู้ให้กู้ (เจ้าหนี้)</Label>
                <div className="w-full rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground">
                  ระบบจะใช้บัญชีของคุณเป็นผู้ให้กู้โดยอัตโนมัติ
                </div>
              </div>
              <div>
                <Label>วันที่เริ่มกู้</Label>
                <Input
                  type="date"
                  value={disburseData.startDate}
                  onChange={(e) => setDisburseData({ ...disburseData, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label>วันครบกำหนด (ถ้ามี)</Label>
                <Input
                  type="date"
                  value={disburseData.dueDate}
                  onChange={(e) => setDisburseData({ ...disburseData, dueDate: e.target.value })}
                />
              </div>
              <div>
                <Label>หมายเหตุ</Label>
                <Textarea
                  value={disburseData.note}
                  onChange={(e) => setDisburseData({ ...disburseData, note: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={handleDisburse} disabled={processing || !disburseData.amount}>
                  {processing ? "กำลังดำเนินการ..." : "ยืนยันเบิกจ่าย"}
                </Button>
                <Button variant="outline" onClick={() => setShowDisburse(false)}>
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
