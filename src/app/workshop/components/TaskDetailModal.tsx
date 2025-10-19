'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Users,
  ChevronLeft,
  ChevronRight,
  Search,
  Check,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface WorkshopWorker {
  id: string;
  name: string;
  role: string;
  specialties: string[];
  avatar?: string;
  experience: 'junior' | 'senior' | 'expert';
  currentTaskId?: string;
}

interface SubtaskAssignment {
  subtaskIndex: number;
  workerId: string;
  date: string;
  quantity: number;
  isDone?: boolean; // Track if assignment is completed
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

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: WorkshopTask;
  workers: WorkshopWorker[];
  onSave: (task: WorkshopTask) => void;
}

export const TaskDetailModal = ({
  isOpen,
  onClose,
  task,
  workers,
  onSave,
}: TaskDetailModalProps) => {
  // Stepper state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;

  // Step 1: Date range selection
  const [selectedDateRange, setSelectedDateRange] = useState<{
    from: Date | null;
    to: Date | null;
  }>({
    from: task.startDate ? new Date(task.startDate) : null,
    to: task.endDate ? new Date(task.endDate) : null,
  });

  // Step 2: Assignment
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSubtasks, setSelectedSubtasks] = useState<number[]>([]);
  const [assignments, setAssignments] = useState<SubtaskAssignment[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [searchWorker, setSearchWorker] = useState('');

  // Load assignments from localStorage on mount
  useEffect(() => {
    const storedAssignments = localStorage.getItem(
      `task_assignments_${task.id}`,
    );
    if (storedAssignments) {
      setAssignments(JSON.parse(storedAssignments));
    }
  }, [task.id]);

  // Save assignments to localStorage whenever they change
  useEffect(() => {
    if (assignments.length > 0) {
      localStorage.setItem(
        `task_assignments_${task.id}`,
        JSON.stringify(assignments),
      );
    }
  }, [assignments, task.id]);

  if (!isOpen) return null;

  // Task name = ass_name - profile (parent level, not subtask level)
  const firstSubtask = task.subtasks[0];
  const taskAssName = firstSubtask?.ass_name || 'Không có tên';
  const taskName = `${taskAssName} - ${task.profile}`;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Validation for Step 1
  const canProceedToStep2 =
    selectedDateRange.from !== null &&
    selectedDateRange.to !== null &&
    selectedDate !== null;

  // Navigate to next step
  const goToNextStep = () => {
    if (currentStep < totalSteps) {
      if (currentStep === 1) {
        if (!selectedDateRange.from || !selectedDateRange.to) {
          alert('Vui lòng chọn ngày bắt đầu và kết thúc');
          return;
        }
        if (!selectedDate) {
          alert('Vui lòng chọn ngày cụ thể trên lịch để giao việc');
          return;
        }
      }
      setCurrentStep(currentStep + 1);
    }
  };

  // Navigate to previous step
  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Stepper Component
  const Stepper = () => (
    <div className="flex items-center justify-center mb-6">
      {[1, 2].map((step, idx) => {
        const isActive = step === currentStep;
        const isCompleted = step < currentStep;
        const stepLabels = ['Chọn thời gian', 'Phân công việc'];

        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all',
                  isCompleted &&
                    'bg-green-500 text-white ring-4 ring-green-100',
                  isActive && 'bg-primary text-white ring-4 ring-primary/20',
                  !isActive && !isCompleted && 'bg-gray-200 text-gray-500',
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <span>{step}</span>
                )}
              </div>
              <span
                className={cn(
                  'mt-2 text-sm font-medium',
                  isActive && 'text-primary',
                  isCompleted && 'text-green-600',
                  !isActive && !isCompleted && 'text-gray-500',
                )}
              >
                {stepLabels[idx]}
              </span>
            </div>
            {step < totalSteps && (
              <div
                className={cn(
                  'w-24 h-1 mx-4 rounded-full transition-all',
                  isCompleted ? 'bg-green-500' : 'bg-gray-200',
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  // Get assignments for a specific date
  const getDateAssignments = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return assignments.filter(a => a.date === dateStr);
  };

  // Get total quantity assigned for a subtask
  const getSubtaskAssignedQty = (subtaskIndex: number) => {
    return assignments
      .filter(a => a.subtaskIndex === subtaskIndex)
      .reduce((sum, a) => sum + a.quantity, 0);
  };

  // Get remaining quantity for a subtask
  const getSubtaskRemainingQty = (subtaskIndex: number) => {
    const subtask = task.subtasks[subtaskIndex];
    const total = subtask.qty_total || 0;
    const assigned = getSubtaskAssignedQty(subtaskIndex);
    return Math.max(0, total - assigned);
  };

  // Generate calendar for current month
  const getMonthDates = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const dates: (Date | null)[] = [];

    // Add empty cells for days before month starts
    const startDay = firstDay.getDay();
    for (let i = 0; i < startDay; i++) {
      dates.push(null);
    }

    // Add all days in month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      dates.push(new Date(year, month, day));
    }

    return dates;
  };

  const monthDates = getMonthDates();

  const handleDateClick = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    setSelectedDate(dateStr);
    setSelectedSubtasks([]); // Reset subtask selection
  };

  const handleSubtaskToggle = (subtaskIndex: number) => {
    setSelectedSubtasks(prev =>
      prev.includes(subtaskIndex)
        ? prev.filter(i => i !== subtaskIndex)
        : [...prev, subtaskIndex],
    );
  };

  const isSubtaskCompleted = (subtaskIndex: number) => {
    const subtask = task.subtasks[subtaskIndex];
    const totalQty = subtask.qty_total || 0;
    const assignedQty = getSubtaskAssignedQty(subtaskIndex);
    return assignedQty >= totalQty;
  };

  const addAssignment = (
    subtaskIndex: number,
    workerId: string,
    date: string,
    quantity: number,
  ) => {
    setAssignments(prev => [
      ...prev,
      { subtaskIndex, workerId, date, quantity },
    ]);
  };

  // Render Step 1: Date Range + Calendar Picker
  const renderStep1 = () => (
    <div className="h-full space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-2xl font-semibold text-gray-900 mb-2">
          Chọn thời gian và ngày giao việc
        </h3>
        <p className="text-gray-600">
          Chọn khoảng thời gian, sau đó click vào ngày cụ thể trên lịch để giao
          việc
        </p>
      </div>

      {/* Date Range */}
      <Card padding="lg">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          Khoảng thời gian thực hiện
        </h4>
        <div className="grid grid-cols-2 gap-4">
          {/* Start Date */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Từ ngày
            </label>
            <input
              type="date"
              value={
                selectedDateRange.from
                  ? selectedDateRange.from.toISOString().split('T')[0]
                  : ''
              }
              onChange={e => {
                const date = e.target.value ? new Date(e.target.value) : null;
                setSelectedDateRange(prev => ({ ...prev, from: date }));
                // Reset selected date if out of range
                if (selectedDate && date) {
                  const selDate = new Date(selectedDate);
                  if (selDate < date) setSelectedDate(null);
                }
              }}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Đến ngày
            </label>
            <input
              type="date"
              value={
                selectedDateRange.to
                  ? selectedDateRange.to.toISOString().split('T')[0]
                  : ''
              }
              min={
                selectedDateRange.from
                  ? selectedDateRange.from.toISOString().split('T')[0]
                  : undefined
              }
              onChange={e => {
                const date = e.target.value ? new Date(e.target.value) : null;
                setSelectedDateRange(prev => ({ ...prev, to: date }));
                // Reset selected date if out of range
                if (selectedDate && date) {
                  const selDate = new Date(selectedDate);
                  if (selDate > date) setSelectedDate(null);
                }
              }}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm"
            />
          </div>
        </div>
      </Card>

      {/* Calendar Picker */}
      {selectedDateRange.from && selectedDateRange.to && (
        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-gray-700">
              Chọn ngày giao việc
            </h4>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setCurrentMonth(
                    new Date(
                      currentMonth.getFullYear(),
                      currentMonth.getMonth() - 1,
                      1,
                    ),
                  )
                }
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="font-medium min-w-[120px] text-center text-sm">
                Tháng {currentMonth.getMonth() + 1},{' '}
                {currentMonth.getFullYear()}
              </span>
              <button
                onClick={() =>
                  setCurrentMonth(
                    new Date(
                      currentMonth.getFullYear(),
                      currentMonth.getMonth() + 1,
                      1,
                    ),
                  )
                }
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Weekday headers */}
            {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(day => (
              <div
                key={day}
                className="p-2 text-center text-xs font-semibold text-gray-600"
              >
                {day}
              </div>
            ))}

            {/* Calendar dates */}
            {monthDates.map((date, idx) => {
              if (!date) {
                return <div key={`empty-${idx}`} className="p-2" />;
              }

              const dateStr = date.toISOString().split('T')[0];
              const isToday = date.getTime() === today.getTime();
              const isInRange =
                selectedDateRange.from &&
                selectedDateRange.to &&
                date >= selectedDateRange.from &&
                date <= selectedDateRange.to;
              const isSelected = selectedDate === dateStr;
              const dateAssignments = getDateAssignments(date);
              const hasAssignments = dateAssignments.length > 0;

              return (
                <button
                  key={idx}
                  onClick={() => isInRange && handleDateClick(date)}
                  disabled={!isInRange}
                  className={cn(
                    'p-2 rounded-lg transition-all min-h-[45px] flex flex-col items-center justify-center text-sm relative',
                    isInRange && 'hover:bg-blue-100 cursor-pointer',
                    !isInRange && 'text-gray-300 cursor-not-allowed',
                    isToday && isInRange && 'font-bold ring-2 ring-primary/30',
                    isSelected &&
                      'bg-primary text-white ring-2 ring-primary shadow-md',
                    !isSelected && hasAssignments && 'bg-green-100',
                  )}
                >
                  <div className={cn('font-medium')}>{date.getDate()}</div>
                  {hasAssignments && !isSelected && (
                    <div className="text-[9px] text-green-700 font-semibold mt-0.5">
                      ● {dateAssignments.length}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Date Info */}
          {selectedDate && (
            <div className="mt-4 bg-primary/5 border-2 border-primary/20 rounded-lg p-3">
              <p className="text-sm font-semibold text-gray-900">
                Ngày được chọn:{' '}
                <span className="text-primary">
                  {new Date(selectedDate).toLocaleDateString('vi-VN', {
                    dateStyle: 'full',
                  })}
                </span>
              </p>
            </div>
          )}
        </Card>
      )}
    </div>
  );

  // Render Step 2: Assignment Matrix - New Clean Design
  const renderStep2 = () => {
    if (!selectedDate) {
      return (
        <div className="flex items-center justify-center h-full">
          <Card padding="lg" className="text-center max-w-md">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Chưa chọn ngày
            </h3>
            <p className="text-gray-600">
              Vui lòng quay lại Step 1 và chọn ngày cụ thể trên lịch để giao
              việc
            </p>
          </Card>
        </div>
      );
    }

    return (
      <div className="h-full">
        {/* Date Info Header */}
        <div className="mb-4 bg-primary/5 border-2 border-primary/20 rounded-lg p-4">
          <p className="text-sm font-semibold text-gray-900">
            Phân công việc cho ngày:{' '}
            <span className="text-primary">
              {new Date(selectedDate).toLocaleDateString('vi-VN', {
                dateStyle: 'full',
              })}
            </span>
          </p>
        </div>

        {/* 2 Columns: Job Selection | Assignment */}
        <div className="grid grid-cols-2 gap-4 h-[calc(100%-80px)] max-h-[40vh]">
          {/* Left: Job Selection Table - Compact */}
          <Card
            padding="lg"
            className="border-2 border-blue-500 overflow-hidden flex flex-col"
          >
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Chọn công việc cần phân công
              </h3>
              <p className="text-sm text-gray-600">
                Chọn các sản phẩm cần giao (chỉ chọn được việc chưa hoàn thành)
              </p>
            </div>

            {/* Jobs Table - Clean & Compact */}
            <div className="overflow-auto max-h-[30vh]">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 bg-gray-100 z-10">
                  <tr>
                    <th className="p-3 text-left text-xs font-semibold text-gray-700 border">
                      <input
                        type="checkbox"
                        checked={
                          selectedSubtasks.length === task.subtasks.length &&
                          task.subtasks.every(
                            (_, idx) => !isSubtaskCompleted(idx),
                          )
                        }
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedSubtasks(
                              task.subtasks
                                .map((_, idx) => idx)
                                .filter(idx => !isSubtaskCompleted(idx)),
                            );
                          } else {
                            setSelectedSubtasks([]);
                          }
                        }}
                        className="w-4 h-4"
                      />
                    </th>
                    <th className="p-3 text-left text-xs font-semibold text-gray-700 border">
                      Tên sản phẩm
                    </th>
                    <th className="p-3 text-left text-xs font-semibold text-gray-700 border">
                      Tiết diện
                    </th>
                    <th className="p-3 text-center text-xs font-semibold text-gray-700 border">
                      Tổng SL
                    </th>
                    <th className="p-3 text-center text-xs font-semibold text-gray-700 border">
                      Đã giao
                    </th>
                    <th className="p-3 text-center text-xs font-semibold text-gray-700 border">
                      Còn lại
                    </th>
                    <th className="p-3 text-left text-xs font-semibold text-gray-700 border w-[200px]">
                      Tiến độ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {task.subtasks.map((subtask, idx) => {
                    const totalQty = subtask.qty_total || 0;
                    const assignedQty = getSubtaskAssignedQty(idx);
                    const remainingQty = getSubtaskRemainingQty(idx);
                    const percent =
                      totalQty > 0
                        ? Math.round((assignedQty / totalQty) * 100)
                        : 0;
                    const isCompleted = isSubtaskCompleted(idx);
                    const isSelected = selectedSubtasks.includes(idx);

                    return (
                      <tr
                        key={idx}
                        className={cn(
                          'transition-colors',
                          isCompleted && 'bg-gray-100 opacity-60',
                          !isCompleted && isSelected && 'bg-blue-50',
                          !isCompleted && !isSelected && 'hover:bg-gray-50',
                        )}
                      >
                        <td className="p-3 border">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isCompleted}
                            onChange={() =>
                              !isCompleted && handleSubtaskToggle(idx)
                            }
                            className="w-4 h-4"
                          />
                        </td>
                        <td className="p-3 border">
                          <p className="text-sm font-medium text-gray-900">
                            {subtask.part_name || `Chi tiết ${idx + 1}`}
                          </p>
                        </td>
                        <td className="p-3 border">
                          <p className="text-sm text-gray-700">
                            {task.profile}
                          </p>
                        </td>
                        <td className="p-3 border text-center">
                          <p className="text-sm font-semibold text-gray-900">
                            {totalQty}
                          </p>
                        </td>
                        <td className="p-3 border text-center">
                          <p className="text-sm text-blue-600 font-medium">
                            {assignedQty}
                          </p>
                        </td>
                        <td className="p-3 border text-center">
                          <p
                            className={cn(
                              'text-sm font-semibold',
                              remainingQty === 0
                                ? 'text-green-600'
                                : 'text-orange-600',
                            )}
                          >
                            {remainingQty}
                          </p>
                        </td>
                        <td className="p-3 border">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  'h-full transition-all',
                                  percent === 100
                                    ? 'bg-green-500'
                                    : percent >= 75
                                    ? 'bg-blue-500'
                                    : percent >= 50
                                    ? 'bg-yellow-500'
                                    : 'bg-orange-500',
                                )}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-700 min-w-[35px]">
                              {percent}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="mt-4 flex items-center justify-between bg-primary/5 px-4 py-3 rounded-lg">
              <p className="text-sm font-medium text-gray-700">
                Đã chọn:{' '}
                <strong className="text-primary">
                  {selectedSubtasks.length}
                </strong>{' '}
                công việc
              </p>
            </div>
          </Card>

          {/* Right: Assignment Matrix n×n */}
          {selectedSubtasks.length > 0 && (
            <Card
              padding="lg"
              className="border-2 border-green-500 overflow-hidden flex flex-col"
            >
              <div className="flex-shrink-0 mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Phân công nhân viên
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Nhập số lượng và đánh dấu hoàn thành
                </p>

                {/* Search Worker */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm nhân viên..."
                    value={searchWorker}
                    onChange={e => setSearchWorker(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {/* Assignment Table */}
              <div className="flex-1 overflow-auto">
                <table className="w-full border-collapse text-sm">
                  <thead className="sticky top-0 bg-gray-100 z-10">
                    <tr>
                      <th className="p-2 text-left text-xs font-semibold text-gray-700 border sticky left-0 bg-gray-100 z-20 min-w-[140px]">
                        Nhân viên
                      </th>
                      {selectedSubtasks.map(idx => {
                        const subtask = task.subtasks[idx];
                        const remaining = getSubtaskRemainingQty(idx);
                        return (
                          <th
                            key={idx}
                            className="p-2 text-left text-xs font-semibold text-gray-700 border min-w-[120px]"
                          >
                            <div>
                              <p className="font-semibold mb-0.5 text-xs">
                                {subtask.part_name}
                              </p>
                              <p className="text-[10px] text-gray-500 font-normal">
                                Còn:{' '}
                                <strong className="text-orange-600">
                                  {remaining}
                                </strong>
                              </p>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {workers
                      .filter(
                        w =>
                          searchWorker === '' ||
                          w.name
                            .toLowerCase()
                            .includes(searchWorker.toLowerCase()) ||
                          w.role
                            .toLowerCase()
                            .includes(searchWorker.toLowerCase()),
                      )
                      .map(worker => {
                        return (
                          <tr
                            key={worker.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="p-3 border sticky left-0 bg-white z-10">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                  <Users className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 text-sm">
                                    {worker.name}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    {worker.role}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Assignment cells: Quantity + Done */}
                            {selectedSubtasks.map(subtaskIdx => {
                              const remaining =
                                getSubtaskRemainingQty(subtaskIdx);

                              // Find assignment for this worker+subtask+selectedDate
                              const currentAssignment = assignments.find(
                                a =>
                                  a.subtaskIndex === subtaskIdx &&
                                  a.workerId === worker.id &&
                                  a.date === selectedDate,
                              );

                              return (
                                <td key={subtaskIdx} className="p-2 border">
                                  <div className="flex items-center gap-2">
                                    {/* Quantity input */}
                                    <input
                                      type="number"
                                      min="0"
                                      max={
                                        remaining +
                                        (currentAssignment?.quantity || 0)
                                      }
                                      value={currentAssignment?.quantity || ''}
                                      onChange={e => {
                                        const qty =
                                          parseInt(e.target.value) || 0;
                                        if (currentAssignment) {
                                          if (qty > 0) {
                                            // Update existing
                                            setAssignments(prev =>
                                              prev.map(a =>
                                                a === currentAssignment
                                                  ? { ...a, quantity: qty }
                                                  : a,
                                              ),
                                            );
                                          } else {
                                            // Remove if 0
                                            setAssignments(prev =>
                                              prev.filter(
                                                a => a !== currentAssignment,
                                              ),
                                            );
                                          }
                                        } else if (qty > 0 && selectedDate) {
                                          // Create new assignment
                                          addAssignment(
                                            subtaskIdx,
                                            worker.id,
                                            selectedDate,
                                            qty,
                                          );
                                        }
                                      }}
                                      placeholder="SL"
                                      className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                                    />

                                    {/* Done checkbox */}
                                    {currentAssignment && (
                                      <button
                                        onClick={() => {
                                          setAssignments(prev =>
                                            prev.map(a =>
                                              a === currentAssignment
                                                ? { ...a, isDone: !a.isDone }
                                                : a,
                                            ),
                                          );
                                        }}
                                        className={cn(
                                          'w-6 h-6 rounded border-2 flex items-center justify-center transition-all flex-shrink-0',
                                          currentAssignment.isDone
                                            ? 'bg-green-500 border-green-600'
                                            : 'border-gray-300 hover:border-green-400',
                                        )}
                                      >
                                        {currentAssignment.isDone && (
                                          <Check className="w-4 h-4 text-white" />
                                        )}
                                      </button>
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
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
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-[70vw] max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">
                {taskName}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {task.profile} {task.material && `| ${task.material}`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Stepper */}
          <div className="px-6 pt-6">
            <Stepper />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-t bg-gray-50">
            <div>
              {currentStep > 1 && (
                <Button variant="secondary" onClick={goToPreviousStep}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Quay lại
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button variant="secondary" onClick={onClose}>
                Đóng
              </Button>
              {currentStep < totalSteps ? (
                <Button onClick={goToNextStep} disabled={!canProceedToStep2}>
                  Tiếp theo
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    // Save logic here
                    onSave(task);
                    onClose();
                  }}
                >
                  Lưu thay đổi
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
