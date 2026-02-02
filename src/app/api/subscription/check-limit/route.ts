import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { canUseFeature, FeatureType } from "@/services/subscription.service";

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

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error checking limit:", error);
    return NextResponse.json(
      { error: "Failed to check limit" },
      { status: 500 }
    );
  }
}
