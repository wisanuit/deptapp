"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ErrorAlert } from "@/components/ui/alert";
import { useToast } from "@/components/ui/toast";
import { 
  UserPlus, Trash2, Shield, User, Crown, Loader2, 
  AlertTriangle, Users, X, ChevronDown
} from "lucide-react";

interface Member {
  id: string;
  userId: string;
  role: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image?: string | null;
  };
}

interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  members: Member[];
}

interface LimitInfo {
  current: number;
  max: number;
  allowed: boolean;
}

export default function WorkspaceSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const workspaceId = params.workspaceId as string;

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [limitInfo, setLimitInfo] = useState<LimitInfo | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  
  // Invite member
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");
  const [inviting, setInviting] = useState(false);
  
  // Edit role
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fetchWorkspace = useCallback(async () => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`);
      if (!res.ok) throw new Error("ไม่พบ Workspace");
      const data = await res.json();
      setWorkspace(data);
      setName(data.name || "");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
        setLimitInfo(data.limit || null);
      }
    } catch (error) {
      console.error("Error fetching members:", error);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchWorkspace();
    fetchMembers();
    // Get current user
    fetch('/api/auth/session').then(r => r.json()).then(data => {
      setCurrentUserId(data?.user?.id || null);
    });
  }, [fetchWorkspace, fetchMembers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "เกิดข้อผิดพลาด");
      }

      toast.success("บันทึกสำเร็จ");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error("กรุณาระบุอีเมล");
      return;
    }

    setInviting(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      const data = await res.json();
      
      if (res.ok) {
        toast.success("เพิ่มสมาชิกสำเร็จ");
        setShowInvite(false);
        setInviteEmail("");
        setInviteRole("MEMBER");
        fetchMembers();
      } else {
        toast.error(data.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setInviting(false);
    }
  };

  const handleChangeRole = async (memberId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await res.json();
      
      if (res.ok) {
        toast.success("เปลี่ยน role สำเร็จ");
        setEditingMember(null);
        fetchMembers();
      } else {
        toast.error(data.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด");
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`ต้องการลบ ${memberName} ออกจาก Workspace?`)) return;

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members/${memberId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      
      if (res.ok) {
        toast.success("ลบสมาชิกสำเร็จ");
        fetchMembers();
      } else {
        toast.error(data.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด");
    }
  };

  const handleDelete = async () => {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบ Workspace นี้? ข้อมูลทั้งหมดจะถูกลบและไม่สามารถกู้คืนได้")) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "เกิดข้อผิดพลาด");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <p>กำลังโหลด...</p>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive">ไม่พบ Workspace</p>
            <Button className="mt-4" onClick={() => router.push("/dashboard")}>
              กลับหน้าหลัก
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted p-4">
      <div className="container mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">ตั้งค่า Workspace</h1>
          <Button variant="outline" onClick={() => router.push(`/workspaces/${workspaceId}`)}>
            กลับ
          </Button>
        </div>

        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลทั่วไป</CardTitle>
            <CardDescription>แก้ไขชื่อ Workspace</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">ชื่อ Workspace *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ชื่อ Workspace"
                  required
                />
              </div>

              {error && <ErrorAlert message={error} onClose={() => setError("")} />}

              <Button type="submit" disabled={saving || deleting || !name.trim()}>
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Members */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  สมาชิกทีม
                </CardTitle>
                <CardDescription>
                  จัดการสมาชิกใน Workspace
                  {limitInfo && (
                    <span className="ml-2">
                      ({limitInfo.current}/{limitInfo.max === -1 ? "∞" : limitInfo.max})
                    </span>
                  )}
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => setShowInvite(true)}
                disabled={limitInfo ? !limitInfo.allowed : false}
                className="rounded-full gap-1"
              >
                <UserPlus className="h-4 w-4" />
                เชิญสมาชิก
              </Button>
            </div>
            
            {/* Limit warning */}
            {limitInfo && !limitInfo.allowed && (
              <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-amber-700 dark:text-amber-400">
                  ถึงขีดจำกัดสมาชิกทีมแล้ว อัปเกรดแพ็กเกจเพื่อเพิ่มสมาชิก
                </span>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {members.map((member) => {
                const isOwner = member.role === "OWNER";
                const isCurrentUser = member.userId === currentUserId;
                const currentMemberRole = members.find(m => m.userId === currentUserId)?.role;
                const canEdit = currentMemberRole === "OWNER" && !isOwner;
                const canRemove = (currentMemberRole === "OWNER" || currentMemberRole === "ADMIN") && !isOwner && !isCurrentUser;
                
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 border rounded-xl hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {member.user.image ? (
                        <Image
                          src={member.user.image}
                          alt={member.user.name || ""}
                          width={40}
                          height={40}
                          className="rounded-full"
                          unoptimized
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-medium">
                          {(member.user.name || member.user.email)?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium flex items-center gap-2">
                          {member.user.name || member.user.email}
                          {isCurrentUser && (
                            <span className="text-xs text-muted-foreground">(คุณ)</span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">{member.user.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {editingMember === member.id ? (
                        <div className="flex items-center gap-2">
                          <select
                            defaultValue={member.role}
                            onChange={(e) => handleChangeRole(member.id, e.target.value)}
                            className="px-3 py-1.5 border rounded-lg text-sm"
                          >
                            <option value="ADMIN">แอดมิน</option>
                            <option value="MEMBER">สมาชิก</option>
                          </select>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingMember(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Badge 
                            variant={isOwner ? "default" : member.role === "ADMIN" ? "secondary" : "outline"}
                            className={`gap-1 ${isOwner ? "bg-amber-500" : ""}`}
                          >
                            {isOwner ? (
                              <><Crown className="h-3 w-3" /> เจ้าของ</>
                            ) : member.role === "ADMIN" ? (
                              <><Shield className="h-3 w-3" /> แอดมิน</>
                            ) : (
                              <><User className="h-3 w-3" /> สมาชิก</>
                            )}
                          </Badge>
                          
                          {canEdit && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingMember(member.id)}
                              className="h-8 w-8 p-0"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {canRemove && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveMember(member.id, member.user.name || member.user.email)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Invite Modal */}
        {showInvite && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-2xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-primary" />
                  เชิญสมาชิก
                </h3>
                <button
                  onClick={() => setShowInvite(false)}
                  className="p-2 hover:bg-muted rounded-full"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">อีเมล *</Label>
                  <Input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="mt-1.5 rounded-xl"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    ผู้ใช้ต้องลงทะเบียนในระบบก่อน
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium">สิทธิ์</Label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 border rounded-xl"
                  >
                    <option value="MEMBER">สมาชิก - ดูและแก้ไขข้อมูล</option>
                    <option value="ADMIN">แอดมิน - จัดการสมาชิกได้</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowInvite(false)}
                  className="flex-1 rounded-full"
                >
                  ยกเลิก
                </Button>
                <Button
                  onClick={handleInvite}
                  disabled={inviting || !inviteEmail.trim()}
                  className="flex-1 rounded-full"
                >
                  {inviting ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> กำลังเชิญ...</>
                  ) : (
                    "เชิญสมาชิก"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Danger Zone */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">ลบ Workspace</CardTitle>
            <CardDescription>
              การลบ Workspace จะลบข้อมูลทั้งหมดรวมถึงผู้ติดต่อ สัญญาเงินกู้ ประวัติการชำระ และบัตรเครดิต
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={saving || deleting}
            >
              {deleting ? "กำลังลบ..." : "ลบ Workspace"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
