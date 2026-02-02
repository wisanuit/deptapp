import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { 
  FeatureType, 
  canUseFeature, 
  getCurrentPlan,
  getUpgradeOptionsFromDB,
  FEATURE_NAMES 
} from "@/services/subscription.service";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await params; // workspaceId ไม่ได้ใช้เพราะเช็คจาก user
    const { searchParams } = new URL(request.url);
    const feature = searchParams.get("feature") as FeatureType;

    if (!feature) {
      return NextResponse.json({ error: "Feature is required" }, { status: 400 });
    }

    // Valid features
    const validFeatures: FeatureType[] = [
      "WORKSPACES",
      "CONTACTS", 
      "LOANS",
      "CREDIT_CARDS",
      "INSTALLMENT_PLANS",
      "PRODUCTS",
      "STORAGE_MB",
      "TEAM_MEMBERS",
    ];

    if (!validFeatures.includes(feature)) {
      return NextResponse.json({ error: "Invalid feature" }, { status: 400 });
    }

    // ตรวจสอบ limit โดยใช้ canUseFeature
    const result = await canUseFeature(session.user.id, feature);

    if (result.allowed) {
      return NextResponse.json({
        allowed: true,
        current: result.currentUsage,
        limit: result.limit,
        feature,
      });
    }

    // ดึงข้อมูล plan ปัจจุบันและ upgrade options จากฐานข้อมูล
    const currentPlan = await getCurrentPlan(session.user.id);
    const upgradeOptions = await getUpgradeOptionsFromDB(currentPlan.name, feature);

    const featureName = FEATURE_NAMES[feature] || feature;

    // ถ้าเกิน limit ส่งข้อมูลสำหรับแสดง upgrade modal
    return NextResponse.json({
      allowed: false,
      current: result.currentUsage,
      limit: result.limit,
      feature,
      message: `ถึงขีดจำกัด${featureName}แล้ว (${result.currentUsage}/${result.limit})`,
      // ข้อมูลสำหรับแสดง upgrade options
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
    console.error("Check limit error:", error);
    return NextResponse.json(
      { error: "Failed to check limit", allowed: true }, // ถ้าเกิด error ให้ผ่านไปก่อน
      { status: 500 }
    );
  }
}
