"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Plus, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";

interface CustomerCredit {
  id: string;
  creditLimit: number;
  usedCredit: number;
  availableCredit: number;
  riskLevel: string;
  lastAssessedAt?: string;
  contact: { name: string; phone?: string };
}

interface Stats {
  totalCustomers: number;
  totalCreditLimit: number;
  totalUsedCredit: number;
  totalAvailableCredit: number;
}

export default function CustomerCreditsPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const [credits, setCredits] = useState<CustomerCredit[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const fetchCredits = async () => {
    try {
      const url = `/api/workspaces/${workspaceId}/customer-credits${filter ? `?riskLevel=${filter}` : ""}`;
      const res = await fetch(url);
      const data = await res.json();
      setCredits(data.credits);
      setStats(data.stats);
    } catch (error) {
      console.error("Error fetching credits:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredits();
  }, [workspaceId, filter]);

  const getRiskBadge = (risk: string) => {
    const badges: Record<string, { color: string; label: string }> = {
      LOW: { color: "bg-green-100 text-green-800", label: "ความเสี่ยงต่ำ" },
      MEDIUM: { color: "bg-yellow-100 text-yellow-800", label: "ความเสี่ยงปานกลาง" },
      HIGH: { color: "bg-orange-100 text-orange-800", label: "ความเสี่ยงสูง" },
      VERY_HIGH: { color: "bg-red-100 text-red-800", label: "ความเสี่ยงสูงมาก" },
    };
    return badges[risk] || { color: "bg-gray-100 text-gray-800", label: risk };
  };

  const getUtilizationColor = (used: number, limit: number) => {
    const ratio = used / limit;
    if (ratio > 0.9) return "bg-red-500";
    if (ratio > 0.7) return "bg-orange-500";
    if (ratio > 0.5) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">วงเงินลูกค้า</h1>
          <p className="text-gray-500 mt-1">{credits.length} ราย</p>
        </div>
        <Link href={`/workspaces/${workspaceId}/customer-credits/new`}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            เพิ่มวงเงินลูกค้า
          </Button>
        </Link>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CreditCard className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500">จำนวนลูกค้า</p>
                  <p className="text-2xl font-bold">{stats.totalCustomers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-gray-500">วงเงินรวม</p>
                <p className="text-xl font-bold">
                  ฿{Number(stats.totalCreditLimit).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-6 w-6 text-red-500" />
                <div>
                  <p className="text-sm text-gray-500">ใช้ไปแล้ว</p>
                  <p className="text-xl font-bold text-red-600">
                    ฿{Number(stats.totalUsedCredit).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <TrendingDown className="h-6 w-6 text-green-500" />
                <div>
                  <p className="text-sm text-gray-500">วงเงินคงเหลือ</p>
                  <p className="text-xl font-bold text-green-600">
                    ฿{Number(stats.totalAvailableCredit).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <Button
          variant={filter === "" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("")}
        >
          ทั้งหมด
        </Button>
        <Button
          variant={filter === "LOW" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("LOW")}
          className="text-green-600"
        >
          ความเสี่ยงต่ำ
        </Button>
        <Button
          variant={filter === "MEDIUM" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("MEDIUM")}
          className="text-yellow-600"
        >
          ความเสี่ยงปานกลาง
        </Button>
        <Button
          variant={filter === "HIGH" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("HIGH")}
          className="text-orange-600"
        >
          ความเสี่ยงสูง
        </Button>
        <Button
          variant={filter === "VERY_HIGH" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("VERY_HIGH")}
          className="text-red-600"
        >
          ความเสี่ยงสูงมาก
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-10">กำลังโหลด...</div>
      ) : credits.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-gray-500">
            <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>ยังไม่มีข้อมูลวงเงินลูกค้า</p>
            <Link href={`/workspaces/${workspaceId}/customer-credits/new`}>
              <Button className="mt-4">เพิ่มวงเงินลูกค้า</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {credits.map((credit) => {
            const risk = getRiskBadge(credit.riskLevel);
            const limit = Number(credit.creditLimit);
            const used = Number(credit.usedCredit);
            const available = Number(credit.availableCredit);
            const utilizationPercent = limit > 0 ? (used / limit) * 100 : 0;

            return (
              <Card
                key={credit.id}
                className={`hover:shadow-md transition-shadow cursor-pointer ${
                  credit.riskLevel === "VERY_HIGH" ? "border-l-4 border-l-red-500" :
                  credit.riskLevel === "HIGH" ? "border-l-4 border-l-orange-500" : ""
                }`}
                onClick={() => router.push(`/workspaces/${workspaceId}/customer-credits/${credit.id}`)}
              >
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{credit.contact.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded ${risk.color}`}>
                          {risk.label}
                        </span>
                      </div>
                      {credit.contact.phone && (
                        <p className="text-sm text-gray-500">{credit.contact.phone}</p>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-gray-500">วงเงิน</p>
                      <p className="text-lg font-bold">฿{limit.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">
                        ใช้ไป ฿{used.toLocaleString()} ({utilizationPercent.toFixed(0)}%)
                      </span>
                      <span className="text-green-600">
                        คงเหลือ ฿{available.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getUtilizationColor(used, limit)}`}
                        style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
                      />
                    </div>
                  </div>

                  {credit.lastAssessedAt && (
                    <p className="text-xs text-gray-400 mt-2">
                      ประเมินล่าสุด: {new Date(credit.lastAssessedAt).toLocaleDateString("th-TH")}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
