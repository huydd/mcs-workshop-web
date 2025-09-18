import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthProvider } from "@/context/auth-context";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Minh Cường Steel - Hệ thống điều hành sản xuất",
  description: "Nền tảng theo dõi và điều hành sản xuất cho Minh Cường Steel",
  keywords: "minh cuong steel, sản xuất, quản trị xưởng, kết cấu thép, vietnam",
  authors: [{ name: "Minh Cường Steel" }],
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
        <meta name="theme-color" content="#F37021" />
        <link rel="icon" href="https://minhcuongsteel.com/wp-content/uploads/2023/10/Group.png" />
        <link rel="apple-touch-icon" href="https://minhcuongsteel.com/wp-content/uploads/2023/10/Group.png" />
        {/* Loại bỏ manifest.json link để tránh lỗi 404 */}
      </head>
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          <AppLayout>{children}</AppLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
