import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as InstallmentService from "@/services/installment.service";

export const dynamic = "force-dynamic";

// GET - ดึงรายการแผนผ่อน
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

    const installmentPlans = await prisma.installmentPlan.findMany({
      where: { workspaceId },
      include: {
        contact: true,
        installments: {
          orderBy: { termNumber: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(installmentPlans);
  } catch (error) {
    console.error("Error fetching installment plans:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - สร้างแผนผ่อนใหม่
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

    const plan = await InstallmentService.createInstallmentPlan({
      workspaceId,
      contactId: body.contactId,
      itemName: body.itemName,
      itemDescription: body.itemDescription,
      itemImageUrl: body.itemImageUrl,
      totalAmount: body.totalAmount,
      downPayment: body.downPayment || 0,
      numberOfTerms: body.numberOfTerms,
      startDate: new Date(body.startDate),
      interestRate: body.interestRate,
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error("Error creating installment plan:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
