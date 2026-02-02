import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin, SUPER_ADMIN_EMAIL } from "@/lib/admin";

// ตรวจสอบสิทธิ์ Admin
async function checkAdminAccess(session: any) {
  if (!session?.user?.id) return false;
  
  return isAdmin(session.user.id);
}

/**
 * GET /api/admin/payments
 * ดึงรายการ PaymentRequest ที่รอตรวจสอบ
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!await checkAdminAccess(session)) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "UPLOADED";

    const payments = await prisma.paymentRequest.findMany({
      where: {
        status: status as any,
      },
      include: {
        invoice: {
          include: {
            subscription: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                  },
                },
                plan: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // นับจำนวนตามสถานะ
    const stats = await prisma.paymentRequest.groupBy({
      by: ["status"],
      _count: { id: true },
    });

    const statusCounts = stats.reduce((acc, item) => {
      acc[item.status] = item._count.id;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      payments: payments.map((p) => ({
        id: p.id,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        slipImage: p.slipImage,
        promptPayId: p.promptPayId,
        transRef: p.transRef,
        senderName: p.senderName,
        senderBank: p.senderBank,
        slipAmount: p.slipAmount,
        transDate: p.transDate,
        transTime: p.transTime,
        rejectedReason: p.rejectedReason,
        createdAt: p.createdAt,
        expiresAt: p.expiresAt,
        invoice: {
          id: p.invoice.id,
          invoiceNumber: p.invoice.invoiceNumber,
          amount: p.invoice.amount,
          description: p.invoice.description,
        },
        user: p.invoice.subscription.user,
        requestedPlan: p.invoice.description,
      })),
      stats: statusCounts,
    });
  } catch (error) {
    console.error("Get payments error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

/**
 * POST /api/admin/payments
 * อนุมัติหรือปฏิเสธ PaymentRequest
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!await checkAdminAccess(session)) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
    }

    const { paymentRequestId, action, reason } = await request.json();

    if (!paymentRequestId || !action) {
      return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 });
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "action ไม่ถูกต้อง" }, { status: 400 });
    }

    // ดึง PaymentRequest
    const paymentRequest = await prisma.paymentRequest.findUnique({
      where: { id: paymentRequestId },
      include: {
        invoice: {
          include: {
            subscription: true,
          },
        },
      },
    });

    if (!paymentRequest) {
      return NextResponse.json({ error: "ไม่พบคำขอชำระเงิน" }, { status: 404 });
    }

    if (paymentRequest.status === "VERIFIED") {
      return NextResponse.json({ error: "คำขอนี้ได้รับการอนุมัติแล้ว" }, { status: 400 });
    }

    if (action === "approve") {
      // อนุมัติ
      await prisma.paymentRequest.update({
        where: { id: paymentRequestId },
        data: {
          status: "VERIFIED",
          verifiedAt: new Date(),
          verifiedBy: session!.user!.email || "ADMIN",
        },
      });

      // อัพเดท Invoice
      await prisma.invoice.update({
        where: { id: paymentRequest.invoiceId },
        data: {
          status: "PAID",
          paidAt: new Date(),
        },
      });

      // คำนวณ endDate
      const subscription = paymentRequest.invoice.subscription;
      const startDate = new Date();
      const endDate = new Date();
      if (subscription.billingCycle === "YEARLY") {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }

      // ดึง Plan จาก invoice description
      const targetPlan = await prisma.plan.findFirst({
        where: {
          price: { lte: paymentRequest.amount + 1, gte: paymentRequest.amount - 1 },
          isActive: true,
        },
      });

      // อัพเดท Subscription
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          planId: targetPlan?.id || subscription.planId,
          status: "ACTIVE",
          startDate,
          endDate,
          approvedBy: session!.user!.email || "ADMIN",
          approvedAt: new Date(),
          requestNote: null,
          rejectedReason: null,
        },
      });

      return NextResponse.json({
        success: true,
        message: "อนุมัติการชำระเงินสำเร็จ",
      });
    } else {
      // ปฏิเสธ
      await prisma.paymentRequest.update({
        where: { id: paymentRequestId },
        data: {
          status: "REJECTED",
          rejectedReason: reason || "สลิปไม่ถูกต้อง",
        },
      });

      return NextResponse.json({
        success: true,
        message: "ปฏิเสธคำขอชำระเงินแล้ว",
      });
    }
  } catch (error) {
    console.error("Process payment error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
