import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as CreditLimitService from "@/services/creditlimit.service";

export const dynamic = "force-dynamic";

// GET - ดึงรายละเอียดวงเงินลูกค้า
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; creditId: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, creditId } = await params;

    // ตรวจสอบสิทธิ์
    const membership = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: session.user.id },
    });

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const credit = await prisma.customerCredit.findFirst({
      where: { id: creditId, workspaceId },
      include: {
        contact: true,
        history: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!credit) {
      return NextResponse.json({ error: "Credit not found" }, { status: 404 });
    }

    return NextResponse.json(credit);
  } catch (error) {
    console.error("Error fetching customer credit:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - อัพเดทวงเงิน
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; creditId: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, creditId } = await params;
    const body = await request.json();

    // ตรวจสอบสิทธิ์
    const membership = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: session.user.id },
    });

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // ประเมินความเสี่ยง
    if (body.action === "assessRisk") {
      const riskLevel = await CreditLimitService.assessRiskLevel(creditId);
      return NextResponse.json({ riskLevel });
    }

    // อัพเดทวงเงิน
    if (body.newLimit !== undefined) {
      const credit = await CreditLimitService.updateCreditLimit(
        creditId,
        body.newLimit,
        body.reason,
        session.user.id
      );
      return NextResponse.json(credit);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Error updating customer credit:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

// POST - ใช้/คืนวงเงิน
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; creditId: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, creditId } = await params;
    const body = await request.json();

    // ตรวจสอบสิทธิ์
    const membership = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: session.user.id },
    });

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    let credit;

    if (body.action === "use") {
      credit = await CreditLimitService.applyCredit(creditId, body.amount, body.reference);
    } else if (body.action === "restore") {
      credit = await CreditLimitService.restoreCredit(creditId, body.amount, body.reference);
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json(credit);
  } catch (error: any) {
    console.error("Error using/restoring credit:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
