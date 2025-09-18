"use client";

import { Heart, Globe, Phone, Mail } from "lucide-react";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Company Info */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-secondary">
                Minh Cường Steel
              </span>
              <span className="text-xs text-secondary/60">
                © {currentYear}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-secondary/60">
              <a
                href="https://minhcuongsteel.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                <Globe className="h-3 w-3" />
                minhcuongsteel.com
              </a>
              <a
                href="tel:+84123456789"
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                <Phone className="h-3 w-3" />
                (84) 123 456 789
              </a>
              <a
                href="mailto:info@minhcuongsteel.com"
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                <Mail className="h-3 w-3" />
                info@minhcuongsteel.com
              </a>
            </div>
          </div>

          {/* System Info */}
          <div className="flex items-center gap-4 text-xs text-secondary/60">
            <span>Hệ thống điều hành sản xuất</span>
            <div className="flex items-center gap-1">
              <span>Made with</span>
              <Heart className="h-3 w-3 text-red-500" />
              <span>for Vietnamese Steel Industry</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};