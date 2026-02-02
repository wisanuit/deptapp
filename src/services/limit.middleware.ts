import { NextResponse } from "next/server";
import { canUseFeature, FeatureType, FEATURE_NAMES } from "./subscription.service";

/**
 * Middleware สำหรับตรวจสอบ limit ก่อนสร้างข้อมูลใหม่
 * ใช้ใน API routes ก่อนที่จะ create record ใหม่
 */
export async function checkFeatureLimit(
  userId: string,
  feature: FeatureType,
  count: number = 1
): Promise<{ allowed: boolean; error?: string }> {
  const result = await canUseFeature(userId, feature, count);

  if (!result.allowed) {
    return {
      allowed: false,
      error: `ถึงขีดจำกัดของ${FEATURE_NAMES[feature]}แล้ว (${result.currentUsage}/${result.limit}) กรุณาอัพเกรดแผนเพื่อเพิ่มขีดจำกัด`,
    };
  }

  return { allowed: true };
}

/**
 * Helper function สำหรับ return error response เมื่อถึง limit
 */
export function limitExceededResponse(feature: FeatureType, currentUsage: number, limit: number) {
  return NextResponse.json(
    {
      error: "LIMIT_EXCEEDED",
      message: `ถึงขีดจำกัดของ${FEATURE_NAMES[feature]}แล้ว`,
      details: {
        feature,
        currentUsage,
        limit,
        upgradeUrl: "/subscription",
      },
    },
    { status: 403 }
  );
}

/**
 * Map API path to feature type
 */
export function getFeatureFromPath(path: string): FeatureType | null {
  if (path.includes("/contacts")) return "CONTACTS";
  if (path.includes("/loans")) return "LOANS";
  if (path.includes("/credit-cards")) return "CREDIT_CARDS";
  if (path.includes("/installments")) return "INSTALLMENT_PLANS";
  if (path.includes("/products")) return "PRODUCTS";
  if (path.includes("/workspaces") && !path.includes("/workspaces/")) return "WORKSPACES";
  return null;
}
