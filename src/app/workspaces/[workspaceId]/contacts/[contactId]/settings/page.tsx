"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorAlert } from "@/components/ui/alert";

interface Contact {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  note: string | null;
   imageUrl?: string | null;
  type: string;
}

export default function ContactSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const contactId = params.contactId as string;

  const [contact, setContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    imageUrl: "",
    note: "",
    type: "BOTH",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchContact();
  }, [contactId]);

  const fetchContact = async () => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/contacts/${contactId}`);
      if (!res.ok) throw new Error("ไม่พบข้อมูลผู้ติดต่อ");
      const data = await res.json();
      setContact(data);
      setFormData({
        name: data.name || "",
        phone: data.phone || "",
        email: data.email || "",
        imageUrl: data.imageUrl || "",
        note: data.note || "",
        type: data.type || "BOTH",
      });
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
      const res = await fetch(`/api/workspaces/${workspaceId}/contacts/${contactId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "เกิดข้อผิดพลาด");
      }

      router.push(`/workspaces/${workspaceId}/contacts`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบผู้ติดต่อนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้")) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/contacts/${contactId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "เกิดข้อผิดพลาด");
      }

      router.push(`/workspaces/${workspaceId}/contacts`);
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

  if (!contact) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive">ไม่พบข้อมูลผู้ติดต่อ</p>
            <Button 
              className="mt-4" 
              onClick={() => router.push(`/workspaces/${workspaceId}/contacts`)}
            >
              กลับ
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>ตั้งค่าผู้ติดต่อ</CardTitle>
          <CardDescription>แก้ไขข้อมูลหรือลบผู้ติดต่อ</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="image">รูปภาพ</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    setFormData((prev) => ({ ...prev, imageUrl: typeof reader.result === "string" ? reader.result : prev.imageUrl }));
                  };
                  reader.readAsDataURL(file);
                }}
              />
              {formData.imageUrl && (
                <div className="mt-2">
                  <img src={formData.imageUrl} alt="ตัวอย่างรูปผู้ติดต่อ" className="h-16 w-16 rounded-full object-cover border" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">ชื่อ *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ชื่อผู้ติดต่อ"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">เบอร์โทร</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0812345678"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">อีเมล</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">ประเภท</Label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="BOTH">ทั้งคู่ (ยืม/ให้ยืม)</option>
                <option value="BORROWER">ผู้กู้ (ลูกหนี้)</option>
                <option value="LENDER">ผู้ให้กู้ (เจ้าหนี้)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">หมายเหตุ</Label>
              <Input
                id="note"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="หมายเหตุเพิ่มเติม"
              />
            </div>

            {error && <ErrorAlert message={error} onClose={() => setError("")} />}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={saving || deleting}
              >
                ยกเลิก
              </Button>
              <Button type="submit" disabled={saving || deleting || !formData.name.trim()}>
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </Button>
            </div>
          </form>

          {/* Delete Section */}
          <div className="mt-8 pt-6 border-t">
            <h3 className="text-lg font-semibold text-destructive mb-2">ลบผู้ติดต่อ</h3>
            <p className="text-sm text-muted-foreground mb-4">
              การลบผู้ติดต่อจะลบข้อมูลทั้งหมดที่เกี่ยวข้อง รวมถึงสัญญาเงินกู้และประวัติการชำระ
            </p>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={saving || deleting}
            >
              {deleting ? "กำลังลบ..." : "ลบผู้ติดต่อ"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
