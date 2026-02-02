"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  CreditCard,
  Loader2,
  Save,
  Trash2,
  QrCode,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

interface SlipOKConfig {
  id: string;
  branchId: string;
  promptPayId: string;
  promptPayName: string;
  bankCode: string | null;
  bankName: string | null;
  isActive: boolean;
  hasApiKey: boolean;
}

export default function AdminSlipOKPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<SlipOKConfig | null>(null);

  // Form state
  const [branchId, setBranchId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [promptPayId, setPromptPayId] = useState("");
  const [promptPayName, setPromptPayName] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [bankName, setBankName] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/admin/slipok");
      if (res.status === 403) {
        router.push("/admin");
        return;
      }
      const data = await res.json();
      if (data.config) {
        setConfig(data.config);
        setBranchId(data.config.branchId);
        setPromptPayId(data.config.promptPayId);
        setPromptPayName(data.config.promptPayName);
        setBankCode(data.config.bankCode || "");
        setBankName(data.config.bankName || "");
        setIsActive(data.config.isActive);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!branchId || !promptPayId || !promptPayName) {
      alert("กรุณากรอกข้อมูลให้ครบ");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/slipok", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId,
          apiKey: apiKey || undefined,
          promptPayId,
          promptPayName,
          bankCode: bankCode || undefined,
          bankName: bankName || undefined,
          isActive,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "เกิดข้อผิดพลาด");
        return;
      }

      await fetchConfig();
      setApiKey(""); // Clear API key field
      alert("บันทึกสำเร็จ");
    } catch (error) {
      alert("เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("ยืนยันการลบการตั้งค่า SlipOK?\nระบบจะไม่สามารถตรวจสอบสลิปอัตโนมัติได้")) return;

    setSaving(true);
    try {
      const res = await fetch("/api/admin/slipok", { method: "DELETE" });
      if (!res.ok) {
        alert("เกิดข้อผิดพลาด");
        return;
      }

      setConfig(null);
      setBranchId("");
      setApiKey("");
      setPromptPayId("");
      setPromptPayName("");
      setBankCode("");
      setBankName("");
      alert("ลบสำเร็จ");
    } catch (error) {
      alert("เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
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
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <QrCode className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">ตั้งค่า SlipOK</h1>
                <p className="text-xs text-slate-400">ระบบตรวจสอบสลิปอัตโนมัติ</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Status Card */}
          <Card className={`border-2 ${config?.isActive ? "border-green-500 bg-green-500/10" : "border-slate-600 bg-slate-800"}`}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                {config?.isActive ? (
                  <>
                    <CheckCircle className="h-10 w-10 text-green-400" />
                    <div>
                      <h3 className="text-lg font-semibold text-green-400">ระบบทำงานอยู่</h3>
                      <p className="text-sm text-slate-400">สามารถตรวจสอบสลิปอัตโนมัติได้</p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-10 w-10 text-amber-400" />
                    <div>
                      <h3 className="text-lg font-semibold text-amber-400">ยังไม่ได้ตั้งค่า</h3>
                      <p className="text-sm text-slate-400">ต้องตรวจสอบสลิปด้วยตนเอง</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                วิธีสมัคร SlipOK
              </CardTitle>
              <CardDescription className="text-slate-400">
                SlipOK เป็นบริการตรวจสอบสลิปโอนเงินอัตโนมัติ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-2 text-sm text-slate-300">
                <li>ไปที่ <a href="https://slipok.com" target="_blank" className="text-blue-400 hover:underline">slipok.com</a></li>
                <li>เพิ่ม LINE @slipok และสมัครสมาชิก</li>
                <li>เลือก Package และกรอกข้อมูลธุรกิจ</li>
                <li>เลือกช่องทาง &quot;API&quot;</li>
                <li>คัดลอก Branch ID และ API Key มาใส่ด้านล่าง</li>
              </ol>
              <a
                href="https://slipok.com/api-documentation/"
                target="_blank"
                className="inline-flex items-center gap-2 text-sm text-blue-400 hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                ดู API Documentation
              </a>
            </CardContent>
          </Card>

          {/* Config Form */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">การตั้งค่า</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* SlipOK Settings */}
              <div className="space-y-4 border-b border-slate-700 pb-4">
                <h4 className="text-sm font-medium text-slate-300">ข้อมูล SlipOK API</h4>
                
                <div>
                  <Label className="text-slate-400">Branch ID *</Label>
                  <Input
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                    placeholder="xxxxxx"
                    className="bg-slate-900 border-slate-600 text-white mt-1"
                  />
                  <p className="text-xs text-slate-500 mt-1">ได้จากหน้า SlipOK Dashboard</p>
                </div>

                <div>
                  <Label className="text-slate-400">API Key {config?.hasApiKey ? "(มีอยู่แล้ว)" : "*"}</Label>
                  <Input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={config?.hasApiKey ? "••••••••••" : "ใส่ API Key"}
                    className="bg-slate-900 border-slate-600 text-white mt-1"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {config?.hasApiKey ? "ใส่ใหม่เพื่อเปลี่ยน API Key" : "ได้จากหน้า SlipOK Dashboard"}
                  </p>
                </div>
              </div>

              {/* PromptPay Settings */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-slate-300">บัญชีรับเงิน PromptPay</h4>

                <div>
                  <Label className="text-slate-400">หมายเลข PromptPay *</Label>
                  <Input
                    value={promptPayId}
                    onChange={(e) => setPromptPayId(e.target.value)}
                    placeholder="0812345678 หรือ เลขบัตรประชาชน"
                    className="bg-slate-900 border-slate-600 text-white mt-1"
                  />
                </div>

                <div>
                  <Label className="text-slate-400">ชื่อบัญชี *</Label>
                  <Input
                    value={promptPayName}
                    onChange={(e) => setPromptPayName(e.target.value)}
                    placeholder="บริษัท xxx จำกัด"
                    className="bg-slate-900 border-slate-600 text-white mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-400">รหัสธนาคาร</Label>
                    <Input
                      value={bankCode}
                      onChange={(e) => setBankCode(e.target.value)}
                      placeholder="004"
                      className="bg-slate-900 border-slate-600 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-400">ชื่อธนาคาร</Label>
                    <Input
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="กสิกรไทย"
                      className="bg-slate-900 border-slate-600 text-white mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={() => setIsActive(!isActive)}
                  className={`w-12 h-6 rounded-full transition-all ${
                    isActive ? "bg-green-500" : "bg-slate-600"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      isActive ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
                <span className="text-sm text-slate-300">เปิดใช้งานระบบตรวจสอบอัตโนมัติ</span>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  บันทึก
                </Button>

                {config && (
                  <Button
                    onClick={handleDelete}
                    disabled={saving}
                    variant="ghost"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    ลบ
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
