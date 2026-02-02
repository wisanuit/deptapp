import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as NotificationService from "@/services/notification.service";

export const dynamic = "force-dynamic";

// PATCH - อัพเดทสถานะแจ้งเตือน
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; notificationId: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, notificationId } = await params;
    const body = await request.json();

    // ตรวจสอบสิทธิ์
    const membership = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: session.user.id },
    });

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (body.action === "markRead") {
      const notification = await NotificationService.markAsRead(notificationId);
      return NextResponse.json(notification);
    }

    if (body.action === "dismiss") {
      const notification = await NotificationService.dismissNotification(notificationId);
      return NextResponse.json(notification);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error updating notification:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
