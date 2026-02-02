"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Wallet,
  CreditCard,
  Receipt,
  Settings,
  Bell,
  Package,
  FileText,
  AlertTriangle,
  PiggyBank,
  ChevronLeft,
  ChevronRight,
  Percent,
  Menu,
  Box,
  X,
  MoreHorizontal,
  Home,
  HandCoins,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/logout-button";

interface NavItem {
  label: string;
  shortLabel?: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  group?: string;
}

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const workspaceId = params.workspaceId as string;
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: NavItem[] = [
    {
      label: "แดชบอร์ด",
      shortLabel: "หน้าหลัก",
      href: `/workspaces/${workspaceId}`,
      icon: LayoutDashboard,
      group: "หลัก",
    },
    {
      label: "การแจ้งเตือน",
      shortLabel: "แจ้งเตือน",
      href: `/workspaces/${workspaceId}/notifications`,
      icon: Bell,
      group: "หลัก",
    },
    {
      label: "ผู้ติดต่อ",
      shortLabel: "ติดต่อ",
      href: `/workspaces/${workspaceId}/contacts`,
      icon: Users,
      group: "ข้อมูลหลัก",
    },
    {
      label: "นโยบายดอกเบี้ย",
      shortLabel: "ดอกเบี้ย",
      href: `/workspaces/${workspaceId}/interest-policies`,
      icon: Percent,
      group: "ข้อมูลหลัก",
    },
    {
      label: "รายการให้กู้ยืม",
      shortLabel: "สัญญา",
      href: `/workspaces/${workspaceId}/loans`,
      icon: Wallet,
      group: "เจ้าหนี้/ลูกหนี้",
    },
    {
      label: "หนี้ที่ต้องจ่าย",
      shortLabel: "หนี้สิน",
      href: `/workspaces/${workspaceId}/debts`,
      icon: HandCoins,
      group: "เจ้าหนี้/ลูกหนี้",
    },
    {
      label: "การชำระเงิน",
      shortLabel: "ชำระเงิน",
      href: `/workspaces/${workspaceId}/payments`,
      icon: Receipt,
      group: "เจ้าหนี้/ลูกหนี้",
    },
    {
      label: "บัตรเครดิต",
      shortLabel: "บัตร",
      href: `/workspaces/${workspaceId}/credit-cards`,
      icon: CreditCard,
      group: "บัตรเครดิต",
    },
    {
      label: "ใบสมัครสินเชื่อ",
      shortLabel: "ใบสมัคร",
      href: `/workspaces/${workspaceId}/loan-applications`,
      icon: FileText,
      group: "ระบบเพิ่มเติม",
    },
    {
      label: "ผ่อนสินค้า",
      shortLabel: "ผ่อน",
      href: `/workspaces/${workspaceId}/installments`,
      icon: Package,
      group: "ระบบเพิ่มเติม",
    },
    {
      label: "สินค้า/สต๊อก",
      shortLabel: "สินค้า",
      href: `/workspaces/${workspaceId}/products`,
      icon: Box,
      group: "ระบบเพิ่มเติม",
    },
    {
      label: "ทวงหนี้",
      shortLabel: "ทวง",
      href: `/workspaces/${workspaceId}/collections`,
      icon: AlertTriangle,
      group: "ระบบเพิ่มเติม",
    },
    {
      label: "ตั้งค่า",
      shortLabel: "ตั้งค่า",
      href: `/workspaces/${workspaceId}/settings`,
      icon: Settings,
      group: "ตั้งค่า",
    },
  ];

  // Bottom nav items for mobile (5 main items)
  const bottomNavItems: NavItem[] = [
    {
      label: "หน้าหลัก",
      href: `/workspaces/${workspaceId}`,
      icon: Home,
    },
    {
      label: "สัญญา",
      href: `/workspaces/${workspaceId}/loans`,
      icon: Wallet,
    },
    {
      label: "ชำระเงิน",
      href: `/workspaces/${workspaceId}/payments`,
      icon: Receipt,
    },
    {
      label: "ติดต่อ",
      href: `/workspaces/${workspaceId}/contacts`,
      icon: Users,
    },
    {
      label: "เพิ่มเติม",
      href: "#",
      icon: MoreHorizontal,
    },
  ];

  const isActive = (href: string) => {
    if (href === `/workspaces/${workspaceId}`) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  // Check if current path is in "more" menu
  const isInMoreMenu = () => {
    const mainPaths = [
      `/workspaces/${workspaceId}`,
      `/workspaces/${workspaceId}/loans`,
      `/workspaces/${workspaceId}/payments`,
      `/workspaces/${workspaceId}/contacts`,
    ];
    return !mainPaths.some(path => 
      path === pathname || (path !== `/workspaces/${workspaceId}` && pathname.startsWith(path))
    ) && pathname !== `/workspaces/${workspaceId}`;
  };

  // Group navigation items
  const groupedNav = navItems.reduce((acc, item) => {
    const group = item.group || "อื่นๆ";
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {} as Record<string, NavItem[]>);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Desktop Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 bg-white shadow-lg transition-all duration-300 hidden md:block
          ${collapsed ? "w-16" : "w-64"}`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={`p-4 border-b flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
            {!collapsed && (
              <Link href="/dashboard" className="font-bold text-xl text-blue-600">
                DebtApp
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            {Object.entries(groupedNav).map(([group, items]) => (
              <div key={group} className="mb-4">
                {!collapsed && (
                  <p className="px-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {group}
                  </p>
                )}
                {items.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-colors
                        ${isActive(item.href)
                          ? "bg-blue-50 text-blue-600 font-medium"
                          : "text-gray-600 hover:bg-gray-50"
                        }
                        ${collapsed ? "justify-center" : ""}
                      `}
                      title={collapsed ? item.label : undefined}
                    >
                      <IconComponent className="h-5 w-5" />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className={`p-4 border-t ${collapsed ? "text-center" : ""}`}>
            {!collapsed ? (
              <div className="space-y-3">
                <p className="text-xs text-gray-400">
                  Debt Management SaaS
                </p>
                <LogoutButton />
              </div>
            ) : (
              <LogoutButton collapsed />
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Full Menu Overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl max-h-[85vh] overflow-hidden md:hidden animate-in slide-in-from-bottom duration-300">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>
            
            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3 border-b">
              <h2 className="text-lg font-bold">เมนูทั้งหมด</h2>
              <div className="flex items-center gap-2">
                <LogoutButton />
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  onClick={() => setMobileOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Menu Grid */}
            <div className="overflow-y-auto max-h-[calc(85vh-80px)] p-4">
              {Object.entries(groupedNav).map(([group, items]) => (
                <div key={group} className="mb-6">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    {group}
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {items.map((item) => {
                      const IconComponent = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-colors
                            ${isActive(item.href)
                              ? "bg-blue-50 text-blue-600"
                              : "text-gray-600 hover:bg-gray-50 active:bg-gray-100"
                            }
                          `}
                          onClick={() => setMobileOpen(false)}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            isActive(item.href) 
                              ? "bg-blue-100" 
                              : "bg-gray-100"
                          }`}>
                            <IconComponent className="h-5 w-5" />
                          </div>
                          <span className="text-[11px] font-medium text-center leading-tight">
                            {item.shortLabel || item.label}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <main
        className={`flex-1 transition-all duration-300 pb-20 md:pb-0
          ${collapsed ? "md:ml-16" : "md:ml-64"}`}
      >
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t shadow-lg md:hidden safe-area-bottom">
        <div className="flex items-center justify-around h-16">
          {bottomNavItems.map((item) => {
            const IconComponent = item.icon;
            const active = item.href === "#" ? isInMoreMenu() : isActive(item.href);
            
            if (item.href === "#") {
              return (
                <button
                  key="more"
                  onClick={() => setMobileOpen(true)}
                  className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors
                    ${active ? "text-blue-600" : "text-gray-500"}`}
                >
                  <IconComponent className="h-5 w-5" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              );
            }
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors
                  ${active 
                    ? "text-blue-600" 
                    : "text-gray-500 active:text-gray-700"
                  }`}
              >
                <div className="relative">
                  <IconComponent className="h-5 w-5" />
                  {active && (
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-600" />
                  )}
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
