"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { 
  ArrowLeft, Wallet, FileText, Calendar, Save, X, 
  Loader2, Trash2, AlertTriangle, TrendingUp, Banknote,
  Upload, User
} from "lucide-react";

interface Allocation {
  id: string;
  principalPaid: number;
  interestPaid: number;
  loan: {
    id: string;
    borrower: { name: string; imageUrl?: string };
    remainingPrincipal: number;
    accruedInterest: number;
  };
}

interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  note?: string;
  attachmentUrl?: string;
  allocations: Allocation[];
}

// Avatar component
function Avatar({ name, size = "md", imageUrl }: { name: string; size?: "sm" | "md" | "lg"; imageUrl?: string | null }) {
  const initials = name ? name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() : "?";
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  };
  
  if (imageUrl) {
    return (
      <img src={imageUrl} alt={name} className={`${sizeClasses[size]} rounded-full object-cover`} />
    );
  }
  
  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-primary to-blue-600 text-white flex items-center justify-center font-semibold`}>
      {initials}
    </div>
  );
}

export default function EditPaymentPage() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const workspaceId = params.workspaceId as string;
  const paymentId = params.paymentId as string;

  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [formData, setFormData] = useState({
    paymentDate: "",
    note: "",
  });

  useEffect(() => {
    fetchPayment();
  }, [paymentId]);

  const fetchPayment = async () => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/payments/${paymentId}`);
      if (!res.ok) throw new Error("ไม่พบข้อมูลรายการชำระ");
      const data = await res.json();
      setPayment(data);
      setFormData({
        paymentDate: new Date(data.paymentDate).toISOString().split("T")[0],
        note: data.note || "",
      });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/payments/${paymentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "เกิดข้อผิดพลาด");
      }

      toast.success("บันทึกการแก้ไขเรียบร้อย");
      router.push(`/workspaces/${workspaceId}/payments`);
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
      const res = await fetch(`/api/workspaces/${workspaceId}/payments/${paymentId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "เกิดข้อผิดพลาด");
      }

      toast.success("ลบรายการชำระเรียบร้อย");
      router.push(`/workspaces/${workspaceId}/payments`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
    }).format(amount);
  };

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

  if (!payment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <Wallet className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-lg text-muted-foreground mb-4">ไม่พบข้อมูลรายการชำระ</p>
            <Link href={`/workspaces/${workspaceId}/payments`}>
              <Button className="rounded-full">กลับไปหน้ารายการ</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalPrincipal = payment.allocations.reduce((sum, a) => sum + a.principalPaid, 0);
  const totalInterest = payment.allocations.reduce((sum, a) => sum + a.interestPaid, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Facebook-style Header */}
      <header className="bg-card sticky top-0 z-50 shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <Link 
                href={`/workspaces/${workspaceId}/payments`}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                <h1 className="text-lg font-semibold">แก้ไขรายการชำระ</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* ยอดชำระ (Read-only) */}
              <div className="p-6 rounded-xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-full bg-green-500 text-white">
                    <Wallet className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="text-sm text-green-700">ยอดชำระ</p>
                    <p className="text-3xl font-bold text-green-700">
                      {formatCurrency(payment.amount)}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-green-600 mt-4 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  ยอดชำระไม่สามารถแก้ไขได้ หากต้องการเปลี่ยนยอด กรุณาลบรายการนี้แล้วสร้างใหม่
                </p>
              </div>

              {/* วันที่ชำระ + หมายเหตุ */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentDate" className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    วันที่ชำระ *
                  </Label>
                  <Input
                    id="paymentDate"
                    type="date"
                    value={formData.paymentDate}
                    onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                    required
                    className="h-12 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="note" className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    หมายเหตุ
                  </Label>
                  <Input
                    id="note"
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    placeholder="หมายเหตุ"
                    className="h-12 rounded-xl"
                  />
                </div>
              </div>

              {/* การจัดสรร (Read-only) */}
              <div className="space-y-4">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  การจัดสรรให้สัญญา
                </Label>
                <p className="text-xs text-muted-foreground -mt-2">
                  การจัดสรรไม่สามารถแก้ไขได้หลังบันทึก
                </p>

                {payment.allocations.map((alloc) => (
                  <div key={alloc.id} className="p-4 rounded-xl bg-muted/50 space-y-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={alloc.loan.borrower.name} size="lg" imageUrl={alloc.loan.borrower.imageUrl} />
                      <div className="flex-1">
                        <p className="font-semibold text-lg">{alloc.loan.borrower.name}</p>
                        <p className="text-sm text-muted-foreground">
                          สัญญาเงินกู้
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1">
                          <Banknote className="h-3 w-3" />
                          ตัดเงินต้น
                        </Label>
                        <div className="h-12 rounded-xl bg-background border border-input flex items-center px-4">
                          <span className="font-semibold text-primary">{formatCurrency(alloc.principalPaid)}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          ตัดดอกเบี้ย
                        </Label>
                        <div className="h-12 rounded-xl bg-background border border-input flex items-center px-4">
                          <span className="font-semibold text-green-600">{formatCurrency(alloc.interestPaid)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* สรุปยอด */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">เงินต้น</p>
                    <p className="text-lg font-bold text-primary">{formatCurrency(totalPrincipal)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">ดอกเบี้ย</p>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(totalInterest)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">รวม</p>
                    <p className="text-lg font-bold">{formatCurrency(payment.amount)}</p>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              {!showDeleteConfirm ? (
                <div className="p-4 rounded-xl border-2 border-dashed border-red-200 bg-red-50/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <div>
                        <p className="font-medium text-red-700">ลบรายการชำระ</p>
                        <p className="text-xs text-red-600">ยอดจะถูกคืนกลับไปยังสัญญาเงินกู้</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={saving || deleting}
                      className="rounded-full gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      ลบ
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl border-2 border-red-300 bg-red-100">
                  <p className="text-sm text-red-700 font-medium mb-3">
                    ⚠️ คุณแน่ใจหรือไม่ที่จะลบรายการนี้? ยอดชำระ {formatCurrency(payment.amount)} จะถูกคืนกลับไปยังสัญญา
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={deleting}
                      className="flex-1 rounded-xl"
                    >
                      ยกเลิก
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex-1 rounded-xl gap-2"
                    >
                      {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      {deleting ? "กำลังลบ..." : "ยืนยันลบ"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={saving || deleting}
                  className="flex-1 h-12 rounded-xl gap-2"
                >
                  <X className="h-4 w-4" />
                  ยกเลิก
                </Button>
                <Button 
                  type="submit" 
                  disabled={saving || deleting}
                  className="flex-1 h-12 rounded-xl gap-2"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
