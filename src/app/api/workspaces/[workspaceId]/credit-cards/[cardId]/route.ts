import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  generateStatement,
  payCreditCardStatement,
  getCreditCardSummary,
} from "@/services/creditcard.service";

interface Params {
  params: { workspaceId: string; cardId: string };
}

async function checkWorkspaceAccess(workspaceId: string, userId: string) {
  return prisma.workspaceMember.findFirst({
    where: { workspaceId, userId },
  });
}

// GET /api/workspaces/[workspaceId]/credit-cards/[cardId]
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

    const summary = await getCreditCardSummary(params.cardId);
    return NextResponse.json(summary);
  } catch (error: any) {
    console.error("Error fetching credit card:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST /api/workspaces/[workspaceId]/credit-cards/[cardId]/generate-statement
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

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "generate-statement") {
      const statement = await generateStatement(params.cardId);
      return NextResponse.json(statement, { status: 201 });
    }

    if (action === "pay") {
      const body = await request.json();
      const { statementId, amount, paymentDate, note } = body;

      const allocation = await payCreditCardStatement(
        statementId,
        amount,
        new Date(paymentDate),
        note
      );

      return NextResponse.json(allocation, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Error processing credit card action:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE /api/workspaces/[workspaceId]/credit-cards/[cardId]
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

    await prisma.creditCard.delete({
      where: { id: params.cardId },
    });

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Error deleting credit card:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PATCH /api/workspaces/[workspaceId]/credit-cards/[cardId]
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
    const {
      name,
      cardNumber,
      creditLimit,
      statementCutDay,
      paymentDueDays,
      minPaymentPercent,
      minPaymentFixed,
      interestRate,
    } = body;

    const updatedCard = await prisma.creditCard.update({
      where: { id: params.cardId },
      data: {
        ...(name !== undefined && { name }),
        ...(cardNumber !== undefined && { cardNumber }),
        ...(creditLimit !== undefined && { creditLimit }),
        ...(statementCutDay !== undefined && { statementCutDay }),
        ...(paymentDueDays !== undefined && { paymentDueDays }),
        ...(minPaymentPercent !== undefined && { minPaymentPercent }),
        ...(minPaymentFixed !== undefined && { minPaymentFixed }),
        ...(interestRate !== undefined && { interestRate }),
      },
    });

    return NextResponse.json(updatedCard);
  } catch (error: any) {
    console.error("Error updating credit card:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
