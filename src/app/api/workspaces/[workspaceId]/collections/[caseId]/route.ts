import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as CollectionService from "@/services/collection.service";

export const dynamic = "force-dynamic";

// GET - ดึงรายละเอียดเคส
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; caseId: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, caseId } = await params;

    // ตรวจสอบสิทธิ์
    const membership = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: session.user.id },
    });

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const collectionCase = await prisma.collectionCase.findFirst({
      where: { id: caseId, workspaceId },
      include: {
        loan: {
          include: { borrower: true, lender: true },
        },
        activities: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!collectionCase) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    return NextResponse.json(collectionCase);
  } catch (error) {
    console.error("Error fetching collection case:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - อัพเดทสถานะเคส
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; caseId: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, caseId } = await params;
    const body = await request.json();

    // ตรวจสอบสิทธิ์
    const membership = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: session.user.id },
    });

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const collectionCase = await CollectionService.updateCaseStatus(
      caseId,
      body.status
    );

    return NextResponse.json(collectionCase);
  } catch (error) {
    console.error("Error updating collection case:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - บันทึกกิจกรรม
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; caseId: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, caseId } = await params;
    const body = await request.json();

    // ตรวจสอบสิทธิ์
    const membership = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: session.user.id },
    });

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const activity = await CollectionService.logCollectionActivity(
      caseId,
      body.type,
      body.description,
      session.user.id,
      body.promisedAmount,
      body.promisedDate ? new Date(body.promisedDate) : undefined,
      body.outcome
    );

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error("Error logging collection activity:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
