"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

interface Props {
  workspaceId: string;
  loanId: string;
  currentDueDate?: string | null;
}

function toDateInputValue(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
}

export function ExtendDueDateForm({ workspaceId, loanId, currentDueDate }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [dueDate, setDueDate] = useState(() => toDateInputValue(currentDueDate));
  const [loading, setLoading] = useState(false);

  const minDate = useMemo(() => {
    if (currentDueDate) {
      return toDateInputValue(currentDueDate);
    }
    return new Date().toISOString().split("T")[0];
  }, [currentDueDate]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!dueDate) {
      toast.error("กรุณาเลือกวันครบกำหนดใหม่");
      return;
    }

    if (currentDueDate) {
      const oldDate = new Date(currentDueDate);
      const newDate = new Date(dueDate);
      if (!Number.isNaN(oldDate.getTime()) && newDate <= oldDate) {
        toast.error("วันใหม่ต้องหลังวันครบกำหนดเดิม");
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/loans/${loanId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dueDate }),
      });

      if (res.ok) {
        toast.success("ขยายวันครบกำหนดเรียบร้อย");
        router.refresh();
      } else {
        const error = await res.json();
        toast.error(error.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      console.error("Error extending due date", error);
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="dueDate">วันครบกำหนดใหม่</Label>
        <Input
          id="dueDate"
          type="date"
          min={minDate}
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
        />
        {currentDueDate && (
          <p className="text-sm text-muted-foreground">วันครบกำหนดเดิม: {toDateInputValue(currentDueDate)}</p>
        )}
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "กำลังบันทึก..." : "บันทึกการขยายกำหนด"}
      </Button>
    </form>
  );
}
