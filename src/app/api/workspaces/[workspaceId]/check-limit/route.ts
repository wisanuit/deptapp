import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { FeatureType, canUseFeature, getFeatureLimit } from "@/services/subscription.service";

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

    // ถ้าเกิน limit ส่งข้อมูลสำหรับแสดง upgrade modal
    return NextResponse.json({
      allowed: false,
      current: result.currentUsage,
      limit: result.limit,
      feature,
      message: `ถึงขีดจำกัดแล้ว (${result.currentUsage}/${result.limit})`,
      // ข้อมูลสำหรับแสดง upgrade options
      planInfo: {
        current: {
          limit: result.limit,
        },
        upgrades: getUpgradeOptions(feature),
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

// ข้อมูลแพ็กเกจสำหรับ upgrade
function getUpgradeOptions(feature: FeatureType) {
  const upgrades = [];

  upgrades.push({
    name: "PRO",
    price: 299,
    limit: getFeatureLimitByPlan("PRO", feature),
    benefits: [
      "รายชื่อติดต่อ 100 รายการ",
      "สินเชื่อ 50 รายการ",
      "บัตรเครดิต 10 ใบ",
      "ผ่อนชำระ 20 รายการ",
      "สินค้า 100 รายการ",
      "พื้นที่ 1GB",
    ],
  });

  upgrades.push({
    name: "BUSINESS",
    price: 899,
    limit: getFeatureLimitByPlan("BUSINESS", feature),
    benefits: [
      "รายชื่อติดต่อไม่จำกัด",
      "สินเชื่อไม่จำกัด",
      "บัตรเครดิตไม่จำกัด",
      "ผ่อนชำระไม่จำกัด",
      "สินค้าไม่จำกัด",
      "พื้นที่ 10GB",
      "สมาชิกทีมไม่จำกัด",
    ],
  });

  return upgrades;
}

// Get limit by plan name (static)
function getFeatureLimitByPlan(plan: string, feature: FeatureType): number {
  const limits: Record<string, Record<FeatureType, number>> = {
    PRO: {
      WORKSPACES: 5,
      CONTACTS: 100,
      LOANS: 50,
      CREDIT_CARDS: 10,
      INSTALLMENT_PLANS: 20,
      PRODUCTS: 100,
      STORAGE_MB: 1024,
      TEAM_MEMBERS: 5,
    },
    BUSINESS: {
      WORKSPACES: -1,
      CONTACTS: -1,
      LOANS: -1,
      CREDIT_CARDS: -1,
      INSTALLMENT_PLANS: -1,
      PRODUCTS: -1,
      STORAGE_MB: 10240,
      TEAM_MEMBERS: -1,
    },
  };
  return limits[plan]?.[feature] ?? 0;
}
