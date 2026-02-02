import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createInterestPolicySchema } from "@/lib/validations";

interface Params {
  params: { workspaceId: string };
}

async function checkWorkspaceAccess(workspaceId: string, userId: string) {
  return prisma.workspaceMember.findFirst({
    where: { workspaceId, userId },
  });
}

// GET /api/workspaces/[workspaceId]/interest-policies
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

    const policies = await prisma.interestPolicy.findMany({
      where: { workspaceId: params.workspaceId },
      include: {
        _count: { select: { loans: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(policies);
  } catch (error) {
    console.error("Error fetching interest policies:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/workspaces/[workspaceId]/interest-policies
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
    const validation = createInterestPolicySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation Error", details: validation.error.issues },
        { status: 400 }
      );
    }

    const policy = await prisma.interestPolicy.create({
      data: {
        ...validation.data,
        workspaceId: params.workspaceId,
      },
    });

    return NextResponse.json(policy, { status: 201 });
  } catch (error) {
    console.error("Error creating interest policy:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
