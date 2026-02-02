import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createLoanSchema } from "@/lib/validations";
import { calculateAccruedInterest, calculateAccruedInterestFromPayments, LoanWithPolicy } from "@/services/interest.service";

interface Params {
  params: { workspaceId: string };
}

async function checkWorkspaceAccess(workspaceId: string, userId: string) {
  return prisma.workspaceMember.findFirst({
    where: { workspaceId, userId },
  });
}

async function ensureLenderContact(workspaceId: string, user: { id: string; name?: string | null; email?: string | null }) {
  const existing = await prisma.contact.findFirst({
    where: { workspaceId, userId: user.id },
  });

  if (existing) return existing;

  const fallbackName = user.name || user.email || "บัญชีของฉัน";

  return prisma.contact.create({
    data: {
      workspaceId,
      userId: user.id,
      name: fallbackName,
      email: user.email,
      type: "LENDER",
    },
  });
}

// GET /api/workspaces/[workspaceId]/loans
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

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const borrowerId = searchParams.get("borrowerId");
    const lenderId = searchParams.get("lenderId");
    const loanType = searchParams.get("loanType"); // RECEIVABLE or PAYABLE

    const where: any = { workspaceId: params.workspaceId };
    
    // Default to RECEIVABLE if not specified (backward compatible)
    if (loanType) {
      where.loanType = loanType;
    } else {
      where.loanType = "RECEIVABLE"; // เฉพาะที่เราเป็นเจ้าหนี้
    }
    
    if (statusParam) {
      const statuses = statusParam.split(",").map((s) => s.trim()).filter(Boolean);
      if (statuses.length === 1) {
        where.status = statuses[0];
      } else if (statuses.length > 1) {
        where.status = { in: statuses };
      }
    }
    if (borrowerId) where.borrowerId = borrowerId;
    if (lenderId) where.lenderId = lenderId;

    const loans = await prisma.loan.findMany({
      where,
      include: {
        borrower: true,
        lender: true,
        interestPolicy: true,
        allocations: {
          include: { payment: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate real-time interest for each loan
    const loansWithInterest = loans.map((loan) => {
      if (loan.status === "CLOSED" || !loan.interestPolicy) {
        return loan;
      }
      
      // ใช้ calculateAccruedInterestFromPayments เพื่อเริ่มนับจากวันที่ชำระล่าสุด
      const calculatedInterest = calculateAccruedInterestFromPayments(loan as LoanWithPolicy, loan.allocations);
      // Use the higher value between calculated and stored (to handle payments)
      const displayInterest = Math.max(calculatedInterest, loan.accruedInterest);
      
      return {
        ...loan,
        accruedInterest: displayInterest,
      };
    });

    return NextResponse.json(loansWithInterest);
  } catch (error) {
    console.error("Error fetching loans:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/workspaces/[workspaceId]/loans
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
    const validation = createLoanSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation Error", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { borrowerId, lenderId, principal, startDate, dueDate, interestPolicyId, note, imageUrl } =
      validation.data;

    const borrower = await prisma.contact.findFirst({ where: { id: borrowerId, workspaceId: params.workspaceId } });
    if (!borrower) {
      return NextResponse.json({ error: "Invalid borrower" }, { status: 400 });
    }

    const lender = await ensureLenderContact(params.workspaceId, {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
    });

    const loan = await prisma.loan.create({
      data: {
        workspaceId: params.workspaceId,
        borrowerId,
        lenderId: lenderId || lender.id,
        principal,
        remainingPrincipal: principal,
        startDate: new Date(startDate),
        dueDate: dueDate ? new Date(dueDate) : null,
        interestPolicyId,
        loanType: "RECEIVABLE", // เราเป็นเจ้าหนี้ (ปล่อยกู้)
        note,
        imageUrl: imageUrl || null,
      },
      include: {
        borrower: true,
        lender: true,
        interestPolicy: true,
      },
    });

    return NextResponse.json(loan, { status: 201 });
  } catch (error) {
    console.error("Error creating loan:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
