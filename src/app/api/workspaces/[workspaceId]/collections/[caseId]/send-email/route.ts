import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

// POST - ส่งอีเมลทวงหนี้
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; caseId: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, caseId } = await params;
    const body = await request.json();
    const { to, subject, body: emailBody } = body;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!to || !subject || !emailBody) {
      return NextResponse.json(
        { message: "กรุณากรอกข้อมูลให้ครบถ้วน" },
        { status: 400 }
      );
    }

    // ตรวจสอบสิทธิ์
    const membership = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: session.user.id },
    });

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // ตรวจสอบว่าเคสมีอยู่จริง
    const collectionCase = await prisma.collectionCase.findFirst({
      where: { id: caseId, workspaceId },
      include: {
        loan: {
          include: { borrower: true },
        },
      },
    });

    if (!collectionCase) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // ======== วิธีที่ 1: ใช้ Resend (แนะนำ - ง่ายกว่า) ========
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      const { data, error } = await resend.emails.send({
        from: process.env.RESEND_FROM || "onboarding@resend.dev",
        to: to,
        subject: subject,
        html: emailBody.replace(/\n/g, "<br>"),
      });

      if (error) {
        console.error("Resend error:", error);
        return NextResponse.json(
          { message: "เกิดข้อผิดพลาดในการส่งอีเมล: " + error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        messageId: data?.id,
        message: "ส่งอีเมลสำเร็จ",
      });
    }

    // ======== วิธีที่ 2: ใช้ SMTP (Gmail App Password) ========
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: to,
        subject: subject,
        text: emailBody,
        html: emailBody.replace(/\n/g, "<br>"),
      });

      console.log("Email sent:", info.messageId);

      return NextResponse.json({
        success: true,
        messageId: info.messageId,
        message: "ส่งอีเมลสำเร็จ",
      });
    }

    // ======== โหมดทดสอบ (ไม่มีการตั้งค่า) ========
    console.log("===== EMAIL DEMO MODE =====");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("Body:", emailBody);
    console.log("============================");
    
    return NextResponse.json({
      success: true,
      message: "บันทึกอีเมลสำเร็จ (โหมดทดสอบ - ตั้งค่า RESEND_API_KEY หรือ SMTP เพื่อส่งจริง)",
    });

  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการส่งอีเมล" },
      { status: 500 }
    );
  }
}
