"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate, daysBetween } from "@/lib/utils";
import {
    Plus, FileText, ChevronRight,
    Calendar, TrendingUp, Wallet, AlertCircle,
    Search, Filter, X
} from "lucide-react";

interface LoanData {
    id: string;
    principal: number;
    remainingPrincipal: number;
    accruedInterest: number;
    calculatedInterest: number;
    startDate: Date;
    dueDate: Date | null;
    status: string;
    borrower: {
        id: string;
        name: string;
        imageUrl: string | null;
    };
    lender: {
        id: string;
        name: string;
    };
    interestPolicy: {
        name: string;
        mode: string;
        monthlyRate: number | null;
        dailyRate: number | null;
    } | null;
}

interface LoansClientProps {
    loans: LoanData[];
    workspaceId: string;
    totalPrincipal: number;
    totalInterest: number;
    openLoansCount: number;
    overdueLoansCount: number;
}

// Avatar component
function Avatar({ name, size = "md", imageUrl }: { name: string; size?: "sm" | "md" | "lg"; imageUrl?: string | null }) {
    const initials = name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
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

const statusConfig: Record<string, { label: string; className: string }> = {
    OPEN: { label: "กำลังดำเนินการ", className: "bg-blue-100 text-blue-700" },
    CLOSED: { label: "ปิดแล้ว", className: "bg-green-100 text-green-700" },
    OVERDUE: { label: "เกินกำหนด", className: "bg-red-100 text-red-700" },
};

export default function LoansClient({
    loans,
    workspaceId,
    totalPrincipal,
    totalInterest,
    openLoansCount,
    overdueLoansCount
}: LoansClientProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    const filteredLoans = useMemo(() => {
        return loans.filter(loan => {
            // Search filter
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch = searchQuery === "" ||
                loan.borrower.name.toLowerCase().includes(searchLower) ||
                loan.lender.name.toLowerCase().includes(searchLower);

            // Status filter
            const matchesStatus = statusFilter === "all" ||
                (statusFilter === "overdue" && isLoanOverdue(loan)) ||
                (statusFilter !== "overdue" && loan.status === statusFilter);

            return matchesSearch && matchesStatus;
        });
    }, [loans, searchQuery, statusFilter]);

    function isLoanOverdue(loan: LoanData) {
        if (loan.status === "CLOSED") return false;
        if (!loan.dueDate) return false;
        return new Date(loan.dueDate) < new Date();
    }

    const statusOptions = [
        { value: "all", label: "ทั้งหมด", count: loans.length },
        { value: "OPEN", label: "กำลังดำเนินการ", count: loans.filter(l => l.status === "OPEN").length },
        { value: "CLOSED", label: "ปิดแล้ว", count: loans.filter(l => l.status === "CLOSED").length },
        { value: "overdue", label: "เกินกำหนด", count: loans.filter(l => isLoanOverdue(l)).length },
    ];

    return (
        <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Loan List */}
            <div className="lg:col-span-2">
                {/* Search and Filter */}
                <Card>
                    <CardContent className="p-4">
                        <div className="mb-4 space-y-3">
                            {/* Search Input */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="ค้นหาชื่อผู้กู้หรือเจ้าหนี้..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 pr-10 rounded-full"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted"
                                    >
                                        <X className="h-4 w-4 text-muted-foreground" />
                                    </button>
                                )}
                            </div>

                            {/* Status Filter Pills */}
                            <div className="flex flex-wrap gap-2">
                                {statusOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => setStatusFilter(option.value)}
                                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${statusFilter === option.value
                                                ? "bg-primary text-white"
                                                : "bg-muted hover:bg-muted/80 text-muted-foreground"
                                            }`}
                                    >
                                        {option.label} ({option.count})
                                    </button>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Results Count */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">
                        รายการสัญญา ({filteredLoans.length})
                        {filteredLoans.length !== loans.length && (
                            <span className="text-sm font-normal text-muted-foreground ml-2">
                                จากทั้งหมด {loans.length}
                            </span>
                        )}
                    </h2>
                </div>

                {filteredLoans.length === 0 ? (
                    <Card>
                        <CardContent className="py-16 text-center">
                            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                            {loans.length === 0 ? (
                                <>
                                    <p className="text-lg text-muted-foreground mb-4">ยังไม่มีสัญญาเงินกู้</p>
                                    <Link href={`/workspaces/${workspaceId}/loans/new`}>
                                        <Button className="rounded-full gap-2">
                                            <Plus className="h-4 w-4" />
                                            สร้างสัญญาแรก
                                        </Button>
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <p className="text-lg text-muted-foreground mb-4">ไม่พบสัญญาที่ตรงกับเงื่อนไข</p>
                                    <Button
                                        variant="outline"
                                        className="rounded-full gap-2"
                                        onClick={() => {
                                            setSearchQuery("");
                                            setStatusFilter("all");
                                        }}
                                    >
                                        <X className="h-4 w-4" />
                                        ล้างตัวกรอง
                                    </Button>
                                </>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                        {filteredLoans.map((loan) => {
                            const status = statusConfig[loan.status] || statusConfig.OPEN;
                            const today = new Date();
                            const dueDate = loan.dueDate ? new Date(loan.dueDate) : null;
                            const isOverdue = dueDate && today > dueDate && loan.status !== "CLOSED";
                            const overdueDays = isOverdue ? daysBetween(dueDate, today) : 0;
                            const displayInterest = loan.calculatedInterest;

                            return (
                                <Link
                                    key={loan.id}
                                    href={`/workspaces/${workspaceId}/loans/${loan.id}`}
                                >
                                    <Card className={`hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all cursor-pointer group h-full ${isOverdue ? 'border-red-300 bg-red-50/30' : ''}`}>
                                        <CardContent className="p-4">
                                            {/* Overdue Alert */}
                                            {isOverdue && (
                                                <div className="flex items-center gap-2 bg-red-100 text-red-700 rounded-lg px-3 py-2 mb-3 text-sm">
                                                    <AlertCircle className="h-4 w-4" />
                                                    <span className="font-medium">เกินกำหนด {overdueDays} วัน</span>
                                                </div>
                                            )}

                                            {/* Header: Avatar + Name + Status */}
                                            <div className="flex items-start gap-3 mb-3">
                                                <Avatar name={loan.borrower.name} size="lg" imageUrl={loan.borrower.imageUrl} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-semibold truncate">{loan.borrower.name}</h3>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground truncate">
                                                        เจ้าหนี้: {loan.lender.name}
                                                    </p>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${status.className}`}>
                                                    {status.label}
                                                </span>
                                            </div>

                                            {/* Amount Section */}
                                            <div className={`rounded-lg p-3 mb-3 ${isOverdue ? 'bg-red-100/50' : 'bg-muted/50'}`}>
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">เงินต้นคงเหลือ</p>
                                                        <p className={`text-lg font-bold ${isOverdue ? 'text-red-600' : 'text-primary'}`}>
                                                            {formatCurrency(loan.remainingPrincipal)}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs text-muted-foreground">ดอกเบี้ย</p>
                                                        <p className={`text-lg font-bold ${isOverdue ? 'text-red-600' : 'text-green-600'}`}>
                                                            +{formatCurrency(displayInterest)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Date Info */}
                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    เริ่ม {formatDate(loan.startDate)}
                                                </span>
                                                {loan.dueDate && (
                                                    <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                                                        <Calendar className="h-3 w-3" />
                                                        ครบ {formatDate(loan.dueDate)}
                                                    </span>
                                                )}
                                                <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
                {/* Summary Stats */}
                <Card>
                    <CardContent className="p-5">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <Wallet className="h-5 w-5 text-primary" />
                            ภาพรวม
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center py-2 border-b border-border">
                                <span className="text-sm text-muted-foreground flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                    สัญญาที่เปิดอยู่
                                </span>
                                <span className="text-xl font-bold">{openLoansCount}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-border">
                                <span className="text-sm text-muted-foreground flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                    สัญญาเกินกำหนด
                                </span>
                                <span className={`text-xl font-bold ${overdueLoansCount > 0 ? 'text-red-600' : ''}`}>
                                    {overdueLoansCount}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-border">
                                <span className="text-sm text-muted-foreground">เงินต้นคงเหลือ</span>
                                <span className="text-lg font-bold text-primary">{formatCurrency(totalPrincipal)}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-border">
                                <span className="text-sm text-muted-foreground">ดอกเบี้ยค้างรับ</span>
                                <span className="text-lg font-bold text-green-600">{formatCurrency(totalInterest)}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 bg-muted/50 rounded-lg px-3 -mx-1">
                                <span className="text-sm font-semibold">รวมทั้งหมด</span>
                                <span className="text-xl font-bold text-primary">{formatCurrency(totalPrincipal + totalInterest)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Status Summary */}
                <Card>
                    <CardContent className="p-5">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            สถานะสัญญา
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                    <span className="text-sm">กำลังดำเนินการ</span>
                                </div>
                                <span className="font-semibold">{loans.filter(l => l.status === "OPEN").length}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                    <span className="text-sm">ปิดแล้ว</span>
                                </div>
                                <span className="font-semibold">{loans.filter(l => l.status === "CLOSED").length}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                    <span className="text-sm">เกินกำหนด</span>
                                </div>
                                <span className="font-semibold">{loans.filter(l => isLoanOverdue(l)).length}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                    <CardContent className="p-5">
                        <h3 className="font-semibold mb-4">การดำเนินการ</h3>
                        <div className="space-y-2">
                            <Link href={`/workspaces/${workspaceId}/loans/new`} className="block">
                                <Button className="w-full rounded-lg gap-2">
                                    <Plus className="h-4 w-4" />
                                    สร้างสัญญาใหม่
                                </Button>
                            </Link>
                            <Link href={`/workspaces/${workspaceId}/payments/new`} className="block">
                                <Button variant="outline" className="w-full rounded-lg gap-2">
                                    <Wallet className="h-4 w-4" />
                                    บันทึกการชำระ
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
