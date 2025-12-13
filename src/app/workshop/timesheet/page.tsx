'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, Users, ChevronLeft, ChevronRight, FileText, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

// Workers data - matches workshop page
const WORKERS = [
  { id: 'w1', name: 'Nguyễn Văn An', role: 'Thợ hàn chính' },
  { id: 'w2', name: 'Trần Thị Bình', role: 'Thợ cắt CNC' },
  { id: 'w3', name: 'Lê Minh Cường', role: 'Thợ gia công' },
  { id: 'w4', name: 'Phạm Thu Duyên', role: 'Thợ hoàn thiện' },
  { id: 'w5', name: 'Vũ Đình Em', role: 'Thợ hàn' },
  { id: 'w6', name: 'Hoàng Thị Phương', role: 'Thợ kiểm tra' },
  { id: 'w7', name: 'Đỗ Văn Giang', role: 'Thợ cắt' },
  { id: 'w8', name: 'Ngô Thị Hương', role: 'Thợ lắp ráp' },
  { id: 'w9', name: 'Bùi Văn Inh', role: 'Thợ hàn' },
  { id: 'w10', name: 'Lý Thị Kiều', role: 'Thợ gia công' },
  { id: 'w11', name: 'Trịnh Văn Long', role: 'Thợ cắt laser' },
  { id: 'w12', name: 'Phan Thị Mai', role: 'Thợ sơn' },
  { id: 'w13', name: 'Võ Văn Nam', role: 'Thợ phay' },
  { id: 'w14', name: 'Đặng Thị Oanh', role: 'Thợ tiện' },
  { id: 'w15', name: 'Lại Văn Phúc', role: 'Thợ hàn' },
  { id: 'w16', name: 'Chu Thị Quỳnh', role: 'Thợ kiểm tra' },
  { id: 'w17', name: 'Dương Văn Rùa', role: 'Thợ cắt' },
  { id: 'w18', name: 'Mạc Thị Sơn', role: 'Thợ lắp ráp' },
  { id: 'w19', name: 'Tạ Văn Tâm', role: 'Thợ hàn TIG' },
  { id: 'w20', name: 'Ứng Thị Uyển', role: 'Thợ hoàn thiện' },
];

interface WorkerAssignment {
  workerId: string;
  workerName: string;
  subtaskIndex: number;
  subtaskName: string;
  quantity: number;
  hoursPerDay: number;
  startDate: string;
  endDate: string;
  taskId: string;
  taskName: string;
}

interface DayHours {
  date: string;
  totalHours: number;
  tasks: {
    taskId: string;
    taskName: string;
    subtaskName: string;
    hours: number;
  }[];
}

export default function TimesheetPage() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedWorker, setSelectedWorker] = useState<string | null>(null);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [refreshKey, setRefreshKey] = useState(0);

  // Function to load all assignments from localStorage
  const loadAssignments = () => {
    if (typeof window === 'undefined') return [];

    const assignments: WorkerAssignment[] = [];

    // Iterate through all localStorage keys to find task assignments
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('task_assignments_')) {
        try {
          const taskId = key.replace('task_assignments_', '');
          const taskAssignments = JSON.parse(localStorage.getItem(key) || '[]');

          // Convert to WorkerAssignment format
          taskAssignments.forEach((a: any) => {
            assignments.push({
              workerId: a.workerId,
              workerName: a.workerName,
              subtaskIndex: a.subtaskIndex,
              subtaskName: a.subtaskName,
              quantity: a.quantity,
              hoursPerDay: a.hoursPerDay || 0,
              startDate: a.startDate,
              endDate: a.endDate,
              taskId: taskId,
              taskName: `Task ${taskId}`, // You can enhance this to load actual task names
            });
          });
        } catch (e) {
          console.error(`Error loading ${key}:`, e);
        }
      }
    }

    return assignments;
  };

  // Load all assignments from localStorage
  const allAssignments = useMemo(() => {
    const assignments = loadAssignments();
    console.log('📊 Timesheet: Loaded assignments:', assignments);
    console.log('📊 Timesheet: Total assignments:', assignments.length);
    return assignments;
  }, [refreshKey]);

  // Auto-refresh when localStorage changes (from other tabs/windows)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('task_assignments_')) {
        setRefreshKey(prev => prev + 1);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Calculate worker hours by day for selected month
  const calculateWorkerHours = (workerId: string, month: string): DayHours[] => {
    const [year, monthNum] = month.split('-').map(Number);
    const daysInMonth = new Date(year, monthNum, 0).getDate();

    const dayHoursMap = new Map<string, DayHours>();

    // Initialize all days in month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      dayHoursMap.set(dateStr, {
        date: dateStr,
        totalHours: 0,
        tasks: [],
      });
    }

    // Filter assignments for this worker
    const workerAssignments = allAssignments.filter(a => a.workerId === workerId);

    // For each assignment, add hours to each day in the date range
    workerAssignments.forEach(assignment => {
      const start = new Date(assignment.startDate);
      const end = new Date(assignment.endDate);

      // Iterate through each day in the assignment's date range
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const dayData = dayHoursMap.get(dateStr);

        if (dayData) {
          dayData.totalHours += assignment.hoursPerDay;
          dayData.tasks.push({
            taskId: assignment.taskId,
            taskName: assignment.taskName,
            subtaskName: assignment.subtaskName,
            hours: assignment.hoursPerDay,
          });
        }
      }
    });

    return Array.from(dayHoursMap.values()).filter(d => d.totalHours > 0);
  };

  // Get worker hours for selected month and worker
  const workerHours = useMemo(() => {
    if (!selectedWorker) return [];
    const hours = calculateWorkerHours(selectedWorker, selectedMonth);
    console.log(`📊 Timesheet: Worker ${selectedWorker} hours for ${selectedMonth}:`, hours);
    return hours;
  }, [selectedWorker, selectedMonth, allAssignments]);

  // Calculate summary stats
  const summary = useMemo(() => {
    const totalHours = workerHours.reduce((sum, day) => sum + day.totalHours, 0);
    const totalDays = workerHours.length;
    const avgHoursPerDay = totalDays > 0 ? totalHours / totalDays : 0;
    const overtimeDays = workerHours.filter(day => day.totalHours > 8).length;

    return { totalHours, totalDays, avgHoursPerDay, overtimeDays };
  }, [workerHours]);

  // Month navigation
  const handlePreviousMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    setSelectedMonth(`${prevYear}-${String(prevMonth).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    setSelectedMonth(`${nextYear}-${String(nextMonth).padStart(2, '0')}`);
  };

  const toggleDayExpand = (date: string) => {
    setExpandedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(date)) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const dayOfWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][date.getDay()];
    return `${dayOfWeek}, ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  const formatMonthYear = (monthStr: string) => {
    const [year, month] = monthStr.split('-').map(Number);
    return `Tháng ${month}/${year}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Calendar className="w-8 h-8 text-blue-600" />
              Bảng Công Tháng
            </h1>
            <p className="text-gray-600 mt-1">Theo dõi giờ làm việc của nhân viên theo tháng</p>
          </div>
          <Button
            onClick={() => setRefreshKey(prev => prev + 1)}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Làm mới
          </Button>
        </div>

        {/* Filters */}
        <Card padding="lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Month Selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Chọn tháng
              </label>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={handlePreviousMonth}
                  className="p-2"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <div className="flex-1 text-center">
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value)}
                    className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full text-center font-semibold"
                  />
                </div>
                <Button
                  variant="secondary"
                  onClick={handleNextMonth}
                  className="p-2"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Worker Selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Chọn nhân viên
              </label>
              <select
                value={selectedWorker || ''}
                onChange={e => setSelectedWorker(e.target.value || null)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
              >
                <option value="">-- Chọn nhân viên --</option>
                {WORKERS.map(worker => (
                  <option key={worker.id} value={worker.id}>
                    {worker.name} - {worker.role}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Summary Stats */}
        {selectedWorker && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card padding="md" className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Tổng giờ làm</p>
                  <p className="text-3xl font-bold mt-1">{summary.totalHours.toFixed(1)}h</p>
                </div>
                <Calendar className="w-8 h-8 opacity-80" />
              </div>
            </Card>

            <Card padding="md" className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Số ngày làm việc</p>
                  <p className="text-3xl font-bold mt-1">{summary.totalDays}</p>
                </div>
                <Users className="w-8 h-8 opacity-80" />
              </div>
            </Card>

            <Card padding="md" className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">TB giờ/ngày</p>
                  <p className="text-3xl font-bold mt-1">{summary.avgHoursPerDay.toFixed(1)}h</p>
                </div>
                <FileText className="w-8 h-8 opacity-80" />
              </div>
            </Card>

            <Card padding="md" className="bg-gradient-to-br from-rose-500 to-rose-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Ngày OT (&gt;8h)</p>
                  <p className="text-3xl font-bold mt-1">{summary.overtimeDays}</p>
                </div>
                <Calendar className="w-8 h-8 opacity-80" />
              </div>
            </Card>
          </div>
        )}

        {/* Timesheet Table */}
        {!selectedWorker ? (
          <Card padding="xl">
            <div className="text-center py-16">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-xl text-gray-500 font-medium">Vui lòng chọn nhân viên để xem bảng công</p>
            </div>
          </Card>
        ) : workerHours.length === 0 ? (
          <Card padding="xl">
            <div className="text-center py-16">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-xl text-gray-500 font-medium">
                Không có dữ liệu công việc cho {formatMonthYear(selectedMonth)}
              </p>
            </div>
          </Card>
        ) : (
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold">Ngày</th>
                    <th className="px-6 py-4 text-center font-semibold">Tổng giờ</th>
                    <th className="px-6 py-4 text-center font-semibold">Trạng thái</th>
                    <th className="px-6 py-4 text-left font-semibold">Chi tiết công việc</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {workerHours.map((day, idx) => {
                    const isExpanded = expandedDays.has(day.date);
                    const isOvertime = day.totalHours > 8;
                    const isWeekend = new Date(day.date).getDay() === 0 || new Date(day.date).getDay() === 6;

                    return (
                      <React.Fragment key={day.date}>
                        <tr
                          className={cn(
                            'hover:bg-blue-50 transition-colors cursor-pointer',
                            idx % 2 === 0 ? 'bg-white' : 'bg-gray-50',
                            isWeekend && 'bg-amber-50',
                          )}
                          onClick={() => toggleDayExpand(day.date)}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <ChevronRight
                                className={cn(
                                  'w-4 h-4 text-gray-400 transition-transform',
                                  isExpanded && 'rotate-90',
                                )}
                              />
                              <span className="font-medium text-gray-900">
                                {formatDate(day.date)}
                              </span>
                              {isWeekend && (
                                <Badge className="bg-amber-100 text-amber-700 text-xs">
                                  Cuối tuần
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={cn(
                                'text-lg font-bold',
                                isOvertime ? 'text-rose-600' : 'text-emerald-600',
                              )}
                            >
                              {day.totalHours.toFixed(1)}h
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {isOvertime ? (
                              <Badge className="bg-rose-100 text-rose-700">
                                OT (+{(day.totalHours - 8).toFixed(1)}h)
                              </Badge>
                            ) : (
                              <Badge className="bg-emerald-100 text-emerald-700">
                                Bình thường
                              </Badge>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-600">
                              {day.tasks.length} công việc
                            </span>
                          </td>
                        </tr>

                        {/* Expanded Row - Task Details */}
                        {isExpanded && (
                          <tr className="bg-blue-50">
                            <td colSpan={4} className="px-6 py-4">
                              <div className="space-y-2">
                                <p className="font-semibold text-gray-700 mb-3">
                                  Chi tiết công việc trong ngày:
                                </p>
                                <div className="grid gap-2">
                                  {day.tasks.map((task, taskIdx) => (
                                    <div
                                      key={taskIdx}
                                      className="bg-white rounded-lg p-3 border-l-4 border-blue-500"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                          <p className="font-medium text-gray-900">
                                            {task.taskName}
                                          </p>
                                          <p className="text-sm text-gray-600 mt-1">
                                            {task.subtaskName}
                                          </p>
                                        </div>
                                        <div className="text-right">
                                          <span className="text-lg font-bold text-blue-600">
                                            {task.hours.toFixed(1)}h
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
