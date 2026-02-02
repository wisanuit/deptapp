import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ workspaceId: string; memberId: string }>;
}

// PATCH - เปลี่ยน role ของสมาชิก
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, memberId } = await params;
    const body = await request.json();
    const { role } = body;

    if (!role || !["ADMIN", "MEMBER"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // ตรวจสอบว่าผู้ใช้เป็น OWNER
    const membership = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: session.user.id },
    });

    if (!membership || membership.role !== "OWNER") {
      return NextResponse.json({ error: "เฉพาะเจ้าของเท่านั้นที่เปลี่ยน role ได้" }, { status: 403 });
    }

    // หา member ที่จะเปลี่ยน role
    const targetMember = await prisma.workspaceMember.findUnique({
      where: { id: memberId },
    });

    if (!targetMember || targetMember.workspaceId !== workspaceId) {
      return NextResponse.json({ error: "ไม่พบสมาชิก" }, { status: 404 });
    }

    // ไม่สามารถเปลี่ยน role ของ OWNER
    if (targetMember.role === "OWNER") {
      return NextResponse.json({ error: "ไม่สามารถเปลี่ยน role ของเจ้าของได้" }, { status: 400 });
    }

    const updatedMember = await prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error("Error updating member:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - ลบสมาชิก
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, memberId } = await params;

    // ตรวจสอบว่าผู้ใช้เป็น OWNER หรือ ADMIN
    const membership = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: session.user.id },
    });

    if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์ลบสมาชิก" }, { status: 403 });
    }

    // หา member ที่จะลบ
    const targetMember = await prisma.workspaceMember.findUnique({
      where: { id: memberId },
    });

    if (!targetMember || targetMember.workspaceId !== workspaceId) {
      return NextResponse.json({ error: "ไม่พบสมาชิก" }, { status: 404 });
    }

    // ไม่สามารถลบ OWNER
    if (targetMember.role === "OWNER") {
      return NextResponse.json({ error: "ไม่สามารถลบเจ้าของได้" }, { status: 400 });
    }

    // ADMIN ไม่สามารถลบ ADMIN ได้
    if (membership.role === "ADMIN" && targetMember.role === "ADMIN") {
      return NextResponse.json({ error: "แอดมินไม่สามารถลบแอดมินได้" }, { status: 403 });
    }

    await prisma.workspaceMember.delete({
      where: { id: memberId },
    });

    return NextResponse.json({ message: "ลบสมาชิกสำเร็จ" });
  } catch (error) {
    console.error("Error deleting member:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
