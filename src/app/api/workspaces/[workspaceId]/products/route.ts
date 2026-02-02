import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET - ดึงรายการสินค้าทั้งหมด
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId } = await params;

    // ตรวจสอบสิทธิ์
    const membership = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: session.user.id },
    });

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";

    const where: any = { 
      workspaceId,
      isActive: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category) {
      where.category = category;
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { name: "asc" },
    });

    // ดึงหมวดหมู่ทั้งหมด
    const categories = await prisma.product.findMany({
      where: { workspaceId, isActive: true },
      select: { category: true },
      distinct: ["category"],
    });

    return NextResponse.json({ 
      products,
      categories: categories.map((c: { category: string | null }) => c.category).filter(Boolean)
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - สร้างสินค้าใหม่
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId } = await params;
    const body = await request.json();

    // ตรวจสอบสิทธิ์
    const membership = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: session.user.id },
    });

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (!body.name) {
      return NextResponse.json({ error: "กรุณาระบุชื่อสินค้า" }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        workspaceId,
        name: body.name,
        description: body.description,
        imageUrl: body.imageUrl,
        price: body.price ? parseFloat(body.price) : null,
        cost: body.cost ? parseFloat(body.cost) : null,
        category: body.category,
        sku: body.sku,
        barcode: body.barcode,
        unit: body.unit,
        stockQty: body.stockQty ? parseInt(body.stockQty) : 0,
        minStock: body.minStock ? parseInt(body.minStock) : 0,
        maxStock: body.maxStock ? parseInt(body.maxStock) : null,
      },
    });

    // ถ้ามี stockQty เริ่มต้น ให้สร้าง StockMovement
    if (body.stockQty && parseInt(body.stockQty) > 0) {
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          type: "IN",
          quantity: parseInt(body.stockQty),
          beforeQty: 0,
          afterQty: parseInt(body.stockQty),
          note: "สต๊อกเริ่มต้น",
          cost: body.cost ? parseFloat(body.cost) : null,
          createdBy: session.user.id,
        },
      });
    }

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
