"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorAlert } from "@/components/ui/alert";

export default function NewWorkspacePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    <div className="min-h-screen bg-muted flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>สร้าง Workspace ใหม่</CardTitle>
          <CardDescription>
            Workspace คือพื้นที่สำหรับจัดการข้อมูลเจ้าหนี้-ลูกหนี้แยกกัน
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">ชื่อ Workspace</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น ธุรกิจส่วนตัว, บริษัท ABC"
                required
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
              <Button type="submit" disabled={loading || !name.trim()}>
                {loading ? "กำลังสร้าง..." : "สร้าง Workspace"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
