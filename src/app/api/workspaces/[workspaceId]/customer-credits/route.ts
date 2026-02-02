import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as CreditLimitService from "@/services/creditlimit.service";

export const dynamic = "force-dynamic";

// GET - ดึงรายการวงเงินลูกค้า
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
    const riskLevel = searchParams.get("riskLevel");

    const where: any = { workspaceId };
    if (riskLevel) where.riskLevel = riskLevel;

    const credits = await prisma.customerCredit.findMany({
      where,
      include: {
        contact: true,
      },
      orderBy: { creditLimit: "desc" },
    });

    const stats = await CreditLimitService.getCreditStats(workspaceId);

    return NextResponse.json({ credits, stats });
  } catch (error) {
    console.error("Error fetching customer credits:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - สร้างวงเงินลูกค้า
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

    const credit = await CreditLimitService.createCustomerCredit({
      workspaceId,
      contactId: body.contactId,
      creditLimit: body.creditLimit,
      riskLevel: body.riskLevel,
      note: body.note,
    });

    return NextResponse.json(credit, { status: 201 });
  } catch (error: any) {
    console.error("Error creating customer credit:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
