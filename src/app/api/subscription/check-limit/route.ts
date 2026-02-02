import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { 
  canUseFeature, 
  FeatureType, 
  getCurrentPlan,
  getUpgradeOptionsFromDB,
  FEATURE_NAMES 
} from "@/services/subscription.service";

export const dynamic = "force-dynamic";

// GET - ตรวจสอบว่าสามารถใช้ feature ได้หรือไม่
export async function GET(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const feature = searchParams.get("feature") as FeatureType;

    if (!feature) {
      return NextResponse.json(
        { error: "Feature parameter is required" },
        { status: 400 }
      );
    }

    const result = await canUseFeature(session.user.id, feature);

    if (result.allowed) {
      return NextResponse.json(result);
    }

    // ถ้าเกิน limit ดึงข้อมูล plan และ upgrade options จากฐานข้อมูล
    const currentPlan = await getCurrentPlan(session.user.id);
    const upgradeOptions = await getUpgradeOptionsFromDB(currentPlan.name, feature);
    const featureName = FEATURE_NAMES[feature] || feature;

    return NextResponse.json({
      ...result,
      message: `ถึงขีดจำกัด${featureName}แล้ว (${result.currentUsage}/${result.limit})`,
      planInfo: {
        current: {
          name: currentPlan.name,
          displayName: currentPlan.displayName,
          limit: result.limit,
        },
        upgrades: upgradeOptions,
      },
    });
  } catch (error) {
    console.error("Error checking limit:", error);
    return NextResponse.json(
      { error: "Failed to check limit", allowed: true },
      { status: 500 }
    );
  }
}
