"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { 
  ArrowLeft, CreditCard as CreditCardIcon, Settings, Trash2, 
  Calendar, Wallet, TrendingUp, AlertTriangle, Loader2,
  Plus, ChevronDown, Check, X, Banknote, Receipt
} from "lucide-react";

interface Statement {
  id: string;
  statementDate: string;
  dueDate: string;
  openingBalance: number;
  closingBalance: number;
  minimumPayment: number;
  totalPaid: number;
  interestCharged: number;
  isPaid: boolean;
}

interface CreditCardData {
  id: string;
  name: string;
  cardNumber: string | null;
  creditLimit: number;
  currentBalance: number;
  statementCutDay: number;
  paymentDueDays: number;
  minPaymentPercent: number;
  minPaymentFixed: number | null;
  interestRate: number;
  statements: Statement[];
}

export default function CreditCardDetailPage() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const workspaceId = params.workspaceId as string;
  const cardId = params.cardId as string;

  const [card, setCard] = useState<CreditCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedStatementId, setExpandedStatementId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    cardNumber: "",
    creditLimit: "",
    statementCutDay: "",
    paymentDueDays: "",
    minPaymentPercent: "",
    minPaymentFixed: "",
    interestRate: "",
  });

  const fetchCard = useCallback(async () => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/credit-cards/${cardId}`);
      if (!res.ok) throw new Error("ไม่พบข้อมูลบัตรเครดิต");
      const data = await res.json();
      
      // API returns { card, statements, unpaidStatements, totalUnpaid, availableCredit }
      // Combine card and statements into one object
      const cardData = {
        ...data.card,
        statements: data.statements || [],
      };
      
      setCard(cardData);
      setFormData({
        name: cardData.name || "",
        cardNumber: cardData.cardNumber || "",
        creditLimit: cardData.creditLimit?.toString() || "",
        statementCutDay: cardData.statementCutDay?.toString() || "",
        paymentDueDays: cardData.paymentDueDays?.toString() || "",
        minPaymentPercent: (cardData.minPaymentPercent * 100)?.toString() || "5",
        minPaymentFixed: cardData.minPaymentFixed?.toString() || "",
        interestRate: (cardData.interestRate * 100)?.toString() || "",
      });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, cardId, toast]);

  useEffect(() => {
    fetchCard();
  }, [fetchCard]);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/credit-cards/${cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          cardNumber: formData.cardNumber || null,
          creditLimit: parseFloat(formData.creditLimit),
          statementCutDay: parseInt(formData.statementCutDay),
          paymentDueDays: parseInt(formData.paymentDueDays),
          minPaymentPercent: parseFloat(formData.minPaymentPercent) / 100,
          minPaymentFixed: formData.minPaymentFixed ? parseFloat(formData.minPaymentFixed) : null,
          interestRate: parseFloat(formData.interestRate) / 100,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "เกิดข้อผิดพลาด");
      }

      toast.success("บันทึกการตั้งค่าเรียบร้อย");
      setShowSettings(false);
      fetchCard();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/credit-cards/${cardId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "เกิดข้อผิดพลาด");
      }

      toast.success("ลบบัตรเครดิตเรียบร้อย");
      router.push(`/workspaces/${workspaceId}/credit-cards`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

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

  if (!card) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <CreditCardIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-lg text-muted-foreground mb-4">ไม่พบข้อมูลบัตรเครดิต</p>
            <Link href={`/workspaces/${workspaceId}/credit-cards`}>
              <Button className="rounded-full">กลับไปหน้ารายการ</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const availableCredit = card.creditLimit - card.currentBalance;
  const usagePercent = (card.currentBalance / card.creditLimit) * 100;
  const unpaidStatements = card.statements.filter(s => !s.isPaid);
  const paidStatements = card.statements.filter(s => s.isPaid);

  return (
    <div className="min-h-screen bg-background">
      {/* Facebook-style Header */}
      <header className="bg-card sticky top-0 z-50 shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <Link 
                href={`/workspaces/${workspaceId}/credit-cards`}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <CreditCardIcon className="h-5 w-5 text-primary" />
                <h1 className="text-lg font-semibold">{card.name}</h1>
                {card.cardNumber && (
                  <span className="text-sm text-muted-foreground">**** {card.cardNumber}</span>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowSettings(!showSettings)}
              className="rounded-full gap-2"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">ตั้งค่า</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Credit Card Visual */}
            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 text-white overflow-hidden">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <p className="text-sm text-slate-300 mb-1">วงเงินใช้ไป</p>
                    <p className="text-3xl font-bold">{formatCurrency(card.currentBalance)}</p>
                  </div>
                  <CreditCardIcon className="h-10 w-10 text-slate-400" />
                </div>
                
                {/* Progress bar */}
                <div className="mb-4">
                  <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        usagePercent > 80 ? "bg-red-500" : usagePercent > 50 ? "bg-yellow-500" : "bg-green-500"
                      }`}
                      style={{ width: `${Math.min(usagePercent, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm mt-2 text-slate-400">
                    <span>{usagePercent.toFixed(1)}% ใช้ไป</span>
                    <span>วงเงิน {formatCurrency(card.creditLimit)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
                  <div>
                    <p className="text-xs text-slate-400">วงเงินคงเหลือ</p>
                    <p className="text-xl font-semibold text-green-400">{formatCurrency(availableCredit)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">ดอกเบี้ย/เดือน</p>
                    <p className="text-xl font-semibold">{(card.interestRate * 100).toFixed(2)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Unpaid Statements */}
            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-orange-500" />
                  รอบบิลที่ยังไม่ชำระ
                  {unpaidStatements.length > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {unpaidStatements.length}
                    </Badge>
                  )}
                </h3>

                {unpaidStatements.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <Check className="h-12 w-12 mx-auto mb-2 text-green-500" />
                    ไม่มีรอบบิลค้างชำระ
                  </div>
                ) : (
                  <div className="space-y-3">
                    {unpaidStatements.map((statement) => {
                      const remaining = statement.closingBalance - statement.totalPaid;
                      const isOverdue = new Date(statement.dueDate) < new Date();
                      
                      return (
                        <div
                          key={statement.id}
                          className={`p-4 rounded-xl border-2 ${
                            isOverdue ? "border-red-200 bg-red-50/50" : "border-orange-200 bg-orange-50/50"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">รอบบิล {formatDate(statement.statementDate)}</span>
                            </div>
                            <Badge variant={isOverdue ? "destructive" : "outline"}>
                              {isOverdue ? "เกินกำหนด" : `ครบกำหนด ${formatDate(statement.dueDate)}`}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">ยอดบิล</p>
                              <p className="font-semibold">{formatCurrency(statement.closingBalance)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">ชำระแล้ว</p>
                              <p className="font-semibold text-green-600">{formatCurrency(statement.totalPaid)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">คงเหลือ</p>
                              <p className="font-semibold text-orange-600">{formatCurrency(remaining)}</p>
                            </div>
                          </div>

                          <div className="mt-3 pt-3 border-t flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              ขั้นต่ำ: {formatCurrency(statement.minimumPayment)}
                            </span>
                            <Button size="sm" className="rounded-full gap-2">
                              <Wallet className="h-4 w-4" />
                              ชำระเงิน
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Paid Statements */}
            {paidStatements.length > 0 && (
              <Card>
                <CardContent className="p-5">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    ประวัติรอบบิล
                  </h3>
                  <div className="space-y-2">
                    {paidStatements.slice(0, 5).map((statement) => (
                      <div
                        key={statement.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                            <Check className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">รอบบิล {formatDate(statement.statementDate)}</p>
                            <p className="text-xs text-muted-foreground">ชำระแล้ว</p>
                          </div>
                        </div>
                        <span className="font-semibold">{formatCurrency(statement.closingBalance)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-4">
            {/* Card Info */}
            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <CreditCardIcon className="h-5 w-5 text-primary" />
                  ข้อมูลบัตร
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">วันตัดรอบ</span>
                    <span className="font-medium">วันที่ {card.statementCutDay}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">ครบกำหนดชำระ</span>
                    <span className="font-medium">+{card.paymentDueDays} วัน</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">ชำระขั้นต่ำ</span>
                    <span className="font-medium">{(card.minPaymentPercent * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">ดอกเบี้ย/เดือน</span>
                    <span className="font-medium">{(card.interestRate * 100).toFixed(2)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Settings Panel */}
            {showSettings && (
              <Card className="border-primary">
                <CardContent className="p-5">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    แก้ไขข้อมูลบัตร
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>ชื่อบัตร</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>เลข 4 หลักท้าย</Label>
                      <Input
                        value={formData.cardNumber}
                        onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                        maxLength={4}
                        className="rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>วงเงิน (บาท)</Label>
                      <Input
                        type="number"
                        value={formData.creditLimit}
                        onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                        className="rounded-lg"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>วันตัดรอบ</Label>
                        <Input
                          type="number"
                          min="1"
                          max="31"
                          value={formData.statementCutDay}
                          onChange={(e) => setFormData({ ...formData, statementCutDay: e.target.value })}
                          className="rounded-lg"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>+กี่วันถึงDue</Label>
                        <Input
                          type="number"
                          value={formData.paymentDueDays}
                          onChange={(e) => setFormData({ ...formData, paymentDueDays: e.target.value })}
                          className="rounded-lg"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>ขั้นต่ำ (%)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={formData.minPaymentPercent}
                          onChange={(e) => setFormData({ ...formData, minPaymentPercent: e.target.value })}
                          className="rounded-lg"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>ดอกเบี้ย (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.interestRate}
                          onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                          className="rounded-lg"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowSettings(false)}
                        className="flex-1 rounded-lg"
                      >
                        ยกเลิก
                      </Button>
                      <Button
                        onClick={handleSaveSettings}
                        disabled={saving}
                        className="flex-1 rounded-lg"
                      >
                        {saving ? "กำลังบันทึก..." : "บันทึก"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Danger Zone */}
            <Card className="border-red-200 bg-red-50/30">
              <CardContent className="p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-5 w-5" />
                  พื้นที่อันตราย
                </h3>
                
                {!showDeleteConfirm ? (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      การลบบัตรเครดิตจะลบข้อมูลรอบบิลทั้งหมด
                    </p>
                    <Button
                      variant="destructive"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full rounded-lg gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      ลบบัตรเครดิต
                    </Button>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-red-100 rounded-lg">
                      <p className="text-sm text-red-700 font-medium mb-2">⚠️ คุณแน่ใจหรือไม่?</p>
                      <p className="text-sm text-red-600">
                        การลบ {`"${card.name}"`} จะลบข้อมูลทั้งหมดอย่างถาวร
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={deleting}
                        className="flex-1 rounded-lg"
                      >
                        ยกเลิก
                      </Button>
                      <Button
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
          </div>
        </div>
      </main>
    </div>
  );
}
