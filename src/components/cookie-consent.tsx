"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Cookie, X } from "lucide-react";

const COOKIE_CONSENT_KEY = "debt-manager-cookie-consent";

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Check if user has already given consent
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Small delay to prevent banner flashing on page load
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
      accepted: true,
      date: new Date().toISOString()
    }));
    setIsAnimating(true);
    setTimeout(() => setShowBanner(false), 300);
  };

  const declineCookies = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
      accepted: false,
      date: new Date().toISOString()
    }));
    setIsAnimating(true);
    setTimeout(() => setShowBanner(false), 300);
  };

  if (!showBanner) return null;

  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 z-50 p-4 transition-all duration-300 ${
        isAnimating ? "translate-y-full opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
          <div className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              {/* Icon and Text */}
              <div className="flex items-start gap-3 flex-1">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Cookie className="w-6 h-6 text-amber-600" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-gray-900">
                    🍪 เว็บไซต์นี้ใช้คุกกี้
                  </h3>
                  <p className="text-sm text-gray-600">
                    เราใช้คุกกี้เพื่อมอบประสบการณ์ที่ดีที่สุดให้คุณ คุกกี้ช่วยให้เราจดจำข้อมูลการเข้าสู่ระบบ 
                    และปรับแต่งเนื้อหาให้เหมาะกับคุณ การใช้งานเว็บไซต์ต่อไปหมายความว่าคุณยอมรับการใช้คุกกี้ของเรา
                  </p>
                  <a 
                    href="#" 
                    className="text-sm text-red-500 hover:text-red-600 hover:underline inline-flex items-center gap-1"
                  >
                    เรียนรู้เพิ่มเติม →
                  </a>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={declineCookies}
                  className="flex-1 md:flex-none text-gray-600 hover:text-gray-800"
                >
                  ปฏิเสธ
                </Button>
                <Button
                  size="sm"
                  onClick={acceptCookies}
                  className="flex-1 md:flex-none bg-red-500 hover:bg-red-600 text-white"
                >
                  ยอมรับทั้งหมด
                </Button>
              </div>

              {/* Close button for mobile */}
              <button
                onClick={declineCookies}
                className="absolute top-2 right-2 md:hidden p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Cookie types info */}
          <div className="bg-gray-50 border-t px-4 md:px-6 py-3">
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>จำเป็น</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span>การวิเคราะห์</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                <span>การทำงาน</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <span>การตลาด</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
