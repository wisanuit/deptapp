"use client";

import { ReactNode } from "react";
import { LoginDialogProvider, HeroButtons, HeaderButtons, PricingButton } from "@/components/home-buttons";
import { CookieConsent } from "@/components/cookie-consent";

export function HomeClientWrapper({ children }: { children: ReactNode }) {
  return (
    <LoginDialogProvider>
      {children}
      <CookieConsent />
    </LoginDialogProvider>
  );
}

export { HeroButtons, HeaderButtons, PricingButton };
