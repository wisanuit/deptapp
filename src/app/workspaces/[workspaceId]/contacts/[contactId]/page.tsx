"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { 
  ArrowLeft, Users, Save, X, Upload, Trash2,
  User, Phone, Mail, FileText, Tag, AlertTriangle,
  Loader2, Building2, CreditCard, QrCode, Smartphone
} from "lucide-react";
import { ImageUpload } from "@/components/ui/image-upload";

interface Contact {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  note: string | null;
  imageUrl?: string | null;
  type: string;
  userId?: string | null;
  bankName?: string | null;
  bankAccountNo?: string | null;
  bankAccountName?: string | null;
  promptPayNo?: string | null;
  qrCodeUrl?: string | null;
  loansAsBorrower?: { id: string }[];
  loansAsLender?: { id: string }[];
}

// Avatar component
function Avatar({ name, size = "xl", imageUrl }: { name: string; size?: "sm" | "md" | "lg" | "xl"; imageUrl?: string | null }) {
  const initials = name ? name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() : "?";
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-24 h-24 text-3xl"
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

export default function ContactSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
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
    bankName: "",
    bankAccountNo: "",
    bankAccountName: "",
    promptPayNo: "",
    qrCodeUrl: "",
  });
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchContact();
    // Get current user
    fetch('/api/auth/session').then(r => r.json()).then(data => {
      setCurrentUserId(data?.user?.id || null);
    });
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
        bankName: data.bankName || "",
        bankAccountNo: data.bankAccountNo || "",
        bankAccountName: data.bankAccountName || "",
        promptPayNo: data.promptPayNo || "",
        qrCodeUrl: data.qrCodeUrl || "",
      });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

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
    setSaving(true);

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

      toast.success("บันทึกการแก้ไขสำเร็จ");
      router.push(`/workspaces/${workspaceId}/contacts`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/contacts/${contactId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "เกิดข้อผิดพลาด");
      }

      toast.success("ลบผู้ติดต่อสำเร็จ");
      router.push(`/workspaces/${workspaceId}/contacts`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const typeOptions = [
    { value: "BOTH", label: "ทั้งคู่ (ยืม/ให้ยืม)", icon: "🔄", description: "สามารถเป็นได้ทั้งผู้กู้และผู้ให้กู้" },
    { value: "BORROWER", label: "ผู้กู้ (ลูกหนี้)", icon: "📥", description: "เป็นผู้กู้เงินจากคุณ" },
    { value: "LENDER", label: "ผู้ให้กู้ (เจ้าหนี้)", icon: "📤", description: "เป็นผู้ให้คุณยืมเงิน" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
          กำลังโหลด...
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-lg text-muted-foreground mb-4">ไม่พบข้อมูลผู้ติดต่อ</p>
            <Link href={`/workspaces/${workspaceId}/contacts`}>
              <Button className="rounded-full">กลับไปหน้ารายชื่อ</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                <h1 className="text-lg font-semibold">ตั้งค่าผู้ติดต่อ</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => router.back()}
                disabled={saving || deleting}
                className="rounded-full gap-2"
              >
                <X className="h-4 w-4" />
                ยกเลิก
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={saving || deleting || !formData.name.trim()}
                className="rounded-full gap-2"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit}>
              {/* Profile Photo Card */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center">
                    <div className="relative mb-4">
                      <Avatar name={formData.name || "?"} size="xl" imageUrl={formData.imageUrl} />
                      <label className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full cursor-pointer hover:bg-primary/90 transition-colors shadow-lg">
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploading}
                        />
                      </label>
                    </div>
                    <h2 className="text-xl font-bold mb-1">{formData.name || "ผู้ติดต่อ"}</h2>
                    <p className="text-sm text-muted-foreground">
                      {uploading ? "กำลังอัพโหลด..." : "คลิกไอคอนเพื่อเปลี่ยนรูปภาพ"}
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

              {/* Bank Info Card */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    ข้อมูลบัญชีธนาคาร
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="bankName" className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          ธนาคาร
                        </Label>
                        <select
                          id="bankName"
                          value={formData.bankName}
                          onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg bg-card text-sm"
                        >
                          <option value="">เลือกธนาคาร</option>
                          <option value="กสิกรไทย">กสิกรไทย (KBANK)</option>
                          <option value="ไทยพาณิชย์">ไทยพาณิชย์ (SCB)</option>
                          <option value="กรุงเทพ">กรุงเทพ (BBL)</option>
                          <option value="กรุงไทย">กรุงไทย (KTB)</option>
                          <option value="ทหารไทยธนชาต">ทหารไทยธนชาต (TTB)</option>
                          <option value="กรุงศรี">กรุงศรี (BAY)</option>
                          <option value="ออมสิน">ออมสิน (GSB)</option>
                          <option value="ธ.ก.ส.">ธ.ก.ส. (BAAC)</option>
                          <option value="อื่นๆ">อื่นๆ</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bankAccountNo" className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          เลขบัญชี
                        </Label>
                        <Input
                          id="bankAccountNo"
                          value={formData.bankAccountNo}
                          onChange={(e) => setFormData({ ...formData, bankAccountNo: e.target.value })}
                          placeholder="xxx-x-xxxxx-x"
                          className="rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bankAccountName" className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        ชื่อบัญชี
                      </Label>
                      <Input
                        id="bankAccountName"
                        value={formData.bankAccountName}
                        onChange={(e) => setFormData({ ...formData, bankAccountName: e.target.value })}
                        placeholder="ชื่อเจ้าของบัญชี"
                        className="rounded-lg"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="promptPayNo" className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                        พร้อมเพย์ (PromptPay)
                      </Label>
                      <Input
                        id="promptPayNo"
                        value={formData.promptPayNo}
                        onChange={(e) => setFormData({ ...formData, promptPayNo: e.target.value })}
                        placeholder="เบอร์โทรหรือเลขบัตรประชาชน"
                        className="rounded-lg"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <QrCode className="h-4 w-4 text-muted-foreground" />
                        QR Code สำหรับโอนเงิน
                      </Label>
                      <ImageUpload
                        value={formData.qrCodeUrl}
                        onChange={(url) => setFormData({ ...formData, qrCodeUrl: url || "" })}
                        folder="contacts/qrcode"
                        placeholder="อัปโหลด QR Code"
                      />
                      <p className="text-xs text-muted-foreground">
                        รูป QR Code จากแอพธนาคาร สำหรับรับโอนเงิน
                      </p>
                    </div>
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
              <div className="lg:hidden flex gap-2 mb-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={saving || deleting}
                  className="flex-1 rounded-lg"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  disabled={saving || deleting || !formData.name.trim()}
                  className="flex-1 rounded-lg"
                >
                  {saving ? "กำลังบันทึก..." : "บันทึก"}
                </Button>
              </div>
            </form>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Contact Stats */}
            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  สถิติ
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">เป็นผู้กู้</span>
                    <span className="text-lg font-bold text-orange-600">
                      {contact.loansAsBorrower?.length || 0} สัญญา
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-muted-foreground">เป็นผู้ให้กู้</span>
                    <span className="text-lg font-bold text-green-600">
                      {contact.loansAsLender?.length || 0} สัญญา
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone - ซ่อนถ้าเป็นบัญชีตัวเอง */}
            {contact.userId !== currentUserId && (
              <Card className="border-red-200 bg-red-50/30">
                <CardContent className="p-5">
                  <h3 className="font-semibold mb-4 flex items-center gap-2 text-red-700">
                    <AlertTriangle className="h-5 w-5" />
                    พื้นที่อันตราย
                  </h3>
                  
                  {!showDeleteConfirm ? (
                    <>
                      <p className="text-sm text-muted-foreground mb-4">
                        การลบผู้ติดต่อจะไม่สามารถกู้คืนได้ โปรดตรวจสอบให้แน่ใจก่อนดำเนินการ
                      </p>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={saving || deleting}
                        className="w-full rounded-lg gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        ลบผู้ติดต่อ
                      </Button>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-red-100 rounded-lg">
                        <p className="text-sm text-red-700 font-medium mb-2">
                          ⚠️ คุณแน่ใจหรือไม่?
                        </p>
                        <p className="text-sm text-red-600">
                          การลบ {`"${contact.name}"`} จะลบข้อมูลทั้งหมดที่เกี่ยวข้องอย่างถาวร
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowDeleteConfirm(false)}
                          disabled={deleting}
                          className="flex-1 rounded-lg"
                        >
                          ยกเลิก
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={handleDelete}
                          disabled={deleting}
                          className="flex-1 rounded-lg gap-2"
                        >
                          {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          {deleting ? "กำลังลบ..." : "ยืนยันลบ"}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Info if this is own account */}
            {contact.userId === currentUserId && (
              <Card className="border-blue-200 bg-blue-50/30">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-800 mb-1">บัญชีของคุณ</h4>
                      <p className="text-sm text-blue-700">
                        นี่คือบัญชีผู้ติดต่อของคุณ ไม่สามารถลบได้
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
