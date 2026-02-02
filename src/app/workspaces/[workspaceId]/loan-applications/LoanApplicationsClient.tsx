"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Plus, FileText, ChevronRight,
  Calendar, Wallet, AlertCircle,
  Search, X, Clock, CheckCircle, XCircle, Banknote
} from "lucide-react";

interface LoanApplicationData {
  id: string;
  requestedAmount: number;
  approvedAmount: number | null;
  purpose: string | null;
  term: number | null;
  status: string;
  submittedAt: Date;
  reviewedAt: Date | null;
  contact: {
    id: string;
    name: string;
    imageUrl: string | null;
  };
  interestPolicy: {
    id: string;
    name: string;
    mode: string;
    monthlyRate: number | null;
    dailyRate: number | null;
  } | null;
}

interface LoanApplicationsClientProps {
  applications: LoanApplicationData[];
  workspaceId: string;
  stats: {
    pending: number;
    reviewing: number;
    approved: number;
    rejected: number;
    disbursed: number;
    totalRequested: number;
    totalApproved: number;
  };
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

const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
  PENDING: { label: "รอพิจารณา", className: "bg-yellow-100 text-yellow-700", icon: Clock },
  REVIEWING: { label: "กำลังพิจารณา", className: "bg-blue-100 text-blue-700", icon: FileText },
  APPROVED: { label: "อนุมัติแล้ว", className: "bg-green-100 text-green-700", icon: CheckCircle },
  REJECTED: { label: "ปฏิเสธ", className: "bg-red-100 text-red-700", icon: XCircle },
  DISBURSED: { label: "เบิกจ่ายแล้ว", className: "bg-purple-100 text-purple-700", icon: Banknote },
  CANCELLED: { label: "ยกเลิก", className: "bg-gray-100 text-gray-700", icon: XCircle },
};

export default function LoanApplicationsClient({
  applications,
  workspaceId,
  stats
}: LoanApplicationsClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = searchQuery === "" ||
        app.contact.name.toLowerCase().includes(searchLower) ||
        (app.purpose && app.purpose.toLowerCase().includes(searchLower));

      // Status filter
      const matchesStatus = statusFilter === "all" || app.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [applications, searchQuery, statusFilter]);

  const statusOptions = [
    { value: "all", label: "ทั้งหมด", count: applications.length },
    { value: "PENDING", label: "รอพิจารณา", count: applications.filter(a => a.status === "PENDING").length },
    { value: "REVIEWING", label: "กำลังพิจารณา", count: applications.filter(a => a.status === "REVIEWING").length },
    { value: "APPROVED", label: "อนุมัติแล้ว", count: applications.filter(a => a.status === "APPROVED").length },
    { value: "DISBURSED", label: "เบิกจ่ายแล้ว", count: applications.filter(a => a.status === "DISBURSED").length },
    { value: "REJECTED", label: "ปฏิเสธ", count: applications.filter(a => a.status === "REJECTED").length },
  ];

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Left Column - Application List */}
      <div className="lg:col-span-2">
        {/* Search and Filter */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ค้นหาชื่อผู้สมัครหรือวัตถุประสงค์..."
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
            รายการใบสมัคร ({filteredApplications.length})
            {filteredApplications.length !== applications.length && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                จากทั้งหมด {applications.length}
              </span>
            )}
          </h2>
        </div>

        {filteredApplications.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              {applications.length === 0 ? (
                <>
                  <p className="text-lg text-muted-foreground mb-4">ยังไม่มีใบสมัครสินเชื่อ</p>
                  <Link href={`/workspaces/${workspaceId}/loan-applications/new`}>
                    <Button className="rounded-full gap-2">
                      <Plus className="h-4 w-4" />
                      สร้างใบสมัครใหม่
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-lg text-muted-foreground mb-4">ไม่พบใบสมัครที่ตรงกับเงื่อนไข</p>
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
            {filteredApplications.map((app) => {
              const status = statusConfig[app.status] || statusConfig.PENDING;
              const StatusIcon = status.icon;
              const isPending = app.status === "PENDING" || app.status === "REVIEWING";

              return (
                <Link
                  key={app.id}
                  href={`/workspaces/${workspaceId}/loan-applications/${app.id}`}
                >
                  <Card className={`hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all cursor-pointer group h-full ${isPending ? 'border-yellow-300 bg-yellow-50/30' : ''}`}>
                    <CardContent className="p-4">
                      {/* Pending Alert */}
                      {isPending && (
                        <div className="flex items-center gap-2 bg-yellow-100 text-yellow-700 rounded-lg px-3 py-2 mb-3 text-sm">
                          <Clock className="h-4 w-4" />
                          <span className="font-medium">รอการพิจารณา</span>
                        </div>
                      )}

                      {/* Header: Avatar + Name + Status */}
                      <div className="flex items-start gap-3 mb-3">
                        <Avatar name={app.contact.name} size="lg" imageUrl={app.contact.imageUrl} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold truncate">{app.contact.name}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {app.purpose || "ไม่ระบุวัตถุประสงค์"}
                          </p>
                          {app.term && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              ระยะเวลา {app.term} เดือน
                            </p>
                          )}
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${status.className}`}>
                          {status.label}
                        </span>
                      </div>

                      {/* Amount Section */}
                      <div className={`rounded-lg p-3 mb-3 ${isPending ? 'bg-yellow-100/50' : 'bg-muted/50'}`}>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-xs text-muted-foreground">ยอดที่ขอกู้</p>
                            <p className={`text-lg font-bold ${isPending ? 'text-yellow-700' : 'text-primary'}`}>
                              {formatCurrency(app.requestedAmount)}
                            </p>
                          </div>
                          {app.approvedAmount && (
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">ยอดอนุมัติ</p>
                              <p className="text-lg font-bold text-green-600">
                                {formatCurrency(app.approvedAmount)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Interest Policy */}
                      {app.interestPolicy && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            {app.interestPolicy.name}
                          </span>
                        </div>
                      )}

                      {/* Date Info */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          ยื่นเมื่อ {formatDate(app.submittedAt)}
                        </span>
                        {app.reviewedAt && (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            พิจารณาเมื่อ {formatDate(app.reviewedAt)}
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
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  รอพิจารณา
                </span>
                <span className={`text-xl font-bold ${stats.pending > 0 ? 'text-yellow-600' : ''}`}>{stats.pending}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  อนุมัติแล้ว
                </span>
                <span className="text-xl font-bold">{stats.approved}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  เบิกจ่ายแล้ว
                </span>
                <span className="text-xl font-bold">{stats.disbursed}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">ยอดขอกู้รวม</span>
                <span className="text-lg font-bold text-primary">{formatCurrency(stats.totalRequested)}</span>
              </div>
              <div className="flex justify-between items-center py-3 bg-muted/50 rounded-lg px-3 -mx-1">
                <span className="text-sm font-semibold">ยอดอนุมัติรวม</span>
                <span className="text-xl font-bold text-green-600">{formatCurrency(stats.totalApproved)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Summary */}
        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              สถานะใบสมัคร
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-sm">รอพิจารณา</span>
                </div>
                <span className="font-semibold">{stats.pending}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm">กำลังพิจารณา</span>
                </div>
                <span className="font-semibold">{stats.reviewing}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm">อนุมัติแล้ว</span>
                </div>
                <span className="font-semibold">{stats.approved}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span className="text-sm">เบิกจ่ายแล้ว</span>
                </div>
                <span className="font-semibold">{stats.disbursed}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm">ปฏิเสธ</span>
                </div>
                <span className="font-semibold">{stats.rejected}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold mb-4">การดำเนินการ</h3>
            <div className="space-y-2">
              <Link href={`/workspaces/${workspaceId}/loan-applications/new`} className="block">
                <Button className="w-full rounded-lg gap-2">
                  <Plus className="h-4 w-4" />
                  สร้างใบสมัครใหม่
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
