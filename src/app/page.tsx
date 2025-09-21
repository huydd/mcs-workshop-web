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
  Paintbrush,
  FolderOpen,
  ChevronDown,
  Download,
  Eye,
  Building2,
  Calendar,
  Package
} from 'lucide-react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ResponsiveTable } from '@/components/ui/ResponsiveTable';
import { useResponsive } from '@/components/layout/ResponsiveContainer';
import { Component, ComponentStatus, ProcessStage } from '@/types';

// Project data structure
interface Project {
  id: string;
  name: string;
  code: string;
  description: string;
  status: 'planning' | 'active' | 'completed' | 'on_hold';
  startDate: string;
  endDate: string;
  totalComponents: number;
  completedComponents: number;
  totalWeight: number;
  completedWeight: number;
  progress: number;
}

// Mock projects data
const mockProjects: Project[] = [
  {
    id: 'p1',
    name: 'Nhà máy sản xuất thép Hòa Phát',
    code: 'HP-2024-001',
    description: 'Kết cấu thép nhà máy chính',
    status: 'active',
    startDate: '2024-01-15',
    endDate: '2024-12-30',
    totalComponents: 156,
    completedComponents: 89,
    totalWeight: 12500,
    completedWeight: 7800,
    progress: 57
  },
  {
    id: 'p2',
    name: 'Cầu Đống Đa - Hà Nội',
    code: 'DD-2024-002',
    description: 'Kết cấu thép cầu bộ hành',
    status: 'active',
    startDate: '2024-03-01',
    endDate: '2025-02-28',
    totalComponents: 78,
    completedComponents: 45,
    totalWeight: 8500,
    completedWeight: 4200,
    progress: 58
  },
  {
    id: 'p3',
    name: 'Trung tâm thương mại Vincom',
    code: 'VC-2024-003',
    description: 'Kết cấu thép tòa nhà 15 tầng',
    status: 'planning',
    startDate: '2024-10-01',
    endDate: '2025-08-30',
    totalComponents: 234,
    completedComponents: 12,
    totalWeight: 18000,
    completedWeight: 850,
    progress: 5
  }
];

// Chart data for combined bar and line chart
const monthlyData = [
  { month: 'T1/24', completed: 45, planned: 50, efficiency: 90 },
  { month: 'T2/24', completed: 52, planned: 55, efficiency: 95 },
  { month: 'T3/24', completed: 48, planned: 60, efficiency: 80 },
  { month: 'T4/24', completed: 65, planned: 65, efficiency: 100 },
  { month: 'T5/24', completed: 72, planned: 70, efficiency: 103 },
  { month: 'T6/24', completed: 68, planned: 75, efficiency: 91 },
  { month: 'T7/24', completed: 78, planned: 80, efficiency: 98 },
  { month: 'T8/24', completed: 85, planned: 85, efficiency: 100 },
  { month: 'T9/24', completed: 92, planned: 90, efficiency: 102 }
];

// Process stage data for pie chart
const stageData = [
  { name: 'Cắt phôi', value: 35, color: '#3b82f6' },
  { name: 'Gá tổ hợp', value: 25, color: '#8b5cf6' },
  { name: 'Hàn', value: 28, color: '#f59e0b' },
  { name: 'Sơn', value: 12, color: '#10b981' }
];

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
  const [selectedProject, setSelectedProject] = useState<Project>(mockProjects[0]);
  const [showProjectSelector, setShowProjectSelector] = useState(false);

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

  // Helper functions for new dashboard
  const getProjectStatusBadge = (status: Project['status']) => {
    const statusConfig = {
      planning: { label: 'Đang lập kế hoạch', color: 'bg-gray-100 text-gray-800' },
      active: { label: 'Đang thực hiện', color: 'bg-blue-100 text-blue-800' },
      completed: { label: 'Hoàn thành', color: 'bg-green-100 text-green-800' },
      on_hold: { label: 'Tạm dừng', color: 'bg-red-100 text-red-800' }
    };
    const config = statusConfig[status];
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header with Project Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
              Bảng điều khiển sản xuất
            </h1>
            <p className="text-gray-600 mt-1">
              Theo dõi tiến độ và hiệu suất sản xuất kết cấu thép
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Project Selector */}
          <div className="relative">
            <Button
              variant="secondary"
              className="flex items-center gap-2 min-w-[200px] justify-between"
              onClick={() => setShowProjectSelector(!showProjectSelector)}
            >
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                <span className="truncate">{selectedProject.name}</span>
              </div>
              <ChevronDown className="h-4 w-4" />
            </Button>

            {showProjectSelector && (
              <div className="absolute top-12 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[300px]">
                <div className="p-2">
                  <div className="text-xs font-medium text-gray-500 mb-2 px-2">Chọn dự án</div>
                  {mockProjects.map((project) => (
                    <button
                      key={project.id}
                      className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
                      onClick={() => {
                        setSelectedProject(project);
                        setShowProjectSelector(false);
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-medium text-gray-900">{project.name}</div>
                        {getProjectStatusBadge(project.status)}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">{project.description}</div>
                      <div className="text-xs text-gray-500">
                        Tiến độ: {project.progress}% • {project.completedComponents}/{project.totalComponents} cấu kiện
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <Button variant="secondary" size={mobile ? 'sm' : 'md'}>
            <Eye className="h-4 w-4" />
            {!mobile && <span className="ml-2">Xem báo cáo</span>}
          </Button>
          <Button size={mobile ? 'sm' : 'md'}>
            <Download className="h-4 w-4" />
            {!mobile && <span className="ml-2">Tải xuống</span>}
          </Button>
        </div>
      </div>

      {/* Project Overview Card */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-semibold text-gray-900">{selectedProject.name}</h2>
              {getProjectStatusBadge(selectedProject.status)}
            </div>
            <p className="text-gray-600">{selectedProject.description}</p>
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Từ {new Date(selectedProject.startDate).toLocaleDateString('vi-VN')} đến {new Date(selectedProject.endDate).toLocaleDateString('vi-VN')}</span>
              </div>
              <div className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                <span>Mã dự án: {selectedProject.code}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{selectedProject.progress}%</div>
              <div className="text-sm text-gray-600">Tiến độ chung</div>
            </div>
            <div className="w-16 h-16 relative">
              <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="2"
                />
                <path
                  d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3"
                  strokeDasharray={`${selectedProject.progress}, 100`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          title="Tổng cấu kiện"
          value={selectedProject.totalComponents}
          subtitle="Trong dự án"
          icon={Package}
          color="bg-blue-600"
        />
        <StatCard
          title="Đã hoàn thành"
          value={selectedProject.completedComponents}
          subtitle={`${Math.round((selectedProject.completedComponents / selectedProject.totalComponents) * 100)}% tiến độ`}
          icon={CheckCircle}
          color="bg-green-600"
        />
        <StatCard
          title="Đang làm"
          value={selectedProject.totalComponents - selectedProject.completedComponents}
          subtitle="Cấu kiện"
          icon={Clock}
          color="bg-orange-600"
        />
        <StatCard
          title="Khối lượng thép"
          value={`${(selectedProject.completedWeight / 1000).toFixed(1)}T`}
          subtitle={`/${(selectedProject.totalWeight / 1000).toFixed(1)}T tổng`}
          icon={TrendingUp}
          color="bg-purple-600"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Progress Chart (Biểu đồ cột kết hợp đường) */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Tiến độ sản xuất theo tháng</h3>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-600 rounded"></div>
                <span>Hoàn thành</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-300 rounded"></div>
                <span>Kế hoạch</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-600 rounded"></div>
                <span>Hiệu suất (%)</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Bar yAxisId="left" dataKey="completed" fill="#3b82f6" name="Hoàn thành" />
              <Bar yAxisId="left" dataKey="planned" fill="#e5e7eb" name="Kế hoạch" />
              <Line yAxisId="right" type="monotone" dataKey="efficiency" stroke="#10b981" strokeWidth={3} name="Hiệu suất (%)" />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>

        {/* Process Distribution Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Phân bố công đoạn</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stageData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {stageData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Progress by Stage */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Tiến độ chi tiết theo công đoạn
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
          <h2 className="text-xl font-semibold text-gray-900">
            Cấu kiện dự án {selectedProject.name}
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Xuất Excel
            </Button>
            <Button variant="secondary" size="sm">
              Xem chi tiết
            </Button>
          </div>
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
          <h3 className="font-semibold text-gray-900 mb-3">Thao tác nhanh</h3>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" className="justify-start">
              <Scissors className="h-4 w-4 mr-2" />
              Cập nhật cắt
            </Button>
            <Button variant="secondary" className="justify-start">
              <Settings2 className="h-4 w-4 mr-2" />
              Cập nhật gá
            </Button>
            <Button variant="secondary" className="justify-start">
              <Zap className="h-4 w-4 mr-2" />
              Cập nhật hàn
            </Button>
            <Button variant="secondary" className="justify-start">
              <Paintbrush className="h-4 w-4 mr-2" />
              Cập nhật sơn
            </Button>
          </div>
        </Card>
      )}

      {/* Project Summary Footer */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Tóm tắt dự án {selectedProject.name}
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Tiến độ</div>
                <div className="font-semibold text-blue-600">{selectedProject.progress}%</div>
              </div>
              <div>
                <div className="text-gray-600">Hoàn thành</div>
                <div className="font-semibold text-green-600">{selectedProject.completedComponents}/{selectedProject.totalComponents}</div>
              </div>
              <div>
                <div className="text-gray-600">Khối lượng</div>
                <div className="font-semibold text-purple-600">{(selectedProject.completedWeight/1000).toFixed(1)}T/{(selectedProject.totalWeight/1000).toFixed(1)}T</div>
              </div>
              <div>
                <div className="text-gray-600">Thời gian còn lại</div>
                <div className="font-semibold text-orange-600">
                  {Math.ceil((new Date(selectedProject.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} ngày
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm">
              <Eye className="h-4 w-4 mr-1" />
              Xem BOM
            </Button>
            <Button size="sm">
              <BarChart3 className="h-4 w-4 mr-1" />
              Báo cáo chi tiết
            </Button>
          </div>
        </div>
      </Card>

      {/* Hide project selector when clicking outside */}
      {showProjectSelector && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowProjectSelector(false)}
        />
      )}
    </div>
  );
}
