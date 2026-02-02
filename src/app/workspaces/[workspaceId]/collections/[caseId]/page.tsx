"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft,
  Mail, 
  MessageSquare, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  User,
  Wallet,
  Calendar,
  FileText,
  MoreHorizontal,
  X,
  ChevronRight,
  TrendingUp,
  Phone,
  MapPin,
  FileWarning,
  CreditCard,
  Plus,
  Send
} from "lucide-react";
import { useToast } from "@/components/ui/toast";

// Avatar component
function Avatar({ name, size = "md", imageUrl }: { name: string; size?: "sm" | "md" | "lg" | "xl"; imageUrl?: string | null }) {
  const initials = name ? name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() : "?";
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-lg"
  };
  const sizePx = { sm: 32, md: 40, lg: 48, xl: 64 };
  
  if (imageUrl) {
    return (
      <Image src={imageUrl} alt={name} width={sizePx[size]} height={sizePx[size]} className="rounded-full object-cover" unoptimized />
    );
  }
  
  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white flex items-center justify-center font-semibold`}>
      {initials}
    </div>
  );
}

interface CollectionActivity {
  id: string;
  type: string;
  description: string;
  performedBy: string;
  promisedAmount?: number;
  promisedDate?: string;
  nextFollowupDate?: string;
  createdAt: string;
}

interface CollectionCase {
  id: string;
  totalOutstanding: number;
  principalDue: number;
  interestDue: number;
  daysPastDue: number;
  status: string;
  priority: string;
  lastContactDate?: string;
  nextFollowUpDate?: string;
  createdAt: string;
  loan: {
    id: string;
    principal: number;
    remainingPrincipal: number;
    startDate: string;
    dueDate?: string;
    borrower: { id: string; name: string; phone?: string; email?: string; imageUrl?: string };
    lender: { name: string };
  };
  activities: CollectionActivity[];
}

export default function CollectionCaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const workspaceId = params.workspaceId as string;
  const caseId = params.caseId as string;

  const [collectionCase, setCollectionCase] = useState<CollectionCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailData, setEmailData] = useState({
    subject: "",
    body: "",
  });
  const [sendingEmail, setSendingEmail] = useState(false);
  const [activityData, setActivityData] = useState({
    type: "PHONE_CALL",
    description: "",
    promisedAmount: "",
    promisedDate: "",
    nextFollowupDate: "",
  });
  const [processing, setProcessing] = useState(false);

  const fetchCase = useCallback(async () => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/collections/${caseId}`);
      const data = await res.json();
      setCollectionCase(data);
    } catch (error) {
      console.error("Error fetching case:", error);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, caseId]);

  useEffect(() => {
    fetchCase();
  }, [fetchCase]);

  const handleAddActivity = async () => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/collections/${caseId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: activityData.type,
          description: activityData.description,
          promisedAmount: activityData.promisedAmount ? parseFloat(activityData.promisedAmount) : undefined,
          promisedDate: activityData.promisedDate || undefined,
          nextFollowupDate: activityData.nextFollowupDate || undefined,
        }),
      });
      if (res.ok) {
        setShowAddActivity(false);
        setActivityData({
          type: "PHONE_CALL",
          description: "",
          promisedAmount: "",
          promisedDate: "",
          nextFollowupDate: "",
        });
        fetchCase();
        toast.success("บันทึกกิจกรรมสำเร็จ");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      await fetch(`/api/workspaces/${workspaceId}/collections/${caseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchCase();
      toast.success("อัปเดตสถานะสำเร็จ");
    } catch (error) {
      console.error("Error:", error);
      toast.error("เกิดข้อผิดพลาด");
    }
  };

  const handleSendEmail = async () => {
    if (!collectionCase?.loan.borrower.email) {
      toast.error("ลูกหนี้ไม่มีอีเมล");
      return;
    }
    
    setSendingEmail(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/collections/${caseId}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: collectionCase.loan.borrower.email,
          subject: emailData.subject,
          body: emailData.body,
        }),
      });
      
      if (res.ok) {
        setShowEmailModal(false);
        setEmailData({ subject: "", body: "" });
        toast.success("ส่งอีเมลสำเร็จ");
        // บันทึกกิจกรรมอัตโนมัติ
        await fetch(`/api/workspaces/${workspaceId}/collections/${caseId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "EMAIL",
            description: `ส่งอีเมล: ${emailData.subject}`,
          }),
        });
        fetchCase();
      } else {
        const error = await res.json();
        toast.error(error.message || "ส่งอีเมลไม่สำเร็จ");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("เกิดข้อผิดพลาดในการส่งอีเมล");
    } finally {
      setSendingEmail(false);
    }
  };

  const openEmailModal = () => {
    if (!collectionCase) return;
    
    // ตั้งค่าเริ่มต้นสำหรับอีเมล
    setEmailData({
      subject: `แจ้งเตือนชำระหนี้ค้าง - ${collectionCase.loan.borrower.name}`,
      body: `เรียน คุณ${collectionCase.loan.borrower.name}

ทางเราขอแจ้งให้ทราบว่าท่านมียอดหนี้ค้างชำระ ดังรายละเอียดต่อไปนี้:

- ยอดค้างชำระ: ฿${Number(collectionCase.totalOutstanding || 0).toLocaleString()}
- จำนวนวันที่ค้าง: ${collectionCase.daysPastDue || 0} วัน
- ยอดคงเหลือ: ฿${Number(collectionCase.loan.remainingPrincipal).toLocaleString()}

กรุณาชำระเงินโดยเร็วที่สุดเพื่อหลีกเลี่ยงค่าปรับเพิ่มเติม

หากท่านได้ชำระเงินแล้ว กรุณาติดต่อกลับเพื่อยืนยันการชำระ

ขอบคุณครับ/ค่ะ`,
    });
    setShowEmailModal(true);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "PHONE_CALL":
        return <Phone className="h-4 w-4" />;
      case "SMS":
        return <MessageSquare className="h-4 w-4" />;
      case "EMAIL":
        return <Mail className="h-4 w-4" />;
      case "VISIT":
        return <MapPin className="h-4 w-4" />;
      case "LETTER":
        return <FileText className="h-4 w-4" />;
      case "PROMISE_TO_PAY":
        return <CheckCircle className="h-4 w-4" />;
      case "PAYMENT_RECEIVED":
        return <Wallet className="h-4 w-4" />;
      case "ESCALATION":
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getActivityTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      PHONE_CALL: "โทรติดตาม",
      SMS: "ส่ง SMS",
      EMAIL: "ส่งอีเมล",
      VISIT: "เข้าพบ",
      LETTER: "ส่งจดหมาย",
      PROMISE_TO_PAY: "สัญญาจะชำระ",
      PAYMENT_RECEIVED: "รับชำระ",
      ESCALATION: "ยกระดับ",
      NOTE: "บันทึก",
    };
    return labels[type] || type;
  };

  const getActivityIconColor = (type: string) => {
    switch (type) {
      case "PHONE_CALL":
        return "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300";
      case "SMS":
        return "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300";
      case "EMAIL":
        return "bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300";
      case "VISIT":
        return "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300";
      case "LETTER":
        return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300";
      case "PROMISE_TO_PAY":
        return "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300";
      case "PAYMENT_RECEIVED":
        return "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300";
      case "ESCALATION":
        return "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getPriorityConfig = (priority: string) => {
    const configs: Record<string, { color: string; label: string; bgColor: string }> = {
      LOW: { color: "text-gray-600", label: "ต่ำ", bgColor: "bg-gray-100 dark:bg-gray-800" },
      MEDIUM: { color: "text-yellow-600", label: "ปานกลาง", bgColor: "bg-yellow-100 dark:bg-yellow-900" },
      HIGH: { color: "text-orange-600", label: "สูง", bgColor: "bg-orange-100 dark:bg-orange-900" },
      CRITICAL: { color: "text-red-600", label: "วิกฤต", bgColor: "bg-red-100 dark:bg-red-900" },
    };
    return configs[priority] || configs.LOW;
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; label: string; bgColor: string }> = {
      OPEN: { color: "text-blue-600", label: "เปิดเคส", bgColor: "bg-blue-100 dark:bg-blue-900" },
      IN_PROGRESS: { color: "text-yellow-600", label: "กำลังดำเนินการ", bgColor: "bg-yellow-100 dark:bg-yellow-900" },
      ESCALATED: { color: "text-red-600", label: "ยกระดับ", bgColor: "bg-red-100 dark:bg-red-900" },
      PAID: { color: "text-green-600", label: "ชำระแล้ว", bgColor: "bg-green-100 dark:bg-green-900" },
      CLOSED: { color: "text-gray-600", label: "ปิดเคส", bgColor: "bg-gray-100 dark:bg-gray-800" },
    };
    return configs[status] || configs.OPEN;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
          <p className="text-muted-foreground">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!collectionCase) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">ไม่พบข้อมูล</p>
          <Link href={`/workspaces/${workspaceId}/collections`}>
            <Button variant="outline" className="mt-4">กลับไปหน้ารายการ</Button>
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(collectionCase.status);
  const priorityConfig = getPriorityConfig(collectionCase.priority);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Facebook-style Header */}
      <header className="bg-card sticky top-0 z-50 shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <Link
                href={`/workspaces/${workspaceId}/collections`}
                className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-9 h-9 rounded-full bg-red-500">
                  <AlertTriangle className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="font-semibold text-base line-clamp-1">{collectionCase.loan.borrower.name}</h1>
                  <p className="text-xs text-muted-foreground">เคสทวงหนี้</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2.5 py-1 rounded-full ${statusConfig.bgColor} ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
              <Button variant="ghost" size="icon" className="rounded-full">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Overdue Summary Card */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-red-100 text-sm mb-1">ยอดค้างชำระ</p>
                  <p className="text-3xl font-bold">
                    ฿{Number(collectionCase.totalOutstanding || 0).toLocaleString()}
                  </p>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-white/20">
                      ค้าง {collectionCase.daysPastDue || 0} วัน
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-white/20">
                      {priorityConfig.label}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <Avatar name={collectionCase.loan.borrower.name} size="xl" imageUrl={collectionCase.loan.borrower.imageUrl} />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-card rounded-xl shadow-sm p-4">
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={() => setShowAddActivity(true)}
                  className="rounded-full bg-red-600 hover:bg-red-700 gap-2"
                >
                  <Plus className="h-4 w-4" />
                  บันทึกกิจกรรม
                </Button>
                
                {collectionCase.loan.borrower.phone && (
                  <a href={`tel:${collectionCase.loan.borrower.phone}`}>
                    <Button variant="outline" className="rounded-full gap-2">
                      <Phone className="h-4 w-4" />
                      โทร
                    </Button>
                  </a>
                )}
                
                {collectionCase.loan.borrower.email && (
                  <Button 
                    variant="outline" 
                    onClick={openEmailModal}
                    className="rounded-full gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    ส่งอีเมล
                  </Button>
                )}
                
                {collectionCase.status === "OPEN" && (
                  <Button 
                    variant="outline" 
                    onClick={() => handleUpdateStatus("IN_PROGRESS")}
                    className="rounded-full gap-2"
                  >
                    <TrendingUp className="h-4 w-4" />
                    เริ่มติดตาม
                  </Button>
                )}
                
                {collectionCase.status !== "PAID" && collectionCase.status !== "CLOSED" && (
                  <Button 
                    variant="outline" 
                    onClick={() => handleUpdateStatus("PAID")}
                    className="rounded-full gap-2 text-green-600 hover:text-green-700"
                  >
                    <CheckCircle className="h-4 w-4" />
                    ชำระแล้ว
                  </Button>
                )}
              </div>
            </div>

            {/* Loan Details */}
            <div className="bg-card rounded-xl shadow-sm p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-red-600" />
                ข้อมูลหนี้
              </h3>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ยอดต้น</p>
                    <p className="font-semibold">฿{Number(collectionCase.loan.principal).toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                    <FileWarning className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ยอดคงเหลือ</p>
                    <p className="font-semibold text-red-600">฿{Number(collectionCase.loan.remainingPrincipal).toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">วันที่เริ่ม</p>
                    <p className="font-semibold">{new Date(collectionCase.loan.startDate).toLocaleDateString("th-TH")}</p>
                  </div>
                </div>
                
                {collectionCase.loan.dueDate && (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">ครบกำหนด</p>
                      <p className="font-semibold text-orange-600">{new Date(collectionCase.loan.dueDate).toLocaleDateString("th-TH")}</p>
                    </div>
                  </div>
                )}
              </div>
              
              <Link href={`/workspaces/${workspaceId}/loans/${collectionCase.loan.id}`}>
                <Button variant="outline" className="w-full mt-4 rounded-full gap-2">
                  <FileText className="h-4 w-4" />
                  ดูรายละเอียดสัญญา
                  <ChevronRight className="h-4 w-4 ml-auto" />
                </Button>
              </Link>
            </div>

            {/* Activity Timeline */}
            <div className="bg-card rounded-xl shadow-sm p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-red-600" />
                ประวัติการติดตาม ({collectionCase.activities.length})
              </h3>
              
              {collectionCase.activities.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-muted-foreground mb-4">ยังไม่มีกิจกรรม</p>
                  <Button 
                    onClick={() => setShowAddActivity(true)}
                    className="rounded-full bg-red-600 hover:bg-red-700"
                  >
                    บันทึกกิจกรรมแรก
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {collectionCase.activities.map((activity, index) => (
                    <div 
                      key={activity.id} 
                      className={`relative pl-10 pb-4 ${
                        index !== collectionCase.activities.length - 1 ? 'border-l-2 border-muted ml-4' : 'ml-4'
                      }`}
                    >
                      {/* Icon */}
                      <div className={`absolute -left-4 top-0 w-8 h-8 rounded-full flex items-center justify-center ${getActivityIconColor(activity.type)}`}>
                        {getActivityIcon(activity.type)}
                      </div>
                      
                      {/* Content */}
                      <div className="bg-muted/30 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{getActivityTypeLabel(activity.type)}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(activity.createdAt).toLocaleString("th-TH")}
                          </span>
                        </div>
                        <p className="text-muted-foreground">{activity.description}</p>
                        
                        {activity.promisedAmount && (
                          <div className="mt-2 p-2 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                            <p className="text-sm text-green-600 flex items-center gap-2">
                              <CheckCircle className="h-4 w-4" />
                              สัญญาจะชำระ ฿{Number(activity.promisedAmount).toLocaleString()}
                              {activity.promisedDate && (
                                <span className="text-green-500">
                                  ภายใน {new Date(activity.promisedDate).toLocaleDateString("th-TH")}
                                </span>
                              )}
                            </p>
                          </div>
                        )}
                        
                        {activity.nextFollowupDate && (
                          <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                            <p className="text-sm text-blue-600 flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              ติดตามครั้งต่อไป: {new Date(activity.nextFollowupDate).toLocaleDateString("th-TH")}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="bg-card rounded-xl shadow-sm p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-red-600" />
                ข้อมูลลูกหนี้
              </h3>
              
              <div className="flex items-center gap-3 mb-4">
                <Avatar name={collectionCase.loan.borrower.name} size="lg" imageUrl={collectionCase.loan.borrower.imageUrl} />
                <div>
                  <p className="font-medium">{collectionCase.loan.borrower.name}</p>
                  <p className="text-sm text-muted-foreground">ลูกหนี้</p>
                </div>
              </div>

              <div className="space-y-3">
                {collectionCase.loan.borrower.phone && (
                  <a 
                    href={`tel:${collectionCase.loan.borrower.phone}`}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl hover:bg-muted transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                      <Phone className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">โทรศัพท์</p>
                      <p className="font-medium text-green-600">{collectionCase.loan.borrower.phone}</p>
                    </div>
                  </a>
                )}
                
                {collectionCase.loan.borrower.email && (
                  <a 
                    href={`mailto:${collectionCase.loan.borrower.email}`}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl hover:bg-muted transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">อีเมล</p>
                      <p className="font-medium text-blue-600">{collectionCase.loan.borrower.email}</p>
                    </div>
                  </a>
                )}
              </div>

              <Link href={`/workspaces/${workspaceId}/contacts/${collectionCase.loan.borrower.id}`}>
                <Button variant="outline" size="sm" className="w-full mt-4 rounded-full">
                  ดูข้อมูลลูกหนี้
                </Button>
              </Link>
            </div>

            {/* Case Status */}
            <div className="bg-card rounded-xl shadow-sm p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                สถานะเคส
              </h3>

              <div className="space-y-2">
                {["OPEN", "IN_PROGRESS", "ESCALATED", "PAID", "CLOSED"].map((status) => {
                  const config = getStatusConfig(status);
                  const isActive = collectionCase.status === status;
                  
                  return (
                    <button
                      key={status}
                      onClick={() => !isActive && handleUpdateStatus(status)}
                      disabled={isActive}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                        isActive 
                          ? `${config.bgColor} ${config.color} font-medium` 
                          : 'hover:bg-muted'
                      }`}
                    >
                      <span>{config.label}</span>
                      {isActive && <CheckCircle className="h-4 w-4" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Case Info */}
            <div className="bg-card rounded-xl shadow-sm p-6">
              <h3 className="font-semibold mb-4">ข้อมูลเคส</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">สร้างเมื่อ</span>
                  <span>{new Date(collectionCase.createdAt).toLocaleDateString("th-TH")}</span>
                </div>
                {collectionCase.lastContactDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ติดต่อล่าสุด</span>
                    <span>{new Date(collectionCase.lastContactDate).toLocaleDateString("th-TH")}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ระดับความสำคัญ</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${priorityConfig.bgColor} ${priorityConfig.color}`}>
                    {priorityConfig.label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">เจ้าหนี้</span>
                  <span>{collectionCase.loan.lender.name}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Add Activity Modal */}
      {showAddActivity && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-red-600" />
                บันทึกกิจกรรม
              </h3>
              <button
                onClick={() => setShowAddActivity(false)}
                className="p-2 hover:bg-muted rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">ประเภทกิจกรรม</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {[
                    { value: "PHONE_CALL", label: "โทร", icon: Phone },
                    { value: "SMS", label: "SMS", icon: MessageSquare },
                    { value: "EMAIL", label: "อีเมล", icon: Mail },
                    { value: "VISIT", label: "เข้าพบ", icon: MapPin },
                    { value: "PROMISE_TO_PAY", label: "สัญญาชำระ", icon: CheckCircle },
                    { value: "PAYMENT_RECEIVED", label: "รับชำระ", icon: Wallet },
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setActivityData({ ...activityData, type: value })}
                      className={`p-3 rounded-xl border-2 transition-colors flex flex-col items-center gap-1 ${
                        activityData.type === value
                          ? 'border-red-500 bg-red-50 dark:bg-red-950/30 text-red-600'
                          : 'border-transparent bg-muted/50 hover:bg-muted'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <Label htmlFor="description" className="text-sm font-medium">รายละเอียด *</Label>
                <Textarea
                  id="description"
                  value={activityData.description}
                  onChange={(e) => setActivityData({ ...activityData, description: e.target.value })}
                  placeholder="รายละเอียดการติดตาม..."
                  className="mt-1.5 rounded-xl"
                  rows={3}
                />
              </div>
              
              {activityData.type === "PROMISE_TO_PAY" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="promisedAmount" className="text-sm font-medium">จำนวนเงิน (บาท)</Label>
                    <Input
                      id="promisedAmount"
                      type="number"
                      value={activityData.promisedAmount}
                      onChange={(e) => setActivityData({ ...activityData, promisedAmount: e.target.value })}
                      className="mt-1.5 rounded-xl"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="promisedDate" className="text-sm font-medium">กำหนดชำระ</Label>
                    <Input
                      id="promisedDate"
                      type="date"
                      value={activityData.promisedDate}
                      onChange={(e) => setActivityData({ ...activityData, promisedDate: e.target.value })}
                      className="mt-1.5 rounded-xl"
                    />
                  </div>
                </div>
              )}
              
              <div>
                <Label htmlFor="nextFollowupDate" className="text-sm font-medium">ติดตามครั้งต่อไป</Label>
                <Input
                  id="nextFollowupDate"
                  type="date"
                  value={activityData.nextFollowupDate}
                  onChange={(e) => setActivityData({ ...activityData, nextFollowupDate: e.target.value })}
                  className="mt-1.5 rounded-xl"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddActivity(false)}
                className="flex-1 rounded-full"
              >
                ยกเลิก
              </Button>
              <Button
                type="button"
                onClick={handleAddActivity}
                disabled={processing || !activityData.description}
                className="flex-1 rounded-full bg-red-600 hover:bg-red-700"
              >
                {processing ? 'กำลังบันทึก...' : 'บันทึก'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Send Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Mail className="h-5 w-5 text-red-600" />
                ส่งอีเมลทวงหนี้
              </h3>
              <button
                onClick={() => setShowEmailModal(false)}
                className="p-2 hover:bg-muted rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Send className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ส่งถึง</p>
                  <p className="font-medium">{collectionCase?.loan.borrower.email}</p>
                </div>
              </div>
              
              <div>
                <Label htmlFor="emailSubject" className="text-sm font-medium">หัวข้อ *</Label>
                <Input
                  id="emailSubject"
                  value={emailData.subject}
                  onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                  placeholder="หัวข้ออีเมล..."
                  className="mt-1.5 rounded-xl"
                />
              </div>
              
              <div>
                <Label htmlFor="emailBody" className="text-sm font-medium">เนื้อหา *</Label>
                <Textarea
                  id="emailBody"
                  value={emailData.body}
                  onChange={(e) => setEmailData({ ...emailData, body: e.target.value })}
                  placeholder="เนื้อหาอีเมล..."
                  className="mt-1.5 rounded-xl"
                  rows={10}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEmailModal(false)}
                className="flex-1 rounded-full"
              >
                ยกเลิก
              </Button>
              <Button
                type="button"
                onClick={handleSendEmail}
                disabled={sendingEmail || !emailData.subject || !emailData.body}
                className="flex-1 rounded-full bg-red-600 hover:bg-red-700 gap-2"
              >
                {sendingEmail ? (
                  'กำลังส่ง...'
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    ส่งอีเมล
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
