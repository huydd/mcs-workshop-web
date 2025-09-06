import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppLayout } from "@/components/layout/AppLayout";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "FactoryOps - Quản lý sản xuất kết cấu thép",
  description: "Hệ thống quản lý sản xuất kết cấu thép tại xưởng",
  keywords: "factory, steel, production, management, vietnam",
  authors: [{ name: "FactoryOps Team" }],
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={inter.variable}>
      <head>
        <meta name="theme-color" content="#1B5E20" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        {/* Loại bỏ manifest.json link để tránh lỗi 404 */}
      </head>
      <body className={`${inter.className} antialiased`}>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
