import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifySlipImage, getBankName } from "@/services/slipok.service";

/**
 * POST /api/subscription/payment/verify
 * อัปโหลดสลิปและตรวจสอบผ่าน SlipOK API
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    const { paymentRequestId, slipImage } = await request.json();

    if (!paymentRequestId) {
      return NextResponse.json({ error: "ไม่พบข้อมูลคำขอชำระเงิน" }, { status: 400 });
    }

    if (!slipImage) {
      return NextResponse.json({ error: "กรุณาอัปโหลดรูปสลิป" }, { status: 400 });
    }

    // ดึงข้อมูล PaymentRequest
    const paymentRequest = await prisma.paymentRequest.findUnique({
      where: { id: paymentRequestId },
      include: {
        invoice: {
          include: {
            subscription: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!paymentRequest) {
      return NextResponse.json({ error: "ไม่พบคำขอชำระเงิน" }, { status: 404 });
    }

    // ตรวจสอบว่าเป็นของ user นี้
    if (paymentRequest.invoice.subscription.userId !== session.user.id) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
    }

    // ตรวจสอบสถานะ
    if (paymentRequest.status === "VERIFIED") {
      return NextResponse.json({ error: "คำขอนี้ได้รับการยืนยันแล้ว" }, { status: 400 });
    }

    if (paymentRequest.status === "EXPIRED") {
      return NextResponse.json({ error: "คำขอชำระเงินหมดอายุแล้ว" }, { status: 400 });
    }

    // ตรวจสอบว่าหมดอายุหรือยัง
    if (new Date() > paymentRequest.expiresAt) {
      await prisma.paymentRequest.update({
        where: { id: paymentRequestId },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json({ error: "คำขอชำระเงินหมดอายุแล้ว" }, { status: 400 });
    }

    // อัพเดทสถานะเป็น UPLOADED
    await prisma.paymentRequest.update({
      where: { id: paymentRequestId },
      data: {
        status: "UPLOADED",
        slipImage,
      },
    });

    // ดึงการตั้งค่า SlipOK
    const slipokConfig = await prisma.slipOKConfig.findFirst({
      where: { isActive: true },
    });

    if (!slipokConfig) {
      // ถ้าไม่มี SlipOK config ให้รอ Admin อนุมัติ manual
      return NextResponse.json({
        success: true,
        message: "อัปโหลดสลิปสำเร็จ รอการตรวจสอบจากผู้ดูแลระบบ",
        autoVerified: false,
        status: "UPLOADED",
      });
    }

    // อัพเดทสถานะเป็น VERIFYING
    await prisma.paymentRequest.update({
      where: { id: paymentRequestId },
      data: { status: "VERIFYING" },
    });

    // ตรวจสอบสลิปผ่าน SlipOK API
    const verifyResult = await verifySlipImage(
      slipokConfig.branchId,
      slipokConfig.apiKey,
      slipImage,
      paymentRequest.amount, // ตรวจสอบยอดเงินด้วย
      true // log เพื่อเช็คสลิปซ้ำ
    );

    if (!verifyResult.success) {
      // สลิปไม่ผ่าน
      const errorCode = verifyResult.error?.code || -1;
      let errorMessage = verifyResult.error?.message || "ไม่สามารถตรวจสอบสลิปได้";
      let newStatus: "PENDING" | "REJECTED" = "PENDING";

      // กรณี error ที่ต้อง reject
      if ([1007, 1008, 1012, 1013, 1014].includes(errorCode)) {
        newStatus = "REJECTED";
      }

      // กรณี error 1010 (bank delay) ให้ลองใหม่
      if (errorCode === 1010) {
        errorMessage = "กรุณารอสักครู่แล้วลองใหม่ (ธนาคารมีความล่าช้า)";
        newStatus = "PENDING";
      }

      await prisma.paymentRequest.update({
        where: { id: paymentRequestId },
        data: {
          status: newStatus,
          rejectedReason: errorMessage,
          slipData: verifyResult.data ? JSON.parse(JSON.stringify(verifyResult.data)) : null,
        },
      });

      return NextResponse.json({
        success: false,
        message: errorMessage,
        autoVerified: false,
        status: newStatus,
        errorCode,
        // ส่ง data กลับด้วยถ้ามี (เช่นกรณีสลิปซ้ำ)
        slipData: verifyResult.data
          ? {
              transRef: verifyResult.data.transRef,
              amount: verifyResult.data.amount,
              senderName: verifyResult.data.sender?.displayName,
              senderBank: getBankName(verifyResult.data.sendingBank),
            }
          : null,
      });
    }

    // สลิปผ่านการตรวจสอบ!
    const slipData = verifyResult.data!;

    // อัพเดท PaymentRequest
    await prisma.paymentRequest.update({
      where: { id: paymentRequestId },
      data: {
        status: "VERIFIED",
        verifiedAt: new Date(),
        verifiedBy: "SLIPOK",
        transRef: slipData.transRef,
        slipAmount: slipData.amount,
        senderName: slipData.sender?.displayName || slipData.sender?.name,
        senderBank: getBankName(slipData.sendingBank),
        receiverName: slipData.receiver?.displayName || slipData.receiver?.name,
        receiverBank: getBankName(slipData.receivingBank),
        transDate: slipData.transDate,
        transTime: slipData.transTime,
        slipData: JSON.parse(JSON.stringify(slipData)),
      },
    });

    // อัพเดท Invoice เป็น PAID
    await prisma.invoice.update({
      where: { id: paymentRequest.invoiceId },
      data: {
        status: "PAID",
        paidAt: new Date(),
      },
    });

    // ดึงข้อมูล pending plan จาก requestNote
    const subscription = paymentRequest.invoice.subscription;
    
    // ค้นหา Plan ที่ user ต้องการสมัคร (จาก invoice description)
    const invoice = paymentRequest.invoice;
    // ลอง parse plan name จาก description หรือใช้ plan เดิม
    const targetPlan = await prisma.plan.findFirst({
      where: {
        price: { lte: paymentRequest.amount + 1, gte: paymentRequest.amount - 1 },
        isActive: true,
      },
      include: { limits: true },
    });

    // คำนวณ endDate
    const startDate = new Date();
    const endDate = new Date();
    if (subscription.billingCycle === "YEARLY") {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // อัพเดท Subscription เป็น ACTIVE
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        planId: targetPlan?.id || subscription.planId,
        status: "ACTIVE",
        startDate,
        endDate,
        approvedBy: "SLIPOK",
        approvedAt: new Date(),
        requestNote: null,
        rejectedReason: null,
      },
      include: {
        plan: { include: { limits: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: "ชำระเงินสำเร็จ! อัพเกรด Package เรียบร้อยแล้ว",
      autoVerified: true,
      status: "VERIFIED",
      slipData: {
        transRef: slipData.transRef,
        amount: slipData.amount,
        senderName: slipData.sender?.displayName,
        senderBank: getBankName(slipData.sendingBank),
        receiverName: slipData.receiver?.displayName,
        receiverBank: getBankName(slipData.receivingBank),
        transDate: slipData.transDate,
        transTime: slipData.transTime,
      },
      subscription: {
        id: updatedSubscription.id,
        plan: updatedSubscription.plan,
        status: updatedSubscription.status,
        startDate: updatedSubscription.startDate,
        endDate: updatedSubscription.endDate,
      },
    });
  } catch (error) {
    console.error("Verify slip error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการตรวจสอบสลิป" },
      { status: 500 }
    );
  }
}
