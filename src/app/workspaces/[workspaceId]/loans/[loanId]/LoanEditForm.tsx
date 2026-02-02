"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

interface InterestPolicy {
  id: string;
  name: string;
  mode: string;
  monthlyRate?: number;
  dailyRate?: number;
}

interface Props {
  workspaceId: string;
  loanId: string;
  defaultStatus: string;
  defaultNote?: string | null;
  defaultInterestPolicyId?: string | null;
}

export function LoanEditForm({ workspaceId, loanId, defaultStatus, defaultNote, defaultInterestPolicyId }: Props) {
  const toast = useToast();
  const router = useRouter();
  const [status, setStatus] = useState(defaultStatus);
  const [note, setNote] = useState(defaultNote || "");
  const [interestPolicyId, setInterestPolicyId] = useState(defaultInterestPolicyId || "");
  const [policies, setPolicies] = useState<InterestPolicy[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/workspaces/${workspaceId}/interest-policies`)
      .then((r) => r.json())
      .then((data) => setPolicies(data || []))
      .catch(() => setPolicies([]));
  }, [workspaceId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/loans/${loanId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          note: note || undefined,
          interestPolicyId: interestPolicyId || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "เกิดข้อผิดพลาด");
      }

      toast.success("อัพเดทรายละเอียดสัญญาแล้ว");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="status">สถานะสัญญา</Label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="OPEN">เปิดอยู่</option>
            <option value="OVERDUE">ค้างชำระ</option>
            <option value="CLOSED">ปิดสัญญา</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="interestPolicyId">นโยบายดอกเบี้ย</Label>
          <select
            id="interestPolicyId"
            value={interestPolicyId}
            onChange={(e) => setInterestPolicyId(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">ไม่คิดดอกเบี้ย</option>
            {policies.map((policy) => (
              <option key={policy.id} value={policy.id}>
                {policy.name} ({policy.mode === "MONTHLY" ? `${(policy.monthlyRate || 0) * 100}%/เดือน` : `${(policy.dailyRate || 0) * 100}%/วัน`})
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="note">หมายเหตุ</Label>
        <Input
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="หมายเหตุสัญญา"
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
      </Button>
    </form>
  );
}
