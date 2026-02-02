import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const SUPER_ADMIN_EMAIL = "wisanu.it@gmail.com";

async function isAdmin(email: string): Promise<boolean> {
  if (email === SUPER_ADMIN_EMAIL) return true;
  const user = await prisma.user.findUnique({
    where: { email },
    select: { isAdmin: true, isSuperAdmin: true },
  });
  return user?.isAdmin || user?.isSuperAdmin || false;
}

/**
 * GET /api/admin/slipok
 * ดึงการตั้งค่า SlipOK
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !(await isAdmin(session.user.email))) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
    }

    const config = await prisma.slipOKConfig.findFirst({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      config: config
        ? {
            id: config.id,
            branchId: config.branchId,
            promptPayId: config.promptPayId,
            promptPayName: config.promptPayName,
            bankCode: config.bankCode,
            bankName: config.bankName,
            isActive: config.isActive,
            // ไม่ส่ง apiKey กลับ
            hasApiKey: !!config.apiKey,
          }
        : null,
    });
  } catch (error) {
    console.error("Get SlipOK config error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

/**
 * POST /api/admin/slipok
 * สร้างหรืออัพเดทการตั้งค่า SlipOK
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !(await isAdmin(session.user.email))) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
    }

    const { branchId, apiKey, promptPayId, promptPayName, bankCode, bankName, isActive } =
      await request.json();

    if (!branchId || !promptPayId || !promptPayName) {
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลให้ครบ (Branch ID, PromptPay ID, ชื่อบัญชี)" },
        { status: 400 }
      );
    }

    // ลบ config เก่าถ้ามี
    await prisma.slipOKConfig.deleteMany({});

    // สร้างใหม่
    const config = await prisma.slipOKConfig.create({
      data: {
        branchId,
        apiKey: apiKey || "", // ถ้าไม่ใส่ ให้เป็น empty (ต้องใส่ทีหลัง)
        promptPayId,
        promptPayName,
        bankCode,
        bankName,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "บันทึกการตั้งค่า SlipOK สำเร็จ",
      config: {
        id: config.id,
        branchId: config.branchId,
        promptPayId: config.promptPayId,
        promptPayName: config.promptPayName,
        bankCode: config.bankCode,
        bankName: config.bankName,
        isActive: config.isActive,
        hasApiKey: !!config.apiKey,
      },
    });
  } catch (error) {
    console.error("Save SlipOK config error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/slipok
 * ลบการตั้งค่า SlipOK (ปิดระบบชำระเงินอัตโนมัติ)
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !(await isAdmin(session.user.email))) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
    }

    await prisma.slipOKConfig.deleteMany({});

    return NextResponse.json({
      success: true,
      message: "ลบการตั้งค่า SlipOK สำเร็จ",
    });
  } catch (error) {
    console.error("Delete SlipOK config error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
