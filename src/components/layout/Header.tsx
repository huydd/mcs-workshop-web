// components/layout/Header.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, Bell, UserCircle, LogOut } from "lucide-react";
import { useResponsive } from "./ResponsiveContainer";
import { Button } from "@/components/ui/Button";
import { MobileSidebar } from "./MobileSidebar";
import { useAuth } from "@/context/auth-context";
import { USER_ROLE_LABELS } from "@/types";
import { useWorkflow } from "@/context/workflow-context";

export const Header = () => {
  const { mobile, tablet } = useResponsive();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { user, logout } = useAuth();
  const { getNotificationsForUser, markNotificationsAsRead } = useWorkflow();

  const roleLabel = user ? USER_ROLE_LABELS[user.role] : null;
  const notifications = useMemo(
    () => (user ? getNotificationsForUser(user.id) : []),
    [user, getNotificationsForUser]
  );
  const unreadCount = notifications.filter((item) => !item.read).length;

  useEffect(() => {
    if (!user) {
      setShowNotifications(false);
    }
  }, [user]);

  const toggleNotifications = () => {
    if (!user) return;
    setShowNotifications((prev) => {
      const next = !prev;
      if (!prev) {
        markNotificationsAsRead(user.id);
      }
      return next;
    });
  };

  const formatDateTime = (iso: string) =>
    new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm text-secondary shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-4">
            {(mobile || tablet) && (
              <Button
                variant="ghost"
                size="sm"
                className="text-secondary hover:bg-secondary/10 p-1.5"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-4 w-4" />
              </Button>
            )}
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="https://minhcuongsteel.com/wp-content/uploads/2023/10/Group.svg"
                alt="Minh Cường Steel"
                width={mobile ? 80 : 120}
                height={mobile ? 28 : 40}
                priority
              />
              <div className="hidden sm:flex flex-col leading-tight">
                <span className="text-sm font-semibold tracking-wide text-secondary">
                  Minh Cường Steel
                </span>
                <span className="text-xs text-secondary/70">
                  Production System
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="text-secondary hover:bg-secondary/10 p-1.5"
                onClick={toggleNotifications}
                disabled={!user}
              >
                <Bell className="h-4 w-4" />
                {!mobile && <span className="ml-1.5 text-sm">Thông báo</span>}
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary text-white text-xs font-semibold px-1">
                    {unreadCount}
                  </span>
                )}
              </Button>
              {showNotifications && user && (
                <div className="absolute right-0 mt-2 w-72 rounded-lg border border-gray-200 bg-white shadow-lg z-50">
                  <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
                    <span className="text-sm font-semibold text-secondary">
                      Thông báo
                    </span>
                    <span className="text-xs text-secondary/60">
                      {notifications.length} mục
                    </span>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="px-3 py-4 text-xs text-secondary/60">
                        Hiện chưa có thông báo.
                      </p>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className="px-3 py-2 border-b border-gray-100 last:border-b-0"
                        >
                          <p className="text-sm font-medium text-secondary">
                            {notification.stageTitle}
                          </p>
                          <p className="text-xs text-secondary/70 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-[11px] text-secondary/50 mt-1">
                            {formatDateTime(notification.createdAt)}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            {user && (
              <div className="hidden md:flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-lg px-2.5 py-1">
                <UserCircle className="h-5 w-5 text-primary" />
                <div className="leading-tight">
                  <p className="text-sm font-medium text-secondary">{user.name}</p>
                  <p className="text-xs text-secondary/70">{roleLabel}</p>
                </div>
              </div>
            )}
            {user && (
              <Button
                variant="ghost"
                size="sm"
                className="text-secondary hover:bg-secondary/10 p-1.5"
                onClick={logout}
              >
                <LogOut className="h-4 w-4" />
                {!mobile && <span className="ml-1.5 text-sm">Đăng xuất</span>}
              </Button>
            )}
          </div>
        </div>
      </header>

      <MobileSidebar isOpen={mobileMenuOpen} setIsOpen={setMobileMenuOpen} />
    </>
  );
};
