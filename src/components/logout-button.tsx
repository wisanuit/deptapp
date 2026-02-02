"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className="rounded-full gap-2"
      onClick={handleLogout}
    >
      <LogOut className="h-4 w-4" />
      <span className="hidden md:inline">ออกจากระบบ</span>
    </Button>
  );
}
