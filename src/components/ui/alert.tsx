import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";

const alertVariants = cva(
  "relative w-full rounded-xl border p-4 shadow-sm transition-all duration-300 animate-in fade-in-0 slide-in-from-top-2",
  {
    variants: {
      variant: {
        default:
          "bg-white border-gray-200 text-gray-900 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-100",
        success:
          "bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200 text-emerald-900 dark:from-emerald-950/50 dark:to-green-950/50 dark:border-emerald-800 dark:text-emerald-100",
        destructive:
          "bg-gradient-to-r from-red-50 to-rose-50 border-red-200 text-red-900 dark:from-red-950/50 dark:to-rose-950/50 dark:border-red-800 dark:text-red-100",
        warning:
          "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 text-amber-900 dark:from-amber-950/50 dark:to-yellow-950/50 dark:border-amber-800 dark:text-amber-100",
        info:
          "bg-gradient-to-r from-blue-50 to-sky-50 border-blue-200 text-blue-900 dark:from-blue-950/50 dark:to-sky-950/50 dark:border-blue-800 dark:text-blue-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const iconMap = {
  default: Info,
  success: CheckCircle2,
  destructive: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const iconColorMap = {
  default: "text-gray-500",
  success: "text-emerald-500",
  destructive: "text-red-500",
  warning: "text-amber-500",
  info: "text-blue-500",
};

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  onClose?: () => void;
  showIcon?: boolean;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", onClose, showIcon = true, children, ...props }, ref) => {
    const IconComponent = iconMap[variant || "default"];
    const iconColor = iconColorMap[variant || "default"];

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        <div className="flex items-start gap-3">
          {showIcon && (
            <div className={cn("flex-shrink-0 mt-0.5", iconColor)}>
              <IconComponent className="h-5 w-5" />
            </div>
          )}
          <div className="flex-1 min-w-0">{children}</div>
          {onClose && (
            <button
              onClick={onClose}
              className={cn(
                "flex-shrink-0 p-1 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/10",
                iconColor
              )}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">ปิด</span>
            </button>
          )}
        </div>
      </div>
    );
  }
);
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("font-semibold leading-tight tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("mt-1 text-sm opacity-90 leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

// Convenience components for common use cases
interface SimpleAlertProps extends Omit<AlertProps, "children"> {
  title?: string;
  message: string;
}

export const SuccessAlert = React.forwardRef<HTMLDivElement, SimpleAlertProps>(
  ({ title, message, ...props }, ref) => (
    <Alert ref={ref} variant="success" {...props}>
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
);
SuccessAlert.displayName = "SuccessAlert";

export const ErrorAlert = React.forwardRef<HTMLDivElement, SimpleAlertProps>(
  ({ title = "เกิดข้อผิดพลาด", message, ...props }, ref) => (
    <Alert ref={ref} variant="destructive" {...props}>
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
);
ErrorAlert.displayName = "ErrorAlert";

export const WarningAlert = React.forwardRef<HTMLDivElement, SimpleAlertProps>(
  ({ title = "คำเตือน", message, ...props }, ref) => (
    <Alert ref={ref} variant="warning" {...props}>
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
);
WarningAlert.displayName = "WarningAlert";

export const InfoAlert = React.forwardRef<HTMLDivElement, SimpleAlertProps>(
  ({ title, message, ...props }, ref) => (
    <Alert ref={ref} variant="info" {...props}>
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
);
InfoAlert.displayName = "InfoAlert";

export { Alert, AlertTitle, AlertDescription };
