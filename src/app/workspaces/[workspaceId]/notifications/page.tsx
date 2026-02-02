"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, CheckCircle, AlertTriangle, Clock, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  loan?: { id: string };
  contact?: { name: string };
}

export default function NotificationsPage() {
  const params = useParams();
  const toast = useToast();
  const workspaceId = params.workspaceId as string;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const url = `/api/workspaces/${workspaceId}/notifications${showUnreadOnly ? "?unreadOnly=true" : ""}`;
      const res = await fetch(url);
      const data = await res.json();
      setNotifications(data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, showUnreadOnly]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleRunCheck = async () => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "check" }),
      });
      const data = await res.json();
      toast.info(`ครบกำหนด ${data.duePayments}, ค้างชำระ ${data.overdueLoans}, บัตรเครดิต ${data.creditCardDue}`, "ตรวจสอบเสร็จสิ้น");
      fetchNotifications();
    } catch (error) {
      console.error("Error running check:", error);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch(`/api/workspaces/${workspaceId}/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markRead" }),
      });
      fetchNotifications();
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      await fetch(`/api/workspaces/${workspaceId}/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "dismiss" }),
      });
      fetchNotifications();
    } catch (error) {
      console.error("Error dismissing:", error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "DUE_PAYMENT":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "OVERDUE_LOAN":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case "CREDIT_CARD_DUE":
        return <Bell className="h-5 w-5 text-blue-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const badges: Record<string, string> = {
      DUE_PAYMENT: "bg-yellow-100 text-yellow-800",
      OVERDUE_LOAN: "bg-red-100 text-red-800",
      CREDIT_CARD_DUE: "bg-blue-100 text-blue-800",
      PAYMENT_REMINDER: "bg-purple-100 text-purple-800",
      GENERAL: "bg-gray-100 text-gray-800",
    };
    return badges[type] || badges.GENERAL;
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      DUE_PAYMENT: "ครบกำหนดชำระ",
      OVERDUE_LOAN: "ค้างชำระ",
      CREDIT_CARD_DUE: "บัตรเครดิต",
      PAYMENT_REMINDER: "แจ้งเตือน",
      GENERAL: "ทั่วไป",
    };
    return labels[type] || type;
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">การแจ้งเตือน</h1>
          <p className="text-gray-500 mt-1">
            {notifications.filter(n => !n.isRead).length} รายการที่ยังไม่ได้อ่าน
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowUnreadOnly(!showUnreadOnly)}>
            {showUnreadOnly ? "แสดงทั้งหมด" : "เฉพาะยังไม่อ่าน"}
          </Button>
          <Button onClick={handleRunCheck}>
            <Bell className="h-4 w-4 mr-2" />
            ตรวจสอบการแจ้งเตือน
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">กำลังโหลด...</div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-gray-500">
            <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>ไม่มีการแจ้งเตือน</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={notification.isRead ? "bg-gray-50" : "bg-white border-l-4 border-l-blue-500"}
            >
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getTypeIcon(notification.type)}
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded ${getTypeBadge(notification.type)}`}>
                        {getTypeLabel(notification.type)}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(notification.createdAt).toLocaleDateString("th-TH", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <h3 className={`font-semibold ${notification.isRead ? "text-gray-600" : "text-gray-900"}`}>
                      {notification.title}
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">{notification.message}</p>
                    {notification.contact && (
                      <p className="text-sm text-gray-500 mt-1">ผู้ติดต่อ: {notification.contact.name}</p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDismiss(notification.id)}
                    >
                      <Trash2 className="h-4 w-4 text-gray-400" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
