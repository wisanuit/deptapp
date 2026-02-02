import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as NotificationService from "@/services/notification.service";

export const dynamic = "force-dynamic";

// GET - ดึงรายการแจ้งเตือน
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId } = await params;

    // ตรวจสอบสิทธิ์
    const membership = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: session.user.id },
    });

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const notifications = await NotificationService.getNotifications(workspaceId, unreadOnly);

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - สร้างแจ้งเตือนหรือรันการตรวจสอบ
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId } = await params;
    const body = await request.json();

    // ตรวจสอบสิทธิ์
    const membership = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: session.user.id },
    });

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (body.action === "check") {
      // รันการตรวจสอบและสร้างแจ้งเตือน
      const results = await NotificationService.runAllNotificationChecks(workspaceId);
      return NextResponse.json({
        message: "Notification check completed",
        duePayments: results.duePayments,
        overdueLoans: results.overdueLoans,
        creditCardDue: results.creditCardDue,
      });
    }

    // สร้างแจ้งเตือนเอง
    const notification = await NotificationService.createNotification(
      workspaceId,
      body.type,
      body.title,
      body.message,
      body.referenceId,
      body.referenceType,
      body.dueDate ? new Date(body.dueDate) : undefined
    );

    return NextResponse.json(notification);
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
