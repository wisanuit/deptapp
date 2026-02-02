"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface Contact {
  id: string;
  name: string;
}

export default function NewCustomerCreditPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const workspaceId = params.workspaceId as string;

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    contactId: "",
    creditLimit: "",
    riskLevel: "MEDIUM",
  });

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const res = await fetch(`/api/workspaces/${workspaceId}/contacts`);
        const data = await res.json();
        setContacts(data);
      } catch (error) {
        console.error("Error fetching contacts:", error);
      }
    };
    fetchContacts();
  }, [workspaceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/customer-credits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: formData.contactId,
          creditLimit: parseFloat(formData.creditLimit),
          riskLevel: formData.riskLevel,
        }),
      });

      if (res.ok) {
        const credit = await res.json();
        router.push(`/workspaces/${workspaceId}/customer-credits/${credit.id}`);
      } else {
        const error = await res.json();
        toast.error(error.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      console.error("Error creating credit:", error);
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-2xl">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        ย้อนกลับ
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>เพิ่มวงเงินลูกค้าใหม่</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="contactId">ลูกค้า *</Label>
              <select
                id="contactId"
                className="w-full mt-1 px-3 py-2 border rounded-md"
                value={formData.contactId}
                onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
                required
              >
                <option value="">เลือกลูกค้า</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="creditLimit">วงเงินเครดิต (บาท) *</Label>
              <Input
                id="creditLimit"
                type="number"
                value={formData.creditLimit}
                onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                placeholder="0"
                required
              />
            </div>

            <div>
              <Label htmlFor="riskLevel">ระดับความเสี่ยงเริ่มต้น</Label>
              <select
                id="riskLevel"
                className="w-full mt-1 px-3 py-2 border rounded-md"
                value={formData.riskLevel}
                onChange={(e) => setFormData({ ...formData, riskLevel: e.target.value })}
              >
                <option value="LOW">ความเสี่ยงต่ำ</option>
                <option value="MEDIUM">ความเสี่ยงปานกลาง</option>
                <option value="HIGH">ความเสี่ยงสูง</option>
                <option value="VERY_HIGH">ความเสี่ยงสูงมาก</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">
                สามารถประเมินความเสี่ยงอัตโนมัติได้ในภายหลัง
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "กำลังสร้าง..." : "เพิ่มวงเงิน"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
