"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface LogoutButtonProps {
  collapsed?: boolean;
}

export function LogoutButton({ collapsed = false }: LogoutButtonProps) {
  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  if (collapsed) {
    return (
      <Button 
        variant="outline" 
        size="icon"
        className="rounded-lg text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors"
        onClick={handleLogout}
        title="ออกจากระบบ"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="rounded-lg gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors"
      onClick={handleLogout}
    >
      <LogOut className="h-4 w-4" />
      <span>ออกจากระบบ</span>
    </Button>
  );
}
