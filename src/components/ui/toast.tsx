"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";

export interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

const iconMap = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const styleMap = {
  success: "bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-300 text-emerald-900 dark:from-emerald-950 dark:to-green-950 dark:border-emerald-700 dark:text-emerald-100",
  error: "bg-gradient-to-r from-red-50 to-rose-50 border-red-300 text-red-900 dark:from-red-950 dark:to-rose-950 dark:border-red-700 dark:text-red-100",
  warning: "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-300 text-amber-900 dark:from-amber-950 dark:to-yellow-950 dark:border-amber-700 dark:text-amber-100",
  info: "bg-gradient-to-r from-blue-50 to-sky-50 border-blue-300 text-blue-900 dark:from-blue-950 dark:to-sky-950 dark:border-blue-700 dark:text-blue-100",
};

const iconColorMap = {
  success: "text-emerald-500",
  error: "text-red-500",
  warning: "text-amber-500",
  info: "text-blue-500",
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const IconComponent = iconMap[toast.type];

  React.useEffect(() => {
    const timer = setTimeout(() => {
      onRemove();
    }, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast.duration, onRemove]);

  return (
    <div
      className={cn(
        "relative flex items-start gap-3 w-full max-w-sm p-4 rounded-xl border shadow-lg",
        "animate-in slide-in-from-right-full fade-in-0 duration-300",
        styleMap[toast.type]
      )}
      role="alert"
    >
      <div className={cn("flex-shrink-0 mt-0.5", iconColorMap[toast.type])}>
        <IconComponent className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="font-semibold text-sm">{toast.title}</p>
        )}
        <p className={cn("text-sm", toast.title && "mt-1 opacity-90")}>
          {toast.message}
        </p>
      </div>
      <button
        onClick={onRemove}
        className="flex-shrink-0 p-1 rounded-lg transition-colors hover:bg-black/10 dark:hover:bg-white/10"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">ปิด</span>
      </button>
      
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-xl overflow-hidden">
        <div 
          className={cn(
            "h-full origin-left animate-shrink",
            toast.type === "success" && "bg-emerald-400",
            toast.type === "error" && "bg-red-400",
            toast.type === "warning" && "bg-amber-400",
            toast.type === "info" && "bg-blue-400"
          )}
          style={{
            animationDuration: `${toast.duration || 4000}ms`,
          }}
        />
      </div>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = React.useCallback(
    (message: string, title?: string) => addToast({ type: "success", message, title }),
    [addToast]
  );

  const error = React.useCallback(
    (message: string, title?: string) => addToast({ type: "error", message, title: title || "เกิดข้อผิดพลาด" }),
    [addToast]
  );

  const warning = React.useCallback(
    (message: string, title?: string) => addToast({ type: "warning", message, title: title || "คำเตือน" }),
    [addToast]
  );

  const info = React.useCallback(
    (message: string, title?: string) => addToast({ type: "info", message, title }),
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-3">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onRemove={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
