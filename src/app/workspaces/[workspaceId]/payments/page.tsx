"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { 
  Pencil, Trash2, X, Check, ArrowLeft, 
  Plus, Wallet, Calendar, FileText, 
  TrendingUp, Banknote, Search, Filter,
  ChevronDown, Loader2
} from "lucide-react";

interface Allocation {
  id: string;
  principalPaid: number;
  interestPaid: number;
  loan: {
    id: string;
    borrower: { name: string };
  };
}

interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  note?: string;
  allocations: Allocation[];
}

export default function PaymentsPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const workspaceId = params.workspaceId as string;

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ note: "", paymentDate: "" });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMonth, setFilterMonth] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/payments`);
      if (res.ok) {
        const data = await res.json();
        setPayments(data);
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateInput = (date: string) => {
    return new Date(date).toISOString().split("T")[0];
  };

  const handleEdit = (payment: Payment) => {
    setEditingId(payment.id);
    setEditData({
      note: payment.note || "",
      paymentDate: formatDateInput(payment.paymentDate),
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({ note: "", paymentDate: "" });
  };

  const handleSaveEdit = async (paymentId: string) => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/payments/${paymentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });

      if (res.ok) {
        toast.success("บันทึกการแก้ไขเรียบร้อย");
        setEditingId(null);
        fetchPayments();
      } else {
        const error = await res.json();
        toast.error(error.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      console.error("Error updating payment:", error);
      toast.error("เกิดข้อผิดพลาด");
    }
  };

  const handleDelete = async (paymentId: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบรายการชำระนี้? ยอดชำระจะถูกคืนกลับไปยังสัญญาเงินกู้")) {
      return;
    }

    setDeletingId(paymentId);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/payments/${paymentId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("ลบรายการชำระเรียบร้อย");
        fetchPayments();
      } else {
        const error = await res.json();
        toast.error(error.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      console.error("Error deleting payment:", error);
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setDeletingId(null);
    }
  };

  // Filter payments
  const filteredPayments = payments.filter((payment) => {
    const matchesSearch = searchQuery === "" || 
      payment.allocations.some(a => 
        a.loan.borrower.name.toLowerCase().includes(searchQuery.toLowerCase())
      ) ||
      (payment.note && payment.note.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesMonth = filterMonth === "" || 
      payment.paymentDate.startsWith(filterMonth);
    
    return matchesSearch && matchesMonth;
  });

  // Calculate summary
  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalPrincipal = payments.reduce((sum, p) => 
    sum + p.allocations.reduce((s, a) => s + a.principalPaid, 0), 0);
  const totalInterest = payments.reduce((sum, p) => 
    sum + p.allocations.reduce((s, a) => s + a.interestPaid, 0), 0);

  // Get unique months for filter
  const months = Array.from(new Set(payments.map(p => p.paymentDate.substring(0, 7)))).sort().reverse();

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

  return (
    <div className="min-h-screen bg-background">
      {/* Facebook-style Header */}
      <header className="bg-card sticky top-0 z-50 shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => router.back()}
                className="rounded-full hover:bg-muted"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                <h1 className="text-lg font-semibold">การชำระเงิน</h1>
                {payments.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-medium">
                    {payments.length}
                  </span>
                )}
              </div>
            </div>
            <Link href={`/workspaces/${workspaceId}/payments/new`}>
              <Button className="rounded-full gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">บันทึกการชำระ</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Payment List */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search & Filter */}
            {payments.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="ค้นหาด้วยชื่อผู้กู้หรือหมายเหตุ..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 rounded-full"
                      />
                    </div>
                    <div className="relative">
                      <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <select
                        value={filterMonth}
                        onChange={(e) => setFilterMonth(e.target.value)}
                        className="pl-9 pr-8 h-10 rounded-full border border-input bg-background text-sm appearance-none cursor-pointer min-w-[160px]"
                      >
                        <option value="">ทุกเดือน</option>
                        {months.map((month) => (
                          <option key={month} value={month}>
                            {new Date(month + "-01").toLocaleDateString("th-TH", { year: "numeric", month: "long" })}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {payments.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Wallet className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-lg text-muted-foreground mb-2">ยังไม่มีการชำระเงิน</p>
                  <p className="text-sm text-muted-foreground mb-6">เริ่มบันทึกการชำระเงินครั้งแรกของคุณ</p>
                  <Link href={`/workspaces/${workspaceId}/payments/new`}>
                    <Button className="rounded-full gap-2">
                      <Plus className="h-4 w-4" />
                      บันทึกการชำระแรก
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : filteredPayments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-lg text-muted-foreground mb-2">ไม่พบรายการที่ค้นหา</p>
                  <Button 
                    variant="outline" 
                    onClick={() => { setSearchQuery(""); setFilterMonth(""); }}
                    className="rounded-full"
                  >
                    ล้างตัวกรอง
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {filteredPayments.map((payment) => (
                  <Card key={payment.id} className="group hover:shadow-md transition-shadow">
                    <CardContent className="p-0">
                      {editingId === payment.id ? (
                        // Edit Mode
                        <div className="p-4 space-y-4">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className="p-3 rounded-full bg-green-100">
                                <Wallet className="h-5 w-5 text-green-600" />
                              </div>
                              <p className="text-2xl font-bold text-green-600">
                                {formatCurrency(payment.amount)}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={handleCancelEdit}
                                className="rounded-full h-9 w-9"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                onClick={() => handleSaveEdit(payment.id)}
                                className="rounded-full h-9 w-9"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                วันที่ชำระ
                              </Label>
                              <Input
                                type="date"
                                value={editData.paymentDate}
                                onChange={(e) =>
                                  setEditData({ ...editData, paymentDate: e.target.value })
                                }
                                className="rounded-lg"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                หมายเหตุ
                              </Label>
                              <Input
                                value={editData.note}
                                onChange={(e) =>
                                  setEditData({ ...editData, note: e.target.value })
                                }
                                placeholder="หมายเหตุ"
                                className="rounded-lg"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        // View Mode
                        <>
                          <div 
                            className="p-4 flex items-center gap-4 cursor-pointer"
                            onClick={() => setExpandedId(expandedId === payment.id ? null : payment.id)}
                          >
                            <div className="p-3 rounded-full bg-green-100 flex-shrink-0">
                              <Wallet className="h-5 w-5 text-green-600" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <p className="text-xl font-bold text-green-600">
                                {formatCurrency(payment.amount)}
                              </p>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3.5 w-3.5" />
                                  {formatDate(payment.paymentDate)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <FileText className="h-3.5 w-3.5" />
                                  {payment.allocations.length} สัญญา
                                </span>
                              </div>
                              {payment.note && (
                                <p className="text-sm text-muted-foreground mt-1 truncate">
                                  💬 {payment.note}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              <Link href={`/workspaces/${workspaceId}/payments/${payment.id}/edit`}>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={(e) => e.stopPropagation()}
                                  className="rounded-full h-9 w-9 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-destructive hover:text-destructive rounded-full h-9 w-9 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => { e.stopPropagation(); handleDelete(payment.id); }}
                                disabled={deletingId === payment.id}
                              >
                                {deletingId === payment.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                              <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${expandedId === payment.id ? 'rotate-180' : ''}`} />
                            </div>
                          </div>

                          {/* Allocations - Expandable */}
                          {expandedId === payment.id && payment.allocations.length > 0 && (
                            <div className="px-4 pb-4 pt-0 border-t border-border">
                              <p className="text-xs uppercase tracking-wide text-muted-foreground my-3 flex items-center gap-2">
                                <TrendingUp className="h-3.5 w-3.5" />
                                การจัดสรร
                              </p>
                              <div className="space-y-2">
                                {payment.allocations.map((alloc) => (
                                  <div
                                    key={alloc.id}
                                    className="flex items-center justify-between bg-muted/50 rounded-xl px-4 py-3"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-blue-600 text-white flex items-center justify-center text-xs font-semibold">
                                        {alloc.loan.borrower.name.charAt(0)}
                                      </div>
                                      <span className="font-medium">{alloc.loan.borrower.name}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm">
                                      <div className="text-right">
                                        <p className="text-xs text-muted-foreground">เงินต้น</p>
                                        <p className="font-semibold text-primary">{formatCurrency(alloc.principalPaid)}</p>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-xs text-muted-foreground">ดอกเบี้ย</p>
                                        <p className="font-semibold text-green-600">{formatCurrency(alloc.interestPaid)}</p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Summary Sidebar */}
          <div className="space-y-4">
            {/* Summary Stats */}
            <Card className="sticky top-20">
              <CardContent className="p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  สรุปการชำระ
                </h3>
                
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Wallet className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-700">ยอดรวมทั้งหมด</span>
                    </div>
                    <p className="text-2xl font-bold text-green-700">{formatCurrency(totalAmount)}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Banknote className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs text-muted-foreground">เงินต้น</span>
                      </div>
                      <p className="text-lg font-bold text-primary">{formatCurrency(totalPrincipal)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-1.5 mb-1">
                        <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                        <span className="text-xs text-muted-foreground">ดอกเบี้ย</span>
                      </div>
                      <p className="text-lg font-bold text-green-600">{formatCurrency(totalInterest)}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-muted-foreground">จำนวนรายการ</span>
                      <span className="font-bold">{payments.length}</span>
                    </div>
                    {filterMonth && (
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-muted-foreground">รายการที่แสดง</span>
                        <span className="font-bold text-primary">{filteredPayments.length}</span>
                      </div>
                    )}
                  </div>
                </div>

                {payments.length > 0 && (
                  <Link href={`/workspaces/${workspaceId}/payments/new`} className="block mt-4">
                    <Button className="w-full rounded-full gap-2">
                      <Plus className="h-4 w-4" />
                      บันทึกการชำระใหม่
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>

            {/* Quick Tips */}
            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold mb-3 text-sm">💡 เคล็ดลับ</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    คลิกที่รายการเพื่อดูรายละเอียดการจัดสรร
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    ใช้ตัวกรองเพื่อดูรายการตามเดือน
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    การลบรายการจะคืนยอดกลับไปยังสัญญา
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
