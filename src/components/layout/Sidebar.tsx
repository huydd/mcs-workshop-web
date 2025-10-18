// components/layout/Sidebar.tsx
'use client';

import {
  LayoutDashboard,
  Factory,
  BarChart3,
  Users,
  Archive,
  Settings,
  GitBranch,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useResponsive } from './ResponsiveContainer';
import { cn } from '@/lib/utils';

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    description: 'Tổng quan hệ thống',
  },
  {
    name: 'Quản lý BOM',
    href: '/project/technical',
    icon: GitBranch,
    description: 'Chia BOM',
  },
  {
    name: 'Quản lý xưởng',
    href: '/workshop',
    icon: Factory,
    description: 'Kéo việc & Task xưởng',
    subItems: [
      { name: 'Kéo việc (Pull Board)', href: '/workshop/pull-board' },
      { name: 'Dashboard Xưởng', href: '/workshop' },
      { name: 'Demo Xưởng', href: '/workshop/demo' },
    ],
  },
  {
    name: 'Báo cáo',
    href: '/reports',
    icon: BarChart3,
    description: 'Thống kê và phân tích',
  },
  {
    name: 'Nhân viên',
    href: '/users',
    icon: Users,
    description: 'Quản lý tài khoản',
  },
  {
    name: 'Kho vật tư',
    href: '/warehouse',
    icon: Archive,
    description: 'Quản lý tồn kho',
  },
  {
    name: 'Cài đặt',
    href: '/settings',
    icon: Settings,
    description: 'Thiết lập hệ thống',
  },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const { desktop } = useResponsive();

  if (!desktop) return null;

  return (
    <aside className="fixed left-0 top-[100px] h-[calc(100vh-100px)] w-64 bg-white/95 backdrop-blur-sm shadow-lg border-r border-gray-200/50 overflow-hidden z-40 flex flex-col">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-200/50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full"></div>
          <span className="text-sm font-semibold text-secondary">
            Điều hành sản xuất
          </span>
        </div>
        <p className="text-xs text-secondary/60 mt-1">Hệ thống quản lý MCS</p>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1 overflow-y-auto flex-1">
        {navigationItems.map(item => {
          const isActive =
            pathname === item.href ||
            (item.subItems && item.subItems.some(sub => pathname === sub.href));
          const isSubActive =
            item.subItems && item.subItems.some(sub => pathname === sub.href);

          return (
            <div key={item.href} className="space-y-1">
              <Link
                href={item.href}
                className={cn(
                  'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative',
                  isActive
                    ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                    : 'text-secondary/70 hover:bg-gray-50 hover:text-secondary',
                )}
              >
                <item.icon
                  className={cn(
                    'h-5 w-5 transition-colors',
                    isActive
                      ? 'text-primary'
                      : 'text-secondary/50 group-hover:text-secondary',
                  )}
                />
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-secondary/50 group-hover:text-secondary/70">
                    {item.description}
                  </div>
                </div>
                {item.subItems && (
                  <ChevronRight
                    className={cn(
                      'h-4 w-4 transition-transform',
                      isSubActive
                        ? 'rotate-90 text-primary'
                        : 'text-secondary/30',
                    )}
                  />
                )}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full"></div>
                )}
              </Link>

              {/* Sub Items */}
              {item.subItems && isSubActive && (
                <div className="ml-8 space-y-1 animate-in slide-in-from-left-2 duration-200">
                  {item.subItems.map(subItem => {
                    const isSubItemActive = pathname === subItem.href;
                    return (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        className={cn(
                          'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors relative',
                          isSubItemActive
                            ? 'bg-primary/5 text-primary font-medium'
                            : 'text-secondary/60 hover:bg-gray-50 hover:text-secondary',
                        )}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-current opacity-50"></div>
                        {subItem.name}
                        {isSubItemActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-primary rounded-r-full"></div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-gray-200/50 bg-white/95 backdrop-blur-sm flex-shrink-0">
        <div className="text-xs text-secondary/50 text-center">
          <div className="flex items-center justify-center gap-1">
            <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
            <span>System Online</span>
          </div>
          <div className="mt-1">v2.0.1 • MCS Production</div>
        </div>
      </div>
    </aside>
  );
};
