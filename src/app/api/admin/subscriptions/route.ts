import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "../route";

// GET - ดึงรายการคำขอสมัคร subscription
export async function GET(request: Request) {
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
    const status = searchParams.get("status") || "PENDING";

    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: status as any,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            createdAt: true,
          },
        },
        plan: {
          select: {
            id: true,
            name: true,
            displayName: true,
            price: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // นับสถิติ
    const stats = {
      pending: await prisma.subscription.count({ where: { status: "PENDING" } }),
      active: await prisma.subscription.count({ where: { status: "ACTIVE" } }),
      cancelled: await prisma.subscription.count({ where: { status: "CANCELLED" } }),
      expired: await prisma.subscription.count({ where: { status: "EXPIRED" } }),
    };

    return NextResponse.json({ subscriptions, stats });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscriptions" },
      { status: 500 }
    );
  }
}

// POST - อนุมัติ/ปฏิเสธ subscription
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
    const { subscriptionId, action, rejectedReason } = body;

    if (!subscriptionId || !action) {
      return NextResponse.json(
        { error: "Subscription ID and action are required" },
        { status: 400 }
      );
    }

    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    if (action === "approve") {
      // อนุมัติ
      const endDate = subscription.billingCycle === "YEARLY"
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: "ACTIVE",
          approvedBy: session.user.id,
          approvedAt: new Date(),
          startDate: new Date(),
          endDate,
        },
      });

      return NextResponse.json({ message: "อนุมัติคำขอสำเร็จ" });
    } else if (action === "reject") {
      // ปฏิเสธ - เปลี่ยนกลับเป็น FREE plan
      const freePlan = await prisma.plan.findUnique({
        where: { name: "FREE" },
      });

      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: "CANCELLED",
          rejectedReason,
          planId: freePlan?.id || subscription.planId,
        },
      });

      return NextResponse.json({ message: "ปฏิเสธคำขอสำเร็จ" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error processing subscription:", error);
    return NextResponse.json(
      { error: "Failed to process subscription" },
      { status: 500 }
    );
  }
}
