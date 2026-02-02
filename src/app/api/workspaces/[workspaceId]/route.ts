import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateWorkspaceSchema } from "@/lib/validations";

interface Params {
  params: { workspaceId: string };
}

// Middleware to check workspace access
async function checkWorkspaceAccess(workspaceId: string, userId: string) {
  const member = await prisma.workspaceMember.findFirst({
    where: { workspaceId, userId },
  });
  return member;
}

// GET /api/workspaces/[workspaceId] - ดึงข้อมูล workspace
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

    const workspace = await prisma.workspace.findUnique({
      where: { id: params.workspaceId },
      include: {
        members: { include: { user: true } },
        _count: {
          select: { contacts: true, loans: true, payments: true },
        },
      },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    return NextResponse.json(workspace);
  } catch (error) {
    console.error("Error fetching workspace:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PATCH /api/workspaces/[workspaceId] - อัพเดท workspace
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const member = await checkWorkspaceAccess(params.workspaceId, session.user.id);
    if (!member || !["OWNER", "ADMIN"].includes(member.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validation = updateWorkspaceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation Error", details: validation.error.issues },
        { status: 400 }
      );
    }

    const workspace = await prisma.workspace.update({
      where: { id: params.workspaceId },
      data: validation.data,
    });

    return NextResponse.json(workspace);
  } catch (error) {
    console.error("Error updating workspace:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/workspaces/[workspaceId] - ลบ workspace
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: params.workspaceId },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    if (workspace.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.workspace.delete({
      where: { id: params.workspaceId },
    });

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Error deleting workspace:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
