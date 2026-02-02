import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Params {
  params: { workspaceId: string; policyId: string };
}

async function checkWorkspaceAccess(workspaceId: string, userId: string) {
  return prisma.workspaceMember.findFirst({
    where: { workspaceId, userId },
  });
}

// GET /api/workspaces/[workspaceId]/interest-policies/[policyId]
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

    const policy = await prisma.interestPolicy.findFirst({
      where: {
        id: params.policyId,
        workspaceId: params.workspaceId,
      },
      include: {
        _count: { select: { loans: true } },
      },
    });

    if (!policy) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    return NextResponse.json(policy);
  } catch (error) {
    console.error("Error fetching interest policy:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PATCH /api/workspaces/[workspaceId]/interest-policies/[policyId]
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

    const policy = await prisma.interestPolicy.findFirst({
      where: {
        id: params.policyId,
        workspaceId: params.workspaceId,
      },
    });

    if (!policy) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    const body = await request.json();

    const updatedPolicy = await prisma.interestPolicy.update({
      where: { id: params.policyId },
      data: {
        name: body.name,
        mode: body.mode,
        monthlyRate: body.monthlyRate,
        dailyRate: body.dailyRate,
        anchorDay: body.anchorDay,
        graceDays: body.graceDays,
      },
    });

    return NextResponse.json(updatedPolicy);
  } catch (error) {
    console.error("Error updating interest policy:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/workspaces/[workspaceId]/interest-policies/[policyId]
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const member = await checkWorkspaceAccess(params.workspaceId, session.user.id);
    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const policy = await prisma.interestPolicy.findFirst({
      where: {
        id: params.policyId,
        workspaceId: params.workspaceId,
      },
      include: {
        _count: { select: { loans: true } },
      },
    });

    if (!policy) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    // ตรวจสอบว่าไม่มี loan ใช้งานอยู่
    if (policy._count.loans > 0) {
      return NextResponse.json(
        { error: "ไม่สามารถลบได้ เนื่องจากมีสัญญาเงินกู้ใช้งานนโยบายนี้อยู่" },
        { status: 400 }
      );
    }

    await prisma.interestPolicy.delete({
      where: { id: params.policyId },
    });

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Error deleting interest policy:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
