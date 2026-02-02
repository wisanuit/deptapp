import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as CollectionService from "@/services/collection.service";

export const dynamic = "force-dynamic";

// GET - ดึงรายการเคสทวงหนี้
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
    const priority = searchParams.get("priority");

    const where: any = { workspaceId };
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const cases = await prisma.collectionCase.findMany({
      where,
      include: {
        loan: {
          include: { borrower: true },
        },
        contact: true,
        activities: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: [
        { daysPastDue: "desc" },
        { createdAt: "desc" },
      ],
    });

    const stats = await CollectionService.getCollectionStats(workspaceId);

    return NextResponse.json({ cases, stats });
  } catch (error) {
    console.error("Error fetching collection cases:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - สร้างเคสหรือสร้างอัตโนมัติ
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

    // สร้างอัตโนมัติ
    if (body.action === "autoCreate") {
      const newCases = await CollectionService.autoCreateCollectionCases(workspaceId);
      return NextResponse.json({
        message: `สร้างเคสอัตโนมัติ ${newCases.length} เคส`,
        cases: newCases,
      });
    }

    // สร้างเคสเอง
    const collectionCase = await CollectionService.createCollectionCase({
      workspaceId,
      loanId: body.loanId,
      contactId: body.contactId,
      totalOutstanding: body.totalOutstanding,
      principalDue: body.principalDue,
      interestDue: body.interestDue || 0,
      daysPastDue: body.daysPastDue,
      assignedTo: body.assignedTo,
      priority: body.priority,
    });

    return NextResponse.json(collectionCase, { status: 201 });
  } catch (error) {
    console.error("Error creating collection case:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
