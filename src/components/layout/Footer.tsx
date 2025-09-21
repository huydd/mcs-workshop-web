"use client";

import {
  Globe,
  Phone,
  Mail,
  MapPin,
  Building2,
  Award,
  Clock,
  Shield,
  Linkedin,
  Facebook,
  Youtube,
  ExternalLink
} from "lucide-react";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-gray-900 to-gray-800 text-white mt-16">
      {/* Main Footer Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Company Information */}
          <div className="lg:col-span-1">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">MCS</h3>
              <div className="w-12 h-1 bg-blue-500 mb-4"></div>
              <p className="text-gray-300 text-sm leading-relaxed">
                Công ty Cổ phần Kết cấu Thép Minh Cường - Đơn vị hàng đầu trong lĩnh vực
                sản xuất và thi công kết cấu thép tại Việt Nam.
              </p>
            </div>

            {/* Certifications */}
            <div className="flex items-center gap-3 mb-4">
              <Award className="h-5 w-5 text-blue-400" />
              <span className="text-sm text-gray-300">ISO 9001:2015</span>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-green-400" />
              <span className="text-sm text-gray-300">Chứng nhận An toàn Lao động</span>
            </div>
          </div>

          {/* Contact Information */}
          <div className="lg:col-span-1">
            <h4 className="text-lg font-semibold text-white mb-6">Thông tin liên hệ</h4>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    Trụ sở chính: Số 123 Đường Nguyễn Văn Linh,
                    Phường Bình Thuận, Quận 7, TP.HCM
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-green-400" />
                <div>
                  <a
                    href="tel:+842838361234"
                    className="text-sm text-gray-300 hover:text-white transition-colors"
                  >
                    (028) 3836 1234
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-yellow-400" />
                <div>
                  <a
                    href="mailto:info@minhcuongsteel.com"
                    className="text-sm text-gray-300 hover:text-white transition-colors"
                  >
                    info@minhcuongsteel.com
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-purple-400" />
                <div>
                  <a
                    href="https://www.minhcuongsteel.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-300 hover:text-white transition-colors flex items-center gap-1"
                  >
                    www.minhcuongsteel.com
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Services & Solutions */}
          <div className="lg:col-span-1">
            <h4 className="text-lg font-semibold text-white mb-6">Dịch vụ & Giải pháp</h4>

            <ul className="space-y-3">
              <li>
                <a href="#" className="text-sm text-gray-300 hover:text-white transition-colors hover:pl-2 transition-all duration-200">
                  Sản xuất kết cấu thép
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-300 hover:text-white transition-colors hover:pl-2 transition-all duration-200">
                  Thi công lắp dựng
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-300 hover:text-white transition-colors hover:pl-2 transition-all duration-200">
                  Tư vấn thiết kế
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-300 hover:text-white transition-colors hover:pl-2 transition-all duration-200">
                  Quản lý dự án
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-300 hover:text-white transition-colors hover:pl-2 transition-all duration-200">
                  Kiểm định chất lượng
                </a>
              </li>
            </ul>
          </div>

          {/* Quick Links & Support */}
          <div className="lg:col-span-1">
            <h4 className="text-lg font-semibold text-white mb-6">Hỗ trợ khách hàng</h4>

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-blue-400" />
                <div>
                  <p className="text-sm text-gray-300">Thứ 2 - Thứ 6: 7:00 - 17:00</p>
                  <p className="text-sm text-gray-300">Thứ 7: 7:00 - 11:30</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-orange-400" />
                <div>
                  <p className="text-sm text-gray-300">Xưởng sản xuất: KCN Hiệp Phước</p>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div>
              <h5 className="text-sm font-semibold text-white mb-3">Kết nối với chúng tôi</h5>
              <div className="flex gap-3">
                <a
                  href="#"
                  className="w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center transition-colors"
                  title="Facebook"
                >
                  <Facebook className="h-5 w-5 text-white" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-blue-500 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors"
                  title="LinkedIn"
                >
                  <Linkedin className="h-5 w-5 text-white" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-red-600 hover:bg-red-700 rounded-lg flex items-center justify-center transition-colors"
                  title="YouTube"
                >
                  <Youtube className="h-5 w-5 text-white" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-700 bg-gray-800">
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <p className="text-sm text-gray-400">
                © {currentYear} Công ty Cổ phần Kết cấu Thép Minh Cường. Bảo lưu mọi quyền.
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <a href="#" className="hover:text-white transition-colors">
                  Chính sách bảo mật
                </a>
                <span>•</span>
                <a href="#" className="hover:text-white transition-colors">
                  Điều khoản sử dụng
                </a>
                <span>•</span>
                <a href="#" className="hover:text-white transition-colors">
                  Hỗ trợ kỹ thuật
                </a>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>Hệ thống quản lý sản xuất</span>
              <span className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium">
                v2.0.1
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};