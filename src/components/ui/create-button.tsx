"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Lock } from "lucide-react";
import { FeatureLockModal } from "./feature-lock";

interface UsageData {
  allowed: boolean;
  currentUsage: number;
  limit: number;
  remaining: number;
}

interface CreateButtonProps {
  feature: string;
  href: string;
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

export function CreateButton({
  feature,
  href,
  children,
  className = "",
  variant = "default",
  size = "default",
}: CreateButtonProps) {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLimit = async () => {
      try {
        const res = await fetch(`/api/subscription/check-limit?feature=${feature}`);
        if (res.ok) {
          setUsage(await res.json());
        }
      } catch (error) {
        console.error("Error checking limit:", error);
      } finally {
        setLoading(false);
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

  const isLocked = usage && !usage.allowed;

  return (
    <>
      <Link href={href} onClick={handleClick}>
        <Button 
          className={`${className} ${isLocked ? "opacity-90" : ""}`}
          variant={variant}
          size={size}
        >
          {isLocked ? (
            <Lock className="h-4 w-4 mr-2" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
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

// Variant without the Plus icon (for customization)
export function LimitedLink({
  feature,
  href,
  children,
  className = "",
}: {
  feature: string;
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
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
      <Link href={href} onClick={handleClick} className={className}>
        {children}
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
