"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorAlert, WarningAlert } from "@/components/ui/alert";
import { Crown } from "lucide-react";
import Link from "next/link";

export default function NewWorkspacePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [limitInfo, setLimitInfo] = useState<{
    allowed: boolean;
    current: number;
    limit: number;
  } | null>(null);
  const [checkingLimit, setCheckingLimit] = useState(true);

  // เช็ค limit ตอนเริ่มต้น
  useEffect(() => {
    const checkLimit = async () => {
      try {
        const res = await fetch("/api/subscription/check-limit?feature=WORKSPACES");
        if (res.ok) {
          const data = await res.json();
          setLimitInfo(data);
        }
      } catch (error) {
        console.error("Error checking limit:", error);
      } finally {
        setCheckingLimit(false);
      }
    };
    checkLimit();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "เกิดข้อผิดพลาด");
      }

      const workspace = await res.json();
      router.push(`/workspaces/${workspace.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>สร้าง Workspace ใหม่</CardTitle>
          <CardDescription>
            Workspace คือพื้นที่สำหรับจัดการข้อมูลเจ้าหนี้-ลูกหนี้แยกกัน
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* แสดง warning ถ้าเกิน limit */}
          {!checkingLimit && limitInfo && !limitInfo.allowed && (
            <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                  <Crown className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                    ถึงขีดจำกัด Workspace แล้ว
                  </h3>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    คุณใช้งาน {limitInfo.current}/{limitInfo.limit} Workspace แล้ว
                    กรุณาอัพเกรดแผนเพื่อสร้าง Workspace เพิ่ม
                  </p>
                  <Link href="/subscription">
                    <Button size="sm" className="mt-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
                      <Crown className="h-4 w-4 mr-2" />
                      อัพเกรดแผน
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* แสดงจำนวนที่ใช้ไป */}
          {!checkingLimit && limitInfo && limitInfo.allowed && limitInfo.limit > 0 && (
            <div className="mb-4 p-3 rounded-lg bg-muted/50 border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Workspace ที่ใช้</span>
                <span className="font-medium">{limitInfo.current}/{limitInfo.limit}</span>
              </div>
              <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all"
                  style={{ width: `${(limitInfo.current / limitInfo.limit) * 100}%` }}
                />
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">ชื่อ Workspace</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น ธุรกิจส่วนตัว, บริษัท ABC"
                required
                disabled={!checkingLimit && limitInfo !== null && !limitInfo.allowed}
              />
            </div>

            {error && (
              <ErrorAlert message={error} onClose={() => setError("")} />
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                ยกเลิก
              </Button>
              <Button 
                type="submit" 
                disabled={loading || !name.trim() || checkingLimit || (limitInfo !== null && !limitInfo.allowed)}
              >
                {checkingLimit ? "กำลังตรวจสอบ..." : loading ? "กำลังสร้าง..." : "สร้าง Workspace"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
