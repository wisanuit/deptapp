import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin";

// GET - ดึงรายการ Plans ทั้งหมด
export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ตรวจสอบสิทธิ์ Admin
    const isAdminUser = await isAdmin(session.user.id);
    if (!isAdminUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const plans = await prisma.plan.findMany({
      include: {
        limits: true,
        _count: {
          select: { subscriptions: true },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ plans });
  } catch (error) {
    console.error("Error fetching plans:", error);
    return NextResponse.json(
      { error: "Failed to fetch plans" },
      { status: 500 }
    );
  }
}

// POST - สร้าง Plan ใหม่
export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdminUser = await isAdmin(session.user.id);
    if (!isAdminUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      displayName,
      description,
      price,
      yearlyPrice,
      isActive = true,
      sortOrder = 0,
      limits = {},
    } = body;

    if (!name || !displayName) {
      return NextResponse.json(
        { error: "Name and displayName are required" },
        { status: 400 }
      );
    }

    // ตรวจสอบชื่อซ้ำ
    const existingPlan = await prisma.plan.findUnique({
      where: { name },
    });

    if (existingPlan) {
      return NextResponse.json(
        { error: "Plan name already exists" },
        { status: 400 }
      );
    }

    const plan = await prisma.plan.create({
      data: {
        name,
        displayName,
        description,
        price: price || 0,
        yearlyPrice: yearlyPrice || 0,
        isActive,
        sortOrder,
      },
    });

    // สร้าง limits
    for (const [feature, limit] of Object.entries(limits)) {
      await prisma.planLimit.create({
        data: {
          planId: plan.id,
          feature,
          limit: limit as number,
        },
      });
    }

    const createdPlan = await prisma.plan.findUnique({
      where: { id: plan.id },
      include: { limits: true },
    });

    return NextResponse.json({
      message: "สร้าง Package สำเร็จ",
      plan: createdPlan,
    });
  } catch (error) {
    console.error("Error creating plan:", error);
    return NextResponse.json(
      { error: "Failed to create plan" },
      { status: 500 }
    );
  }
}

// PUT - แก้ไข Plan
export async function PUT(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdminUser = await isAdmin(session.user.id);
    if (!isAdminUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      id,
      name,
      displayName,
      description,
      price,
      yearlyPrice,
      isActive,
      sortOrder,
      limits = {},
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Plan ID is required" }, { status: 400 });
    }

    const plan = await prisma.plan.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(displayName && { displayName }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price }),
        ...(yearlyPrice !== undefined && { yearlyPrice }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });

    // อัพเดท limits
    for (const [feature, limit] of Object.entries(limits)) {
      await prisma.planLimit.upsert({
        where: {
          planId_feature: {
            planId: plan.id,
            feature,
          },
        },
        update: { limit: limit as number },
        create: {
          planId: plan.id,
          feature,
          limit: limit as number,
        },
      });
    }

    const updatedPlan = await prisma.plan.findUnique({
      where: { id: plan.id },
      include: { limits: true },
    });

    return NextResponse.json({
      message: "แก้ไข Package สำเร็จ",
      plan: updatedPlan,
    });
  } catch (error) {
    console.error("Error updating plan:", error);
    return NextResponse.json(
      { error: "Failed to update plan" },
      { status: 500 }
    );
  }
}

// DELETE - ลบ Plan
export async function DELETE(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdminUser = await isAdmin(session.user.id);
    if (!isAdminUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const planId = searchParams.get("planId");

    if (!planId) {
      return NextResponse.json({ error: "Plan ID is required" }, { status: 400 });
    }

    // ตรวจสอบว่ามี subscription อยู่หรือไม่
    const subscriptionCount = await prisma.subscription.count({
      where: { planId },
    });

    if (subscriptionCount > 0) {
      return NextResponse.json(
        { error: `ไม่สามารถลบได้ มี ${subscriptionCount} subscriptions ที่ใช้ Package นี้อยู่` },
        { status: 400 }
      );
    }

    await prisma.plan.delete({
      where: { id: planId },
    });

    return NextResponse.json({ message: "ลบ Package สำเร็จ" });
  } catch (error) {
    console.error("Error deleting plan:", error);
    return NextResponse.json(
      { error: "Failed to delete plan" },
      { status: 500 }
    );
  }
}
