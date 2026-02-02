import { prisma } from "@/lib/prisma";

// Super Admin email (ตั้งต้น)
export const SUPER_ADMIN_EMAIL = "wisanu.it@gmail.com";

// ตรวจสอบว่าเป็น Admin หรือไม่
export async function isAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true, isSuperAdmin: true, email: true },
  });

  if (!user) return false;

  // Super admin email ตั้งต้น
  if (user.email === SUPER_ADMIN_EMAIL) return true;

  return user.isAdmin || user.isSuperAdmin;
}

// ตรวจสอบว่าเป็น Super Admin หรือไม่
export async function isSuperAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSuperAdmin: true, email: true },
  });

  if (!user) return false;

  // Super admin email ตั้งต้น
  if (user.email === SUPER_ADMIN_EMAIL) return true;

  return user.isSuperAdmin;
}
