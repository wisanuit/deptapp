import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as LoanApplicationService from "@/services/loanapplication.service";

export const dynamic = "force-dynamic";

// GET - ดึงรายการใบสมัครสินเชื่อ
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
    const status = searchParams.get("status");

    const where: any = { workspaceId };
    if (status) {
      where.status = status;
    }

    const applications = await prisma.loanApplication.findMany({
      where,
      include: {
        contact: true,
        interestPolicy: true,
      },
      orderBy: { submittedAt: "desc" },
    });

    const stats = await LoanApplicationService.getApplicationStats(workspaceId);

    return NextResponse.json({ applications, stats });
  } catch (error) {
    console.error("Error fetching loan applications:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - สร้างใบสมัครสินเชื่อ
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

    const application = await LoanApplicationService.createLoanApplication({
      workspaceId,
      contactId: body.contactId,
      requestedAmount: body.requestedAmount,
      purpose: body.purpose,
      term: body.term,
      interestPolicyId: body.interestPolicyId,
    });

    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    console.error("Error creating loan application:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
