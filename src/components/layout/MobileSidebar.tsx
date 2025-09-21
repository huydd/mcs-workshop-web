// components/layout/MobileSidebar.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { X, LayoutDashboard, Factory, BarChart3, Users, Archive, Settings, GitBranch, LogOut, UserCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useResponsive } from "./ResponsiveContainer";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/Button";

const navigationItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Luồng BOM", href: "/project", icon: GitBranch },
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
  const { user, logout, getRoleLabel } = useAuth();

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
        fixed left-0 top-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 z-50 flex flex-col
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="relative w-24 h-10">
              <Image
                src="https://minhcuongsteel.com/wp-content/uploads/2023/10/Group.svg"
                alt="Minh Cường Steel"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div>
              <h2 className="font-bold text-lg text-secondary">Minh Cường Steel</h2>
              {user && (
                <p className="text-xs text-secondary/70 mt-0.5">{getRoleLabel(user.role)}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4 py-3 border-b">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <UserCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-secondary">{user.name}</p>
                <p className="text-xs text-secondary/70">{user.email}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-secondary/70">Chưa đăng nhập</p>
          )}
        </div>

        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-white"
                    : "text-secondary/70 hover:bg-secondary/5"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {user && (
          <div className="p-4 border-t">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                logout();
                setIsOpen(false);
              }}
            >
              <LogOut className="h-4 w-4" />
              <span className="ml-2">Đăng xuất</span>
            </Button>
          </div>
        )}
      </aside>
    </>
  );
};
