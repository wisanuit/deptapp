import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as LoanApplicationService from "@/services/loanapplication.service";

export const dynamic = "force-dynamic";

// GET - ดึงรายละเอียดใบสมัคร
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; applicationId: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, applicationId } = await params;

    // ตรวจสอบสิทธิ์
    const membership = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: session.user.id },
    });

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const application = await prisma.loanApplication.findFirst({
      where: { id: applicationId, workspaceId },
      include: {
        contact: true,
        interestPolicy: true,
        documents: true,
        createdLoan: true,
      },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    return NextResponse.json(application);
  } catch (error) {
    console.error("Error fetching loan application:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - อัพเดทสถานะใบสมัคร
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; applicationId: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, applicationId } = await params;
    const body = await request.json();

    // ตรวจสอบสิทธิ์
    const membership = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: session.user.id },
    });

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // อนุมัติและเบิกจ่าย
    if (body.action === "disburse") {
      const loan = await LoanApplicationService.approveAndDisburse(
        applicationId,
        session.user.id,
        body.approvedAmount,
        {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
        },
        new Date(body.startDate),
        body.dueDate ? new Date(body.dueDate) : undefined,
        body.note
      );
      return NextResponse.json({ message: "Disbursed successfully", loan });
    }

    // อัพเดทสถานะอื่นๆ
    const application = await LoanApplicationService.updateApplicationStatus(
      applicationId,
      body.status,
      session.user.id,
      body.approvedAmount,
      body.note
    );

    return NextResponse.json(application);
  } catch (error: any) {
    console.error("Error updating loan application:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
