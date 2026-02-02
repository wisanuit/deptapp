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
  Search, Check, ClipboardList
} from "lucide-react";

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

export default function NewLoanApplicationPage() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const workspaceId = params.workspaceId as string;

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [policies, setPolicies] = useState<InterestPolicy[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  const [formData, setFormData] = useState({
    contactId: "",
    requestedAmount: "",
    purpose: "",
    term: "",
    interestPolicyId: "",
  });

  const [contactSearch, setContactSearch] = useState("");
  const [showContactDropdown, setShowContactDropdown] = useState(false);

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
      const res = await fetch(`/api/workspaces/${workspaceId}/loan-applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: formData.contactId,
          requestedAmount: parseFloat(formData.requestedAmount),
          purpose: formData.purpose || null,
          term: formData.term ? parseInt(formData.term) : null,
          interestPolicyId: formData.interestPolicyId || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "เกิดข้อผิดพลาด");
      }

      const app = await res.json();
      toast.success("สร้างใบสมัครสินเชื่อสำเร็จ");
      router.push(`/workspaces/${workspaceId}/loan-applications/${app.id}`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedContact = contacts.find(c => c.id === formData.contactId);
  const selectedPolicy = policies.find(p => p.id === formData.interestPolicyId);

  // Filter contacts by search query
  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(contactSearch.toLowerCase())
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
                href={`/workspaces/${workspaceId}/loan-applications`} 
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                <h1 className="text-lg font-semibold">สร้างใบสมัครสินเชื่อ</h1>
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
                disabled={loading || !formData.contactId || !formData.requestedAmount}
                className="rounded-full gap-2"
              >
                <Save className="h-4 w-4" />
                {loading ? "กำลังบันทึก..." : "ยื่นใบสมัคร"}
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
              {/* Contact Selection Card */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    ผู้ขอสินเชื่อ
                    <span className="text-red-500">*</span>
                  </h3>
                  
                  {contacts.length === 0 ? (
                    <div className="text-center py-8 bg-muted/50 rounded-lg">
                      <User className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-muted-foreground mb-4">ยังไม่มีผู้ติดต่อ</p>
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
                          placeholder="ค้นหาผู้ติดต่อ..."
                          value={contactSearch}
                          onChange={(e) => {
                            setContactSearch(e.target.value);
                            setShowContactDropdown(true);
                          }}
                          onFocus={() => setShowContactDropdown(true)}
                          className="pl-9 rounded-lg"
                        />
                      </div>

                      {/* Selected Contact Display */}
                      {selectedContact && !showContactDropdown && (
                        <div 
                          className="flex items-center gap-3 p-4 rounded-xl border-2 border-primary bg-primary/5 cursor-pointer"
                          onClick={() => setShowContactDropdown(true)}
                        >
                          <Avatar name={selectedContact.name} size="lg" imageUrl={selectedContact.imageUrl} />
                          <div className="flex-1">
                            <p className="font-semibold text-lg">{selectedContact.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {selectedContact.type === "LENDER" ? "📤 เจ้าหนี้" : 
                               selectedContact.type === "BORROWER" ? "📥 ผู้กู้" : "🔄 ทั้งคู่"}
                            </p>
                          </div>
                          <div className="p-2 rounded-full bg-primary text-white">
                            <Check className="h-4 w-4" />
                          </div>
                        </div>
                      )}

                      {/* Dropdown Menu */}
                      {showContactDropdown && (
                        <div className="border rounded-xl shadow-lg bg-card max-h-64 overflow-y-auto">
                          {filteredContacts.length === 0 ? (
                            <div className="p-4 text-center text-muted-foreground">
                              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p>ไม่พบผู้ติดต่อที่ค้นหา</p>
                            </div>
                          ) : (
                            filteredContacts.map((contact) => (
                              <div
                                key={contact.id}
                                className={`flex items-center gap-3 p-3 cursor-pointer transition-colors hover:bg-muted ${
                                  formData.contactId === contact.id ? 'bg-primary/10' : ''
                                }`}
                                onClick={() => {
                                  setFormData({ ...formData, contactId: contact.id });
                                  setShowContactDropdown(false);
                                  setContactSearch("");
                                }}
                              >
                                <Avatar name={contact.name} size="md" imageUrl={contact.imageUrl} />
                                <div className="flex-1">
                                  <p className="font-medium">{contact.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {contact.type === "LENDER" ? "📤 เจ้าหนี้" : 
                                     contact.type === "BORROWER" ? "📥 ผู้กู้" : "🔄 ทั้งคู่"}
                                  </p>
                                </div>
                                {formData.contactId === contact.id && (
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
                      {showContactDropdown && (
                        <div 
                          className="fixed inset-0 z-[-1]" 
                          onClick={() => setShowContactDropdown(false)}
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
                    ยอดที่ขอกู้
                    <span className="text-red-500">*</span>
                  </h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="requestedAmount">จำนวนเงิน (บาท)</Label>
                    <div className="relative">
                      <Input
                        id="requestedAmount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.requestedAmount}
                        onChange={(e) => setFormData({ ...formData, requestedAmount: e.target.value })}
                        placeholder="0.00"
                        className="rounded-lg text-xl font-bold pl-8"
                        required
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">฿</span>
                    </div>
                    {formData.requestedAmount && (
                      <p className="text-sm text-muted-foreground">
                        = {formatCurrency(formData.requestedAmount)}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Term Card */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    ระยะเวลากู้
                  </h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="term">จำนวนเดือน</Label>
                    <div className="relative">
                      <Input
                        id="term"
                        type="number"
                        min="1"
                        value={formData.term}
                        onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                        placeholder="เช่น 12"
                        className="rounded-lg"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      ไม่จำเป็นต้องระบุ ผู้พิจารณาสามารถกำหนดภายหลังได้
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Interest Policy Card */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Percent className="h-5 w-5 text-primary" />
                    นโยบายดอกเบี้ยที่ต้องการ
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
                        ❓
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">ไม่ระบุ</p>
                        <p className="text-xs text-muted-foreground">ให้ผู้พิจารณากำหนดนโยบายดอกเบี้ย</p>
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

              {/* Purpose Card */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    วัตถุประสงค์การกู้
                  </h3>
                  
                  <Textarea
                    id="purpose"
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    placeholder="เช่น ใช้เป็นทุนหมุนเวียนธุรกิจ, ซ่อมแซมบ้าน..."
                    rows={4}
                    className="rounded-lg resize-none"
                  />
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
                  disabled={loading || !formData.contactId || !formData.requestedAmount}
                  className="flex-1 rounded-lg"
                >
                  {loading ? "กำลังส่ง..." : "ยื่นใบสมัคร"}
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
                  <ClipboardList className="h-5 w-5 text-primary" />
                  สรุปใบสมัคร
                </h3>
                
                <div className="space-y-4">
                  {/* Contact */}
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">ผู้ขอสินเชื่อ</p>
                    {selectedContact ? (
                      <div className="flex items-center gap-2">
                        <Avatar name={selectedContact.name} size="sm" imageUrl={selectedContact.imageUrl} />
                        <span className="font-medium">{selectedContact.name}</span>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">ยังไม่ได้เลือก</p>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">ยอดที่ขอกู้</p>
                    <p className="text-xl font-bold text-primary">
                      {formData.requestedAmount ? formatCurrency(formData.requestedAmount) : "฿0"}
                    </p>
                  </div>

                  {/* Term */}
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">ระยะเวลา</p>
                    <p className="font-medium">
                      {formData.term ? `${formData.term} เดือน` : "ไม่ระบุ"}
                    </p>
                  </div>

                  {/* Interest */}
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">นโยบายดอกเบี้ยที่ต้องการ</p>
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
                      <p className="text-muted-foreground">ให้ผู้พิจารณากำหนด</p>
                    )}
                  </div>

                  {/* Purpose */}
                  {formData.purpose && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">วัตถุประสงค์</p>
                      <p className="text-sm">{formData.purpose}</p>
                    </div>
                  )}
                </div>

                {/* Create Button */}
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !formData.contactId || !formData.requestedAmount}
                  className="w-full mt-6 rounded-lg gap-2"
                >
                  <Save className="h-4 w-4" />
                  {loading ? "กำลังส่ง..." : "ยื่นใบสมัคร"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
