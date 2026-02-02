import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateLoanSchema } from "@/lib/validations";
import { calculateAccruedInterest } from "@/services/interest.service";

interface Params {
  params: { workspaceId: string; loanId: string };
}

async function checkWorkspaceAccess(workspaceId: string, userId: string) {
  return prisma.workspaceMember.findFirst({
    where: { workspaceId, userId },
  });
}

// GET /api/workspaces/[workspaceId]/loans/[loanId]
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const member = await checkWorkspaceAccess(params.workspaceId, session.user.id);
    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const loan = await prisma.loan.findFirst({
      where: {
        id: params.loanId,
        workspaceId: params.workspaceId,
      },
      include: {
        borrower: true,
        lender: true,
        interestPolicy: true,
        allocations: {
          include: { payment: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!loan) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    // คำนวณดอกเบี้ยคงค้าง
    const currentInterest = calculateAccruedInterest(loan as any);

    return NextResponse.json({
      ...loan,
      currentInterest,
      totalOwed: loan.remainingPrincipal + currentInterest,
    });
  } catch (error) {
    console.error("Error fetching loan:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PATCH /api/workspaces/[workspaceId]/loans/[loanId]
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const member = await checkWorkspaceAccess(params.workspaceId, session.user.id);
    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validation = updateLoanSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation Error", details: validation.error.issues },
        { status: 400 }
      );
    }

    const updateData: any = { ...validation.data };
    if (updateData.dueDate) {
      updateData.dueDate = new Date(updateData.dueDate);
    }
    if (Object.prototype.hasOwnProperty.call(updateData, "interestPolicyId") && updateData.interestPolicyId === null) {
      updateData.interestPolicyId = null;
    }

    const result = await prisma.loan.updateMany({
      where: {
        id: params.loanId,
        workspaceId: params.workspaceId,
      },
      data: updateData,
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    const updatedLoan = await prisma.loan.findUnique({
      where: { id: params.loanId },
      include: { borrower: true, lender: true, interestPolicy: true },
    });

    return NextResponse.json(updatedLoan);
  } catch (error) {
    console.error("Error updating loan:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/workspaces/[workspaceId]/loans/[loanId]
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const member = await checkWorkspaceAccess(params.workspaceId, session.user.id);
    if (!member || !["OWNER", "ADMIN"].includes(member.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await prisma.loan.deleteMany({
      where: {
        id: params.loanId,
        workspaceId: params.workspaceId,
      },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Error deleting loan:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
