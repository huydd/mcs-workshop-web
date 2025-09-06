// components/layout/Header.tsx
"use client";

import { useState } from "react";
import { Menu, Bell, User } from "lucide-react";
import { useResponsive } from "./ResponsiveContainer";
import { Button } from "@/components/ui/Button";
import { MobileSidebar } from "./MobileSidebar";

export const Header = () => {
  const { mobile, tablet } = useResponsive();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="bg-[#263238] text-white shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            {(mobile || tablet) && (
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-gray-700"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#1B5E20] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">FO</span>
              </div>
              <h1 className={`font-bold ${mobile ? "text-lg" : "text-xl"}`}>
                FactoryOps
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-gray-700"
            >
              <Bell className="h-5 w-5" />
              {!mobile && <span className="ml-2">Thông báo</span>}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-gray-700"
            >
              <User className="h-5 w-5" />
              {!mobile && <span className="ml-2">Tài khoản</span>}
            </Button>
          </div>
        </div>
      </header>

      <MobileSidebar isOpen={mobileMenuOpen} setIsOpen={setMobileMenuOpen} />
    </>
  );
};
