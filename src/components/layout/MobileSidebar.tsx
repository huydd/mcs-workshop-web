// components/layout/MobileSidebar.tsx
"use client";

import { useState } from "react";
import { X, LayoutDashboard, Factory, BarChart3, Users, Archive, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useResponsive } from "./ResponsiveContainer";

const navigationItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Ghi nhận công đoạn", href: "/production", icon: Factory },
  { name: "Báo cáo", href: "/reports", icon: BarChart3 },
  { name: "Nhân viên", href: "/users", icon: Users },
  { name: "Kho vật tư", href: "/warehouse", icon: Archive },
  { name: "Cài đặt", href: "/settings", icon: Settings },
];

interface MobileSidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const MobileSidebar = ({ isOpen, setIsOpen }: MobileSidebarProps) => {
  const pathname = usePathname();
  const { mobile, tablet } = useResponsive();

  if (!mobile && !tablet) return null;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed left-0 top-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 z-50
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#1B5E20] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">FO</span>
            </div>
            <h2 className="font-bold text-lg">FactoryOps</h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#1B5E20] text-white"
                    : "text-[#616161] hover:bg-gray-100"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
};