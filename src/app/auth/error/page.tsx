"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorMessages: Record<string, string> = {
    Configuration: "มีปัญหาในการตั้งค่าระบบ กรุณาติดต่อผู้ดูแลระบบ",
    AccessDenied: "คุณไม่มีสิทธิ์เข้าถึงระบบ",
    Verification: "ลิงก์ยืนยันหมดอายุหรือถูกใช้งานแล้ว",
    Default: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง",
  };

  const message = error ? errorMessages[error] || errorMessages.Default : errorMessages.Default;

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-destructive">เกิดข้อผิดพลาด</CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      <CardContent>
        <Link href="/auth/signin">
          <Button className="w-full">กลับไปหน้าเข้าสู่ระบบ</Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <Suspense fallback={<div>Loading...</div>}>
        <AuthErrorContent />
      </Suspense>
    </div>
  );
}
