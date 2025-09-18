// app/page.tsx - Dashboard
'use client';

import { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Scissors,
  Settings2,
  Zap,
  Paintbrush
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ResponsiveTable } from '@/components/ui/ResponsiveTable';
import { useResponsive } from '@/components/layout/ResponsiveContainer';
import { Component, ComponentStatus, ProcessStage } from '@/types';

// Mock data
const mockComponents: Component[] = [
  {
    id: '1',
    code: 'CH1.1',
    name: 'Dầm chính A1',
    specifications: 'H300×168×6×10',
    length: 5898,
    unitWeight: 269,
    quantity: 2,
    totalWeight: 538,
    status: ComponentStatus.IN_PROGRESS,
    currentStage: ProcessStage.WELDING,
    createdAt: new Date('2025-09-01'),
    updatedAt: new Date('2025-09-03')
  },
  {
    id: '2',
    code: 'CH1.2',
    name: 'Dầm phụ B2',
    specifications: 'H250×125×5×8',
    length: 6760,
    unitWeight: 295,
    quantity: 4,
    totalWeight: 1180,
    status: ComponentStatus.COMPLETED,
    currentStage: ProcessStage.PAINTING,
    createdAt: new Date('2025-08-28'),
    updatedAt: new Date('2025-09-02')
  },
  {
    id: '3',
    code: 'CH2.1',
    name: 'Cột thép C1',
    specifications: 'H400×200×8×13',
    length: 4200,
    unitWeight: 415,
    quantity: 6,
    totalWeight: 2490,
    status: ComponentStatus.PENDING,
    currentStage: ProcessStage.CUTTING,
    createdAt: new Date('2025-09-02'),
    updatedAt: new Date('2025-09-03')
  }
];

const summaryStats = {
  totalComponents: 12,
  completedComponents: 4,
  inProgressComponents: 6,
  totalWeight: 8500,
  completedWeight: 3200,
  stageProgress: {
    cutting: 85,
    assembly: 72,
    welding: 45,
    painting: 30
  }
};

const tableColumns = [
  {
    key: 'code' as keyof Component,
    label: 'Mã cấu kiện',
    priority: 'high' as const,
    width: '120px'
  },
  {
    key: 'name' as keyof Component,
    label: 'Tên cấu kiện',
    priority: 'high' as const,
    render: (value: string) => (
      <div className="font-medium">{value}</div>
    )
  },
  {
    key: 'specifications' as keyof Component,
    label: 'Thông số',
    priority: 'medium' as const
  },
  {
    key: 'totalWeight' as keyof Component,
    label: 'Khối lượng (kg)',
    priority: 'medium' as const,
    render: (value: number) => value.toLocaleString()
  },
  {
    key: 'currentStage' as keyof Component,
    label: 'Công đoạn',
    priority: 'high' as const,
    render: (stage: ProcessStage) => {
      const stageMap = {
        [ProcessStage.CUTTING]: { label: 'Cắt phôi', icon: Scissors, color: 'bg-blue-100 text-blue-800' },
        [ProcessStage.ASSEMBLY]: { label: 'Gá tổ hợp', icon: Settings2, color: 'bg-purple-100 text-purple-800' },
        [ProcessStage.WELDING]: { label: 'Hàn', icon: Zap, color: 'bg-orange-100 text-orange-800' },
        [ProcessStage.PAINTING]: { label: 'Sơn', icon: Paintbrush, color: 'bg-green-100 text-green-800' }
      };
      const config = stageMap[stage];
      const Icon = config.icon;
      return (
        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
          <Icon className="h-3 w-3" />
          {config.label}
        </div>
      );
    }
  },
  {
    key: 'status' as keyof Component,
    label: 'Trạng thái',
    priority: 'high' as const,
    render: (status: ComponentStatus) => <Badge variant={status}>{getStatusText(status)}</Badge>
  },
  {
    key: 'updatedAt' as keyof Component,
    label: 'Cập nhật',
    priority: 'low' as const,
    render: (date: Date) => new Intl.DateTimeFormat('vi-VN').format(date)
  }
];

function getStatusText(status: ComponentStatus): string {
  const statusMap = {
    [ComponentStatus.PENDING]: 'Chờ xử lý',
    [ComponentStatus.IN_PROGRESS]: 'Đang thực hiện',
    [ComponentStatus.COMPLETED]: 'Hoàn thành',
    [ComponentStatus.QC_FAILED]: 'QC không đạt',
    [ComponentStatus.APPROVED]: 'Đã duyệt'
  };
  return statusMap[status];
}

export default function DashboardPage() {
  const { mobile, tablet } = useResponsive();
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);

  const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    color 
  }: { 
    title: string; 
    value: string | number; 
    subtitle?: string; 
    icon: any; 
    color: string; 
  }) => (
    <Card className="p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[#616161]">{title}</p>
          <p className="text-2xl lg:text-3xl font-bold text-[#212121]">{value}</p>
          {subtitle && (
            <p className="text-sm text-[#616161] mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </Card>
  );

  const ProgressCard = ({ 
    title, 
    percentage, 
    icon: Icon 
  }: { 
    title: string; 
    percentage: number; 
    icon: any; 
  }) => (
    <Card className="p-4">
      <div className="flex items-center gap-3 mb-3">
        <Icon className="h-5 w-5 text-primary" />
        <span className="font-medium text-secondary">{title}</span>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-[#616161]">Tiến độ</span>
          <span className="font-medium text-[#212121]">{percentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-[#212121]">
            Dashboard Sản Xuất
          </h1>
          <p className="text-[#616161] mt-1">
            Tổng quan tình hình sản xuất kết cấu thép
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size={mobile ? 'sm' : 'md'}>
            <BarChart3 className="h-4 w-4" />
            {!mobile && <span className="ml-2">Báo cáo</span>}
          </Button>
          <Button size={mobile ? 'sm' : 'md'}>
            <TrendingUp className="h-4 w-4" />
            {!mobile && <span className="ml-2">Xuất Excel</span>}
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          title="Tổng cấu kiện"
          value={summaryStats.totalComponents}
          subtitle="Trong kế hoạch"
          icon={BarChart3}
          color="bg-primary"
        />
        <StatCard
          title="Hoàn thành"
          value={summaryStats.completedComponents}
          subtitle={`${Math.round((summaryStats.completedComponents / summaryStats.totalComponents) * 100)}% kế hoạch`}
          icon={CheckCircle}
          color="bg-[#388E3C]"
        />
        <StatCard
          title="Đang thực hiện"
          value={summaryStats.inProgressComponents}
          subtitle="Cấu kiện"
          icon={Clock}
          color="bg-[#FFA000]"
        />
        <StatCard
          title="Khối lượng"
          value={`${(summaryStats.completedWeight / 1000).toFixed(1)}T`}
          subtitle={`/${(summaryStats.totalWeight / 1000).toFixed(1)}T tổng`}
          icon={TrendingUp}
          color="bg-primary-dark"
        />
      </div>

      {/* Progress by Stage */}
      <div>
        <h2 className="text-xl font-semibold text-[#212121] mb-4">
          Tiến độ theo công đoạn
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ProgressCard
            title="Cắt phôi"
            percentage={summaryStats.stageProgress.cutting}
            icon={Scissors}
          />
          <ProgressCard
            title="Gá tổ hợp"
            percentage={summaryStats.stageProgress.assembly}
            icon={Settings2}
          />
          <ProgressCard
            title="Hàn hoàn thiện"
            percentage={summaryStats.stageProgress.welding}
            icon={Zap}
          />
          <ProgressCard
            title="Sơn xuất xưởng"
            percentage={summaryStats.stageProgress.painting}
            icon={Paintbrush}
          />
        </div>
      </div>

      {/* Recent Components Table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[#212121]">
            Cấu kiện gần đây
          </h2>
          <Button variant="secondary" size="sm">
            Xem tất cả
          </Button>
        </div>
        
        <ResponsiveTable
          data={mockComponents}
          columns={tableColumns}
          keyField="id"
          onRowClick={setSelectedComponent}
        />
      </div>

      {/* Quick Actions - Mobile Only */}
      {mobile && (
        <Card className="p-4">
          <h3 className="font-semibold text-[#212121] mb-3">Thao tác nhanh</h3>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" className="justify-start">
              <Scissors className="h-4 w-4 mr-2" />
              Ghi nhận cắt
            </Button>
            <Button variant="secondary" className="justify-start">
              <Settings2 className="h-4 w-4 mr-2" />
              Ghi nhận gá
            </Button>
            <Button variant="secondary" className="justify-start">
              <Zap className="h-4 w-4 mr-2" />
              Ghi nhận hàn
            </Button>
            <Button variant="secondary" className="justify-start">
              <Paintbrush className="h-4 w-4 mr-2" />
              Ghi nhận sơn
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
