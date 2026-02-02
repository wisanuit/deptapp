"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ErrorAlert } from "@/components/ui/alert";
import { useToast } from "@/components/ui/toast";

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

export default function InterestPolicyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const workspaceId = params.workspaceId as string;
  const policyId = params.policyId as string;

  const [policy, setPolicy] = useState<InterestPolicy | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    mode: "MONTHLY",
    monthlyRate: "",
    dailyRate: "",
    anchorDay: "1",
    graceDays: "0",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

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
      setLoading(false);
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

      router.push(`/workspaces/${workspaceId}/interest-policies`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <p>กำลังโหลด...</p>
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive">{error || "ไม่พบนโยบายดอกเบี้ย"}</p>
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
    <div className="min-h-screen bg-muted p-4">
      <div className="container mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{policy.name}</h1>
            <Badge variant={policy.mode === "MONTHLY" ? "default" : "secondary"}>
              {policy.mode === "MONTHLY" ? "รายเดือน" : "รายวัน"}
            </Badge>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push(`/workspaces/${workspaceId}/interest-policies`)}
          >
            กลับ
          </Button>
        </div>

        {/* Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle>แก้ไขนโยบาย</CardTitle>
            <CardDescription>แก้ไขข้อมูลนโยบายดอกเบี้ย</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">ชื่อนโยบาย *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="เช่น ดอกเบี้ย 1.5% ต่อเดือน"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mode">ประเภท</Label>
                <select
                  id="mode"
                  value={formData.mode}
                  onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="MONTHLY">รายเดือน</option>
                  <option value="DAILY">รายวัน</option>
                </select>
              </div>

              {formData.mode === "MONTHLY" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="monthlyRate">อัตราดอกเบี้ยต่อเดือน (%) *</Label>
                    <Input
                      id="monthlyRate"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.monthlyRate}
                      onChange={(e) => setFormData({ ...formData, monthlyRate: e.target.value })}
                      placeholder="1.5"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      ตัวอย่าง: 1.5 หมายถึง 1.5% ต่อเดือน
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="anchorDay">วันครบรอบ (1-31)</Label>
                    <Input
                      id="anchorDay"
                      type="number"
                      min="1"
                      max="31"
                      value={formData.anchorDay}
                      onChange={(e) => setFormData({ ...formData, anchorDay: e.target.value })}
                      placeholder="1"
                    />
                    <p className="text-xs text-muted-foreground">
                      วันที่คิดดอกเบี้ยรอบเต็มเดือน (ถ้าเดือนไม่มีวันที่นี้จะใช้วันสุดท้ายของเดือน)
                    </p>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="dailyRate">อัตราดอกเบี้ยต่อวัน (%) *</Label>
                  <Input
                    id="dailyRate"
                    type="number"
                    step="0.001"
                    min="0"
                    value={formData.dailyRate}
                    onChange={(e) => setFormData({ ...formData, dailyRate: e.target.value })}
                    placeholder="0.05"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    ตัวอย่าง: 0.05 หมายถึง 0.05% ต่อวัน
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="graceDays">วันผ่อนผัน</Label>
                <Input
                  id="graceDays"
                  type="number"
                  min="0"
                  value={formData.graceDays}
                  onChange={(e) => setFormData({ ...formData, graceDays: e.target.value })}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  จำนวนวันที่ไม่คิดดอกเบี้ยหลังวันกู้ (0 = คิดทันที)
                </p>
              </div>

              {error && <ErrorAlert message={error} onClose={() => setError("")} />}

              <Button type="submit" disabled={saving || deleting || !formData.name.trim()}>
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Usage Info */}
        <Card>
          <CardHeader>
            <CardTitle>การใช้งาน</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              นโยบายนี้ถูกใช้งานใน{" "}
              <span className="font-bold text-foreground">{policy._count?.loans || 0}</span>{" "}
              สัญญาเงินกู้
            </p>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">ลบนโยบาย</CardTitle>
            <CardDescription>
              {policy._count?.loans && policy._count.loans > 0
                ? "ไม่สามารถลบนโยบายที่มีสัญญาเงินกู้ใช้งานอยู่"
                : "การลบนโยบายจะไม่สามารถกู้คืนได้"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={saving || deleting || Boolean(policy._count?.loans && policy._count.loans > 0)}
            >
              {deleting ? "กำลังลบ..." : "ลบนโยบาย"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
