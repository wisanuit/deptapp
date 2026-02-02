import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";

/**
 * POST /api/subscription/payment
 * สร้างคำขอชำระเงินสำหรับอัพเกรด subscription
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    const { planId, billingCycle } = await request.json();

    if (!planId) {
      return NextResponse.json({ error: "กรุณาเลือก Package" }, { status: 400 });
    }

    // ดึงข้อมูล Plan
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
      include: { limits: true },
    });

    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: "ไม่พบ Package ที่เลือก" }, { status: 404 });
    }

    // คำนวณราคา
    const isYearly = billingCycle === "YEARLY";
    const amount = isYearly ? (plan.yearlyPrice ?? plan.price * 12 * 0.8) : plan.price;

    // ถ้าเป็นแพคเก็จฟรี ไม่ต้องชำระเงิน
    if (amount === 0) {
      // อัพเกรดเป็น FREE โดยตรง
      const subscription = await prisma.subscription.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          planId: plan.id,
          status: "ACTIVE",
          billingCycle: isYearly ? "YEARLY" : "MONTHLY",
          startDate: new Date(),
        },
        update: {
          planId: plan.id,
          status: "ACTIVE",
          billingCycle: isYearly ? "YEARLY" : "MONTHLY",
          startDate: new Date(),
          endDate: null,
        },
        include: {
          plan: { include: { limits: true } },
        },
      });

      return NextResponse.json({
        success: true,
        message: "สมัคร Package สำเร็จ",
        subscription,
        requiresPayment: false,
      });
    }

    // ดึงการตั้งค่า SlipOK (ถ้ามี)
    const slipokConfig = await prisma.slipOKConfig.findFirst({
      where: { isActive: true },
    });

    // ใช้ค่า default จาก env ถ้าไม่มี SlipOK config
    const promptPayId = slipokConfig?.promptPayId || process.env.DEFAULT_PROMPTPAY_ID || "";
    const promptPayName = slipokConfig?.promptPayName || process.env.DEFAULT_PROMPTPAY_NAME || "";
    const bankName = slipokConfig?.bankName || "";

    if (!promptPayId) {
      return NextResponse.json(
        { error: "ระบบชำระเงินยังไม่พร้อมใช้งาน กรุณาติดต่อผู้ดูแลระบบ" },
        { status: 503 }
      );
    }

    // สร้าง/อัพเดท Subscription แบบ PENDING
    const subscription = await prisma.subscription.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        planId: plan.id,
        status: "PENDING",
        billingCycle: isYearly ? "YEARLY" : "MONTHLY",
        startDate: new Date(),
      },
      update: {
        // ไม่เปลี่ยน planId เดิม ยังคงใช้แพคเก็จเดิมอยู่
        status: "PENDING",
        requestNote: `ขอสมัคร ${plan.displayName} (${isYearly ? "รายปี" : "รายเดือน"})`,
      },
    });

    // สร้าง Invoice
    const invoiceNumber = `INV-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, "0")}-${uuidv4().substring(0, 8).toUpperCase()}`;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7); // หมดอายุใน 7 วัน

    const invoice = await prisma.invoice.create({
      data: {
        subscriptionId: subscription.id,
        amount,
        currency: "THB",
        status: "PENDING",
        dueDate,
        invoiceNumber,
        description: `สมัคร ${plan.displayName} (${isYearly ? "รายปี" : "รายเดือน"})`,
      },
    });

    // สร้าง PaymentRequest
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // QR หมดอายุใน 24 ชั่วโมง

    const paymentRequest = await prisma.paymentRequest.create({
      data: {
        invoiceId: invoice.id,
        amount,
        currency: "THB",
        status: "PENDING",
        promptPayId: promptPayId,
        expiresAt,
      },
    });

    return NextResponse.json({
      success: true,
      message: "สร้างคำขอชำระเงินสำเร็จ",
      requiresPayment: true,
      autoVerify: !!slipokConfig, // บอกว่ามี SlipOK หรือไม่
      paymentRequest: {
        id: paymentRequest.id,
        amount,
        currency: "THB",
        promptPayId: promptPayId,
        promptPayName: promptPayName,
        bankName: bankName,
        expiresAt: paymentRequest.expiresAt,
      },
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        dueDate: invoice.dueDate,
      },
      plan: {
        id: plan.id,
        name: plan.name,
        displayName: plan.displayName,
      },
      billingCycle,
    });
  } catch (error) {
    console.error("Create payment request error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการสร้างคำขอชำระเงิน" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/subscription/payment
 * ดึงข้อมูลคำขอชำระเงินที่รอดำเนินการ
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    // ดึง subscription ของ user
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
      include: {
        plan: { include: { limits: true } },
        invoices: {
          where: { status: "PENDING" },
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            paymentRequests: {
              where: { status: { in: ["PENDING", "UPLOADED", "VERIFYING"] } },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    if (!subscription) {
      return NextResponse.json({ paymentRequest: null });
    }

    const latestInvoice = subscription.invoices[0];
    const latestPayment = latestInvoice?.paymentRequests[0];

    if (!latestPayment) {
      return NextResponse.json({ paymentRequest: null });
    }

    // ดึงการตั้งค่า SlipOK (ถ้ามี)
    const slipokConfig = await prisma.slipOKConfig.findFirst({
      where: { isActive: true },
    });

    // ใช้ค่า default จาก env ถ้าไม่มี SlipOK config
    const promptPayId = slipokConfig?.promptPayId || latestPayment.promptPayId || process.env.DEFAULT_PROMPTPAY_ID || "";
    const promptPayName = slipokConfig?.promptPayName || process.env.DEFAULT_PROMPTPAY_NAME || "";
    const bankName = slipokConfig?.bankName || "";

    return NextResponse.json({
      paymentRequest: {
        id: latestPayment.id,
        amount: latestPayment.amount,
        currency: latestPayment.currency,
        status: latestPayment.status,
        promptPayId: promptPayId,
        promptPayName: promptPayName,
        bankName: bankName,
        expiresAt: latestPayment.expiresAt,
        slipImage: latestPayment.slipImage,
      },
      autoVerify: !!slipokConfig, // บอกว่ามี SlipOK หรือไม่
      invoice: latestInvoice
        ? {
            id: latestInvoice.id,
            invoiceNumber: latestInvoice.invoiceNumber,
            amount: latestInvoice.amount,
            dueDate: latestInvoice.dueDate,
            description: latestInvoice.description,
          }
        : null,
      subscription: {
        status: subscription.status,
        plan: subscription.plan,
      },
    });
  } catch (error) {
    console.error("Get payment request error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาด" },
      { status: 500 }
    );
  }
}
