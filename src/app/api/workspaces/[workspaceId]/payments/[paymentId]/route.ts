import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ workspaceId: string; paymentId: string }>;
}

async function checkWorkspaceAccess(workspaceId: string, userId: string) {
  return prisma.workspaceMember.findFirst({
    where: { workspaceId, userId },
  });
}

// GET /api/workspaces/[workspaceId]/payments/[paymentId]
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, paymentId } = await params;

    const member = await checkWorkspaceAccess(workspaceId, session.user.id);
    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, workspaceId },
      include: {
        allocations: {
          include: {
            loan: {
              include: { borrower: true, lender: true },
            },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error("Error fetching payment:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PATCH /api/workspaces/[workspaceId]/payments/[paymentId]
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, paymentId } = await params;
    const body = await request.json();

    const member = await checkWorkspaceAccess(workspaceId, session.user.id);
    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check payment exists
    const existingPayment = await prisma.payment.findFirst({
      where: { id: paymentId, workspaceId },
    });

    if (!existingPayment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Update payment basic info (note, date)
    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        note: body.note !== undefined ? body.note : existingPayment.note,
        paymentDate: body.paymentDate ? new Date(body.paymentDate) : existingPayment.paymentDate,
      },
      include: {
        allocations: {
          include: {
            loan: {
              include: { borrower: true, lender: true },
            },
          },
        },
      },
    });

    return NextResponse.json(payment);
  } catch (error) {
    console.error("Error updating payment:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/workspaces/[workspaceId]/payments/[paymentId]
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, paymentId } = await params;

    const member = await checkWorkspaceAccess(workspaceId, session.user.id);
    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check payment exists
    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, workspaceId },
      include: {
        allocations: true,
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Reverse the allocations - add back to loan remainingPrincipal/accruedInterest
    for (const allocation of payment.allocations) {
      await prisma.loan.update({
        where: { id: allocation.loanId },
        data: {
          remainingPrincipal: {
            increment: allocation.principalPaid,
          },
          accruedInterest: {
            increment: allocation.interestPaid,
          },
        },
      });
    }

    // Delete payment (cascades to allocations)
    await prisma.payment.delete({
      where: { id: paymentId },
    });

    return NextResponse.json({ message: "ลบรายการชำระเรียบร้อยแล้ว" });
  } catch (error) {
    console.error("Error deleting payment:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
