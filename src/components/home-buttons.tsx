"use client";

import { useState, createContext, useContext, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { LoginDialog } from "@/components/ui/login-dialog";
import {
  ArrowRight,
} from "lucide-react";

// Context สำหรับ share state ของ login dialog
const LoginDialogContext = createContext<{
  openLogin: () => void;
} | null>(null);

// Provider ที่ wrap ทั้งหน้า
export function LoginDialogProvider({ children }: { children: ReactNode }) {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <LoginDialogContext.Provider value={{ openLogin: () => setIsLoginOpen(true) }}>
      {children}
      <LoginDialog isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </LoginDialogContext.Provider>
  );
}

// Hook สำหรับเปิด dialog
function useLoginDialog() {
  const context = useContext(LoginDialogContext);
  if (!context) {
    throw new Error("useLoginDialog must be used within LoginDialogProvider");
  }
  return context;
}

export function HeroButtons() {
  const { openLogin } = useLoginDialog();

  return (
    <Button
      size="lg"
      onClick={openLogin}
      className="h-14 px-10 rounded-full text-lg bg-red-500 hover:bg-red-600 shadow-lg shadow-red-600/25 transition-all hover:scale-105"
    >
      เริ่มต้นใช้งานฟรี <ArrowRight className="ml-2 h-5 w-5" />
    </Button>
  );
}

export function HeaderButtons() {
  const { openLogin } = useLoginDialog();

  return (
    <>
      <Button 
        variant="ghost" 
        onClick={openLogin}
        className="font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/50"
      >
        เข้าสู่ระบบ
      </Button>
      <Button 
        onClick={openLogin}
        className="hidden sm:inline-flex bg-red-500 hover:bg-red-600 shadow-sm"
      >
        เริ่มต้นใช้งาน
      </Button>
    </>
  );
}
