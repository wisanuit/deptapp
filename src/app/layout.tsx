import type { Metadata } from "next";
import { Itim } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const itim = Itim({ 
  weight: "400",
  subsets: ["thai", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Debt Management SaaS",
  description: "ระบบจัดการเจ้าหนี้ ลูกหนี้ และบัตรเครดิต",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body className={itim.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
