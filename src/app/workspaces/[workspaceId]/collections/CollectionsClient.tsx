"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Plus, AlertTriangle, ChevronRight,
  Calendar, Wallet, Search, X,
  Clock, PhoneCall, ArrowUp, CheckCircle,
  Phone, Scale
} from "lucide-react";

interface CollectionCaseData {
  id: string;
  totalOutstanding: number;
  principalDue: number;
  interestDue: number;
  daysPastDue: number;
  status: string;
  priority: string;
  lastContactDate: Date | null;
  nextFollowUpDate: Date | null;
  contact: {
    id: string;
    name: string;
    phone: string | null;
    imageUrl: string | null;
  };
  loan: {
    id: string;
    principal: number;
    remainingPrincipal: number;
  };
  lastActivity: {
    activityType: string;
    description: string;
    createdAt: Date;
  } | null;
}

interface CollectionsClientProps {
  cases: CollectionCaseData[];
  workspaceId: string;
  stats: {
    active: number;
    promised: number;
    resolved: number;
    legal: number;
    totalOutstanding: number;
    totalCases: number;
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
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-red-500 to-red-700 text-white flex items-center justify-center font-semibold`}>
      {initials}
    </div>
  );
}

const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
  ACTIVE: { label: "กำลังติดตาม", className: "bg-blue-100 text-blue-700", icon: PhoneCall },
  PROMISED: { label: "สัญญาจ่าย", className: "bg-yellow-100 text-yellow-700", icon: Clock },
  PARTIAL: { label: "จ่ายบางส่วน", className: "bg-orange-100 text-orange-700", icon: Wallet },
  RESOLVED: { label: "เก็บหนี้ได้", className: "bg-green-100 text-green-700", icon: CheckCircle },
  WRITTEN_OFF: { label: "ตัดหนี้สูญ", className: "bg-gray-100 text-gray-700", icon: X },
  LEGAL: { label: "ดำเนินคดี", className: "bg-red-100 text-red-700", icon: Scale },
};

const priorityConfig: Record<string, { label: string; className: string; borderClass: string }> = {
  LOW: { label: "ต่ำ", className: "bg-gray-100 text-gray-700", borderClass: "" },
  NORMAL: { label: "ปกติ", className: "bg-blue-100 text-blue-700", borderClass: "" },
  HIGH: { label: "สูง", className: "bg-orange-100 text-orange-700", borderClass: "border-l-4 border-l-orange-500" },
  CRITICAL: { label: "วิกฤต", className: "bg-red-100 text-red-700", borderClass: "border-l-4 border-l-red-500" },
};

export default function CollectionsClient({
  cases,
  workspaceId,
  stats
}: CollectionsClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = searchQuery === "" ||
        c.contact.name.toLowerCase().includes(searchLower) ||
        c.contact.phone?.includes(searchQuery);

      // Status filter
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;

      // Priority filter  
      const matchesPriority = priorityFilter === "all" || c.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [cases, searchQuery, statusFilter, priorityFilter]);

  const statusOptions = [
    { value: "all", label: "ทั้งหมด", count: cases.length },
    { value: "ACTIVE", label: "กำลังติดตาม", count: cases.filter(c => c.status === "ACTIVE").length },
    { value: "PROMISED", label: "สัญญาจ่าย", count: cases.filter(c => c.status === "PROMISED").length },
    { value: "RESOLVED", label: "เก็บหนี้ได้", count: cases.filter(c => c.status === "RESOLVED").length },
    { value: "LEGAL", label: "ดำเนินคดี", count: cases.filter(c => c.status === "LEGAL").length },
  ];

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Left Column - Case List */}
      <div className="lg:col-span-2">
        {/* Search and Filter */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ค้นหาชื่อลูกหนี้หรือเบอร์โทร..."
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

              {/* Priority Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">ความเร่งด่วน:</span>
                <div className="flex gap-1">
                  {[
                    { value: "all", label: "ทั้งหมด" },
                    { value: "CRITICAL", label: "วิกฤต" },
                    { value: "HIGH", label: "สูง" },
                    { value: "NORMAL", label: "ปกติ" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setPriorityFilter(option.value)}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${priorityFilter === option.value
                        ? option.value === "CRITICAL" ? "bg-red-500 text-white" :
                          option.value === "HIGH" ? "bg-orange-500 text-white" :
                          "bg-primary text-white"
                        : "bg-muted hover:bg-muted/80 text-muted-foreground"
                        }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            เคสทวงหนี้ ({filteredCases.length})
            {filteredCases.length !== cases.length && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                จากทั้งหมด {cases.length}
              </span>
            )}
          </h2>
        </div>

        {filteredCases.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              {cases.length === 0 ? (
                <>
                  <p className="text-lg text-muted-foreground mb-4">ยังไม่มีเคสทวงหนี้</p>
                  <p className="text-sm text-muted-foreground mb-4">ระบบจะสร้างเคสอัตโนมัติจากสัญญาที่เกินกำหนด</p>
                </>
              ) : (
                <>
                  <p className="text-lg text-muted-foreground mb-4">ไม่พบเคสที่ตรงกับเงื่อนไข</p>
                  <Button
                    variant="outline"
                    className="rounded-full gap-2"
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("all");
                      setPriorityFilter("all");
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
            {filteredCases.map((caseItem) => {
              const status = statusConfig[caseItem.status] || statusConfig.ACTIVE;
              const priority = priorityConfig[caseItem.priority] || priorityConfig.NORMAL;
              const StatusIcon = status.icon;
              const isCritical = caseItem.priority === "CRITICAL" || caseItem.priority === "HIGH";

              return (
                <Link
                  key={caseItem.id}
                  href={`/workspaces/${workspaceId}/collections/${caseItem.id}`}
                >
                  <Card className={`hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all cursor-pointer group h-full ${priority.borderClass} ${isCritical ? 'bg-red-50/30' : ''}`}>
                    <CardContent className="p-4">
                      {/* Priority Alert */}
                      {isCritical && (
                        <div className={`flex items-center gap-2 ${caseItem.priority === "CRITICAL" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"} rounded-lg px-3 py-2 mb-3 text-sm`}>
                          <AlertTriangle className="h-4 w-4" />
                          <span className="font-medium">
                            {caseItem.priority === "CRITICAL" ? "วิกฤต" : "เร่งด่วน"} - ค้าง {caseItem.daysPastDue} วัน
                          </span>
                        </div>
                      )}

                      {/* Header: Avatar + Name + Status */}
                      <div className="flex items-start gap-3 mb-3">
                        <Avatar name={caseItem.contact.name} size="lg" imageUrl={caseItem.contact.imageUrl} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold truncate">{caseItem.contact.name}</h3>
                          </div>
                          {caseItem.contact.phone && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {caseItem.contact.phone}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${status.className}`}>
                            {status.label}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${priority.className}`}>
                            {priority.label}
                          </span>
                        </div>
                      </div>

                      {/* Amount Section */}
                      <div className={`rounded-lg p-3 mb-3 ${isCritical ? 'bg-red-100/50' : 'bg-muted/50'}`}>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-xs text-muted-foreground">ยอดค้างชำระ</p>
                            <p className={`text-lg font-bold ${isCritical ? 'text-red-600' : 'text-primary'}`}>
                              {formatCurrency(caseItem.totalOutstanding)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">ค้างชำระ</p>
                            <p className="text-lg font-bold text-red-600">
                              {caseItem.daysPastDue} วัน
                            </p>
                          </div>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground mt-2 pt-2 border-t border-border/50">
                          <span>เงินต้น: {formatCurrency(caseItem.principalDue)}</span>
                          <span>ดอกเบี้ย: {formatCurrency(caseItem.interestDue)}</span>
                        </div>
                      </div>

                      {/* Last Activity */}
                      {caseItem.lastActivity && (
                        <div className="text-xs text-muted-foreground mb-2 p-2 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span className="truncate">{caseItem.lastActivity.description}</span>
                          </div>
                        </div>
                      )}

                      {/* Date Info */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        {caseItem.lastContactDate && (
                          <span className="flex items-center gap-1">
                            <PhoneCall className="h-3 w-3" />
                            ติดต่อล่าสุด {formatDate(caseItem.lastContactDate)}
                          </span>
                        )}
                        {caseItem.nextFollowUpDate && (
                          <span className="flex items-center gap-1 text-orange-600">
                            <Calendar className="h-3 w-3" />
                            นัดติดตาม {formatDate(caseItem.nextFollowUpDate)}
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
                  กำลังติดตาม
                </span>
                <span className="text-xl font-bold">{stats.active}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  สัญญาจ่าย
                </span>
                <span className="text-xl font-bold">{stats.promised}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  เก็บหนี้ได้
                </span>
                <span className="text-xl font-bold">{stats.resolved}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  ดำเนินคดี
                </span>
                <span className={`text-xl font-bold ${stats.legal > 0 ? 'text-red-600' : ''}`}>
                  {stats.legal}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 -mx-1">
                <span className="text-sm font-semibold">ยอดค้างรวม</span>
                <span className="text-xl font-bold text-red-600">{formatCurrency(stats.totalOutstanding)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Priority Summary */}
        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary" />
              ความเร่งด่วน
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm">วิกฤต</span>
                </div>
                <span className="font-semibold">{cases.filter(c => c.priority === "CRITICAL").length}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span className="text-sm">สูง</span>
                </div>
                <span className="font-semibold">{cases.filter(c => c.priority === "HIGH").length}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm">ปกติ</span>
                </div>
                <span className="font-semibold">{cases.filter(c => c.priority === "NORMAL").length}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                  <span className="text-sm">ต่ำ</span>
                </div>
                <span className="font-semibold">{cases.filter(c => c.priority === "LOW").length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold mb-4">การดำเนินการ</h3>
            <div className="space-y-2">
              <Link href={`/workspaces/${workspaceId}/loans`} className="block">
                <Button variant="outline" className="w-full rounded-lg gap-2">
                  <Wallet className="h-4 w-4" />
                  ดูสัญญาเงินกู้
                </Button>
              </Link>
              <Link href={`/workspaces/${workspaceId}/payments/new`} className="block">
                <Button className="w-full rounded-lg gap-2">
                  <Plus className="h-4 w-4" />
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
