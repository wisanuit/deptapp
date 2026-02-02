"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate, daysBetween } from "@/lib/utils";
import {
  Plus, Package, ChevronRight,
  Calendar, TrendingUp, Wallet, AlertCircle,
  Search, X, CheckCircle, Clock
} from "lucide-react";

interface InstallmentData {
  id: string;
  itemName: string;
  itemDescription: string | null;
  itemImageUrl: string | null;
  totalAmount: number;
  downPayment: number;
  numberOfTerms: number;
  termAmount: number;
  interestRate: number;
  startDate: Date;
  status: string;
  contact: {
    id: string;
    name: string;
    imageUrl: string | null;
  };
  paidTerms: number;
  totalTerms: number;
  overdueTerms: number;
  totalPaid: number;
  remainingAmount: number;
  nextDueDate: Date | null;
}

interface InstallmentsClientProps {
  installments: InstallmentData[];
  workspaceId: string;
  totalFinanceAmount: number;
  totalPaidAmount: number;
  activePlansCount: number;
  overduePlansCount: number;
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

// Product Image component
function ProductImage({ itemName, imageUrl, size = "md" }: { itemName: string; imageUrl?: string | null; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16"
  };

  if (imageUrl) {
    return (
      <img src={imageUrl} alt={itemName} className={`${sizeClasses[size]} rounded-lg object-cover`} />
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 text-white flex items-center justify-center`}>
      <Package className="h-6 w-6" />
    </div>
  );
}

const statusConfig: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: "กำลังผ่อน", className: "bg-blue-100 text-blue-700" },
  COMPLETED: { label: "ผ่อนครบ", className: "bg-green-100 text-green-700" },
  DEFAULTED: { label: "ผิดนัด", className: "bg-red-100 text-red-700" },
  CANCELLED: { label: "ยกเลิก", className: "bg-gray-100 text-gray-700" },
};

export default function InstallmentsClient({
  installments,
  workspaceId,
  totalFinanceAmount,
  totalPaidAmount,
  activePlansCount,
  overduePlansCount
}: InstallmentsClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredInstallments = useMemo(() => {
    return installments.filter(plan => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = searchQuery === "" ||
        plan.itemName.toLowerCase().includes(searchLower) ||
        plan.contact.name.toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus = statusFilter === "all" ||
        (statusFilter === "overdue" && plan.overdueTerms > 0) ||
        (statusFilter !== "overdue" && plan.status === statusFilter);

      return matchesSearch && matchesStatus;
    });
  }, [installments, searchQuery, statusFilter]);

  const statusOptions = [
    { value: "all", label: "ทั้งหมด", count: installments.length },
    { value: "ACTIVE", label: "กำลังผ่อน", count: installments.filter(p => p.status === "ACTIVE").length },
    { value: "COMPLETED", label: "ผ่อนครบ", count: installments.filter(p => p.status === "COMPLETED").length },
    { value: "overdue", label: "มีงวดค้าง", count: installments.filter(p => p.overdueTerms > 0).length },
  ];

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Left Column - Installment List */}
      <div className="lg:col-span-2">
        {/* Search and Filter */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ค้นหาชื่อสินค้าหรือผู้ซื้อ..."
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
            รายการผ่อนสินค้า ({filteredInstallments.length})
            {filteredInstallments.length !== installments.length && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                จากทั้งหมด {installments.length}
              </span>
            )}
          </h2>
        </div>

        {filteredInstallments.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              {installments.length === 0 ? (
                <>
                  <p className="text-lg text-muted-foreground mb-4">ยังไม่มีแผนผ่อนสินค้า</p>
                  <Link href={`/workspaces/${workspaceId}/installments/new`}>
                    <Button className="rounded-full gap-2">
                      <Plus className="h-4 w-4" />
                      สร้างแผนผ่อนใหม่
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-lg text-muted-foreground mb-4">ไม่พบรายการที่ตรงกับเงื่อนไข</p>
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
            {filteredInstallments.map((plan) => {
              const status = statusConfig[plan.status] || statusConfig.ACTIVE;
              const hasOverdue = plan.overdueTerms > 0;
              const progress = (plan.paidTerms / plan.totalTerms) * 100;

              return (
                <Link
                  key={plan.id}
                  href={`/workspaces/${workspaceId}/installments/${plan.id}`}
                >
                  <Card className={`hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all cursor-pointer group h-full ${hasOverdue ? 'border-red-300 bg-red-50/30' : ''}`}>
                    <CardContent className="p-4">
                      {/* Overdue Alert */}
                      {hasOverdue && (
                        <div className="flex items-center gap-2 bg-red-100 text-red-700 rounded-lg px-3 py-2 mb-3 text-sm">
                          <AlertCircle className="h-4 w-4" />
                          <span className="font-medium">ค้างชำระ {plan.overdueTerms} งวด</span>
                        </div>
                      )}

                      {/* Header: Product Image + Name + Status */}
                      <div className="flex items-start gap-3 mb-3">
                        <ProductImage itemName={plan.itemName} imageUrl={plan.itemImageUrl} size="lg" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold truncate">{plan.itemName}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            ผู้ซื้อ: {plan.contact.name}
                          </p>
                          {plan.itemDescription && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {plan.itemDescription}
                            </p>
                          )}
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${status.className}`}>
                          {status.label}
                        </span>
                      </div>

                      {/* Amount Section */}
                      <div className={`rounded-lg p-3 mb-3 ${hasOverdue ? 'bg-red-100/50' : 'bg-muted/50'}`}>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-xs text-muted-foreground">ยอดคงเหลือ</p>
                            <p className={`text-lg font-bold ${hasOverdue ? 'text-red-600' : 'text-primary'}`}>
                              {formatCurrency(plan.remainingAmount)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">ต่องวด</p>
                            <p className="text-lg font-bold text-muted-foreground">
                              {formatCurrency(plan.termAmount)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">
                            ชำระแล้ว {plan.paidTerms}/{plan.totalTerms} งวด
                          </span>
                          <span className={`font-medium ${hasOverdue ? 'text-red-600' : 'text-green-600'}`}>
                            {progress.toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${hasOverdue ? "bg-red-500" : "bg-green-500"}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Date Info */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          เริ่ม {formatDate(plan.startDate)}
                        </span>
                        {plan.nextDueDate && plan.status === "ACTIVE" && (
                          <span className={`flex items-center gap-1 ${hasOverdue ? 'text-red-600 font-medium' : ''}`}>
                            <Clock className="h-3 w-3" />
                            งวดถัดไป {formatDate(plan.nextDueDate)}
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
                  แผนที่กำลังผ่อน
                </span>
                <span className="text-xl font-bold">{activePlansCount}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  แผนที่มีงวดค้าง
                </span>
                <span className={`text-xl font-bold ${overduePlansCount > 0 ? 'text-red-600' : ''}`}>
                  {overduePlansCount}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">ยอดรวมที่ต้องรับ</span>
                <span className="text-lg font-bold text-primary">{formatCurrency(totalFinanceAmount)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">ยอดที่ชำระแล้ว</span>
                <span className="text-lg font-bold text-green-600">{formatCurrency(totalPaidAmount)}</span>
              </div>
              <div className="flex justify-between items-center py-3 bg-muted/50 rounded-lg px-3 -mx-1">
                <span className="text-sm font-semibold">ยอดคงเหลือ</span>
                <span className="text-xl font-bold text-primary">{formatCurrency(totalFinanceAmount - totalPaidAmount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Summary */}
        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              สถานะแผนผ่อน
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm">กำลังผ่อน</span>
                </div>
                <span className="font-semibold">{installments.filter(p => p.status === "ACTIVE").length}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm">ผ่อนครบ</span>
                </div>
                <span className="font-semibold">{installments.filter(p => p.status === "COMPLETED").length}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm">ผิดนัด</span>
                </div>
                <span className="font-semibold">{installments.filter(p => p.status === "DEFAULTED").length}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                  <span className="text-sm">ยกเลิก</span>
                </div>
                <span className="font-semibold">{installments.filter(p => p.status === "CANCELLED").length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold mb-4">การดำเนินการ</h3>
            <div className="space-y-2">
              <Link href={`/workspaces/${workspaceId}/installments/new`} className="block">
                <Button className="w-full rounded-lg gap-2">
                  <Plus className="h-4 w-4" />
                  สร้างแผนผ่อนใหม่
                </Button>
              </Link>
              <Link href={`/workspaces/${workspaceId}/contacts`} className="block">
                <Button variant="outline" className="w-full rounded-lg gap-2">
                  <Wallet className="h-4 w-4" />
                  จัดการผู้ติดต่อ
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
