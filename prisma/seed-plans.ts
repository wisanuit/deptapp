import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Default limits สำหรับแต่ละแผน
const DEFAULT_PLAN_LIMITS = {
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

async function main() {
  console.log("🌱 Seeding subscription plans...\n");

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

  for (const planData of plans) {
    console.log(`📦 Creating plan: ${planData.name}...`);
    
    const plan = await prisma.plan.upsert({
      where: { name: planData.name },
      update: planData,
      create: planData,
    });

    // สร้าง limits
    const limits = DEFAULT_PLAN_LIMITS[planData.name as keyof typeof DEFAULT_PLAN_LIMITS];
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

    console.log(`   ✅ ${planData.displayName} - ฿${planData.price}/เดือน`);
  }

  console.log("\n✨ Subscription plans seeded successfully!");
  
  // Show summary
  const allPlans = await prisma.plan.findMany({
    include: { limits: true },
    orderBy: { sortOrder: "asc" },
  });

  console.log("\n📊 Plan Summary:");
  console.log("─".repeat(60));
  
  for (const plan of allPlans) {
    console.log(`\n${plan.displayName} (${plan.name}):`);
    console.log(`   ราคา: ฿${plan.price}/เดือน | ฿${plan.yearlyPrice}/ปี`);
    console.log("   Limits:");
    for (const limit of plan.limits) {
      console.log(`     - ${limit.feature}: ${limit.limit === -1 ? "ไม่จำกัด" : limit.limit}`);
    }
  }
}

main()
  .catch((e) => {
    console.error("❌ Error seeding plans:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
