import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPaymentSchema, autoAllocateSchema } from "@/lib/validations";
import {
  createPaymentWithAllocations,
  autoAllocatePayment,
} from "@/services/payment.service";

interface Params {
  params: { workspaceId: string };
}

async function checkWorkspaceAccess(workspaceId: string, userId: string) {
  return prisma.workspaceMember.findFirst({
    where: { workspaceId, userId },
  });
}

// GET /api/workspaces/[workspaceId]/payments
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

    const payments = await prisma.payment.findMany({
      where: { workspaceId: params.workspaceId },
      include: {
        allocations: {
          include: {
            loan: {
              include: { borrower: true, lender: true },
            },
          },
        },
      },
      orderBy: { paymentDate: "desc" },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/workspaces/[workspaceId]/payments
export async function POST(request: NextRequest, { params }: Params) {
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

    // Check if auto-allocate
    if (body.method) {
      const validation = autoAllocateSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: "Validation Error", details: validation.error.issues },
          { status: 400 }
        );
      }

      const { amount, paymentDate, method, note, attachmentUrl } = validation.data;

      // Auto-generate allocations
      const allocations = await autoAllocatePayment(
        params.workspaceId,
        amount,
        method
      );

      if (allocations.length === 0) {
        return NextResponse.json(
          { error: "ไม่มี Loan ที่สามารถ allocate ได้" },
          { status: 400 }
        );
      }

      const payment = await createPaymentWithAllocations(
        params.workspaceId,
        amount,
        new Date(paymentDate),
        allocations,
        note,
        attachmentUrl
      );

      return NextResponse.json(payment, { status: 201 });
    }

    // Manual allocation
    const validation = createPaymentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation Error", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { amount, paymentDate, allocations, note, attachmentUrl } = validation.data;

    const payment = await createPaymentWithAllocations(
      params.workspaceId,
      amount,
      new Date(paymentDate),
      allocations,
      note,
      attachmentUrl
    );

    return NextResponse.json(payment, { status: 201 });
  } catch (error: any) {
    console.error("Error creating payment:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
