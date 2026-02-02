"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate, daysBetween } from "@/lib/utils";
import {
    Plus, HandCoins, ChevronRight,
    Calendar, TrendingDown, Wallet, AlertCircle,
    Search, X, Receipt
} from "lucide-react";

interface DebtData {
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
        imageUrl: string | null;
    };
    interestPolicy: {
        name: string;
        mode: string;
        monthlyRate: number | null;
        dailyRate: number | null;
    } | null;
}

interface DebtsClientProps {
    debts: DebtData[];
    workspaceId: string;
    totalPrincipal: number;
    totalInterest: number;
    openDebtsCount: number;
    overdueDebtsCount: number;
}

// Avatar component - Red/Orange theme for debts
function Avatar({ name, size = "md", imageUrl }: { name: string; size?: "sm" | "md" | "lg"; imageUrl?: string | null }) {
    const initials = name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
    const sizeClasses = {
        sm: "w-8 h-8 text-xs",
        md: "w-10 h-10 text-sm",
        lg: "w-12 h-12 text-base"
    };

    if (imageUrl) {
        return (
            <Image src={imageUrl} alt={name} width={48} height={48} className={`${sizeClasses[size]} rounded-full object-cover`} unoptimized />
        );
    }

    return (
        <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-red-500 to-orange-600 text-white flex items-center justify-center font-semibold`}>
            {initials}
        </div>
    );
}

const statusConfig: Record<string, { label: string; className: string }> = {
    OPEN: { label: "ค้างชำระ", className: "bg-orange-100 text-orange-700" },
    CLOSED: { label: "ชำระครบแล้ว", className: "bg-green-100 text-green-700" },
    OVERDUE: { label: "เกินกำหนด", className: "bg-red-100 text-red-700" },
};

export default function DebtsClient({
    debts,
    workspaceId,
    totalPrincipal,
    totalInterest,
    openDebtsCount,
    overdueDebtsCount
}: DebtsClientProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    const filteredDebts = useMemo(() => {
        return debts.filter(debt => {
            // Search filter
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch = searchQuery === "" ||
                debt.lender.name.toLowerCase().includes(searchLower);

            // Status filter
            const matchesStatus = statusFilter === "all" ||
                (statusFilter === "overdue" && isDebtOverdue(debt)) ||
                (statusFilter !== "overdue" && debt.status === statusFilter);

            return matchesSearch && matchesStatus;
        });
    }, [debts, searchQuery, statusFilter]);

    function isDebtOverdue(debt: DebtData) {
        if (debt.status === "CLOSED") return false;
        if (!debt.dueDate) return false;
        return new Date(debt.dueDate) < new Date();
    }

    const statusOptions = [
        { value: "all", label: "ทั้งหมด", count: debts.length },
        { value: "OPEN", label: "ค้างชำระ", count: debts.filter(d => d.status === "OPEN").length },
        { value: "CLOSED", label: "ชำระครบแล้ว", count: debts.filter(d => d.status === "CLOSED").length },
        { value: "overdue", label: "เกินกำหนด", count: debts.filter(d => isDebtOverdue(d)).length },
    ];

    return (
        <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Debt List */}
            <div className="lg:col-span-2">
                {/* Search and Filter */}
                <Card>
                    <CardContent className="p-4">
                        <div className="mb-4 space-y-3">
                            {/* Search Input */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="ค้นหาชื่อเจ้าหนี้..."
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
                                                ? "bg-red-600 text-white"
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
                        รายการหนี้ ({filteredDebts.length})
                        {filteredDebts.length !== debts.length && (
                            <span className="text-sm font-normal text-muted-foreground ml-2">
                                จากทั้งหมด {debts.length}
                            </span>
                        )}
                    </h2>
                </div>

                {filteredDebts.length === 0 ? (
                    <Card>
                        <CardContent className="py-16 text-center">
                            <HandCoins className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                            {debts.length === 0 ? (
                                <>
                                    <p className="text-lg text-muted-foreground mb-2">ไม่มีหนี้สิน! 🎉</p>
                                    <p className="text-sm text-muted-foreground mb-4">คุณยังไม่มีหนี้ที่ต้องจ่าย</p>
                                    <Link href={`/workspaces/${workspaceId}/debts/new`}>
                                        <Button className="rounded-full gap-2 bg-red-600 hover:bg-red-700">
                                            <Plus className="h-4 w-4" />
                                            บันทึกหนี้ใหม่
                                        </Button>
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <p className="text-lg text-muted-foreground mb-4">ไม่พบหนี้ที่ตรงกับเงื่อนไข</p>
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
                        {filteredDebts.map((debt) => {
                            const status = statusConfig[debt.status] || statusConfig.OPEN;
                            const today = new Date();
                            const dueDate = debt.dueDate ? new Date(debt.dueDate) : null;
                            const isOverdue = dueDate && today > dueDate && debt.status !== "CLOSED";
                            const overdueDays = isOverdue ? daysBetween(dueDate, today) : 0;
                            const displayInterest = debt.calculatedInterest;
                            const isClosed = debt.status === "CLOSED";

                            return (
                                <Link
                                    key={debt.id}
                                    href={`/workspaces/${workspaceId}/loans/${debt.id}`}
                                >
                                    <Card className={`hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all cursor-pointer group h-full ${
                                        isOverdue ? 'border-red-300 bg-red-50/30' : ''
                                    } ${isClosed ? 'opacity-70' : ''}`}>
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
                                                <Avatar name={debt.lender.name} size="lg" imageUrl={debt.lender.imageUrl} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-semibold truncate">{debt.lender.name}</h3>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground truncate">
                                                        💰 เจ้าหนี้
                                                    </p>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${status.className}`}>
                                                    {status.label}
                                                </span>
                                            </div>

                                            {/* Amount Section */}
                                            <div className={`rounded-lg p-3 mb-3 ${
                                                isOverdue ? 'bg-red-100/50' : isClosed ? 'bg-green-50' : 'bg-orange-50'
                                            }`}>
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">หนี้คงเหลือ</p>
                                                        <p className={`text-lg font-bold ${
                                                            isClosed ? 'text-green-600 line-through' : isOverdue ? 'text-red-600' : 'text-orange-600'
                                                        }`}>
                                                            {formatCurrency(debt.remainingPrincipal)}
                                                        </p>
                                                    </div>
                                                    {!isClosed && displayInterest > 0 && (
                                                        <div className="text-right">
                                                            <p className="text-xs text-muted-foreground">ดอกเบี้ยค้างจ่าย</p>
                                                            <p className="text-lg font-bold text-purple-600">
                                                                +{formatCurrency(displayInterest)}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Date Info */}
                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    กู้ {formatDate(debt.startDate)}
                                                </span>
                                                {debt.dueDate && (
                                                    <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                                                        <Calendar className="h-3 w-3" />
                                                        ครบ {formatDate(debt.dueDate)}
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
                <Card className="border-red-200">
                    <CardContent className="p-5">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <TrendingDown className="h-5 w-5 text-red-600" />
                            ภาพรวมหนี้สิน
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center py-2 border-b border-border">
                                <span className="text-sm text-muted-foreground flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                    หนี้ค้างชำระ
                                </span>
                                <span className="text-xl font-bold">{openDebtsCount}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-border">
                                <span className="text-sm text-muted-foreground flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                    เกินกำหนด
                                </span>
                                <span className={`text-xl font-bold ${overdueDebtsCount > 0 ? 'text-red-600' : ''}`}>
                                    {overdueDebtsCount}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-border">
                                <span className="text-sm text-muted-foreground">หนี้คงเหลือ</span>
                                <span className="text-lg font-bold text-red-600">{formatCurrency(totalPrincipal)}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-border">
                                <span className="text-sm text-muted-foreground">ดอกเบี้ยค้างจ่าย</span>
                                <span className="text-lg font-bold text-purple-600">{formatCurrency(totalInterest)}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 bg-red-50 rounded-lg px-3 -mx-1 border border-red-100">
                                <span className="text-sm font-semibold text-red-700">ยอดหนี้รวม</span>
                                <span className="text-xl font-bold text-red-700">{formatCurrency(totalPrincipal + totalInterest)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Status Summary */}
                <Card>
                    <CardContent className="p-5">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <HandCoins className="h-5 w-5 text-red-600" />
                            สถานะหนี้
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                                    <span className="text-sm">ค้างชำระ</span>
                                </div>
                                <span className="font-semibold">{debts.filter(d => d.status === "OPEN").length}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                    <span className="text-sm">ชำระครบแล้ว</span>
                                </div>
                                <span className="font-semibold">{debts.filter(d => d.status === "CLOSED").length}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                    <span className="text-sm">เกินกำหนด</span>
                                </div>
                                <span className="font-semibold">{debts.filter(d => isDebtOverdue(d)).length}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                    <CardContent className="p-5">
                        <h3 className="font-semibold mb-4">การดำเนินการ</h3>
                        <div className="space-y-2">
                            <Link href={`/workspaces/${workspaceId}/debts/new`} className="block">
                                <Button className="w-full rounded-lg gap-2 bg-red-600 hover:bg-red-700">
                                    <Plus className="h-4 w-4" />
                                    บันทึกหนี้ใหม่
                                </Button>
                            </Link>
                            <Link href={`/workspaces/${workspaceId}/payments/new`} className="block">
                                <Button variant="outline" className="w-full rounded-lg gap-2">
                                    <Receipt className="h-4 w-4" />
                                    บันทึกการชำระ
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                {/* Tips */}
                {overdueDebtsCount > 0 && (
                    <Card className="border-red-200 bg-red-50">
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                                <div>
                                    <h4 className="font-medium text-red-800 mb-1">หนี้เกินกำหนด!</h4>
                                    <p className="text-sm text-red-700">
                                        คุณมี {overdueDebtsCount} รายการที่เกินกำหนดชำระ กรุณาติดต่อเจ้าหนี้เพื่อชำระหนี้
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
