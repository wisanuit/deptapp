"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ErrorAlert } from "@/components/ui/alert";

interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  members: {
    id: string;
    userId: string;
    role: string;
    user: {
      id: string;
      name: string | null;
      email: string;
    };
  }[];
}

export default function WorkspaceSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchWorkspace();
  }, [workspaceId]);

  const fetchWorkspace = async () => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`);
      if (!res.ok) throw new Error("ไม่พบ Workspace");
      const data = await res.json();
      setWorkspace(data);
      setName(data.name || "");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "เกิดข้อผิดพลาด");
      }

      router.push(`/workspaces/${workspaceId}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบ Workspace นี้? ข้อมูลทั้งหมดจะถูกลบและไม่สามารถกู้คืนได้")) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "เกิดข้อผิดพลาด");
      }

      router.push("/dashboard");
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

  if (!workspace) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive">ไม่พบ Workspace</p>
            <Button className="mt-4" onClick={() => router.push("/dashboard")}>
              กลับหน้าหลัก
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
          <h1 className="text-2xl font-bold">ตั้งค่า Workspace</h1>
          <Button variant="outline" onClick={() => router.push(`/workspaces/${workspaceId}`)}>
            กลับ
          </Button>
        </div>

        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลทั่วไป</CardTitle>
            <CardDescription>แก้ไขชื่อ Workspace</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">ชื่อ Workspace *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ชื่อ Workspace"
                  required
                />
              </div>

              {error && <ErrorAlert message={error} onClose={() => setError("")} />}

              <Button type="submit" disabled={saving || deleting || !name.trim()}>
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Members */}
        <Card>
          <CardHeader>
            <CardTitle>สมาชิก</CardTitle>
            <CardDescription>รายชื่อสมาชิกใน Workspace</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {workspace.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{member.user.name || member.user.email}</p>
                    <p className="text-sm text-muted-foreground">{member.user.email}</p>
                  </div>
                  <Badge variant={member.role === "OWNER" ? "default" : "secondary"}>
                    {member.role === "OWNER" ? "เจ้าของ" : member.role === "ADMIN" ? "แอดมิน" : "สมาชิก"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">ลบ Workspace</CardTitle>
            <CardDescription>
              การลบ Workspace จะลบข้อมูลทั้งหมดรวมถึงผู้ติดต่อ สัญญาเงินกู้ ประวัติการชำระ และบัตรเครดิต
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={saving || deleting}
            >
              {deleting ? "กำลังลบ..." : "ลบ Workspace"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
