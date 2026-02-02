"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { 
  ArrowLeft, Users, Save, X, Upload, 
  User, Phone, Mail, FileText, Tag
} from "lucide-react";

// Avatar component
function Avatar({ name, size = "xl", imageUrl }: { name: string; size?: "sm" | "md" | "lg" | "xl"; imageUrl?: string | null }) {
  const initials = name ? name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() : "?";
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-20 h-20 text-2xl"
  };
  
  if (imageUrl) {
    return (
      <img src={imageUrl} alt={name} className={`${sizeClasses[size]} rounded-full object-cover ring-4 ring-background shadow-lg`} />
    );
  }
  
  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-primary to-blue-600 text-white flex items-center justify-center font-semibold ring-4 ring-background shadow-lg`}>
      {initials}
    </div>
  );
}

export default function NewContactPage() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const workspaceId = params.workspaceId as string;

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    imageUrl: "",
    note: "",
    type: "BOTH",
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formDataUpload,
      });

      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({ ...prev, imageUrl: data.url }));
        toast.success("อัพโหลดรูปภาพสำเร็จ");
      } else {
        toast.error("อัพโหลดรูปภาพล้มเหลว");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("เกิดข้อผิดพลาดในการอัพโหลด");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "เกิดข้อผิดพลาด");
      }

      toast.success("เพิ่มผู้ติดต่อสำเร็จ");
      router.push(`/workspaces/${workspaceId}/contacts`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const typeOptions = [
    { value: "BOTH", label: "ทั้งคู่ (ยืม/ให้ยืม)", icon: "🔄", description: "สามารถเป็นได้ทั้งผู้กู้และผู้ให้กู้" },
    { value: "BORROWER", label: "ผู้กู้ (ลูกหนี้)", icon: "📥", description: "เป็นผู้กู้เงินจากคุณ" },
    { value: "LENDER", label: "ผู้ให้กู้ (เจ้าหนี้)", icon: "📤", description: "เป็นผู้ให้คุณยืมเงิน" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Facebook-style Header */}
      <header className="bg-card sticky top-0 z-50 shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <Link 
                href={`/workspaces/${workspaceId}/contacts`} 
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <h1 className="text-lg font-semibold">เพิ่มผู้ติดต่อใหม่</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
                className="rounded-full gap-2"
              >
                <X className="h-4 w-4" />
                ยกเลิก
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || !formData.name.trim()}
                className="rounded-full gap-2"
              >
                <Save className="h-4 w-4" />
                {loading ? "กำลังบันทึก..." : "บันทึก"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit}>
            {/* Profile Photo Card */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col items-center">
                  <div className="relative mb-4">
                    <Avatar name={formData.name || "?"} size="xl" imageUrl={formData.imageUrl} />
                    <label className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full cursor-pointer hover:bg-primary/90 transition-colors shadow-lg">
                      <Upload className="h-4 w-4" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {uploading ? "กำลังอัพโหลด..." : "คลิกไอคอนเพื่ออัพโหลดรูปภาพ"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Basic Info Card */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  ข้อมูลพื้นฐาน
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2">
                      <span>ชื่อ</span>
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="ชื่อ-นามสกุล หรือชื่อบริษัท"
                      className="rounded-lg"
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        เบอร์โทร
                      </Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="0812345678"
                        className="rounded-lg"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        อีเมล
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="email@example.com"
                        className="rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Type Card */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Tag className="h-5 w-5 text-primary" />
                  ประเภทผู้ติดต่อ
                </h3>
                
                <div className="grid gap-3">
                  {typeOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.type === option.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="type"
                        value={option.value}
                        checked={formData.type === option.value}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="hidden"
                      />
                      <span className="text-2xl">{option.icon}</span>
                      <div className="flex-1">
                        <p className="font-medium">{option.label}</p>
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        formData.type === option.value ? 'border-primary' : 'border-border'
                      }`}>
                        {formData.type === option.value && (
                          <div className="w-3 h-3 rounded-full bg-primary" />
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Note Card */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  หมายเหตุ
                </h3>
                
                <Textarea
                  id="note"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="บันทึกข้อมูลเพิ่มเติมเกี่ยวกับผู้ติดต่อ..."
                  rows={4}
                  className="rounded-lg resize-none"
                />
              </CardContent>
            </Card>

            {/* Submit Button (Mobile) */}
            <div className="md:hidden flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
                className="flex-1 rounded-lg"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={loading || !formData.name.trim()}
                className="flex-1 rounded-lg"
              >
                {loading ? "กำลังบันทึก..." : "บันทึก"}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
