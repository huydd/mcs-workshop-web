// components/layout/Sidebar.tsx
"use client";

import {
  LayoutDashboard,
  Factory,
  BarChart3,
  Users,
  Archive,
  Settings,
} from "lucide-react";
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

export const Sidebar = () => {
  const pathname = usePathname();
  const { desktop } = useResponsive();

  if (!desktop) return null;

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white shadow-sm border-r border-gray-200 overflow-y-auto">
      <nav className="p-4 space-y-2">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
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
  );
};