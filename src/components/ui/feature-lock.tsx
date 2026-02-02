"use client";

import * as React from "react";
import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Crown,
  Lock,
  Sparkles,
  Zap,
  ArrowRight,
  CheckCircle2,
  X,
} from "lucide-react";

// Feature labels in Thai
const FEATURE_LABELS: Record<string, string> = {
  WORKSPACES: "Workspace",
  CONTACTS: "ผู้ติดต่อ",
  LOANS: "สัญญาเงินกู้",
  CREDIT_CARDS: "บัตรเครดิต",
  INSTALLMENT_PLANS: "แผนผ่อนชำระ",
  PRODUCTS: "สินค้า",
  STORAGE_MB: "พื้นที่เก็บข้อมูล",
  TEAM_MEMBERS: "สมาชิกทีม",
};

// Plan benefits
const PLAN_BENEFITS: Record<string, string[]> = {
  PRO: [
    "สร้าง Workspace ได้ 3 รายการ",
    "ผู้ติดต่อไม่จำกัด",
    "สัญญาเงินกู้ไม่จำกัด",
    "บัตรเครดิต 10 ใบ",
    "แผนผ่อนชำระ 50 แผน",
    "พื้นที่ 1 GB",
    "สมาชิกทีม 5 คน",
  ],
  BUSINESS: [
    "ทุกอย่างไม่จำกัด",
    "Workspace ไม่จำกัด",
    "พื้นที่ 10 GB",
    "สมาชิกทีมไม่จำกัด",
    "รายงานขั้นสูง",
    "API Access",
    "Priority Support",
  ],
};

export interface UsageData {
  allowed: boolean;
  currentUsage: number;
  limit: number;
  remaining: number;
}

// Context for subscription data
interface SubscriptionContextType {
  planName: string;
  checkLimit: (feature: string) => Promise<UsageData>;
  isLoading: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [planName, setPlanName] = useState<string>("FREE");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const res = await fetch("/api/subscription");
        if (res.ok) {
          const data = await res.json();
          setPlanName(data.subscription?.plan?.name || "FREE");
        }
      } catch (error) {
        console.error("Error fetching subscription:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSubscription();
  }, []);

  const checkLimit = useCallback(async (feature: string): Promise<UsageData> => {
    try {
      const res = await fetch(`/api/subscription/check-limit?feature=${feature}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (error) {
      console.error("Error checking limit:", error);
    }
    return { allowed: true, currentUsage: 0, limit: -1, remaining: -1 };
  }, []);

  return (
    <SubscriptionContext.Provider value={{ planName, checkLimit, isLoading }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    // Return default values if no provider
    return {
      planName: "FREE",
      checkLimit: async () => ({ allowed: true, currentUsage: 0, limit: -1, remaining: -1 }),
      isLoading: false,
    };
  }
  return context;
}

// Feature Lock Modal
interface FeatureLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  currentUsage?: number;
  limit?: number;
}

interface PlanData {
  id: string;
  name: string;
  displayName: string;
  price: number;
  yearlyPrice: number | null;
  limits: Record<string, number>;
}

export function FeatureLockModal({
  isOpen,
  onClose,
  feature,
  currentUsage = 0,
  limit = 0,
}: FeatureLockModalProps) {
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // ดึงข้อมูลแผนจาก API
      const fetchPlans = async () => {
        try {
          const res = await fetch("/api/subscription");
          if (res.ok) {
            const data = await res.json();
            setPlans(data.plans || []);
          }
        } catch (error) {
          console.error("Error fetching plans:", error);
        } finally {
          setLoadingPlans(false);
        }
      };
      fetchPlans();
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const proPlan = plans.find(p => p.name === "PRO");
  const businessPlan = plans.find(p => p.name === "BUSINESS");

  // Format price with Thai Baht
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("th-TH").format(price);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in zoom-in-95 fade-in-0 duration-300">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-10"
        >
          <X className="h-5 w-5 text-slate-500" />
        </button>

        {/* Gradient Header */}
        <div className="relative bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 p-8 text-center">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjEiPjxjaXJjbGUgY3g9IjMwIiBjeT0iMzAiIHI9IjMwIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
          
          <div className="relative">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full backdrop-blur-sm mb-4">
              <Lock className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">ถึงขีดจำกัดแล้ว</h2>
            <p className="text-white/90 text-sm">
              คุณใช้งาน {FEATURE_LABELS[feature] || feature} ครบ {currentUsage}/{limit} รายการแล้ว
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Upgrade message */}
          <div className="text-center mb-6">
            <p className="text-slate-600 dark:text-slate-400">
              อัพเกรดเพื่อปลดล็อคขีดจำกัดและใช้งานได้เต็มประสิทธิภาพ
            </p>
          </div>

          {/* Plan comparison */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* PRO */}
            <div className="border border-blue-200 dark:border-blue-800 rounded-xl p-4 bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/30 dark:to-slate-900">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-5 w-5 text-blue-500" />
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {proPlan?.displayName || "PRO"}
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                {loadingPlans ? (
                  <span className="inline-block w-16 h-7 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                ) : (
                  <>฿{formatPrice(proPlan?.price || 299)}<span className="text-sm font-normal text-slate-500">/เดือน</span></>
                )}
              </div>
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                {PLAN_BENEFITS.PRO.slice(0, 4).map((benefit, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            {/* BUSINESS */}
            <div className="border-2 border-amber-400 dark:border-amber-500 rounded-xl p-4 bg-gradient-to-b from-amber-50 to-white dark:from-amber-950/30 dark:to-slate-900 relative">
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                <span className="bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  แนะนำ
                </span>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <Crown className="h-5 w-5 text-amber-500" />
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {businessPlan?.displayName || "BUSINESS"}
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                {loadingPlans ? (
                  <span className="inline-block w-16 h-7 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                ) : (
                  <>฿{formatPrice(businessPlan?.price || 899)}<span className="text-sm font-normal text-slate-500">/เดือน</span></>
                )}
              </div>
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                {PLAN_BENEFITS.BUSINESS.slice(0, 4).map((benefit, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* CTA */}
          <Link href="/subscription">
            <Button className="w-full h-12 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 hover:from-amber-500 hover:via-orange-600 hover:to-red-600 text-white font-semibold text-base shadow-lg shadow-orange-500/25">
              <Sparkles className="h-5 w-5 mr-2" />
              ดูแผนทั้งหมด
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>

          <p className="text-center text-xs text-slate-500 dark:text-slate-500 mt-4">
            ยกเลิกได้ทุกเมื่อ • ไม่มีค่าธรรมเนียมซ่อนเร้น
          </p>
        </div>
      </div>
    </div>
  );
}

// Feature Lock Wrapper - wraps content that should be locked
interface FeatureLockProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureLock({ feature, children, fallback }: FeatureLockProps) {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLimit = async () => {
      try {
        const res = await fetch(`/api/subscription/check-limit?feature=${feature}`);
        if (res.ok) {
          const data = await res.json();
          setUsage(data);
        }
      } catch (error) {
        console.error("Error checking limit:", error);
      } finally {
        setLoading(false);
      }
    };
    checkLimit();
  }, [feature]);

  if (loading) {
    return <>{children}</>;
  }

  if (usage && !usage.allowed) {
    return (
      <>
        {fallback || (
          <div
            className="relative cursor-pointer group"
            onClick={() => setShowModal(true)}
          >
            {/* Locked overlay */}
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] rounded-lg z-10 flex items-center justify-center transition-all group-hover:bg-slate-900/70">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-500/20 rounded-full mb-2">
                  <Lock className="h-6 w-6 text-amber-400" />
                </div>
                <p className="text-white text-sm font-medium">คลิกเพื่ออัพเกรด</p>
              </div>
            </div>
            {/* Blurred content */}
            <div className="opacity-50 blur-[1px] pointer-events-none">
              {children}
            </div>
          </div>
        )}
        <FeatureLockModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          feature={feature}
          currentUsage={usage.currentUsage}
          limit={usage.limit}
        />
      </>
    );
  }

  return <>{children}</>;
}

// Create Button with Limit Check
interface CreateButtonWithLimitProps {
  feature: string;
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function CreateButtonWithLimit({
  feature,
  href,
  children,
  className,
}: CreateButtonWithLimitProps) {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const checkLimit = async () => {
      try {
        const res = await fetch(`/api/subscription/check-limit?feature=${feature}`);
        if (res.ok) {
          setUsage(await res.json());
        }
      } catch (error) {
        console.error("Error checking limit:", error);
      }
    };
    checkLimit();
  }, [feature]);

  const handleClick = (e: React.MouseEvent) => {
    if (usage && !usage.allowed) {
      e.preventDefault();
      setShowModal(true);
    }
  };

  return (
    <>
      <Link href={href} onClick={handleClick}>
        <Button className={className}>
          {usage && !usage.allowed && <Lock className="h-4 w-4 mr-2" />}
          {children}
        </Button>
      </Link>
      {usage && (
        <FeatureLockModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          feature={feature}
          currentUsage={usage.currentUsage}
          limit={usage.limit}
        />
      )}
    </>
  );
}

// Inline Upgrade Prompt (for showing in forms/pages)
export function UpgradePrompt({
  feature,
  compact = false,
}: {
  feature: string;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="flex items-center gap-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
        <div className="flex-shrink-0">
          <Crown className="h-5 w-5 text-amber-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            อัพเกรดเพื่อเพิ่มขีดจำกัด{FEATURE_LABELS[feature] || feature}
          </p>
        </div>
        <Link href="/subscription">
          <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white">
            อัพเกรด
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-amber-950/30 dark:via-orange-950/30 dark:to-red-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-6 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full mb-4">
        <Crown className="h-8 w-8 text-white" />
      </div>
      <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100 mb-2">
        ปลดล็อคความสามารถเพิ่มเติม
      </h3>
      <p className="text-sm text-amber-700 dark:text-amber-300 mb-4">
        อัพเกรดเพื่อเพิ่มขีดจำกัด{FEATURE_LABELS[feature] || feature}และฟีเจอร์อื่นๆ
      </p>
      <Link href="/subscription">
        <Button className="bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white">
          <Sparkles className="h-4 w-4 mr-2" />
          ดูแผนทั้งหมด
        </Button>
      </Link>
    </div>
  );
}
