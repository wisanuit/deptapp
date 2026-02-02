import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canUseFeature } from "@/services/subscription.service";
import nodemailer from "nodemailer";

// ฟังก์ชันส่งอีเมลเชิญสมาชิก
async function sendInviteEmail(
  toEmail: string,
  inviterName: string,
  workspaceName: string,
  role: string
) {
  const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const roleText = role === "ADMIN" ? "ผู้ดูแล" : "สมาชิก";

  const subject = `คุณได้รับเชิญเป็น${roleText}ของ ${workspaceName}`;
  const emailBody = `
สวัสดี,

คุณได้รับเชิญจาก ${inviterName} ให้เข้าร่วม Workspace "${workspaceName}" ในฐานะ${roleText}

คุณสามารถเข้าใช้งานได้ที่:
${appUrl}/dashboard

ขอบคุณ,
ทีมงานระบบจัดการหนี้
  `.trim();

  // ใช้ SMTP (Gmail App Password)
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: toEmail,
        subject: subject,
        text: emailBody,
        html: emailBody.replace(/\n/g, "<br>"),
      });

      console.log("Invite email sent to:", toEmail);
      return true;
    } catch (error) {
      console.error("Failed to send invite email:", error);
      return false;
    }
  }

  // โหมดทดสอบ
  console.log("===== INVITE EMAIL (DEMO MODE) =====");
  console.log("To:", toEmail);
  console.log("Subject:", subject);
  console.log("Body:", emailBody);
  console.log("=====================================");
  return false;
}

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ workspaceId: string }>;
}

// GET - ดึงรายชื่อสมาชิกใน Workspace
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId } = await params;

    // ตรวจสอบว่าผู้ใช้เป็นสมาชิก
    const membership = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: session.user.id },
    });

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
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
      orderBy: [
        { role: "asc" }, // OWNER first
        { createdAt: "asc" },
      ],
    });

    // ดึง owner ของ workspace เพื่อตรวจสอบ limit
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    const limitResult = await canUseFeature(workspace?.ownerId || session.user.id, "TEAM_MEMBERS");

    return NextResponse.json({
      members,
      limit: {
        current: members.length,
        max: limitResult.limit,
        allowed: limitResult.allowed,
      },
    });
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - เชิญสมาชิกใหม่
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId } = await params;
    const body = await request.json();
    const { email, role = "MEMBER" } = body;

    if (!email) {
      return NextResponse.json({ error: "กรุณาระบุอีเมล" }, { status: 400 });
    }

    // ตรวจสอบว่าผู้ใช้เป็น OWNER หรือ ADMIN
    const membership = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: session.user.id },
    });

    if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์เชิญสมาชิก" }, { status: 403 });
    }

    // ดึง workspace และตรวจสอบ limit
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      return NextResponse.json({ error: "ไม่พบ Workspace" }, { status: 404 });
    }

    const limitResult = await canUseFeature(workspace.ownerId, "TEAM_MEMBERS");
    if (!limitResult.allowed) {
      return NextResponse.json(
        { error: `ถึงขีดจำกัดสมาชิกทีมแล้ว (${limitResult.currentUsage}/${limitResult.limit})` },
        { status: 403 }
      );
    }

    // หา user จาก email
    const userToInvite = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!userToInvite) {
      return NextResponse.json(
        { error: "ไม่พบผู้ใช้ที่มีอีเมลนี้ในระบบ กรุณาให้ผู้ใช้ลงทะเบียนก่อน" },
        { status: 404 }
      );
    }

    // ตรวจสอบว่าเป็นสมาชิกอยู่แล้วหรือไม่
    const existingMember = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: userToInvite.id },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "ผู้ใช้นี้เป็นสมาชิกอยู่แล้ว" },
        { status: 400 }
      );
    }

    // เพิ่มสมาชิก
    const newMember = await prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: userToInvite.id,
        role: role === "ADMIN" ? "ADMIN" : "MEMBER",
      },
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

    // ส่งอีเมลแจ้งเตือน
    const inviter = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true },
    });

    const emailSent = await sendInviteEmail(
      userToInvite.email,
      inviter?.name || inviter?.email || "เจ้าของ Workspace",
      workspace.name,
      newMember.role
    );

    return NextResponse.json({ ...newMember, emailSent }, { status: 201 });
  } catch (error) {
    console.error("Error adding member:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
