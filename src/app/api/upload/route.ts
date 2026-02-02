import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { put } from "@vercel/blob";

export const dynamic = "force-dynamic";

// POST - อัปโหลดไฟล์ไปยัง Vercel Blob
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = formData.get("folder") as string || "uploads";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // ตรวจสอบประเภทไฟล์
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not allowed. Only images and PDF are accepted." },
        { status: 400 }
      );
    }

    // ตรวจสอบขนาดไฟล์ (สูงสุด 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    // สร้างชื่อไฟล์ unique
    const timestamp = Date.now();
    const extension = file.name.split(".").pop();
    const filename = `${folder}/${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`;

    // อัปโหลดไปยัง Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: false,
    });

    return NextResponse.json({ 
      url: blob.url, 
      filename: blob.pathname 
    }, { status: 201 });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
