"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, TrendingUp, TrendingDown, RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface CreditHistory {
  id: string;
  changeType: string;
  amount: number;
  previousLimit?: number;
  newLimit?: number;
  reason?: string;
  changedBy?: string;
  createdAt: string;
}

interface CustomerCredit {
  id: string;
  creditLimit: number;
  usedCredit: number;
  availableCredit: number;
  riskLevel: string;
  lastAssessedAt?: string;
  contact: { id: string; name: string; phone?: string; email?: string };
  history: CreditHistory[];
}

export default function CustomerCreditDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const workspaceId = params.workspaceId as string;
  const creditId = params.creditId as string;

  const [credit, setCredit] = useState<CustomerCredit | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [showUpdateLimit, setShowUpdateLimit] = useState(false);
  const [updateData, setUpdateData] = useState({ newLimit: "", reason: "" });

  const [showUseCredit, setShowUseCredit] = useState(false);
  const [useData, setUseData] = useState({ amount: "", reference: "" });

  const fetchCredit = async () => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/customer-credits/${creditId}`);
      const data = await res.json();
      setCredit(data);
      if (data.creditLimit) {
        setUpdateData((prev) => ({ ...prev, newLimit: String(data.creditLimit) }));
      }
    } catch (error) {
      console.error("Error fetching credit:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredit();
  }, [workspaceId, creditId]);

  const handleUpdateLimit = async () => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/customer-credits/${creditId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newLimit: parseFloat(updateData.newLimit),
          reason: updateData.reason,
        }),
      });
      if (res.ok) {
        setShowUpdateLimit(false);
        setUpdateData({ newLimit: "", reason: "" });
        fetchCredit();
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setProcessing(false);
    }
  };

  const handleAssessRisk = async () => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/customer-credits/${creditId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "assessRisk" }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(`ระดับความเสี่ยงใหม่: ${data.riskLevel}`, "ประเมินความเสี่ยง");
        fetchCredit();
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setProcessing(false);
    }
  };

  const handleUseOrRestore = async (action: "use" | "restore") => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/customer-credits/${creditId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          amount: parseFloat(useData.amount),
          reference: useData.reference,
        }),
      });
      if (res.ok) {
        setShowUseCredit(false);
        setUseData({ amount: "", reference: "" });
        fetchCredit();
        toast.success(action === "use" ? "ใช้วงเงินสำเร็จ" : "คืนวงเงินสำเร็จ");
      } else {
        const error = await res.json();
        toast.error(error.error);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setProcessing(false);
    }
  };

  const getRiskBadge = (risk: string) => {
    const badges: Record<string, { color: string; label: string }> = {
      LOW: { color: "bg-green-100 text-green-800", label: "ความเสี่ยงต่ำ" },
      MEDIUM: { color: "bg-yellow-100 text-yellow-800", label: "ความเสี่ยงปานกลาง" },
      HIGH: { color: "bg-orange-100 text-orange-800", label: "ความเสี่ยงสูง" },
      VERY_HIGH: { color: "bg-red-100 text-red-800", label: "ความเสี่ยงสูงมาก" },
    };
    return badges[risk] || { color: "bg-gray-100 text-gray-800", label: risk };
  };

  const getChangeTypeIcon = (type: string) => {
    switch (type) {
      case "INCREASE":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "DECREASE":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case "USE":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "RESTORE":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
    }
  };

  const getChangeTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      INITIAL_SETUP: "ตั้งค่าเริ่มต้น",
      INCREASE: "เพิ่มวงเงิน",
      DECREASE: "ลดวงเงิน",
      USE: "ใช้วงเงิน",
      RESTORE: "คืนวงเงิน",
      ADJUSTMENT: "ปรับปรุง",
    };
    return labels[type] || type;
  };

  if (loading) {
    return <div className="container mx-auto py-10 text-center">กำลังโหลด...</div>;
  }

  if (!credit) {
    return <div className="container mx-auto py-10 text-center">ไม่พบข้อมูล</div>;
  }

  const limit = Number(credit.creditLimit);
  const used = Number(credit.usedCredit);
  const available = Number(credit.availableCredit);
  const utilizationPercent = limit > 0 ? (used / limit) * 100 : 0;
  const risk = getRiskBadge(credit.riskLevel);

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        ย้อนกลับ
      </Button>

      {/* Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{credit.contact.name}</CardTitle>
                <div className="flex gap-2 mt-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${risk.color}`}>
                    {risk.label}
                  </span>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleAssessRisk} disabled={processing}>
                <RefreshCw className="h-4 w-4 mr-2" />
                ประเมินความเสี่ยง
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-500">วงเงิน</p>
                <p className="text-2xl font-bold">฿{limit.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">ใช้ไปแล้ว</p>
                <p className="text-2xl font-bold text-red-600">฿{used.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">คงเหลือ</p>
                <p className="text-2xl font-bold text-green-600">฿{available.toLocaleString()}</p>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>การใช้วงเงิน</span>
                <span>{utilizationPercent.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${
                    utilizationPercent > 90 ? "bg-red-500" :
                    utilizationPercent > 70 ? "bg-orange-500" :
                    utilizationPercent > 50 ? "bg-yellow-500" :
                    "bg-green-500"
                  }`}
                  style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">ข้อมูลติดต่อ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-gray-500">ชื่อ:</span> {credit.contact.name}</p>
            {credit.contact.phone && (
              <p><span className="text-gray-500">โทร:</span> {credit.contact.phone}</p>
            )}
            {credit.contact.email && (
              <p><span className="text-gray-500">อีเมล:</span> {credit.contact.email}</p>
            )}
            {credit.lastAssessedAt && (
              <p className="text-xs text-gray-400 mt-3">
                ประเมินล่าสุด: {new Date(credit.lastAssessedAt).toLocaleDateString("th-TH")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <Button onClick={() => setShowUpdateLimit(true)}>
          ปรับวงเงิน
        </Button>
        <Button variant="outline" onClick={() => setShowUseCredit(true)}>
          ใช้/คืน วงเงิน
        </Button>
      </div>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle>ประวัติการเปลี่ยนแปลง</CardTitle>
        </CardHeader>
        <CardContent>
          {credit.history.length === 0 ? (
            <p className="text-center text-gray-500 py-4">ยังไม่มีประวัติ</p>
          ) : (
            <div className="space-y-4">
              {credit.history.map((item) => (
                <div key={item.id} className="flex gap-4 border-l-2 border-gray-200 pl-4 pb-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    {getChangeTypeIcon(item.changeType)}
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{getChangeTypeLabel(item.changeType)}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(item.createdAt).toLocaleString("th-TH")}
                      </span>
                    </div>
                    <p className="text-lg font-semibold">
                      {item.changeType === "DECREASE" || item.changeType === "USE" ? "-" : "+"}
                      ฿{Number(item.amount).toLocaleString()}
                    </p>
                    {(item.previousLimit !== undefined && item.newLimit !== undefined) && (
                      <p className="text-sm text-gray-500">
                        วงเงิน: ฿{Number(item.previousLimit).toLocaleString()} → ฿{Number(item.newLimit).toLocaleString()}
                      </p>
                    )}
                    {item.reason && (
                      <p className="text-sm text-gray-600 mt-1">{item.reason}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Update Limit Modal */}
      {showUpdateLimit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>ปรับวงเงิน</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>วงเงินใหม่ (บาท)</Label>
                <Input
                  type="number"
                  value={updateData.newLimit}
                  onChange={(e) => setUpdateData({ ...updateData, newLimit: e.target.value })}
                />
              </div>
              <div>
                <Label>เหตุผล</Label>
                <Textarea
                  value={updateData.reason}
                  onChange={(e) => setUpdateData({ ...updateData, reason: e.target.value })}
                  placeholder="เหตุผลในการปรับวงเงิน..."
                />
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={handleUpdateLimit}
                  disabled={processing || !updateData.newLimit}
                >
                  {processing ? "กำลังบันทึก..." : "บันทึก"}
                </Button>
                <Button variant="outline" onClick={() => setShowUpdateLimit(false)}>
                  ยกเลิก
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Use/Restore Credit Modal */}
      {showUseCredit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>ใช้/คืน วงเงิน</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>จำนวนเงิน (บาท)</Label>
                <Input
                  type="number"
                  value={useData.amount}
                  onChange={(e) => setUseData({ ...useData, amount: e.target.value })}
                />
              </div>
              <div>
                <Label>อ้างอิง</Label>
                <Input
                  value={useData.reference}
                  onChange={(e) => setUseData({ ...useData, reference: e.target.value })}
                  placeholder="เช่น เลขที่สัญญากู้..."
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handleUseOrRestore("use")}
                  disabled={processing || !useData.amount}
                >
                  ใช้วงเงิน
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => handleUseOrRestore("restore")}
                  disabled={processing || !useData.amount}
                >
                  คืนวงเงิน
                </Button>
              </div>
              <Button variant="outline" className="w-full" onClick={() => setShowUseCredit(false)}>
                ยกเลิก
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
