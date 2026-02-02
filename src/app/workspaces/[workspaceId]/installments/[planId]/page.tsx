"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "@/components/ui/image-upload";
import { 
  ArrowLeft, 
  ShoppingBag, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  User,
  Calendar,
  CreditCard,
  Percent,
  Package,
  Phone,
  Mail,
  MoreHorizontal,
  FileText,
  Receipt,
  Image as ImageIcon,
  X
} from "lucide-react";
import { useToast } from "@/components/ui/toast";

// Avatar component
function Avatar({ name, size = "md", imageUrl }: { name: string; size?: "sm" | "md" | "lg" | "xl"; imageUrl?: string | null }) {
  const initials = name ? name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() : "?";
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-lg"
  };
  
  if (imageUrl) {
    return (
      <img src={imageUrl} alt={name} className={`${sizeClasses[size]} rounded-full object-cover`} />
    );
  }
  
  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-white flex items-center justify-center font-semibold`}>
      {initials}
    </div>
  );
}

interface Installment {
  id: string;
  termNumber: number;
  amount: number;
  principalAmount: number;
  interestAmount: number;
  dueDate: string;
  status: string;
  paidAmount: number;
  paidDate?: string;
  slipImageUrl?: string;
}

interface InstallmentPlan {
  id: string;
  itemName: string;
  itemDescription?: string;
  itemImageUrl?: string;
  totalAmount: number;
  downPayment: number;
  numberOfTerms: number;
  termAmount: number;
  interestRate: number;
  status: string;
  startDate: string;
  contact: { 
    id: string; 
    name: string; 
    phone?: string; 
    email?: string; 
    imageUrl?: string | null 
  };
  installments: Installment[];
}

interface Summary {
  totalPaid: number;
  totalDue: number;
  remainingAmount: number;
  paidCount: number;
  overdueCount: number;
  progress: number;
}

export default function InstallmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const workspaceId = params.workspaceId as string;
  const planId = params.planId as string;

  const [plan, setPlan] = useState<InstallmentPlan | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [slipImageUrl, setSlipImageUrl] = useState("");
  const [viewingSlip, setViewingSlip] = useState<string | null>(null);

  const fetchPlan = async () => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/installments/${planId}`);
      const data = await res.json();
      setPlan(data.plan);
      setSummary(data.summary);
    } catch (error) {
      console.error("Error fetching plan:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, [workspaceId, planId]);

  const handlePayment = async (installmentId: string, amount: number) => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/installments/${planId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          installmentId,
          amount,
          paidDate: new Date(payDate).toISOString(),
          slipImageUrl: slipImageUrl || undefined,
        }),
      });

      if (res.ok) {
        setPayingId(null);
        setEditingId(null);
        setPayAmount("");
        setPayDate(new Date().toISOString().split("T")[0]);
        setSlipImageUrl("");
        fetchPlan();
        toast.success("ชำระงวดสำเร็จ");
      } else {
        const error = await res.json();
        toast.error(error.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      console.error("Error paying:", error);
      toast.error("เกิดข้อผิดพลาด");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PAID":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "OVERDUE":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; label: string }> = {
      PENDING: { color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200", label: "รอชำระ" },
      PAID: { color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", label: "ชำระแล้ว" },
      OVERDUE: { color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", label: "ค้างชำระ" },
      PARTIAL: { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", label: "ชำระบางส่วน" },
    };
    return badges[status] || { color: "bg-gray-100 text-gray-800", label: status };
  };

  const getPlanStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; label: string }> = {
      ACTIVE: { color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", label: "กำลังผ่อน" },
      COMPLETED: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", label: "ผ่อนครบ" },
      CANCELLED: { color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200", label: "ยกเลิก" },
    };
    return badges[status] || { color: "bg-gray-100 text-gray-800", label: status };
  };

  const financeAmount = plan ? plan.totalAmount - plan.downPayment : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
          <p className="text-muted-foreground">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">ไม่พบข้อมูล</p>
          <Link href={`/workspaces/${workspaceId}/installments`}>
            <Button variant="outline" className="mt-4">กลับไปหน้ารายการ</Button>
          </Link>
        </div>
      </div>
    );
  }

  const planStatus = getPlanStatusBadge(plan.status);
  const progressPercent = summary ? summary.progress : 0;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Facebook-style Header */}
      <header className="bg-card sticky top-0 z-50 shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <Link
                href={`/workspaces/${workspaceId}/installments`}
                className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex items-center gap-2">
                {plan.itemImageUrl ? (
                  <img 
                    src={plan.itemImageUrl} 
                    alt={plan.itemName}
                    className="w-9 h-9 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-purple-500">
                    <ShoppingBag className="h-4 w-4 text-white" />
                  </div>
                )}
                <div>
                  <h1 className="font-semibold text-base line-clamp-1">{plan.itemName}</h1>
                  <p className="text-xs text-muted-foreground">รายละเอียดการผ่อน</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-1 rounded-full ${planStatus.color}`}>
                {planStatus.label}
              </span>
              <Button variant="ghost" size="icon" className="rounded-full">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Product Info Card */}
            <div className="bg-card rounded-xl shadow-sm overflow-hidden">
              <div className="p-6">
                {/* Product Header with balanced image */}
                <div className="flex flex-col sm:flex-row gap-6 mb-6">
                  {plan.itemImageUrl ? (
                    <div className="flex-shrink-0 mx-auto sm:mx-0">
                      <img 
                        src={plan.itemImageUrl} 
                        alt={plan.itemName}
                        className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl object-cover shadow-lg border-4 border-white dark:border-gray-800"
                      />
                    </div>
                  ) : (
                    <div className="flex-shrink-0 mx-auto sm:mx-0">
                      <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 flex items-center justify-center shadow-lg">
                        <Package className="h-16 w-16 text-purple-500" />
                      </div>
                    </div>
                  )}
                  
                  <div className="flex-1 text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                      <div>
                        <h2 className="text-2xl font-bold">{plan.itemName}</h2>
                        {plan.itemDescription && (
                          <p className="text-muted-foreground mt-1">{plan.itemDescription}</p>
                        )}
                      </div>
                      <span className={`inline-flex text-xs px-3 py-1 rounded-full ${planStatus.color}`}>
                        {planStatus.label}
                      </span>
                    </div>
                    
                    {/* Key stats inline */}
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="bg-purple-50 dark:bg-purple-950/30 rounded-xl p-3">
                        <p className="text-xs text-muted-foreground">ราคาสินค้า</p>
                        <p className="text-lg font-bold text-purple-600">฿{Number(plan.totalAmount).toLocaleString()}</p>
                      </div>
                      <div className="bg-green-50 dark:bg-green-950/30 rounded-xl p-3">
                        <p className="text-xs text-muted-foreground">ยอดผ่อน</p>
                        <p className="text-lg font-bold text-green-600">฿{financeAmount.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4 pt-4 border-t">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                      <Package className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">เงินดาวน์</p>
                      <p className="font-semibold">฿{Number(plan.downPayment).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">จำนวนงวด</p>
                      <p className="font-semibold">{plan.numberOfTerms} งวด</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">ผ่อนงวดละ</p>
                      <p className="font-semibold">฿{Number(plan.termAmount).toLocaleString()}</p>
                    </div>
                  </div>
                  {plan.interestRate > 0 && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                        <Percent className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">ดอกเบี้ย</p>
                        <p className="font-semibold">{plan.interestRate}%</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">วันที่เริ่ม</p>
                      <p className="font-semibold">{new Date(plan.startDate).toLocaleDateString("th-TH")}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Installments List */}
            <div className="bg-card rounded-xl shadow-sm p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                รายการงวด ({plan.installments.length} งวด)
              </h3>
              
              <div className="space-y-3">
                {plan.installments.map((installment) => {
                  const status = getStatusBadge(installment.status);
                  const isPending = installment.status === "PENDING" || installment.status === "OVERDUE";
                  const isPaid = installment.status === "PAID";
                  const isOverdue = installment.status === "OVERDUE";
                  const isActive = payingId === installment.id || editingId === installment.id;

                  return (
                    <div
                      key={installment.id}
                      className={`rounded-xl border transition-colors ${
                        isOverdue 
                          ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30" 
                          : isPaid 
                            ? "bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800" 
                            : "hover:bg-muted/30"
                      }`}
                    >
                      {/* Main Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4">
                        <div className="flex items-center gap-4 mb-3 sm:mb-0">
                          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                            isPaid 
                              ? "bg-green-100 dark:bg-green-900" 
                              : isOverdue 
                                ? "bg-red-100 dark:bg-red-900"
                                : "bg-gray-100 dark:bg-gray-800"
                          }`}>
                            {getStatusIcon(installment.status)}
                          </div>
                          <div>
                            <p className="font-medium">งวดที่ {installment.termNumber}</p>
                            <p className="text-sm text-muted-foreground">
                              กำหนด: {new Date(installment.dueDate).toLocaleDateString("th-TH")}
                            </p>
                            {installment.paidDate && (
                              <p className="text-xs text-green-600">
                                ชำระเมื่อ {new Date(installment.paidDate).toLocaleDateString("th-TH")}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right mr-2">
                            <p className="font-semibold text-lg">฿{Number(installment.amount).toLocaleString()}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>
                              {status.label}
                            </span>
                          </div>

                          {/* Show slip button if already paid */}
                          {installment.slipImageUrl && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setViewingSlip(installment.slipImageUrl!)}
                              className="rounded-full gap-1"
                            >
                              <Receipt className="h-4 w-4" />
                              <span className="hidden sm:inline">ดูสลิป</span>
                            </Button>
                          )}

                          {/* Action buttons */}
                          {isPending && !isActive && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setPayingId(installment.id);
                                setPayAmount(String(installment.amount));
                                setPayDate(new Date().toISOString().split("T")[0]);
                                setSlipImageUrl("");
                              }}
                              className="rounded-full bg-purple-600 hover:bg-purple-700"
                            >
                              ชำระ
                            </Button>
                          )}

                          {/* Edit button for paid installments */}
                          {isPaid && !isActive && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingId(installment.id);
                                setPayAmount(String(installment.paidAmount || installment.amount));
                                setPayDate(installment.paidDate ? new Date(installment.paidDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]);
                                setSlipImageUrl(installment.slipImageUrl || "");
                              }}
                              className="rounded-full gap-1"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="hidden sm:inline">แก้ไข</span>
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Expanded Payment Form */}
                      {isActive && (
                        <div className="px-4 pb-4 pt-2 border-t bg-muted/30">
                          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div>
                              <label className="text-sm font-medium text-muted-foreground mb-1 block">
                                จำนวนเงิน
                              </label>
                              <Input
                                type="number"
                                placeholder="จำนวนเงิน"
                                value={payAmount}
                                onChange={(e) => setPayAmount(e.target.value)}
                                className="rounded-lg"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground mb-1 block">
                                วันที่ชำระ
                              </label>
                              <Input
                                type="date"
                                value={payDate}
                                onChange={(e) => setPayDate(e.target.value)}
                                className="rounded-lg"
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="text-sm font-medium text-muted-foreground mb-1 block">
                                แนบสลิปการชำระ
                              </label>
                              <ImageUpload
                                value={slipImageUrl}
                                onChange={(url) => setSlipImageUrl(url || "")}
                                folder="installment-slips"
                                placeholder="เลือกไฟล์สลิป"
                              />
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => { 
                                setPayingId(null); 
                                setEditingId(null);
                                setPayAmount(""); 
                                setPayDate(new Date().toISOString().split("T")[0]);
                                setSlipImageUrl(""); 
                              }}
                              className="rounded-full"
                            >
                              ยกเลิก
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handlePayment(installment.id, parseFloat(payAmount))}
                              disabled={!payAmount}
                              className="rounded-full bg-purple-600 hover:bg-purple-700"
                            >
                              {editingId ? "บันทึกการแก้ไข" : "ยืนยันการชำระ"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="bg-card rounded-xl shadow-sm p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-purple-600" />
                ข้อมูลลูกค้า
              </h3>
              
              <div className="flex items-center gap-3 mb-4">
                <Avatar name={plan.contact.name} size="lg" imageUrl={plan.contact.imageUrl} />
                <div>
                  <p className="font-medium">{plan.contact.name}</p>
                  <p className="text-sm text-muted-foreground">ลูกค้า</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {plan.contact.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{plan.contact.phone}</span>
                  </div>
                )}
                {plan.contact.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{plan.contact.email}</span>
                  </div>
                )}
              </div>

              <Link href={`/workspaces/${workspaceId}/contacts/${plan.contact.id}`}>
                <Button variant="outline" size="sm" className="w-full mt-4 rounded-full">
                  ดูข้อมูลลูกค้า
                </Button>
              </Link>
            </div>

            {/* Payment Summary */}
            {summary && (
              <div className="bg-card rounded-xl shadow-sm p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-purple-600" />
                  สรุปการชำระ
                </h3>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">ความคืบหน้า</span>
                    <span className="font-medium">{summary.paidCount}/{plan.numberOfTerms} งวด</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 text-right">
                    {progressPercent}%
                  </p>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ชำระแล้ว</span>
                    <span className="font-semibold text-green-600">
                      ฿{(summary.totalPaid ?? 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">คงเหลือ</span>
                    <span className="font-semibold">
                      ฿{(summary.remainingAmount ?? 0).toLocaleString()}
                    </span>
                  </div>
                  {(summary.overdueCount ?? 0) > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>ค้างชำระ</span>
                      <span className="font-semibold">{summary.overdueCount} งวด</span>
                    </div>
                  )}
                </div>

                {/* Monthly Payment Highlight */}
                <div className="mt-4 p-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl text-white">
                  <p className="text-sm opacity-90">ผ่อนเดือนละ</p>
                  <p className="text-2xl font-bold">
                    ฿{Number(plan.termAmount).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Slip Viewer Modal */}
      {viewingSlip && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setViewingSlip(null)}
        >
          <div className="relative max-w-2xl max-h-[90vh]">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setViewingSlip(null)}
              className="absolute -top-12 right-0 text-white hover:bg-white/20 rounded-full"
            >
              <X className="h-6 w-6" />
            </Button>
            <img 
              src={viewingSlip} 
              alt="สลิปการชำระ"
              className="max-w-full max-h-[85vh] rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
