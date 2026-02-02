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
  ArrowLeft, FileText, Save, X, 
  User, Wallet, Calendar, Percent, 
  ChevronRight, AlertCircle, Search, Check, ImageIcon
} from "lucide-react";
import { ImageUpload } from "@/components/ui/image-upload";

interface Contact {
  id: string;
  name: string;
  type: string;
  imageUrl?: string;
}

interface InterestPolicy {
  id: string;
  name: string;
  mode: string;
  monthlyRate?: number;
  dailyRate?: number;
}

// Avatar component
function Avatar({ name, size = "md", imageUrl }: { name: string; size?: "sm" | "md" | "lg"; imageUrl?: string | null }) {
  const initials = name ? name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() : "?";
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base"
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

export default function NewLoanPage() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const workspaceId = params.workspaceId as string;

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [policies, setPolicies] = useState<InterestPolicy[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  const [formData, setFormData] = useState({
    borrowerId: "",
    principal: "",
    startDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    interestPolicyId: "",
    note: "",
    imageUrl: "",
  });

  const [borrowerSearch, setBorrowerSearch] = useState("");
  const [showBorrowerDropdown, setShowBorrowerDropdown] = useState(false);

  useEffect(() => {
    setDataLoading(true);
    Promise.all([
      fetch(`/api/workspaces/${workspaceId}/contacts`).then((r) => r.json()),
      fetch(`/api/workspaces/${workspaceId}/interest-policies`).then((r) => r.json()),
    ]).then(([contactsData, policiesData]) => {
      setContacts(contactsData);
      setPolicies(policiesData);
      setDataLoading(false);
    }).catch(() => {
      setDataLoading(false);
    });
  }, [workspaceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/loans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          principal: parseFloat(formData.principal),
          interestPolicyId: formData.interestPolicyId || undefined,
          dueDate: formData.dueDate || undefined,
          imageUrl: formData.imageUrl || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "เกิดข้อผิดพลาด");
      }

      toast.success("สร้างสัญญาเงินกู้สำเร็จ");
      router.push(`/workspaces/${workspaceId}/loans`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const borrowers = contacts.filter((c) => c.type === "BORROWER" || c.type === "BOTH");
  const selectedBorrower = borrowers.find(b => b.id === formData.borrowerId);
  const selectedPolicy = policies.find(p => p.id === formData.interestPolicyId);

  // Filter borrowers by search query
  const filteredBorrowers = borrowers.filter((c) =>
    c.name.toLowerCase().includes(borrowerSearch.toLowerCase())
  );

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return "฿0";
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
    }).format(num);
  };

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          กำลังโหลดข้อมูล...
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
              <Link 
                href={`/workspaces/${workspaceId}/loans`} 
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <h1 className="text-lg font-semibold">สร้างสัญญาเงินกู้</h1>
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
                disabled={loading || !formData.borrowerId || !formData.principal}
                className="rounded-full gap-2"
              >
                <Save className="h-4 w-4" />
                {loading ? "กำลังบันทึก..." : "สร้างสัญญา"}
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
              {/* Borrower Selection Card */}
              {/* Info Banner */}
              <Card className="mb-6 border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-800 mb-1">บันทึกสัญญาเงินกู้</h4>
                      <p className="text-sm text-blue-700">
                        หน้านี้ใช้สำหรับบันทึกลูกหนี้
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="mb-6">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    ผู้กู้ (ลูกหนี้)
                    <span className="text-red-500">*</span>
                  </h3>
                  
                  {borrowers.length === 0 ? (
                    <div className="text-center py-8 bg-muted/50 rounded-lg">
                      <AlertCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-muted-foreground mb-4">ยังไม่มีผู้ติดต่อที่เป็นผู้กู้</p>
                      <Link href={`/workspaces/${workspaceId}/contacts/new`}>
                        <Button variant="outline" className="rounded-lg">
                          เพิ่มผู้ติดต่อใหม่
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Search Input */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="ค้นหาผู้กู้..."
                          value={borrowerSearch}
                          onChange={(e) => {
                            setBorrowerSearch(e.target.value);
                            setShowBorrowerDropdown(true);
                          }}
                          onFocus={() => setShowBorrowerDropdown(true)}
                          className="pl-9 rounded-lg"
                        />
                      </div>

                      {/* Selected Borrower Display */}
                      {selectedBorrower && !showBorrowerDropdown && (
                        <div 
                          className="flex items-center gap-3 p-4 rounded-xl border-2 border-primary bg-primary/5 cursor-pointer"
                          onClick={() => setShowBorrowerDropdown(true)}
                        >
                          <Avatar name={selectedBorrower.name} size="lg" imageUrl={selectedBorrower.imageUrl} />
                          <div className="flex-1">
                            <p className="font-semibold text-lg">{selectedBorrower.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {selectedBorrower.type === "BORROWER" ? "📥 ผู้กู้" : "🔄 ทั้งคู่"}
                            </p>
                          </div>
                          <div className="p-2 rounded-full bg-primary text-white">
                            <Check className="h-4 w-4" />
                          </div>
                        </div>
                      )}

                      {/* Dropdown Menu */}
                      {showBorrowerDropdown && (
                        <div className="border rounded-xl shadow-lg bg-card max-h-64 overflow-y-auto">
                          {filteredBorrowers.length === 0 ? (
                            <div className="p-4 text-center text-muted-foreground">
                              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p>ไม่พบผู้กู้ที่ค้นหา</p>
                            </div>
                          ) : (
                            filteredBorrowers.map((contact) => (
                              <div
                                key={contact.id}
                                className={`flex items-center gap-3 p-3 cursor-pointer transition-colors hover:bg-muted ${
                                  formData.borrowerId === contact.id ? 'bg-primary/10' : ''
                                }`}
                                onClick={() => {
                                  setFormData({ ...formData, borrowerId: contact.id });
                                  setShowBorrowerDropdown(false);
                                  setBorrowerSearch("");
                                }}
                              >
                                <Avatar name={contact.name} size="md" imageUrl={contact.imageUrl} />
                                <div className="flex-1">
                                  <p className="font-medium">{contact.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {contact.type === "BORROWER" ? "📥 ผู้กู้" : "🔄 ทั้งคู่"}
                                  </p>
                                </div>
                                {formData.borrowerId === contact.id && (
                                  <Check className="h-5 w-5 text-primary" />
                                )}
                              </div>
                            ))
                          )}
                          
                          {/* Add new contact option */}
                          <Link 
                            href={`/workspaces/${workspaceId}/contacts/new`}
                            className="flex items-center gap-3 p-3 border-t hover:bg-muted transition-colors text-primary"
                          >
                            <div className="w-10 h-10 rounded-full border-2 border-dashed border-primary flex items-center justify-center">
                              <User className="h-5 w-5" />
                            </div>
                            <span className="font-medium">+ เพิ่มผู้ติดต่อใหม่</span>
                          </Link>
                        </div>
                      )}

                      {/* Close dropdown when clicking outside */}
                      {showBorrowerDropdown && (
                        <div 
                          className="fixed inset-0 z-[-1]" 
                          onClick={() => setShowBorrowerDropdown(false)}
                        />
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Amount Card */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-primary" />
                    จำนวนเงิน
                    <span className="text-red-500">*</span>
                  </h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="principal">เงินต้น (บาท)</Label>
                    <div className="relative">
                      <Input
                        id="principal"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.principal}
                        onChange={(e) => setFormData({ ...formData, principal: e.target.value })}
                        placeholder="0.00"
                        className="rounded-lg text-xl font-bold pl-8"
                        required
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">฿</span>
                    </div>
                    {formData.principal && (
                      <p className="text-sm text-muted-foreground">
                        = {formatCurrency(formData.principal)}
                      </p>
                    )}
                  </div>

                  {/* Quick Amount Buttons */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {[1000, 5000, 10000, 20000, 50000, 100000].map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setFormData({ ...formData, principal: amount.toString() })}
                        className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                          formData.principal === amount.toString()
                            ? "bg-red-100 border-red-500 text-red-700"
                            : "border-gray-200 hover:border-red-300 text-gray-600"
                        }`}
                      >
                        ฿{amount.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Date Card */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    วันที่
                  </h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate" className="flex items-center gap-1">
                        วันที่เริ่มสัญญา <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="rounded-lg"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dueDate">วันครบกำหนด (ถ้ามี)</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        className="rounded-lg"
                        min={formData.startDate}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Interest Policy Card */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Percent className="h-5 w-5 text-primary" />
                    นโยบายดอกเบี้ย
                  </h3>
                  
                  <div className="grid gap-2">
                    <label
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        !formData.interestPolicyId
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="interestPolicyId"
                        value=""
                        checked={!formData.interestPolicyId}
                        onChange={() => setFormData({ ...formData, interestPolicyId: "" })}
                        className="hidden"
                      />
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl">
                        🚫
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">ไม่คิดดอกเบี้ย</p>
                        <p className="text-xs text-muted-foreground">ไม่มีการคิดดอกเบี้ยสำหรับสัญญานี้</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        !formData.interestPolicyId ? 'border-primary' : 'border-border'
                      }`}>
                        {!formData.interestPolicyId && (
                          <div className="w-3 h-3 rounded-full bg-primary" />
                        )}
                      </div>
                    </label>

                    {policies.map((policy) => (
                      <label
                        key={policy.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          formData.interestPolicyId === policy.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="interestPolicyId"
                          value={policy.id}
                          checked={formData.interestPolicyId === policy.id}
                          onChange={(e) => setFormData({ ...formData, interestPolicyId: e.target.value })}
                          className="hidden"
                        />
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-xl">
                          💰
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{policy.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {policy.mode === "MONTHLY" 
                              ? `รายเดือน: ${((policy.monthlyRate || 0) * 100).toFixed(2)}% ต่อเดือน`
                              : `รายวัน: ${((policy.dailyRate || 0) * 100).toFixed(4)}% ต่อวัน`
                            }
                          </p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          formData.interestPolicyId === policy.id ? 'border-primary' : 'border-border'
                        }`}>
                          {formData.interestPolicyId === policy.id && (
                            <div className="w-3 h-3 rounded-full bg-primary" />
                          )}
                        </div>
                      </label>
                    ))}
                  </div>

                  {policies.length === 0 && (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-700">
                        💡 ยังไม่มีนโยบายดอกเบี้ย คุณสามารถ{" "}
                        <Link href={`/workspaces/${workspaceId}/interest-policies/new`} className="underline font-medium">
                          สร้างนโยบายดอกเบี้ย
                        </Link>{" "}
                        ได้
                      </p>
                    </div>
                  )}
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
                    placeholder="บันทึกรายละเอียดเพิ่มเติมเกี่ยวกับสัญญา..."
                    rows={4}
                    className="rounded-lg resize-none"
                  />
                </CardContent>
              </Card>

              {/* Image Upload Card */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-primary" />
                    รูปภาพหลักฐาน
                  </h3>
                  
                  <ImageUpload
                    value={formData.imageUrl}
                    onChange={(url) => setFormData({ ...formData, imageUrl: url || "" })}
                    folder="loans"
                    placeholder="อัปโหลดรูปหลักฐานสัญญา"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    เช่น รูปสัญญากู้ยืม, หลักฐานการโอนเงิน, บัตรประชาชน เป็นต้น
                  </p>
                </CardContent>
              </Card>

              {/* Submit Button (Mobile) */}
              <div className="lg:hidden flex gap-2">
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
                  disabled={loading || !formData.borrowerId || !formData.principal}
                  className="flex-1 rounded-lg"
                >
                  {loading ? "กำลังบันทึก..." : "สร้างสัญญา"}
                </Button>
              </div>
            </form>
          </div>

          {/* Right Column - Summary Sidebar */}
          <div className="space-y-6">
            {/* Summary Card */}
            <Card className="sticky top-20">
              <CardContent className="p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  สรุปสัญญา
                </h3>
                
                <div className="space-y-4">
                  {/* Borrower */}
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">ผู้กู้</p>
                    {selectedBorrower ? (
                      <div className="flex items-center gap-2">
                        <Avatar name={selectedBorrower.name} size="sm" imageUrl={selectedBorrower.imageUrl} />
                        <span className="font-medium">{selectedBorrower.name}</span>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">ยังไม่ได้เลือก</p>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">เงินต้น</p>
                    <p className="text-xl font-bold text-primary">
                      {formData.principal ? formatCurrency(formData.principal) : "฿0"}
                    </p>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">เริ่มสัญญา</p>
                      <p className="font-medium text-sm">
                        {formData.startDate ? new Date(formData.startDate).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                      </p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">ครบกำหนด</p>
                      <p className="font-medium text-sm">
                        {formData.dueDate ? new Date(formData.dueDate).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" }) : "ไม่กำหนด"}
                      </p>
                    </div>
                  </div>

                  {/* Interest */}
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">ดอกเบี้ย</p>
                    {selectedPolicy ? (
                      <div>
                        <p className="font-medium">{selectedPolicy.name}</p>
                        <p className="text-sm text-green-600">
                          {selectedPolicy.mode === "MONTHLY" 
                            ? `${((selectedPolicy.monthlyRate || 0) * 100).toFixed(2)}% / เดือน`
                            : `${((selectedPolicy.dailyRate || 0) * 100).toFixed(4)}% / วัน`
                          }
                        </p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">ไม่คิดดอกเบี้ย</p>
                    )}
                  </div>
                </div>

                {/* Create Button */}
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !formData.borrowerId || !formData.principal}
                  className="w-full mt-6 rounded-lg gap-2"
                >
                  <Save className="h-4 w-4" />
                  {loading ? "กำลังสร้าง..." : "สร้างสัญญา"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
