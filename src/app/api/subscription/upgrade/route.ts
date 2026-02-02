import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { upgradePlan, cancelSubscription } from "@/services/subscription.service";

// POST - อัพเกรดหรือเปลี่ยนแผน
export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { planName, billingCycle } = body;

    if (!planName || !["PRO", "BUSINESS"].includes(planName)) {
      return NextResponse.json(
        { error: "Invalid plan name. Must be PRO or BUSINESS" },
        { status: 400 }
      );
    }

    const subscription = await upgradePlan(
      session.user.id,
      planName,
      billingCycle || "MONTHLY"
    );

    return NextResponse.json({
      message: `Successfully upgraded to ${planName}`,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        billingCycle: subscription.billingCycle,
        plan: {
          name: subscription.plan.name,
          displayName: subscription.plan.displayName,
        },
      },
    });
  } catch (error) {
    console.error("Error upgrading plan:", error);
    return NextResponse.json(
      { error: "Failed to upgrade plan" },
      { status: 500 }
    );
  }
}

// DELETE - ยกเลิก subscription (downgrade to FREE)
export async function DELETE() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await cancelSubscription(session.user.id);

    return NextResponse.json({
      message: "Subscription cancelled. Downgraded to FREE plan.",
      subscription: {
        id: subscription.id,
        status: subscription.status,
        plan: {
          name: subscription.plan.name,
          displayName: subscription.plan.displayName,
        },
      },
    });
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
