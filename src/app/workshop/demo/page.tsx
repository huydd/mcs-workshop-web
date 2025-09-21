'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/auth-context';
import { UserRole } from '@/types';
import { Factory, Users, LogIn } from 'lucide-react';

const WorkshopDemoPage = () => {
  const { login, user, logout } = useAuth();

  const workshopAccounts = [
    {
      id: "user-workshop-a",
      name: "Trần Thị Hà",
      email: "ha.xuong1@mcs.vn",
      role: UserRole.WORKSHOP_LEAD,
      department: "Xưởng 1",
      workshopCode: "W1",
      workshopName: "Xưởng kết cấu A",
      password: "123456",
      color: "bg-blue-100 text-blue-800",
    },
    {
      id: "user-workshop-b",
      name: "Đỗ Minh Tân",
      email: "tan.xuong2@mcs.vn",
      role: UserRole.WORKSHOP_LEAD,
      department: "Xưởng 2",
      workshopCode: "W2",
      workshopName: "Xưởng gia công B",
      password: "123456",
      color: "bg-green-100 text-green-800",
    },
    {
      id: "user-workshop-c",
      name: "Lê Thu Trang",
      email: "trang.xuong3@mcs.vn",
      role: UserRole.WORKSHOP_LEAD,
      department: "Xưởng 3",
      workshopCode: "W3",
      workshopName: "Xưởng hàn C",
      password: "123456",
      color: "bg-purple-100 text-purple-800",
    },
    {
      id: "user-workshop-d",
      name: "Vũ Quốc Huy",
      email: "huy.xuong4@mcs.vn",
      role: UserRole.WORKSHOP_LEAD,
      department: "Xưởng 4",
      workshopCode: "W4",
      workshopName: "Xưởng hoàn thiện D",
      password: "123456",
      color: "bg-orange-100 text-orange-800",
    },
  ];

  const handleLogin = (account: any) => {
    const result = login(account.email, account.password);
    if (result.success) {
      // Redirect to workshop page
      window.location.href = '/workshop';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="space-y-4" padding="lg">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-secondary mb-2">
            Demo Hệ thống Quản lý Xưởng
          </h1>
          <p className="text-secondary/70">
            Chọn tài khoản trưởng xưởng để trải nghiệm hệ thống quản lý task
          </p>
        </div>

        {user && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">
                  Đang đăng nhập với: {user.name}
                </p>
                <p className="text-xs text-green-600">
                  {user.department} ({user.workshopCode})
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => window.location.href = '/workshop'}
                >
                  Vào Xưởng
                </Button>
                <Button variant="secondary" size="sm" onClick={logout}>
                  Đăng xuất
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {workshopAccounts.map(account => (
          <Card key={account.id} className="space-y-4" padding="lg">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <Factory className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-secondary">{account.name}</h3>
                  <p className="text-sm text-secondary/70">{account.email}</p>
                  <Badge className={account.color}>
                    {account.workshopCode} - {account.workshopName}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Chức vụ:</span>
                  <p className="font-medium">Trưởng xưởng</p>
                </div>
                <div>
                  <span className="text-gray-500">Bộ phận:</span>
                  <p className="font-medium">{account.department}</p>
                </div>
              </div>

              <div className="pt-3 border-t">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                  <Users className="h-4 w-4" />
                  <span>Thông tin đăng nhập:</span>
                </div>
                <div className="bg-gray-50 rounded p-3 space-y-1 text-xs">
                  <p><span className="font-medium">Email:</span> {account.email}</p>
                  <p><span className="font-medium">Password:</span> {account.password}</p>
                </div>
              </div>
            </div>

            <Button
              onClick={() => handleLogin(account)}
              disabled={user?.id === account.id}
              className="w-full"
            >
              <LogIn className="h-4 w-4 mr-2" />
              {user?.id === account.id ? 'Đã đăng nhập' : 'Đăng nhập'}
            </Button>
          </Card>
        ))}
      </div>

      <Card className="space-y-4" padding="lg">
        <h3 className="font-semibold text-secondary">Hướng dẫn sử dụng</h3>
        <div className="space-y-3 text-sm text-secondary/70">
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-medium">
              1
            </span>
            <p>
              <strong>Phân công nhiệm vụ:</strong> Trước tiên, đăng nhập với tài khoản "Anh Giỏi" (Điều phối sản xuất)
              tại trang <a href="/project/technical" className="text-primary hover:underline">/project/technical</a> để
              phân công task cho các xưởng.
            </p>
          </div>
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-medium">
              2
            </span>
            <p>
              <strong>Đăng nhập xưởng:</strong> Chọn một trong các tài khoản trưởng xưởng ở trên để đăng nhập.
            </p>
          </div>
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-medium">
              3
            </span>
            <p>
              <strong>Quản lý task:</strong> Sử dụng Kanban board để theo dõi và quản lý các nhiệm vụ đã được phân công cho xưởng.
            </p>
          </div>
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-medium">
              4
            </span>
            <p>
              <strong>Thiết lập chi tiết:</strong> Click vào nút Edit trên task card để thiết lập timeline, phân công nhân viên,
              zone và checklist công việc.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default WorkshopDemoPage;