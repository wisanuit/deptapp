import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateAccruedInterest, LoanWithPolicy } from "@/services/interest.service";
import { z } from "zod";

interface Params {
  params: { workspaceId: string };
}

async function checkWorkspaceAccess(workspaceId: string, userId: string) {
  return prisma.workspaceMember.findFirst({
    where: { workspaceId, userId },
  });
}

// Schema สำหรับสร้างหนี้ (เราเป็นลูกหนี้)
const createDebtSchema = z.object({
  lenderId: z.string().min(1, "กรุณาเลือกเจ้าหนี้"),
  principal: z.number().positive("เงินต้นต้องมากกว่า 0"),
  startDate: z.string().min(1, "กรุณาระบุวันที่เริ่มสัญญา"),
  dueDate: z.string().optional(),
  interestPolicyId: z.string().optional(),
  note: z.string().optional(),
});

// สร้าง Contact สำหรับตัวเอง (เป็นผู้กู้)
async function ensureBorrowerContact(workspaceId: string, user: { id: string; name?: string | null; email?: string | null }) {
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
      type: "BORROWER",
    },
  });
}

// GET /api/workspaces/[workspaceId]/debts
// ดึงรายการหนี้ที่เราเป็นลูกหนี้ (PAYABLE)
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
    const lenderId = searchParams.get("lenderId");

    const where: any = { 
      workspaceId: params.workspaceId,
      loanType: "PAYABLE", // เฉพาะหนี้ที่เราเป็นลูกหนี้
    };
    
    if (statusParam) {
      const statuses = statusParam.split(",").map((s) => s.trim()).filter(Boolean);
      if (statuses.length === 1) {
        where.status = statuses[0];
      } else if (statuses.length > 1) {
        where.status = { in: statuses };
      }
    }
    if (lenderId) where.lenderId = lenderId;

    const debts = await prisma.loan.findMany({
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

    // Calculate real-time interest for each debt
    const debtsWithInterest = debts.map((debt) => {
      if (debt.status === "CLOSED" || !debt.interestPolicy) {
        return debt;
      }
      
      const calculatedInterest = calculateAccruedInterest(debt as LoanWithPolicy);
      const displayInterest = Math.max(calculatedInterest, debt.accruedInterest);
      
      return {
        ...debt,
        accruedInterest: displayInterest,
      };
    });

    return NextResponse.json(debtsWithInterest);
  } catch (error) {
    console.error("Error fetching debts:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/workspaces/[workspaceId]/debts
// สร้างหนี้ใหม่ (เราเป็นลูกหนี้)
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
    const validation = createDebtSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation Error", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { lenderId, principal, startDate, dueDate, interestPolicyId, note } =
      validation.data;

    // ตรวจสอบเจ้าหนี้
    const lender = await prisma.contact.findFirst({ 
      where: { id: lenderId, workspaceId: params.workspaceId } 
    });
    if (!lender) {
      return NextResponse.json({ error: "Invalid lender" }, { status: 400 });
    }

    // สร้าง Contact สำหรับตัวเอง (เป็นผู้กู้)
    const borrower = await ensureBorrowerContact(params.workspaceId, {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
    });

    const debt = await prisma.loan.create({
      data: {
        workspaceId: params.workspaceId,
        borrowerId: borrower.id, // เราเป็นผู้กู้
        lenderId: lenderId, // เจ้าหนี้ที่เลือก
        principal,
        remainingPrincipal: principal,
        startDate: new Date(startDate),
        dueDate: dueDate ? new Date(dueDate) : null,
        interestPolicyId: interestPolicyId || null,
        loanType: "PAYABLE", // ระบุว่าเป็นหนี้ที่เราต้องจ่าย
        note,
      },
      include: {
        borrower: true,
        lender: true,
        interestPolicy: true,
      },
    });

    return NextResponse.json(debt, { status: 201 });
  } catch (error) {
    console.error("Error creating debt:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
