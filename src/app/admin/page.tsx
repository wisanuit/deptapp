"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Users,
  Package,
  FileCheck,
  Shield,
  Crown,
  Loader2,
  AlertCircle,
  Settings,
  TrendingUp,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  Wallet,
} from "lucide-react";

interface Stats {
  pending: number;
  active: number;
  cancelled: number;
  expired: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [planCount, setPlanCount] = useState(0);
  const [adminCount, setAdminCount] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch subscription stats
      const subsRes = await fetch("/api/admin/subscriptions");
      if (subsRes.status === 403) {
        setError("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
        setLoading(false);
        return;
      }
      if (!subsRes.ok) throw new Error("Failed to fetch subscriptions");
      const subsData = await subsRes.json();
      setStats(subsData.stats);

      // Fetch plans
      const plansRes = await fetch("/api/admin/plans");
      if (plansRes.ok) {
        const plansData = await plansRes.json();
        setPlanCount(plansData.plans?.length || 0);
      }

      // Fetch admins
      const adminsRes = await fetch("/api/admin");
      if (adminsRes.ok) {
        const adminsData = await adminsRes.json();
        setAdminCount(adminsData.admins?.length || 0);
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">ไม่มีสิทธิ์เข้าถึง</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => router.push("/dashboard")}>
              กลับหน้าหลัก
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")} className="text-slate-300 hover:text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />
                กลับ
              </Button>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
                  <p className="text-xs text-slate-400">จัดการระบบ SaaS</p>
                </div>
              </div>
            </div>
            <Badge className="bg-purple-600 text-white">
              <Crown className="h-3 w-3 mr-1" />
              Super Admin
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">รออนุมัติ</p>
                  <p className="text-3xl font-bold text-amber-400">{stats?.pending || 0}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">ใช้งานอยู่</p>
                  <p className="text-3xl font-bold text-green-400">{stats?.active || 0}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">ยกเลิก/หมดอายุ</p>
                  <p className="text-3xl font-bold text-red-400">{(stats?.cancelled || 0) + (stats?.expired || 0)}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Packages</p>
                  <p className="text-3xl font-bold text-purple-400">{planCount}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Package className="h-6 w-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <h2 className="text-lg font-semibold text-white mb-4">เมนูจัดการ</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {/* Payment Verification */}
          <Link href="/admin/payments">
            <Card className="bg-slate-800 border-slate-700 hover:border-amber-500/50 transition-all cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-white" />
                  </div>
                  {stats?.pending && stats.pending > 0 && (
                    <Badge className="bg-red-500 text-white animate-pulse">
                      รอตรวจสอบ
                    </Badge>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-amber-400 transition-colors">
                  ตรวจสอบการชำระเงิน
                </h3>
                <p className="text-sm text-slate-400">
                  ตรวจสอบและอนุมัติสลิปการโอนเงิน
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Subscription Requests */}
          <Link href="/admin/subscriptions">
            <Card className="bg-slate-800 border-slate-700 hover:border-amber-500/50 transition-all cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                    <FileCheck className="h-6 w-6 text-white" />
                  </div>
                  {stats?.pending && stats.pending > 0 && (
                    <Badge className="bg-red-500 text-white animate-pulse">
                      {stats.pending} รอดำเนินการ
                    </Badge>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-amber-400 transition-colors">
                  คำขอสมัคร Package
                </h3>
                <p className="text-sm text-slate-400">
                  ตรวจสอบและอนุมัติคำขอสมัคร Package จากผู้ใช้
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Package Management */}
          <Link href="/admin/plans">
            <Card className="bg-slate-800 border-slate-700 hover:border-purple-500/50 transition-all cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                    <Package className="h-6 w-6 text-white" />
                  </div>
                  <Badge variant="outline" className="border-slate-600 text-slate-400">
                    {planCount} แผน
                  </Badge>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-400 transition-colors">
                  จัดการ Package
                </h3>
                <p className="text-sm text-slate-400">
                  สร้าง แก้ไข เปิด/ปิด Package และกำหนด Limits
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Admin Management */}
          <Link href="/admin/team">
            <Card className="bg-slate-800 border-slate-700 hover:border-blue-500/50 transition-all cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <Badge variant="outline" className="border-slate-600 text-slate-400">
                    {adminCount} คน
                  </Badge>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                  จัดการผู้ดูแลระบบ
                </h3>
                <p className="text-sm text-slate-400">
                  เพิ่ม/ลบ Admin และกำหนดสิทธิ์ Super Admin
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Payment Settings (SlipOK) */}
          <Link href="/admin/slipok">
            <Card className="bg-slate-800 border-slate-700 hover:border-green-500/50 transition-all cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                    <Wallet className="h-6 w-6 text-white" />
                  </div>
                  <Badge variant="outline" className="border-slate-600 text-slate-400">
                    SlipOK
                  </Badge>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-green-400 transition-colors">
                  ตั้งค่าชำระเงิน
                </h3>
                <p className="text-sm text-slate-400">
                  ตั้งค่า PromptPay และ SlipOK สำหรับรับชำระเงิน
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Activity */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-400" />
              ภาพรวมระบบ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-slate-900 rounded-lg">
                <CreditCard className="h-8 w-8 text-indigo-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{(stats?.active || 0) * 299}</p>
                <p className="text-sm text-slate-400">รายได้โดยประมาณ (บาท/เดือน)</p>
              </div>
              <div className="text-center p-4 bg-slate-900 rounded-lg">
                <Users className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">
                  {(stats?.active || 0) + (stats?.pending || 0) + (stats?.cancelled || 0)}
                </p>
                <p className="text-sm text-slate-400">ผู้ใช้ทั้งหมด</p>
              </div>
              <div className="text-center p-4 bg-slate-900 rounded-lg">
                <Package className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{planCount}</p>
                <p className="text-sm text-slate-400">Packages ที่ใช้งานได้</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
