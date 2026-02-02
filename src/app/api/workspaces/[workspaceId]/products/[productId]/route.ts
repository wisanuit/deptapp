import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET - ดึงข้อมูลสินค้าและประวัติสต๊อก
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; productId: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, productId } = await params;

    // ตรวจสอบสิทธิ์
    const membership = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: session.user.id },
    });

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const product = await prisma.product.findFirst({
      where: { id: productId, workspaceId },
      include: {
        stockMovements: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT - อัพเดทข้อมูลสินค้า
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; productId: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, productId } = await params;
    const body = await request.json();

    // ตรวจสอบสิทธิ์
    const membership = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: session.user.id },
    });

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        name: body.name,
        description: body.description,
        imageUrl: body.imageUrl,
        price: body.price ? parseFloat(body.price) : null,
        cost: body.cost ? parseFloat(body.cost) : null,
        category: body.category,
        sku: body.sku,
        barcode: body.barcode,
        unit: body.unit,
        minStock: body.minStock ? parseInt(body.minStock) : 0,
        maxStock: body.maxStock ? parseInt(body.maxStock) : null,
        isActive: body.isActive ?? true,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - เคลื่อนไหวสต๊อก (รับเข้า/จ่ายออก/ปรับยอด)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; productId: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, productId } = await params;
    const body = await request.json();

    // ตรวจสอบสิทธิ์
    const membership = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: session.user.id },
    });

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { type, quantity, reference, note, cost } = body;

    if (!type || quantity === undefined) {
      return NextResponse.json({ error: "กรุณาระบุประเภทและจำนวน" }, { status: 400 });
    }

    // ดึงข้อมูลสินค้าปัจจุบัน
    const product = await prisma.product.findFirst({
      where: { id: productId, workspaceId },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const beforeQty = product.stockQty;
    let afterQty = beforeQty;
    const qty = parseInt(quantity);

    // คำนวณยอดใหม่ตามประเภท
    switch (type) {
      case "IN":
      case "RETURN":
        afterQty = beforeQty + qty;
        break;
      case "OUT":
      case "SALE":
      case "DAMAGE":
      case "TRANSFER":
        afterQty = beforeQty - qty;
        if (afterQty < 0) {
          return NextResponse.json({ error: "สต๊อกไม่เพียงพอ" }, { status: 400 });
        }
        break;
      case "ADJUST":
        afterQty = qty; // ปรับยอดตรงๆ
        break;
      default:
        return NextResponse.json({ error: "ประเภทไม่ถูกต้อง" }, { status: 400 });
    }

    // อัพเดทสต๊อกและบันทึกประวัติ
    const [updatedProduct, movement] = await prisma.$transaction([
      prisma.product.update({
        where: { id: productId },
        data: { stockQty: afterQty },
      }),
      prisma.stockMovement.create({
        data: {
          productId,
          type,
          quantity: type === "ADJUST" ? afterQty - beforeQty : qty,
          beforeQty,
          afterQty,
          reference,
          note,
          cost: cost ? parseFloat(cost) : null,
          createdBy: session.user.id,
        },
      }),
    ]);

    return NextResponse.json({
      product: updatedProduct,
      movement,
    });
  } catch (error) {
    console.error("Error updating stock:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - ลบสินค้า (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; productId: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, productId } = await params;

    // ตรวจสอบสิทธิ์
    const membership = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: session.user.id },
    });

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await prisma.product.update({
      where: { id: productId },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
