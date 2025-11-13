'use client';

import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Users,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface FinalAssignment {
  workerId: string;
  workerName: string;
  subtaskIndex: number;
  subtaskName: string;
  quantity: number;
  hoursPerDay: number;
  startDate: string;
  endDate: string;
  isDone?: boolean;
  doneAt?: string;
  doneBy?: string;
  isApproved?: boolean;
  isRejected?: boolean;
  reviewComment?: string;
  reviewImages?: string[];
  reviewedAt?: string;
  reviewedBy?: string;
}

interface WorkshopWorker {
  id: string;
  name: string;
  role: string;
  specialties: string[];
  avatar?: string;
  experience: 'junior' | 'senior' | 'expert';
  currentTaskId?: string;
  birthYear?: number;
  address?: string;
  yearsOfExperience?: number;
}

interface WorkshopTask {
  id: string;
  profile: string;
  material: string | null;
  subtasks: {
    index: number;
    part_name: string | null;
    ass_name: string | null;
    qty_total: number | null;
    weight_total: number | null;
    area_total: number | null;
    welding_machine: number | null;
    hand_welding: number | null;
    note: string | null;
    completionPercent?: number;
  }[];
  totalQty: number;
  totalWeight: number;
  totalArea: number;
  startDate?: string;
  endDate?: string;
  assignedWorkers: string[];
  assignedZone?: string;
  workInstructions?: string;
  checklist: any[];
  status: 'todo' | 'in_progress' | 'review' | 'done';
  subStage?: string;
  progress: number;
  isDelayed: boolean;
  delayExplanation?: string;
  estimatedDays?: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface WorkerScheduleCalendarProps {
  workers: WorkshopWorker[];
  tasks: WorkshopTask[];
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
  onWorkerSelect?: (worker: WorkshopWorker) => void;
  compact?: boolean;
}

export const WorkerScheduleCalendar = ({
  workers,
  tasks,
  selectedDate = new Date(),
  onDateChange,
  onWorkerSelect,
  compact = false,
}: WorkerScheduleCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));
  const [selectedWorker, setSelectedWorker] = useState<string | null>(null);

  // Load all assignments from localStorage
  const allAssignments = useMemo(() => {
    const assignments: FinalAssignment[] = [];

    if (typeof window !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('task_assignments_')) {
          try {
            const taskAssignments = JSON.parse(
              localStorage.getItem(key) || '[]',
            );
            assignments.push(...taskAssignments);
          } catch (e) {
            console.error(`Error loading ${key}:`, e);
          }
        }
      }
    }

    return assignments;
  }, []);

  // Get worker's schedule for a specific date
  const getWorkerScheduleForDate = (workerId: string, date: Date) => {
    const dateStr = date.toISOString().split('T')[0];

    return allAssignments.filter(assignment => {
      if (assignment.workerId !== workerId) return false;

      const startDate = new Date(assignment.startDate);
      const endDate = new Date(assignment.endDate);
      const checkDate = new Date(dateStr);

      return checkDate >= startDate && checkDate <= endDate;
    });
  };

  // Calculate total hours for worker on specific date
  const getWorkerHoursForDate = (workerId: string, date: Date) => {
    const schedule = getWorkerScheduleForDate(workerId, date);
    return schedule.reduce(
      (total, assignment) => total + (assignment.hoursPerDay || 0),
      0,
    );
  };

  // Get days in month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  // Navigate months
  const previousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1),
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1),
    );
  };

  // Check if worker is available on date
  const isWorkerAvailable = (workerId: string, date: Date) => {
    const hours = getWorkerHoursForDate(workerId, date);
    return hours < 8;
  };

  // Get worker availability status
  const getWorkerAvailabilityStatus = (workerId: string, date: Date) => {
    const hours = getWorkerHoursForDate(workerId, date);
    const schedule = getWorkerScheduleForDate(workerId, date);

    if (hours === 0)
      return {
        status: 'available',
        color: 'bg-green-100 text-green-700',
        text: 'Rảnh',
      };
    if (hours < 8)
      return {
        status: 'partial',
        color: 'bg-yellow-100 text-yellow-700',
        text: `${hours}/8h`,
      };
    return { status: 'full', color: 'bg-red-100 text-red-700', text: 'Đủ 8h' };
  };

  const days = getDaysInMonth(currentMonth);
  const weekDays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  if (compact) {
    // Compact version - show current week only
    const today = new Date();
    const currentWeek: Date[] = [];
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      currentWeek.push(day);
    }

    return (
      <Card padding="md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            Lịch tuần này
          </h3>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onDateChange?.(new Date())}
          >
            Hôm nay
          </Button>
        </div>

        <div className="space-y-2">
          {workers.map(worker => {
            const workerSchedule = currentWeek.map(date => ({
              date,
              hours: getWorkerHoursForDate(worker.id, date),
              assignments: getWorkerScheduleForDate(worker.id, date),
              availability: getWorkerAvailabilityStatus(worker.id, date),
            }));

            const totalWeeklyHours = workerSchedule.reduce(
              (sum, day) => sum + day.hours,
              0,
            );

            return (
              <div
                key={worker.id}
                className={cn(
                  'p-3 border rounded-lg cursor-pointer transition-all',
                  selectedWorker === worker.id
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300',
                  totalWeeklyHours >= 40 && 'bg-orange-50 border-orange-200',
                )}
                onClick={() => {
                  setSelectedWorker(
                    worker.id === selectedWorker ? null : worker.id,
                  );
                  onWorkerSelect?.(worker);
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {worker.name}
                      </p>
                      <p className="text-xs text-gray-600">{worker.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      className={cn(
                        'text-xs',
                        totalWeeklyHours >= 40
                          ? 'bg-red-100 text-red-700'
                          : totalWeeklyHours >= 32
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700',
                      )}
                    >
                      {totalWeeklyHours}/40h
                    </Badge>
                  </div>
                </div>

                {selectedWorker === worker.id && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="grid grid-cols-7 gap-1 text-xs">
                      {weekDays.map((day, idx) => (
                        <div key={idx} className="text-center">
                          <p className="text-gray-500 mb-1">{day}</p>
                          <div
                            className={cn(
                              'w-8 h-8 rounded-full flex items-center justify-center mx-auto',
                              workerSchedule[idx].availability.color,
                            )}
                          >
                            {workerSchedule[idx].date.getDate()}
                          </div>
                          <p className="mt-1 font-medium">
                            {workerSchedule[idx].hours}h
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Show assignments for today */}
                    {workerSchedule
                      .find(s => s.date.toDateString() === today.toDateString())
                      ?.assignments.map((assignment, idx) => (
                        <div
                          key={idx}
                          className="mt-2 p-2 bg-blue-50 rounded text-xs"
                        >
                          <p className="font-medium text-blue-900">
                            {assignment.subtaskName}
                          </p>
                          <p className="text-blue-700">
                            {assignment.hoursPerDay}h • SL:{' '}
                            {assignment.quantity}
                          </p>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-100"></div>
              <span>Rảnh</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-yellow-100"></div>
              <span>Bận 1 phần</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-100"></div>
              <span>Đủ 8h</span>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Full calendar version
  return (
    <Card padding="lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Lịch làm việc
          </h3>
          <div className="text-sm text-gray-600">
            {currentMonth.toLocaleDateString('vi-VN', {
              month: 'long',
              year: 'numeric',
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={previousMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onDateChange?.(new Date())}
          >
            Hôm nay
          </Button>
          <Button size="sm" variant="secondary" onClick={nextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Worker selection */}
      <div className="mb-4">
        <select
          value={selectedWorker || ''}
          onChange={e => setSelectedWorker(e.target.value || null)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
        >
          <option value="">Tất cả nhân viên</option>
          {workers.map(worker => (
            <option key={worker.id} value={worker.id}>
              {worker.name} - {worker.role}
            </option>
          ))}
        </select>
      </div>

      {/* Calendar */}
      <div className="mb-6">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div
              key={day}
              className="text-center text-sm font-semibold text-gray-700 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day, idx) => {
            if (!day) {
              return <div key={idx} className="aspect-square"></div>;
            }

            const isToday = day.toDateString() === new Date().toDateString();
            const isSelected =
              day.toDateString() === selectedDate.toDateString();

            return (
              <div
                key={idx}
                className={cn(
                  'aspect-square border rounded-lg p-1 cursor-pointer transition-all',
                  isToday && 'ring-2 ring-primary',
                  isSelected && 'bg-primary/10 border-primary',
                  'hover:bg-gray-50',
                )}
                onClick={() => onDateChange?.(day)}
              >
                <div className="text-center">
                  <div
                    className={cn(
                      'text-sm font-medium',
                      isToday && 'text-primary',
                    )}
                  >
                    {day.getDate()}
                  </div>

                  {selectedWorker && (
                    <div className="mt-1">
                      {(() => {
                        const availability = getWorkerAvailabilityStatus(
                          selectedWorker,
                          day,
                        );
                        return (
                          <div
                            className={cn(
                              'w-6 h-6 rounded-full text-xs flex items-center justify-center mx-auto',
                              availability.color,
                            )}
                          >
                            {getWorkerHoursForDate(selectedWorker, day)}h
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected date details */}
      {selectedWorker && (
        <div className="border-t pt-4">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Chi tiết lịch làm việc
          </h4>

          {(() => {
            const worker = workers.find(w => w.id === selectedWorker);
            const schedule = getWorkerScheduleForDate(
              selectedWorker,
              selectedDate,
            );
            const totalHours = schedule.reduce(
              (sum, s) => sum + (s.hoursPerDay || 0),
              0,
            );

            return (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-600" />
                    <span className="font-medium">{worker?.name}</span>
                  </div>
                  <Badge
                    className={cn(
                      totalHours >= 8
                        ? 'bg-red-100 text-red-700'
                        : totalHours > 0
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700',
                    )}
                  >
                    {totalHours}/8 giờ
                  </Badge>
                </div>

                {schedule.length > 0 ? (
                  <div className="space-y-2">
                    {schedule.map((assignment, idx) => (
                      <div
                        key={idx}
                        className="p-3 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 text-sm">
                              {assignment.subtaskName}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              {assignment.hoursPerDay} giờ • SL:{' '}
                              {assignment.quantity}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge className="bg-blue-100 text-blue-700 text-xs">
                                {assignment.isDone ? 'Đã xong' : 'Đang làm'}
                              </Badge>
                              {assignment.isApproved && (
                                <Badge className="bg-green-100 text-green-700 text-xs">
                                  Đã xác nhận
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Không có công việc được phân công</p>
                  </div>
                )}

                {totalHours >= 8 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-900">
                          Nhân viên đã đủ 8 giờ làm việc
                        </p>
                        <p className="text-xs text-red-700 mt-1">
                          Không thể phân công thêm công việc cho ngày này
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Hướng dẫn sử dụng:</p>
            <ul className="text-xs space-y-1 list-disc list-inside">
              <li>Chọn nhân viên để xem lịch làm việc chi tiết</li>
              <li>Ngày có màu xanh: nhân viên rảnh</li>
              <li>Ngày có màu vàng: nhân viên bận 1 phần</li>
              <li>Ngày có màu đỏ: nhân viên đã đủ 8 giờ</li>
              <li>Mỗi nhân viên chỉ làm tối đa 8 giờ/ngày</li>
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );
};
