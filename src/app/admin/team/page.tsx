"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Users,
  Loader2,
  Plus,
  Trash2,
  Crown,
  Shield,
  User,
  Mail,
  CheckCircle,
} from "lucide-react";

interface Admin {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  createdAt: string;
}

export default function AdminTeamPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [makeSuperAdmin, setMakeSuperAdmin] = useState(false);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const fetchAdmins = useCallback(async () => {
    try {
      const res = await fetch("/api/admin");
      if (res.status === 403) {
        router.push("/admin");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setAdmins(data.admins);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleAddAdmin = async () => {
    if (!newEmail.trim()) {
      alert("กรุณาใส่ email");
      return;
    }

    setAdding(true);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmail.trim(),
          makeSuperAdmin,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "เกิดข้อผิดพลาด");
        return;
      }

      await fetchAdmins();
      setNewEmail("");
      setMakeSuperAdmin(false);
      alert("เพิ่ม Admin สำเร็จ");
    } catch (error) {
      alert("เกิดข้อผิดพลาด");
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveAdmin = async (userId: string) => {
    if (!confirm("ยืนยันการลบสิทธิ์ Admin?")) return;

    setRemoving(userId);
    try {
      const res = await fetch(`/api/admin?userId=${userId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "เกิดข้อผิดพลาด");
        return;
      }

      await fetchAdmins();
      alert("ลบสิทธิ์ Admin สำเร็จ");
    } catch (error) {
      alert("เกิดข้อผิดพลาด");
    } finally {
      setRemoving(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/admin")} className="text-slate-300 hover:text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              กลับ
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">จัดการผู้ดูแลระบบ</h1>
                <p className="text-xs text-slate-400">เพิ่ม/ลบ Admin และกำหนดสิทธิ์</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Admin List */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold text-white mb-4">
              รายชื่อผู้ดูแลระบบ ({admins.length} คน)
            </h2>

            {admins.map((admin) => (
              <Card key={admin.id} className="bg-slate-800 border-slate-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden">
                        {admin.image ? (
                          <Image src={admin.image} alt="" width={48} height={48} className="rounded-full" unoptimized />
                        ) : (
                          <User className="h-6 w-6 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-white">{admin.name || "ไม่ระบุชื่อ"}</p>
                          {admin.isSuperAdmin && (
                            <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white">
                              <Crown className="h-3 w-3 mr-1" />
                              Super Admin
                            </Badge>
                          )}
                          {!admin.isSuperAdmin && admin.isAdmin && (
                            <Badge className="bg-blue-600">
                              <Shield className="h-3 w-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <Mail className="h-3 w-3" />
                          {admin.email}
                        </div>
                      </div>
                    </div>

                    {!admin.isSuperAdmin && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveAdmin(admin.id)}
                        disabled={removing === admin.id}
                        className="text-slate-400 hover:text-red-400"
                      >
                        {removing === admin.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Add Admin Form */}
          <div>
            <Card className="bg-slate-800 border-slate-700 sticky top-24">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  เพิ่มผู้ดูแลระบบ
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Email</label>
                  <Input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="bg-slate-900 border-slate-600 text-white"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    ถ้า email นี้ยังไม่มีในระบบ จะถูกสร้างขึ้นใหม่
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setMakeSuperAdmin(!makeSuperAdmin)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      makeSuperAdmin
                        ? "bg-amber-500 border-amber-500"
                        : "border-slate-600"
                    }`}
                  >
                    {makeSuperAdmin && <CheckCircle className="h-3 w-3 text-white" />}
                  </button>
                  <div>
                    <p className="text-sm text-slate-300">ตั้งเป็น Super Admin</p>
                    <p className="text-xs text-slate-500">สามารถจัดการ Admin คนอื่นได้</p>
                  </div>
                </div>

                <Button
                  onClick={handleAddAdmin}
                  disabled={adding || !newEmail.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {adding ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  เพิ่ม Admin
                </Button>

                <div className="border-t border-slate-700 pt-4 mt-4">
                  <h4 className="text-sm font-medium text-slate-300 mb-2">สิทธิ์การจัดการ</h4>
                  <ul className="text-xs text-slate-500 space-y-1">
                    <li className="flex items-center gap-2">
                      <Shield className="h-3 w-3 text-blue-400" />
                      <span><strong>Admin:</strong> จัดการ Package, อนุมัติคำขอ</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Crown className="h-3 w-3 text-amber-400" />
                      <span><strong>Super Admin:</strong> ทุกอย่าง + จัดการ Admin</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
