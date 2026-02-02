import { prisma } from "@/lib/prisma";

// Features ที่มีการจำกัด
export type FeatureType = 
  | "WORKSPACES"
  | "CONTACTS"
  | "LOANS"
  | "CREDIT_CARDS"
  | "INSTALLMENT_PLANS"
  | "PRODUCTS"
  | "STORAGE_MB"
  | "TEAM_MEMBERS";

// Default limits สำหรับแต่ละแผน
export const DEFAULT_PLAN_LIMITS: Record<string, Record<FeatureType, number>> = {
  FREE: {
    WORKSPACES: 1,
    CONTACTS: 10,
    LOANS: 5,
    CREDIT_CARDS: 2,
    INSTALLMENT_PLANS: 3,
    PRODUCTS: 10,
    STORAGE_MB: 100,
    TEAM_MEMBERS: 1,
  },
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
    WORKSPACES: -1, // unlimited
    CONTACTS: -1,
    LOANS: -1,
    CREDIT_CARDS: -1,
    INSTALLMENT_PLANS: -1,
    PRODUCTS: -1,
    STORAGE_MB: 10240,
    TEAM_MEMBERS: -1,
  },
};

// Plan pricing
export const PLAN_PRICING = {
  FREE: { monthly: 0, yearly: 0 },
  PRO: { monthly: 299, yearly: 2990 },
  BUSINESS: { monthly: 899, yearly: 8990 },
};

// ดึงแผนทั้งหมดจากฐานข้อมูล (สำหรับหน้า pricing)
export async function getAllPlans() {
  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    include: { limits: true },
    orderBy: { sortOrder: "asc" },
  });

  // ถ้าไม่มีแผนในฐานข้อมูล ให้ return ค่า default
  if (plans.length === 0) {
    return [
      {
        id: "free",
        name: "FREE",
        displayName: "ฟรี",
        description: "เริ่มต้นใช้งานฟรี เหมาะสำหรับการทดลองใช้",
        price: 0,
        yearlyPrice: 0,
        limits: Object.entries(DEFAULT_PLAN_LIMITS.FREE).map(([feature, limit]) => ({
          feature,
          limit,
        })),
      },
      {
        id: "pro",
        name: "PRO",
        displayName: "โปร",
        description: "สำหรับผู้ใช้งานจริงจัง ฟีเจอร์ครบถ้วน",
        price: 299,
        yearlyPrice: 2990,
        limits: Object.entries(DEFAULT_PLAN_LIMITS.PRO).map(([feature, limit]) => ({
          feature,
          limit,
        })),
      },
      {
        id: "business",
        name: "BUSINESS",
        displayName: "ธุรกิจ",
        description: "สำหรับธุรกิจ ไม่จำกัดการใช้งาน",
        price: 899,
        yearlyPrice: 8990,
        limits: Object.entries(DEFAULT_PLAN_LIMITS.BUSINESS).map(([feature, limit]) => ({
          feature,
          limit,
        })),
      },
    ];
  }

  return plans;
}

// ดึง subscription ของ user
export async function getUserSubscription(userId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    include: {
      plan: {
        include: {
          limits: true,
        },
      },
    },
  });

  // ถ้าไม่มี subscription ให้สร้าง FREE plan
  if (!subscription) {
    return await createFreeSubscription(userId);
  }

  return subscription;
}

// สร้าง FREE subscription สำหรับ user ใหม่
export async function createFreeSubscription(userId: string) {
  // หา FREE plan หรือสร้างถ้ายังไม่มี
  let freePlan = await prisma.plan.findUnique({
    where: { name: "FREE" },
    include: { limits: true },
  });

  if (!freePlan) {
    freePlan = await initializePlans();
  }

  const subscription = await prisma.subscription.create({
    data: {
      userId,
      planId: freePlan!.id,
      status: "ACTIVE",
      billingCycle: "MONTHLY",
    },
    include: {
      plan: {
        include: {
          limits: true,
        },
      },
    },
  });

  return subscription;
}

// Initialize all plans (run once)
export async function initializePlans() {
  const plans = [
    {
      name: "FREE",
      displayName: "ฟรี",
      description: "เริ่มต้นใช้งานฟรี เหมาะสำหรับการทดลองใช้",
      price: 0,
      yearlyPrice: 0,
      sortOrder: 0,
    },
    {
      name: "PRO",
      displayName: "โปร",
      description: "สำหรับผู้ใช้งานจริงจัง ฟีเจอร์ครบถ้วน",
      price: 299,
      yearlyPrice: 2990,
      sortOrder: 1,
    },
    {
      name: "BUSINESS",
      displayName: "ธุรกิจ",
      description: "สำหรับธุรกิจ ไม่จำกัดการใช้งาน",
      price: 899,
      yearlyPrice: 8990,
      sortOrder: 2,
    },
  ];

  let freePlan = null;

  for (const planData of plans) {
    const plan = await prisma.plan.upsert({
      where: { name: planData.name },
      update: planData,
      create: planData,
    });

    // สร้าง limits
    const limits = DEFAULT_PLAN_LIMITS[planData.name];
    for (const [feature, limit] of Object.entries(limits)) {
      await prisma.planLimit.upsert({
        where: {
          planId_feature: {
            planId: plan.id,
            feature,
          },
        },
        update: { limit },
        create: {
          planId: plan.id,
          feature,
          limit,
        },
      });
    }

    if (planData.name === "FREE") {
      freePlan = await prisma.plan.findUnique({
        where: { name: "FREE" },
        include: { limits: true },
      });
    }
  }

  return freePlan;
}

// ดึง limit ของ feature
export async function getFeatureLimit(userId: string, feature: FeatureType): Promise<number> {
  const subscription = await getUserSubscription(userId);
  const limit = subscription.plan.limits.find((l: { feature: string; limit: number }) => l.feature === feature);
  return limit?.limit ?? 0;
}

// ดึง usage ปัจจุบันของ feature
export async function getCurrentUsage(userId: string, feature: FeatureType): Promise<number> {
  const subscription = await getUserSubscription(userId);
  
  // นับจาก database จริง
  switch (feature) {
    case "WORKSPACES":
      return await prisma.workspaceMember.count({
        where: { userId, role: "OWNER" },
      });
    case "CONTACTS":
      const workspaces = await prisma.workspaceMember.findMany({
        where: { userId },
        select: { workspaceId: true },
      });
      return await prisma.contact.count({
        where: { workspaceId: { in: workspaces.map((w) => w.workspaceId) } },
      });
    case "LOANS":
      const wsForLoans = await prisma.workspaceMember.findMany({
        where: { userId },
        select: { workspaceId: true },
      });
      return await prisma.loan.count({
        where: { workspaceId: { in: wsForLoans.map((w) => w.workspaceId) } },
      });
    case "CREDIT_CARDS":
      const wsForCards = await prisma.workspaceMember.findMany({
        where: { userId },
        select: { workspaceId: true },
      });
      return await prisma.creditCard.count({
        where: { workspaceId: { in: wsForCards.map((w) => w.workspaceId) } },
      });
    case "INSTALLMENT_PLANS":
      const wsForPlans = await prisma.workspaceMember.findMany({
        where: { userId },
        select: { workspaceId: true },
      });
      return await prisma.installmentPlan.count({
        where: { workspaceId: { in: wsForPlans.map((w) => w.workspaceId) } },
      });
    case "PRODUCTS":
      const wsForProducts = await prisma.workspaceMember.findMany({
        where: { userId },
        select: { workspaceId: true },
      });
      return await prisma.product.count({
        where: { workspaceId: { in: wsForProducts.map((w) => w.workspaceId) } },
      });
    case "TEAM_MEMBERS":
      const ownedWorkspaces = await prisma.workspaceMember.findMany({
        where: { userId, role: "OWNER" },
        select: { workspaceId: true },
      });
      return await prisma.workspaceMember.count({
        where: { 
          workspaceId: { in: ownedWorkspaces.map((w) => w.workspaceId) },
          userId: { not: userId },
        },
      });
    default:
      return 0;
  }
}

// ตรวจสอบว่า user สามารถใช้ feature ได้หรือไม่
export async function canUseFeature(
  userId: string,
  feature: FeatureType,
  additionalCount: number = 1
): Promise<{ allowed: boolean; currentUsage: number; limit: number; remaining: number }> {
  const limit = await getFeatureLimit(userId, feature);
  const currentUsage = await getCurrentUsage(userId, feature);

  // -1 = unlimited
  if (limit === -1) {
    return {
      allowed: true,
      currentUsage,
      limit: -1,
      remaining: -1,
    };
  }

  const remaining = limit - currentUsage;
  const allowed = remaining >= additionalCount;

  return {
    allowed,
    currentUsage,
    limit,
    remaining: Math.max(0, remaining),
  };
}

// ดึงสถิติการใช้งานทั้งหมด
export async function getUsageStats(userId: string) {
  const features: FeatureType[] = [
    "WORKSPACES",
    "CONTACTS",
    "LOANS",
    "CREDIT_CARDS",
    "INSTALLMENT_PLANS",
    "PRODUCTS",
    "TEAM_MEMBERS",
  ];

  const stats: Record<FeatureType, { usage: number; limit: number; percentage: number }> = {} as any;

  for (const feature of features) {
    const result = await canUseFeature(userId, feature);
    stats[feature] = {
      usage: result.currentUsage,
      limit: result.limit,
      percentage: result.limit === -1 ? 0 : Math.round((result.currentUsage / result.limit) * 100),
    };
  }

  return stats;
}

// อัพเกรด subscription
export async function upgradePlan(
  userId: string,
  planName: "PRO" | "BUSINESS",
  billingCycle: "MONTHLY" | "YEARLY" = "MONTHLY"
) {
  const plan = await prisma.plan.findUnique({
    where: { name: planName },
  });

  if (!plan) {
    throw new Error("Plan not found");
  }

  const subscription = await prisma.subscription.update({
    where: { userId },
    data: {
      planId: plan.id,
      billingCycle,
      status: "ACTIVE",
      startDate: new Date(),
      endDate: billingCycle === "MONTHLY" 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
    include: {
      plan: {
        include: {
          limits: true,
        },
      },
    },
  });

  return subscription;
}

// ยกเลิก subscription (downgrade to FREE)
export async function cancelSubscription(userId: string) {
  const freePlan = await prisma.plan.findUnique({
    where: { name: "FREE" },
  });

  if (!freePlan) {
    throw new Error("Free plan not found");
  }

  const subscription = await prisma.subscription.update({
    where: { userId },
    data: {
      planId: freePlan.id,
      status: "CANCELLED",
      cancelledAt: new Date(),
      endDate: null,
    },
    include: {
      plan: {
        include: {
          limits: true,
        },
      },
    },
  });

  return subscription;
}

// Feature names ภาษาไทย
export const FEATURE_NAMES: Record<FeatureType, string> = {
  WORKSPACES: "Workspaces",
  CONTACTS: "ผู้ติดต่อ",
  LOANS: "สัญญาเงินกู้",
  CREDIT_CARDS: "บัตรเครดิต",
  INSTALLMENT_PLANS: "แผนผ่อนชำระ",
  PRODUCTS: "สินค้า",
  STORAGE_MB: "พื้นที่จัดเก็บ (MB)",
  TEAM_MEMBERS: "สมาชิกทีม",
};

// ดึง upgrade options จากฐานข้อมูล
export async function getUpgradeOptionsFromDB(
  currentPlanName: string,
  feature: FeatureType
) {
  // ดึง plans ที่สูงกว่า current plan
  const allPlans = await prisma.plan.findMany({
    where: { 
      isActive: true,
      name: { not: currentPlanName }, // ไม่รวม plan ปัจจุบัน
      NOT: { name: "FREE" }, // ไม่รวม FREE
    },
    include: {
      limits: true,
    },
    orderBy: { sortOrder: "asc" },
  });

  return allPlans.map((plan) => {
    const featureLimit = plan.limits.find((l) => l.feature === feature);
    return {
      name: plan.name,
      displayName: plan.displayName,
      price: plan.price,
      yearlyPrice: plan.yearlyPrice,
      limit: featureLimit?.limit ?? 0,
      benefits: plan.limits.map((l) => {
        const featureName = FEATURE_NAMES[l.feature as FeatureType] || l.feature;
        return l.limit === -1 
          ? `${featureName} ไม่จำกัด`
          : `${featureName} ${l.limit} รายการ`;
      }),
    };
  });
}

// ดึง plan ปัจจุบันของ user
export async function getCurrentPlan(userId: string) {
  const subscription = await getUserSubscription(userId);
  return subscription.plan;
}
