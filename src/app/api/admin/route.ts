import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin, isSuperAdmin, SUPER_ADMIN_EMAIL } from "@/lib/admin";

// GET - ดึงรายการ admins ทั้งหมด
export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ตรวจสอบสิทธิ์ Super Admin
    const isSuperAdminUser = await isSuperAdmin(session.user.id);
    if (!isSuperAdminUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const admins = await prisma.user.findMany({
      where: {
        OR: [
          { isAdmin: true },
          { isSuperAdmin: true },
          { email: SUPER_ADMIN_EMAIL },
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        isAdmin: true,
        isSuperAdmin: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Mark super admin email
    const adminsWithRole = admins.map((admin) => ({
      ...admin,
      isSuperAdmin: admin.email === SUPER_ADMIN_EMAIL || admin.isSuperAdmin,
    }));

    return NextResponse.json({ admins: adminsWithRole });
  } catch (error) {
    console.error("Error fetching admins:", error);
    return NextResponse.json(
      { error: "Failed to fetch admins" },
      { status: 500 }
    );
  }
}

// POST - เพิ่ม Admin ใหม่จาก email
export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ตรวจสอบสิทธิ์ Super Admin
    const isSuperAdminUser = await isSuperAdmin(session.user.id);
    if (!isSuperAdminUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { email, makeSuperAdmin = false } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // หา user จาก email
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // สร้าง user ใหม่ถ้ายังไม่มี
      user = await prisma.user.create({
        data: {
          email,
          isAdmin: true,
          isSuperAdmin: makeSuperAdmin,
        },
      });
    } else {
      // อัพเดท user ที่มีอยู่
      user = await prisma.user.update({
        where: { email },
        data: {
          isAdmin: true,
          isSuperAdmin: makeSuperAdmin || user.isSuperAdmin,
        },
      });
    }

    return NextResponse.json({
      message: `เพิ่ม ${email} เป็น Admin สำเร็จ`,
      admin: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
        isSuperAdmin: user.isSuperAdmin,
      },
    });
  } catch (error) {
    console.error("Error adding admin:", error);
    return NextResponse.json(
      { error: "Failed to add admin" },
      { status: 500 }
    );
  }
}

// DELETE - ลบสิทธิ์ Admin
export async function DELETE(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ตรวจสอบสิทธิ์ Super Admin
    const isSuperAdminUser = await isSuperAdmin(session.user.id);
    if (!isSuperAdminUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // ห้ามลบ super admin ตั้งต้น
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (targetUser?.email === SUPER_ADMIN_EMAIL) {
      return NextResponse.json(
        { error: "ไม่สามารถลบสิทธิ์ Super Admin หลักได้" },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        isAdmin: false,
        isSuperAdmin: false,
      },
    });

    return NextResponse.json({ message: "ลบสิทธิ์ Admin สำเร็จ" });
  } catch (error) {
    console.error("Error removing admin:", error);
    return NextResponse.json(
      { error: "Failed to remove admin" },
      { status: 500 }
    );
  }
}
