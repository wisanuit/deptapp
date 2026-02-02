import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateContactSchema } from "@/lib/validations";

interface Params {
  params: Promise<{ workspaceId: string; contactId: string }>;
}

async function checkWorkspaceAccess(workspaceId: string, userId: string) {
  return prisma.workspaceMember.findFirst({
    where: { workspaceId, userId },
  });
}

// GET /api/workspaces/[workspaceId]/contacts/[contactId]
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, contactId } = await params;

    const member = await checkWorkspaceAccess(workspaceId, session.user.id);
    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const contact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        workspaceId: workspaceId,
      },
      include: {
        loansAsBorrower: {
          include: { interestPolicy: true },
        },
        loansAsLender: {
          include: { interestPolicy: true },
        },
      },
    });

    if (!contact) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    return NextResponse.json(contact);
  } catch (error) {
    console.error("Error fetching contact:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PATCH /api/workspaces/[workspaceId]/contacts/[contactId]
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, contactId } = await params;

    const member = await checkWorkspaceAccess(workspaceId, session.user.id);
    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validation = updateContactSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation Error", details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = { ...validation.data } as any;
    // Convert empty strings to null for optional fields
    const nullableFields = ['imageUrl', 'bankName', 'bankAccountNo', 'bankAccountName', 'promptPayNo', 'qrCodeUrl'];
    for (const field of nullableFields) {
      if (data[field] === "") {
        data[field] = null;
      }
    }

    const contact = await prisma.contact.updateMany({
      where: {
        id: contactId,
        workspaceId: workspaceId,
      },
      data,
    });

    if (contact.count === 0) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    const updatedContact = await prisma.contact.findUnique({
      where: { id: contactId },
    });

    return NextResponse.json(updatedContact);
  } catch (error) {
    console.error("Error updating contact:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/workspaces/[workspaceId]/contacts/[contactId]
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, contactId } = await params;

    const member = await checkWorkspaceAccess(workspaceId, session.user.id);
    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if user is trying to delete their own contact
    const contact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        workspaceId: workspaceId,
      },
    });

    if (contact?.userId === session.user.id) {
      return NextResponse.json(
        { error: "ไม่สามารถลบบัญชีผู้ติดต่อของตัวเองได้" },
        { status: 403 }
      );
    }

    const result = await prisma.contact.deleteMany({
      where: {
        id: contactId,
        workspaceId: workspaceId,
      },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Error deleting contact:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
