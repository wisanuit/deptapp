"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Crown, Zap, ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface UsageData {
  allowed: boolean;
  currentUsage: number;
  limit: number;
  remaining: number;
}

interface UsageBadgeProps {
  feature: string;
  showUpgradeLink?: boolean;
}

const FEATURE_LABELS: Record<string, string> = {
  WORKSPACES: "Workspaces",
  CONTACTS: "ผู้ติดต่อ",
  LOANS: "สัญญาเงินกู้",
  CREDIT_CARDS: "บัตรเครดิต",
  INSTALLMENT_PLANS: "แผนผ่อนชำระ",
  PRODUCTS: "สินค้า",
  STORAGE_MB: "พื้นที่เก็บข้อมูล",
  TEAM_MEMBERS: "สมาชิกทีม",
};

export function UsageBadge({ feature, showUpgradeLink = true }: UsageBadgeProps) {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsage();
  }, [feature]);

  const fetchUsage = async () => {
    try {
      const res = await fetch(`/api/subscription/check-limit?feature=${feature}`);
      if (res.ok) {
        const data = await res.json();
        setUsage(data);
      }
    } catch (error) {
      console.error("Error fetching usage:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !usage) {
    return null;
  }

  const isUnlimited = usage.limit === -1;
  const percentage = isUnlimited ? 0 : Math.round((usage.currentUsage / usage.limit) * 100);
  const isNearLimit = !isUnlimited && percentage >= 80;
  const isAtLimit = !isUnlimited && usage.remaining === 0;

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant="outline"
        className={`text-xs ${
          isAtLimit
            ? "bg-red-50 text-red-700 border-red-200"
            : isNearLimit
            ? "bg-amber-50 text-amber-700 border-amber-200"
            : "bg-slate-50 text-slate-600 border-slate-200"
        }`}
      >
        {isAtLimit && <AlertTriangle className="h-3 w-3 mr-1" />}
        {isUnlimited
          ? `${usage.currentUsage} ${FEATURE_LABELS[feature] || feature}`
          : `${usage.currentUsage}/${usage.limit} ${FEATURE_LABELS[feature] || feature}`}
      </Badge>
      
      {isAtLimit && showUpgradeLink && (
        <Link href="/subscription">
          <Button size="sm" variant="outline" className="h-6 text-xs gap-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50">
            <Crown className="h-3 w-3" />
            อัพเกรด
          </Button>
        </Link>
      )}
    </div>
  );
}

// Component สำหรับแสดงก่อนสร้างรายการใหม่
export function LimitCheck({
  feature,
  children,
  onLimitReached,
}: {
  feature: string;
  children: React.ReactNode;
  onLimitReached?: () => void;
}) {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsage();
  }, [feature]);

  const fetchUsage = async () => {
    try {
      const res = await fetch(`/api/subscription/check-limit?feature=${feature}`);
      if (res.ok) {
        const data = await res.json();
        setUsage(data);
        if (!data.allowed && onLimitReached) {
          onLimitReached();
        }
      }
    } catch (error) {
      console.error("Error fetching usage:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <>{children}</>;
  }

  if (usage && !usage.allowed) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <h3 className="font-semibold text-amber-800 mb-2">
          ถึงขีดจำกัดของแผนปัจจุบันแล้ว
        </h3>
        <p className="text-sm text-amber-700 mb-4">
          คุณใช้งาน {FEATURE_LABELS[feature] || feature} ครบ {usage.limit} รายการแล้ว
          อัพเกรดแผนเพื่อเพิ่มขีดจำกัด
        </p>
        <Link href="/subscription">
          <Button className="bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white">
            <Crown className="h-4 w-4 mr-2" />
            อัพเกรดตอนนี้
          </Button>
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}

// Usage Progress Bar
export function UsageProgress({ feature }: { feature: string }) {
  const [usage, setUsage] = useState<UsageData | null>(null);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const res = await fetch(`/api/subscription/check-limit?feature=${feature}`);
        if (res.ok) {
          setUsage(await res.json());
        }
      } catch (error) {
        console.error("Error:", error);
      }
    };
    fetchUsage();
  }, [feature]);

  if (!usage) return null;

  const isUnlimited = usage.limit === -1;
  const percentage = isUnlimited ? 5 : Math.min((usage.currentUsage / usage.limit) * 100, 100);

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{FEATURE_LABELS[feature] || feature}</span>
        <span>
          {isUnlimited ? `${usage.currentUsage} (ไม่จำกัด)` : `${usage.currentUsage}/${usage.limit}`}
        </span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            percentage >= 90
              ? "bg-red-500"
              : percentage >= 70
              ? "bg-amber-500"
              : "bg-green-500"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Upgrade Prompt Card
export function UpgradePrompt() {
  return (
    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-5 w-5" />
            <span className="font-semibold">อัพเกรดแผนของคุณ</span>
          </div>
          <p className="text-sm text-indigo-100 mb-4">
            ปลดล็อคฟีเจอร์เพิ่มเติมและเพิ่มขีดจำกัดการใช้งาน
          </p>
          <Link href="/subscription">
            <Button className="bg-white text-indigo-600 hover:bg-indigo-50">
              ดูแผนทั้งหมด
              <ArrowUpRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
        <Crown className="h-16 w-16 text-indigo-200/50" />
      </div>
    </div>
  );
}
