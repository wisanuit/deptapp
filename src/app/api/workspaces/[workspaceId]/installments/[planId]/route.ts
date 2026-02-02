import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as InstallmentService from "@/services/installment.service";

export const dynamic = "force-dynamic";

// GET - ดึงรายละเอียดแผนผ่อน
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; planId: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, planId } = await params;

    // ตรวจสอบสิทธิ์
    const membership = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: session.user.id },
    });

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const plan = await prisma.installmentPlan.findFirst({
      where: { id: planId, workspaceId },
      include: {
        contact: true,
        installments: {
          orderBy: { termNumber: "asc" },
        },
      },
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const summary = await InstallmentService.getInstallmentSummary(planId);

    return NextResponse.json({ plan, summary });
  } catch (error) {
    console.error("Error fetching installment plan:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - ชำระงวด
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; planId: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, planId } = await params;
    const body = await request.json();

    // ตรวจสอบสิทธิ์
    const membership = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: session.user.id },
    });

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const installment = await InstallmentService.payInstallment(
      body.installmentId,
      body.amount,
      new Date(body.paidDate),
      body.slipImageUrl
    );

    return NextResponse.json(installment);
  } catch (error: any) {
    console.error("Error paying installment:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
