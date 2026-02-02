"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Info,
  Trash2,
  X,
} from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "danger" | "warning" | "info" | "success";
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantStyles = {
  default: {
    iconBg: "bg-slate-100 dark:bg-slate-800",
    iconColor: "text-slate-600 dark:text-slate-400",
    confirmBtn: "bg-primary hover:bg-primary/90",
    icon: HelpCircle,
  },
  danger: {
    iconBg: "bg-red-100 dark:bg-red-900/30",
    iconColor: "text-red-600 dark:text-red-400",
    confirmBtn: "bg-red-600 hover:bg-red-700",
    icon: Trash2,
  },
  warning: {
    iconBg: "bg-amber-100 dark:bg-amber-900/30",
    iconColor: "text-amber-600 dark:text-amber-400",
    confirmBtn: "bg-amber-600 hover:bg-amber-700",
    icon: AlertTriangle,
  },
  info: {
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
    confirmBtn: "bg-blue-600 hover:bg-blue-700",
    icon: Info,
  },
  success: {
    iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    confirmBtn: "bg-emerald-600 hover:bg-emerald-700",
    icon: CheckCircle2,
  },
};

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "ยืนยัน",
  cancelText = "ยกเลิก",
  variant = "default",
  loading = false,
  icon,
}: ConfirmDialogProps) {
  const styles = variantStyles[variant];
  const IconComponent = styles.icon;

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-200"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 fade-in-0 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="h-4 w-4 text-slate-500" />
        </button>

        {/* Content */}
        <div className="p-6 text-center">
          {/* Icon */}
          <div
            className={cn(
              "mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4",
              styles.iconBg
            )}
          >
            {icon || <IconComponent className={cn("h-8 w-8", styles.iconColor)} />}
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            {title}
          </h3>

          {/* Message */}
          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 pt-0">
          <Button
            variant="outline"
            className="flex-1 h-11"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            className={cn("flex-1 h-11 text-white", styles.confirmBtn)}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                กำลังดำเนินการ...
              </span>
            ) : (
              confirmText
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Hook for easy usage
export function useConfirm() {
  const [state, setState] = React.useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: ConfirmDialogProps["variant"];
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    variant: "default",
    onConfirm: () => {},
  });

  const confirm = React.useCallback(
    (options: {
      title: string;
      message: string;
      variant?: ConfirmDialogProps["variant"];
    }): Promise<boolean> => {
      return new Promise((resolve) => {
        setState({
          isOpen: true,
          title: options.title,
          message: options.message,
          variant: options.variant || "default",
          onConfirm: () => {
            setState((prev) => ({ ...prev, isOpen: false }));
            resolve(true);
          },
        });
      });
    },
    []
  );

  const close = React.useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const ConfirmDialogComponent = React.useCallback(
    () => (
      <ConfirmDialog
        isOpen={state.isOpen}
        onClose={close}
        onConfirm={state.onConfirm}
        title={state.title}
        message={state.message}
        variant={state.variant}
      />
    ),
    [state, close]
  );

  return { confirm, ConfirmDialogComponent };
}

// Delete confirmation shortcut
export function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  loading = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  loading?: boolean;
}) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="ยืนยันการลบ"
      message={`คุณแน่ใจหรือไม่ที่จะลบ "${itemName}"? การดำเนินการนี้ไม่สามารถยกเลิกได้`}
      confirmText="ลบ"
      cancelText="ยกเลิก"
      variant="danger"
      loading={loading}
    />
  );
}
