"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import {
  ArrowLeft,
  Wallet,
  FileText,
  User,
  Calendar,
  Save,
  X,
  Search,
  Check,
  AlertCircle,
  Banknote,
  Receipt,
  Upload,
  Calculator,
} from "lucide-react";

interface Loan {
  id: string;
  borrower: { id: string; name: string; imageUrl?: string };
  lender: { id: string; name: string; imageUrl?: string };
  remainingPrincipal: number;
  accruedInterest: number;
  startDate: string;
  loanType?: "RECEIVABLE" | "PAYABLE";
}

interface Contact {
  id: string;
  name: string;
  type: string;
  imageUrl?: string;
}

interface Allocation {
  loanId: string;
  principalPaid: number;
  interestPaid: number;
}

// Avatar component
function Avatar({
  name,
  size = "md",
  imageUrl,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  imageUrl?: string | null;
}) {
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "?";
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  };

  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt={name}
        width={48}
        height={48}
        className={`${sizeClasses[size]} rounded-full object-cover`}
        unoptimized
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white flex items-center justify-center font-semibold`}
    >
      {initials}
    </div>
  );
}

export default function NewPaymentPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const toast = useToast();
  const workspaceId = params.workspaceId as string;
  const prefillLoanId = searchParams.get("loanId");

  // If loanId is prefilled, lock the selection
  const isLoanLocked = !!prefillLoanId;

  const [loans, setLoans] = useState<Loan[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  // Form state
  const [scope, setScope] = useState<"loan" | "person">("loan");
  const [selectedLoanId, setSelectedLoanId] = useState<string>(prefillLoanId || "");
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [note, setNote] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [autoMethod, setAutoMethod] = useState<
    "" | "INTEREST_FIRST" | "PRINCIPAL_FIRST" | "FIFO"
  >("");

  // Search states
  const [loanSearch, setLoanSearch] = useState("");
  const [showLoanDropdown, setShowLoanDropdown] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [showContactDropdown, setShowContactDropdown] = useState(false);

  // Load data
  useEffect(() => {
    setDataLoading(true);
    Promise.all([
      // Fetch RECEIVABLE loans (we are lender - ลูกหนี้ของเรา)
      fetch(
        `/api/workspaces/${workspaceId}/loans?status=OPEN,OVERDUE&loanType=RECEIVABLE`
      ).then((r) => r.json()),
      // Fetch PAYABLE loans (we are borrower - หนี้ที่เราต้องจ่าย)
      fetch(
        `/api/workspaces/${workspaceId}/loans?status=OPEN,OVERDUE&loanType=PAYABLE`
      ).then((r) => r.json()),
      fetch(`/api/workspaces/${workspaceId}/contacts`).then((r) => r.json()),
    ])
      .then(([receivableLoans, payableLoans, contactsData]) => {
        // Filter only loans with outstanding balance and add loanType
        const receivable = (receivableLoans || [])
          .filter((loan: Loan) => loan.remainingPrincipal > 0 || loan.accruedInterest > 0)
          .map((loan: Loan) => ({ ...loan, loanType: "RECEIVABLE" as const }));
        const payable = (payableLoans || [])
          .filter((loan: Loan) => loan.remainingPrincipal > 0 || loan.accruedInterest > 0)
          .map((loan: Loan) => ({ ...loan, loanType: "PAYABLE" as const }));
        setLoans([...receivable, ...payable]);
        setContacts(contactsData || []);
        setDataLoading(false);
      })
      .catch(() => {
        setDataLoading(false);
      });
  }, [workspaceId]);

  // Get borrowers who have outstanding loans
  const borrowersWithLoans = contacts.filter((c) =>
    loans.some((l) => l.borrower.name === c.name)
  );

  // Filter loans by selected contact
  const loansForContact = selectedContactId
    ? loans.filter((l) => l.borrower.name === contacts.find(c => c.id === selectedContactId)?.name)
    : loans;

  // Filter loans by search
  const filteredLoans = (scope === "person" ? loansForContact : loans).filter((l) =>
    l.borrower.name.toLowerCase().includes(loanSearch.toLowerCase())
  );

  // Filter contacts by search
  const filteredContacts = borrowersWithLoans.filter((c) =>
    c.name.toLowerCase().includes(contactSearch.toLowerCase())
  );

  const selectedLoan = loans.find((l) => l.id === selectedLoanId);
  const selectedContact = contacts.find((c) => c.id === selectedContactId);

  const handleAllocationChange = (
    loanId: string,
    field: "principalPaid" | "interestPaid",
    value: number
  ) => {
    setAllocations((prev) => {
      const existing = prev.find((a) => a.loanId === loanId);
      if (existing) {
        return prev.map((a) =>
          a.loanId === loanId ? { ...a, [field]: value } : a
        );
      }
      return [...prev, { loanId, principalPaid: 0, interestPaid: 0, [field]: value }];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const body: any = {
        amount: parseFloat(amount),
        paymentDate,
        note: note || undefined,
        attachmentUrl: attachmentUrl || undefined,
      };

      if (autoMethod) {
        body.method = autoMethod;
        if (selectedLoanId) {
          body.allocations = [{ loanId: selectedLoanId, principalPaid: 0, interestPaid: 0 }];
        }
      } else {
        // Use manual allocation or auto-fill from selected loan
        const manualAllocations = allocations.filter(
          (a) => a.principalPaid > 0 || a.interestPaid > 0
        );

        if (manualAllocations.length === 0 && selectedLoanId) {
          // Auto-calculate based on amount
          const loan = loans.find((l) => l.id === selectedLoanId);
          if (loan) {
            const payAmount = parseFloat(amount);
            let interestPaid = Math.min(loan.accruedInterest, payAmount);
            let principalPaid = Math.min(loan.remainingPrincipal, payAmount - interestPaid);
            body.allocations = [{ loanId: selectedLoanId, principalPaid, interestPaid }];
          }
        } else if (manualAllocations.length > 0) {
          body.allocations = manualAllocations;
        } else {
          throw new Error("กรุณาระบุการจัดสรรอย่างน้อย 1 สัญญา");
        }
      }

      const res = await fetch(`/api/workspaces/${workspaceId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "เกิดข้อผิดพลาด");
      }

      toast.success("บันทึกการชำระเงินสำเร็จ");
      router.push(`/workspaces/${workspaceId}/payments`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number | string) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num)) return "฿0";
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
    }).format(num);
  };

  // Calculate allocation preview
  const allocationPreview = () => {
    if (!selectedLoan || !amount) return null;
    const payAmount = parseFloat(amount);
    if (isNaN(payAmount) || payAmount <= 0) return null;

    const manualAlloc = allocations.find((a) => a.loanId === selectedLoanId);
    if (manualAlloc && (manualAlloc.principalPaid > 0 || manualAlloc.interestPaid > 0)) {
      return manualAlloc;
    }

    // Auto-calculate: interest first
    let interestPaid = Math.min(selectedLoan.accruedInterest, payAmount);
    let principalPaid = Math.min(selectedLoan.remainingPrincipal, payAmount - interestPaid);
    return { principalPaid, interestPaid };
  };

  const preview = allocationPreview();

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
                href={`/workspaces/${workspaceId}/payments`}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-green-600" />
                <h1 className="text-lg font-semibold">บันทึกการชำระเงิน</h1>
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
                disabled={loading || !selectedLoanId || !amount}
                className="rounded-full gap-2 bg-green-600 hover:bg-green-700"
              >
                <Save className="h-4 w-4" />
                {loading ? "กำลังบันทึก..." : "บันทึกการชำระ"}
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
              {/* Payment Mode Selection - Hide when loan is locked */}
              {!isLoanLocked && (
              <Card className="mb-6">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-green-600" />
                    รูปแบบการชำระ
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                        scope === "loan"
                          ? "border-green-500 bg-green-50 dark:bg-green-950/30"
                          : "border-border hover:border-green-300"
                      }`}
                      onClick={() => {
                        setScope("loan");
                        setSelectedContactId("");
                      }}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          scope === "loan"
                            ? "bg-green-500 text-white"
                            : "bg-muted"
                        }`}
                      >
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">รายสัญญา</p>
                        <p className="text-xs text-muted-foreground">
                          เลือกสัญญาที่ต้องการชำระ
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                        scope === "person"
                          ? "border-green-500 bg-green-50 dark:bg-green-950/30"
                          : "border-border hover:border-green-300"
                      }`}
                      onClick={() => {
                        setScope("person");
                        setSelectedLoanId("");
                      }}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          scope === "person"
                            ? "bg-green-500 text-white"
                            : "bg-muted"
                        }`}
                      >
                        <User className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">รายคน (ลูกหนี้)</p>
                        <p className="text-xs text-muted-foreground">
                          เลือกลูกหนี้ก่อน
                        </p>
                      </div>
                    </button>
                  </div>
                </CardContent>
              </Card>
              )}

              {/* Person Selection (when scope is person) */}
              {scope === "person" && !isLoanLocked && (
                <Card className="mb-6">
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <User className="h-5 w-5 text-green-600" />
                      เลือกลูกหนี้
                      <span className="text-red-500">*</span>
                    </h3>

                    {borrowersWithLoans.length === 0 ? (
                      <div className="text-center py-8 bg-muted/50 rounded-lg">
                        <AlertCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                        <p className="text-muted-foreground">ไม่มีลูกหนี้ที่มียอดคงค้าง</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Search Input */}
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="ค้นหาลูกหนี้..."
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
                            className="flex items-center gap-3 p-4 rounded-xl border-2 border-green-500 bg-green-50 dark:bg-green-950/30 cursor-pointer"
                            onClick={() => setShowContactDropdown(true)}
                          >
                            <Avatar
                              name={selectedContact.name}
                              size="lg"
                              imageUrl={selectedContact.imageUrl}
                            />
                            <div className="flex-1">
                              <p className="font-semibold text-lg">
                                {selectedContact.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {loansForContact.length} สัญญาคงค้าง
                              </p>
                            </div>
                            <div className="p-2 rounded-full bg-green-500 text-white">
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
                                <p>ไม่พบลูกหนี้ที่ค้นหา</p>
                              </div>
                            ) : (
                              filteredContacts.map((contact) => {
                                const contactLoans = loans.filter(
                                  (l) => l.borrower.name === contact.name
                                );
                                const totalOutstanding = contactLoans.reduce(
                                  (sum, l) =>
                                    sum + l.remainingPrincipal + l.accruedInterest,
                                  0
                                );

                                return (
                                  <div
                                    key={contact.id}
                                    className={`flex items-center gap-3 p-3 cursor-pointer transition-colors hover:bg-muted ${
                                      selectedContactId === contact.id
                                        ? "bg-green-50 dark:bg-green-950/30"
                                        : ""
                                    }`}
                                    onClick={() => {
                                      setSelectedContactId(contact.id);
                                      setSelectedLoanId("");
                                      setShowContactDropdown(false);
                                      setContactSearch("");
                                    }}
                                  >
                                    <Avatar
                                      name={contact.name}
                                      size="md"
                                      imageUrl={contact.imageUrl}
                                    />
                                    <div className="flex-1">
                                      <p className="font-medium">{contact.name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {contactLoans.length} สัญญา •{" "}
                                        {formatCurrency(totalOutstanding)}
                                      </p>
                                    </div>
                                    {selectedContactId === contact.id && (
                                      <Check className="h-5 w-5 text-green-500" />
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}

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
              )}

              {/* Loan Selection */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-green-600" />
                    {isLoanLocked ? "สัญญาที่ชำระ" : (scope === "person" ? "เลือกสัญญา" : "เลือกสัญญาที่จะชำระ")}
                    {!isLoanLocked && <span className="text-red-500">*</span>}
                  </h3>

                  {/* Locked Loan Display */}
                  {isLoanLocked && selectedLoan && (
                    <div className={`flex items-center gap-3 p-4 rounded-xl border-2 ${
                      selectedLoan.loanType === "PAYABLE"
                        ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30"
                        : "border-green-500 bg-green-50 dark:bg-green-950/30"
                    }`}>
                      <Avatar
                        name={selectedLoan.loanType === "PAYABLE" ? selectedLoan.lender.name : selectedLoan.borrower.name}
                        size="lg"
                        imageUrl={selectedLoan.loanType === "PAYABLE" ? selectedLoan.lender.imageUrl : selectedLoan.borrower.imageUrl}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            selectedLoan.loanType === "PAYABLE"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-blue-100 text-blue-700"
                          }`}>
                            {selectedLoan.loanType === "PAYABLE" ? "หนี้ที่ต้องจ่าย" : "สัญญาเงินกู้"}
                          </span>
                        </div>
                        <p className="font-semibold text-lg">
                          {selectedLoan.loanType === "PAYABLE"
                            ? `เจ้าหนี้: ${selectedLoan.lender.name}`
                            : `ลูกหนี้: ${selectedLoan.borrower.name}`
                          }
                        </p>
                        <div className="flex gap-3 text-sm">
                          <span className="text-blue-600">
                            ต้น: {formatCurrency(selectedLoan.remainingPrincipal)}
                          </span>
                          <span className={selectedLoan.loanType === "PAYABLE" ? "text-orange-600" : "text-green-600"}>
                            ดอก: {formatCurrency(selectedLoan.accruedInterest)}
                          </span>
                        </div>
                      </div>
                      <div className={`p-2 rounded-full text-white ${selectedLoan.loanType === "PAYABLE" ? "bg-orange-500" : "bg-green-500"}`}>
                        <Check className="h-4 w-4" />
                      </div>
                    </div>
                  )}

                  {!isLoanLocked && (scope === "loan" || selectedContactId) && (
                    <>
                      {filteredLoans.length === 0 ? (
                        <div className="text-center py-8 bg-muted/50 rounded-lg">
                          <AlertCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                          <p className="text-muted-foreground">
                            {scope === "person"
                              ? "ไม่มีสัญญาคงค้างของลูกหนี้รายนี้"
                              : "ไม่มีสัญญาที่มียอดคงค้าง"}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {/* Search Input */}
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="ค้นหาสัญญา..."
                              value={loanSearch}
                              onChange={(e) => {
                                setLoanSearch(e.target.value);
                                setShowLoanDropdown(true);
                              }}
                              onFocus={() => setShowLoanDropdown(true)}
                              className="pl-9 rounded-lg"
                            />
                          </div>

                          {/* Selected Loan Display */}
                          {selectedLoan && !showLoanDropdown && (
                            <div
                              className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer ${
                                selectedLoan.loanType === "PAYABLE" 
                                  ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30"
                                  : "border-green-500 bg-green-50 dark:bg-green-950/30"
                              }`}
                              onClick={() => setShowLoanDropdown(true)}
                            >
                              <Avatar
                                name={selectedLoan.loanType === "PAYABLE" ? selectedLoan.lender.name : selectedLoan.borrower.name}
                                size="lg"
                                imageUrl={selectedLoan.loanType === "PAYABLE" ? selectedLoan.lender.imageUrl : selectedLoan.borrower.imageUrl}
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    selectedLoan.loanType === "PAYABLE"
                                      ? "bg-orange-100 text-orange-700"
                                      : "bg-blue-100 text-blue-700"
                                  }`}>
                                    {selectedLoan.loanType === "PAYABLE" ? "หนี้ที่ต้องจ่าย" : "สัญญาเงินกู้"}
                                  </span>
                                </div>
                                <p className="font-semibold text-lg">
                                  {selectedLoan.loanType === "PAYABLE" 
                                    ? `เจ้าหนี้: ${selectedLoan.lender.name}`
                                    : `ลูกหนี้: ${selectedLoan.borrower.name}`
                                  }
                                </p>
                                <div className="flex gap-3 text-sm">
                                  <span className="text-blue-600">
                                    ต้น: {formatCurrency(selectedLoan.remainingPrincipal)}
                                  </span>
                                  <span className={selectedLoan.loanType === "PAYABLE" ? "text-orange-600" : "text-green-600"}>
                                    ดอก: {formatCurrency(selectedLoan.accruedInterest)}
                                  </span>
                                </div>
                              </div>
                              <div className={`p-2 rounded-full text-white ${selectedLoan.loanType === "PAYABLE" ? "bg-orange-500" : "bg-green-500"}`}>
                                <Check className="h-4 w-4" />
                              </div>
                            </div>
                          )}

                          {/* Dropdown Menu */}
                          {showLoanDropdown && (
                            <div className="border rounded-xl shadow-lg bg-card max-h-80 overflow-y-auto">
                              {filteredLoans.length === 0 ? (
                                <div className="p-4 text-center text-muted-foreground">
                                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                  <p>ไม่พบสัญญาที่ค้นหา</p>
                                </div>
                              ) : (
                                filteredLoans.map((loan) => (
                                  <div
                                    key={loan.id}
                                    className={`flex items-center gap-3 p-3 cursor-pointer transition-colors hover:bg-muted ${
                                      selectedLoanId === loan.id
                                        ? loan.loanType === "PAYABLE" 
                                          ? "bg-orange-50 dark:bg-orange-950/30"
                                          : "bg-green-50 dark:bg-green-950/30"
                                        : ""
                                    }`}
                                    onClick={() => {
                                      setSelectedLoanId(loan.id);
                                      setShowLoanDropdown(false);
                                      setLoanSearch("");
                                      setAllocations([]);
                                    }}
                                  >
                                    <Avatar
                                      name={loan.loanType === "PAYABLE" ? loan.lender.name : loan.borrower.name}
                                      size="md"
                                      imageUrl={loan.loanType === "PAYABLE" ? loan.lender.imageUrl : loan.borrower.imageUrl}
                                    />
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                                          loan.loanType === "PAYABLE"
                                            ? "bg-orange-100 text-orange-700"
                                            : "bg-blue-100 text-blue-700"
                                        }`}>
                                          {loan.loanType === "PAYABLE" ? "หนี้" : "กู้"}
                                        </span>
                                        <p className="font-medium">
                                          {loan.loanType === "PAYABLE" ? loan.lender.name : loan.borrower.name}
                                        </p>
                                      </div>
                                      <div className="flex gap-3 text-xs text-muted-foreground">
                                        <span>
                                          ต้น:{" "}
                                          <span className="text-blue-600 font-medium">
                                            {formatCurrency(loan.remainingPrincipal)}
                                          </span>
                                        </span>
                                        <span>
                                          ดอก:{" "}
                                          <span className={`font-medium ${loan.loanType === "PAYABLE" ? "text-orange-600" : "text-green-600"}`}>
                                            {formatCurrency(loan.accruedInterest)}
                                          </span>
                                        </span>
                                      </div>
                                    </div>
                                    {selectedLoanId === loan.id && (
                                      <Check className={`h-5 w-5 ${loan.loanType === "PAYABLE" ? "text-orange-500" : "text-green-500"}`} />
                                    )}
                                  </div>
                                ))
                              )}
                            </div>
                          )}

                          {showLoanDropdown && (
                            <div
                              className="fixed inset-0 z-[-1]"
                              onClick={() => setShowLoanDropdown(false)}
                            />
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {!isLoanLocked && scope === "person" && !selectedContactId && (
                    <div className="text-center py-8 bg-muted/50 rounded-lg">
                      <User className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">
                        กรุณาเลือกลูกหนี้ก่อน
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Amount Card */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Banknote className="h-5 w-5 text-green-600" />
                    จำนวนเงิน
                    <span className="text-red-500">*</span>
                  </h3>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">จำนวนเงินที่ชำระ (บาท)</Label>
                      <div className="relative">
                        <Input
                          id="amount"
                          type="number"
                          min="0"
                          step="0.01"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          className="rounded-lg text-xl font-bold pl-8 h-14"
                          required
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">
                          ฿
                        </span>
                      </div>
                      {amount && (
                        <p className="text-sm text-muted-foreground">
                          = {formatCurrency(amount)}
                        </p>
                      )}
                    </div>

                    {/* Quick amount buttons */}
                    {selectedLoan && (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                          onClick={() =>
                            setAmount(selectedLoan.accruedInterest.toString())
                          }
                        >
                          ดอกเบี้ยทั้งหมด ({formatCurrency(selectedLoan.accruedInterest)})
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                          onClick={() =>
                            setAmount(
                              (
                                selectedLoan.remainingPrincipal +
                                selectedLoan.accruedInterest
                              ).toString()
                            )
                          }
                        >
                          ชำระทั้งหมด (
                          {formatCurrency(
                            selectedLoan.remainingPrincipal +
                              selectedLoan.accruedInterest
                          )}
                          )
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Date & Note Card */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-green-600" />
                    รายละเอียดเพิ่มเติม
                  </h3>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="paymentDate">วันที่ชำระ *</Label>
                      <Input
                        id="paymentDate"
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className="rounded-lg"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="attachment" className="flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        แนบสลิป
                      </Label>
                      <Input
                        id="attachment"
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (typeof reader.result === "string") {
                              setAttachmentUrl(reader.result);
                            }
                          };
                          reader.readAsDataURL(file);
                        }}
                        className="rounded-lg file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:bg-green-100 file:text-green-700"
                      />
                      {attachmentUrl && (
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          ไฟล์ถูกแนบแล้ว
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="note">หมายเหตุ</Label>
                    <Textarea
                      id="note"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="หมายเหตุเพิ่มเติม..."
                      className="rounded-lg"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Allocation Method Card */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-green-600" />
                    วิธีการจัดสรร
                  </h3>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                    {[
                      { value: "", label: "อัตโนมัติ", desc: "ตัดดอกก่อน" },
                      { value: "INTEREST_FIRST", label: "ตัดดอกก่อน", desc: "จ่ายดอกเบี้ยก่อน" },
                      { value: "PRINCIPAL_FIRST", label: "ตัดต้นก่อน", desc: "จ่ายเงินต้นก่อน" },
                      { value: "FIFO", label: "FIFO", desc: "เรียงตามวัน" },
                    ].map((method) => (
                      <button
                        key={method.value}
                        type="button"
                        className={`p-3 rounded-xl text-sm transition-all text-left ${
                          autoMethod === method.value
                            ? "bg-green-500 text-white shadow-md"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                        onClick={() => setAutoMethod(method.value as any)}
                      >
                        <p className="font-medium">{method.label}</p>
                        <p
                          className={`text-xs ${
                            autoMethod === method.value
                              ? "text-green-100"
                              : "text-muted-foreground"
                          }`}
                        >
                          {method.desc}
                        </p>
                      </button>
                    ))}
                  </div>

                  {/* Manual Allocation */}
                  {autoMethod === "" && selectedLoan && (
                    <div className="p-4 rounded-xl bg-muted/50 space-y-4">
                      <p className="text-sm font-medium text-muted-foreground">
                        กำหนดการตัดเอง (ถ้าไม่กำหนด จะตัดดอกก่อนอัตโนมัติ)
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs">ตัดเงินต้น</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            max={selectedLoan.remainingPrincipal}
                            placeholder="0"
                            value={
                              allocations.find((a) => a.loanId === selectedLoanId)
                                ?.principalPaid || ""
                            }
                            onChange={(e) =>
                              handleAllocationChange(
                                selectedLoanId,
                                "principalPaid",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="rounded-lg"
                          />
                          <p className="text-xs text-muted-foreground">
                            คงเหลือ: {formatCurrency(selectedLoan.remainingPrincipal)}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">ตัดดอกเบี้ย</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            max={selectedLoan.accruedInterest}
                            placeholder="0"
                            value={
                              allocations.find((a) => a.loanId === selectedLoanId)
                                ?.interestPaid || ""
                            }
                            onChange={(e) =>
                              handleAllocationChange(
                                selectedLoanId,
                                "interestPaid",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="rounded-lg"
                          />
                          <p className="text-xs text-muted-foreground">
                            ดอกค้าง: {formatCurrency(selectedLoan.accruedInterest)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Mobile Submit Button */}
              <div className="lg:hidden flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                  className="flex-1 h-12 rounded-xl gap-2"
                >
                  <X className="h-4 w-4" />
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !selectedLoanId || !amount}
                  className="flex-1 h-12 rounded-xl gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Save className="h-4 w-4" />
                  {loading ? "กำลังบันทึก..." : "บันทึก"}
                </Button>
              </div>
            </form>
          </div>

          {/* Right Column - Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-green-600" />
                    สรุปการชำระ
                  </h3>

                  {!selectedLoan ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">เลือกสัญญาเพื่อดูสรุป</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Loan Info */}
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                        <Avatar
                          name={selectedLoan.borrower.name}
                          size="md"
                          imageUrl={selectedLoan.borrower.imageUrl}
                        />
                        <div>
                          <p className="font-medium">{selectedLoan.borrower.name}</p>
                          <p className="text-xs text-muted-foreground">
                            เจ้าหนี้: {selectedLoan.lender.name}
                          </p>
                        </div>
                      </div>

                      {/* Outstanding Balance */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">เงินต้นคงเหลือ</span>
                          <span className="font-medium text-blue-600">
                            {formatCurrency(selectedLoan.remainingPrincipal)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">ดอกเบี้ยค้าง</span>
                          <span className="font-medium text-green-600">
                            {formatCurrency(selectedLoan.accruedInterest)}
                          </span>
                        </div>
                        <div className="h-px bg-border my-2" />
                        <div className="flex justify-between">
                          <span className="font-medium">ยอดรวมคงค้าง</span>
                          <span className="font-bold text-lg">
                            {formatCurrency(
                              selectedLoan.remainingPrincipal +
                                selectedLoan.accruedInterest
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Payment Preview */}
                      {amount && parseFloat(amount) > 0 && (
                        <>
                          <div className="h-px bg-border" />
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-green-600">
                              การจัดสรรที่จะเกิดขึ้น
                            </p>
                            {preview && (
                              <>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">
                                    ตัดดอกเบี้ย
                                  </span>
                                  <span className="text-green-600">
                                    -{formatCurrency(preview.interestPaid)}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">
                                    ตัดเงินต้น
                                  </span>
                                  <span className="text-blue-600">
                                    -{formatCurrency(preview.principalPaid)}
                                  </span>
                                </div>
                              </>
                            )}
                            <div className="h-px bg-border my-2" />
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                ยอดคงเหลือหลังชำระ
                              </span>
                              <span className="font-bold">
                                {formatCurrency(
                                  selectedLoan.remainingPrincipal +
                                    selectedLoan.accruedInterest -
                                    parseFloat(amount)
                                )}
                              </span>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Payment Amount */}
                      <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-xl">
                        <p className="text-sm text-muted-foreground mb-1">
                          จำนวนเงินที่ชำระ
                        </p>
                        <p className="text-2xl font-bold text-green-600">
                          {amount ? formatCurrency(amount) : "฿0.00"}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
