import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getUserSubscription,
  getUsageStats,
  initializePlans,
} from "@/services/subscription.service";

// GET - ดึงข้อมูล subscription และ usage ของ user
export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await getUserSubscription(session.user.id);
    const usageStats = await getUsageStats(session.user.id);

    // ดึงรายการ plans ทั้งหมด
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      include: { limits: true },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        billingCycle: subscription.billingCycle,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        plan: {
          id: subscription.plan.id,
          name: subscription.plan.name,
          displayName: subscription.plan.displayName,
          price: subscription.plan.price,
          yearlyPrice: subscription.plan.yearlyPrice,
        },
      },
      usage: usageStats,
      plans: plans.map((p: any) => ({
        id: p.id,
        name: p.name,
        displayName: p.displayName,
        description: p.description,
        price: p.price,
        yearlyPrice: p.yearlyPrice,
        limits: p.limits.reduce((acc: Record<string, number>, l: any) => {
          acc[l.feature] = l.limit;
          return acc;
        }, {} as Record<string, number>),
      })),
    });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}

// POST - Initialize plans (admin only, run once)
export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    if (body.action === "initialize") {
      await initializePlans();
      return NextResponse.json({ message: "Plans initialized successfully" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error initializing plans:", error);
    return NextResponse.json(
      { error: "Failed to initialize plans" },
      { status: 500 }
    );
  }
}
