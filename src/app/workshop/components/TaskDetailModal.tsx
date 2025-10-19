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
  const [selectedDateRange, setSelectedDateRange] = useState<{
    from: Date | null;
    to: Date | null;
  }>({
    from: task.startDate ? new Date(task.startDate) : null,
    to: task.endDate ? new Date(task.endDate) : null,
  });
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

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
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

          {/* Content */}
          <div className="flex-1 overflow-hidden p-6">
            <div className="grid grid-cols-2 gap-6 h-full">
              {/* Left Column: Date + Subtasks Selection */}
              <div className="flex flex-col h-full space-y-4">
                {/* Date Picker Calendar - 1/3 height */}
                <Card padding="lg" className="flex-shrink-0">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Chọn ngày giao việc
                    </h3>
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
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="font-medium min-w-[150px] text-center">
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
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-0.5">
                    {/* Weekday headers */}
                    {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(day => (
                      <div
                        key={day}
                        className="p-1 text-center text-xs font-semibold text-gray-600"
                      >
                        {day}
                      </div>
                    ))}

                    {/* Calendar dates */}
                    {monthDates.map((date, idx) => {
                      if (!date) {
                        return <div key={`empty-${idx}`} className="p-1" />;
                      }

                      const dateStr = date.toISOString().split('T')[0];
                      const isToday = date.getTime() === today.getTime();
                      const isPast = date < today;
                      const dateAssignments = getDateAssignments(date);
                      const totalQtyForDay = dateAssignments.reduce(
                        (sum, a) => sum + a.quantity,
                        0,
                      );
                      const isSelected = selectedDate === dateStr;

                      return (
                        <button
                          key={idx}
                          onClick={() => handleDateClick(date)}
                          disabled={isPast && totalQtyForDay === 0}
                          className={cn(
                            'p-1 rounded transition-all min-h-[40px] flex flex-col items-center justify-center text-xs relative',
                            isToday && 'bg-primary/20 font-bold rounded-md',
                            !isToday &&
                              totalQtyForDay > 0 &&
                              'bg-blue-50 hover:bg-blue-100',
                            !isToday &&
                              totalQtyForDay === 0 &&
                              !isPast &&
                              'hover:bg-gray-100',
                            isPast &&
                              totalQtyForDay === 0 &&
                              'text-gray-300 cursor-not-allowed',
                            isPast &&
                              totalQtyForDay > 0 &&
                              'bg-gray-50 hover:bg-gray-100',
                            isSelected && 'ring-2 ring-primary ring-inset',
                          )}
                        >
                          <div
                            className={cn(
                              'font-medium',
                              isToday && 'text-primary',
                            )}
                          >
                            {date.getDate()}
                          </div>
                          {totalQtyForDay > 0 && (
                            <div className="text-[9px] text-blue-600 font-semibold">
                              {totalQtyForDay}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </Card>

                {/* Subtasks Selection - 2/3 height with scroll */}
                {selectedDate && (
                  <Card
                    padding="lg"
                    className="border-2 border-blue-500 flex-1 overflow-hidden flex flex-col"
                  >
                    <div className="flex-shrink-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Chọn công việc cho ngày{' '}
                        {new Date(selectedDate).toLocaleDateString('vi-VN', {
                          dateStyle: 'medium',
                        })}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Chọn các sản phẩm cần giao việc (chỉ chọn được việc chưa
                        hoàn thành)
                      </p>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-2">
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
                          <button
                            key={idx}
                            onClick={() =>
                              !isCompleted && handleSubtaskToggle(idx)
                            }
                            disabled={isCompleted}
                            className={cn(
                              'w-full p-3 rounded-lg border-2 transition-all text-left flex items-center gap-3',
                              isCompleted &&
                                'opacity-50 cursor-not-allowed bg-gray-100 border-gray-300',
                              !isCompleted &&
                                isSelected &&
                                'border-primary bg-primary/5 shadow-md',
                              !isCompleted &&
                                !isSelected &&
                                'border-gray-200 bg-white hover:border-gray-400 hover:shadow-sm',
                            )}
                          >
                            {/* Checkbox */}
                            <div
                              className={cn(
                                'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0',
                                isSelected
                                  ? 'bg-primary border-primary'
                                  : 'border-gray-300',
                                isCompleted && 'bg-gray-300 border-gray-300',
                              )}
                            >
                              {isSelected && (
                                <svg
                                  className="w-3 h-3 text-white"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                            </div>

                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 text-sm mb-1">
                                {subtask.part_name || `Chi tiết ${idx + 1}`}
                              </h4>
                              <p className="text-xs text-gray-500 mb-2">
                                Tiết diện: {task.profile} | Tổng: {totalQty} SL
                              </p>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className={cn(
                                        'h-full transition-all',
                                        percent === 100
                                          ? 'bg-green-500'
                                          : 'bg-blue-500',
                                      )}
                                      style={{ width: `${percent}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-gray-600">
                                    {percent}%
                                  </span>
                                </div>
                                <span className="text-xs text-gray-600">
                                  Còn: <strong>{remainingQty}</strong>
                                </span>
                              </div>
                            </div>

                            {isCompleted && (
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                Đã xong
                              </Badge>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </Card>
                )}
              </div>

              {/* Right Column: Worker Assignment Matrix */}
              <div className="flex flex-col h-full">
                {selectedDate && selectedSubtasks.length > 0 && (
                  <Card
                    padding="lg"
                    className="border-2 border-green-500 h-full flex flex-col overflow-hidden"
                  >
                    <div className="flex-shrink-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Phân công nhân viên
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Ngày:{' '}
                        {new Date(selectedDate).toLocaleDateString('vi-VN', {
                          dateStyle: 'full',
                        })}{' '}
                        | {selectedSubtasks.length} công việc đã chọn
                      </p>

                      {/* Search Worker */}
                      <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Tìm nhân viên..."
                          value={searchWorker}
                          onChange={e => setSearchWorker(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Assignment Matrix Table */}
                    <div className="flex-1 overflow-auto max-h-[37vh]">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="p-3 text-left text-xs font-semibold text-gray-700 border border-gray-300 sticky left-0 bg-gray-100 z-10">
                              Nhân viên
                            </th>
                            {selectedSubtasks.map(idx => {
                              const subtask = task.subtasks[idx];
                              const remaining = getSubtaskRemainingQty(idx);
                              return (
                                <th
                                  key={idx}
                                  className="p-3 text-left text-xs font-semibold text-gray-700 border border-gray-300 min-w-[150px]"
                                >
                                  <div>
                                    <p className="font-semibold">
                                      {subtask.part_name}
                                    </p>
                                    <p className="text-xs text-gray-500 font-normal">
                                      Còn: {remaining} SL
                                    </p>
                                  </div>
                                </th>
                              );
                            })}
                            <th className="p-3 text-center text-xs font-semibold text-gray-700 border border-gray-300">
                              Tổng SL
                            </th>
                            <th className="p-3 text-center text-xs font-semibold text-gray-700 border border-gray-300">
                              Done
                            </th>
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
                              // Check if worker has other tasks on this date
                              const workerAssignments = assignments.filter(
                                a =>
                                  a.workerId === worker.id &&
                                  a.date === selectedDate,
                              );
                              const hasOtherTasks =
                                workerAssignments.length > 0;

                              // Calculate total quantity assigned to this worker
                              const totalQtyForWorker = selectedSubtasks.reduce(
                                (sum, subtaskIdx) => {
                                  const assignment = assignments.find(
                                    a =>
                                      a.subtaskIndex === subtaskIdx &&
                                      a.workerId === worker.id &&
                                      a.date === selectedDate,
                                  );
                                  return sum + (assignment?.quantity || 0);
                                },
                                0,
                              );

                              return (
                                <tr
                                  key={worker.id}
                                  className={cn(
                                    'hover:bg-gray-50 transition-colors',
                                    hasOtherTasks && 'bg-orange-50',
                                  )}
                                >
                                  <td className="p-3 border border-gray-300 sticky left-0 bg-white z-10">
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
                                        {/* {hasOtherTasks && (
                                      <p className="text-xs text-orange-600 mt-1">
                                        ⚠️ {workerAssignments.length} việc khác
                                      </p>
                                    )} */}
                                      </div>
                                    </div>
                                  </td>

                                  {/* Input cells for each subtask */}
                                  {selectedSubtasks.map(subtaskIdx => {
                                    const subtask = task.subtasks[subtaskIdx];
                                    const remaining =
                                      getSubtaskRemainingQty(subtaskIdx);
                                    const currentAssignment = assignments.find(
                                      a =>
                                        a.subtaskIndex === subtaskIdx &&
                                        a.workerId === worker.id &&
                                        a.date === selectedDate,
                                    );

                                    return (
                                      <td
                                        key={subtaskIdx}
                                        className="p-2 border border-gray-300"
                                      >
                                        <input
                                          type="number"
                                          min="0"
                                          max={
                                            remaining +
                                            (currentAssignment?.quantity || 0)
                                          }
                                          value={
                                            currentAssignment?.quantity || ''
                                          }
                                          onChange={e => {
                                            const qty =
                                              parseInt(e.target.value) || 0;
                                            if (currentAssignment) {
                                              // Update existing assignment
                                              setAssignments(prev =>
                                                prev
                                                  .map(a =>
                                                    a.subtaskIndex ===
                                                      subtaskIdx &&
                                                    a.workerId === worker.id &&
                                                    a.date === selectedDate
                                                      ? { ...a, quantity: qty }
                                                      : a,
                                                  )
                                                  .filter(a => a.quantity > 0),
                                              ); // Remove if quantity is 0
                                            } else if (qty > 0) {
                                              // Add new assignment
                                              addAssignment(
                                                subtaskIdx,
                                                worker.id,
                                                selectedDate,
                                                qty,
                                              );
                                            }
                                          }}
                                          placeholder="SL"
                                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                                        />
                                      </td>
                                    );
                                  })}

                                  {/* Total column */}
                                  <td className="p-3 border border-gray-300 text-center">
                                    <span
                                      className={cn(
                                        'font-semibold text-sm',
                                        totalQtyForWorker > 0
                                          ? 'text-green-600'
                                          : 'text-gray-400',
                                      )}
                                    >
                                      {totalQtyForWorker || '-'}
                                    </span>
                                  </td>

                                  {/* Done checkbox column */}
                                  <td className="p-3 border border-gray-300 text-center">
                                    {totalQtyForWorker > 0 &&
                                      selectedSubtasks.map(subtaskIdx => {
                                        const assignment = assignments.find(
                                          a =>
                                            a.subtaskIndex === subtaskIdx &&
                                            a.workerId === worker.id &&
                                            a.date === selectedDate,
                                        );
                                        if (!assignment) return null;

                                        return (
                                          <button
                                            key={subtaskIdx}
                                            onClick={() => {
                                              setAssignments(prev =>
                                                prev.map(a =>
                                                  a === assignment
                                                    ? {
                                                        ...a,
                                                        isDone: !a.isDone,
                                                      }
                                                    : a,
                                                ),
                                              );
                                            }}
                                            className={cn(
                                              'w-6 h-6 rounded border-2 flex items-center justify-center transition-all mx-auto mb-1',
                                              assignment.isDone
                                                ? 'bg-green-500 border-green-600'
                                                : 'border-gray-300 hover:border-green-400',
                                            )}
                                          >
                                            {assignment.isDone && (
                                              <Check className="w-4 h-4 text-white" />
                                            )}
                                          </button>
                                        );
                                      })}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>

                        {/* Summary row */}
                        <tfoot>
                          <tr className="bg-gray-100 font-semibold">
                            <td className="p-3 border border-gray-300 text-sm sticky left-0 bg-gray-100 z-10">
                              Tổng đã phân
                            </td>
                            {selectedSubtasks.map(subtaskIdx => {
                              const totalAssigned = assignments
                                .filter(
                                  a =>
                                    a.subtaskIndex === subtaskIdx &&
                                    a.date === selectedDate,
                                )
                                .reduce((sum, a) => sum + a.quantity, 0);
                              const remaining =
                                getSubtaskRemainingQty(subtaskIdx);
                              const total =
                                task.subtasks[subtaskIdx].qty_total || 0;

                              return (
                                <td
                                  key={subtaskIdx}
                                  className="p-3 border border-gray-300 text-sm"
                                >
                                  <div className="flex items-center justify-between">
                                    <span
                                      className={cn(
                                        totalAssigned >= total
                                          ? 'text-green-600'
                                          : 'text-blue-600',
                                      )}
                                    >
                                      {totalAssigned}/{total}
                                    </span>
                                    {remaining > 0 && (
                                      <Badge className="text-xs bg-yellow-100 text-yellow-800">
                                        -{remaining}
                                      </Badge>
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                            <td className="p-3 border border-gray-300 text-center text-sm">
                              <span className="text-primary">
                                {assignments
                                  .filter(
                                    a =>
                                      selectedSubtasks.includes(
                                        a.subtaskIndex,
                                      ) && a.date === selectedDate,
                                  )
                                  .reduce((sum, a) => sum + a.quantity, 0)}
                              </span>
                            </td>
                            <td className="p-3 border border-gray-300 text-center text-sm">
                              <span className="text-green-600 font-semibold">
                                {
                                  assignments.filter(
                                    a =>
                                      selectedSubtasks.includes(
                                        a.subtaskIndex,
                                      ) &&
                                      a.date === selectedDate &&
                                      a.isDone,
                                  ).length
                                }
                              </span>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-sm text-gray-600">
                        💡 Nhập số lượng trực tiếp vào ô để phân công việc
                      </p>
                      <Button
                        onClick={() => {
                          // Save assignments
                          alert('Đã lưu phân công thành công!');
                        }}
                      >
                        Lưu phân công
                      </Button>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
            <Button variant="secondary" onClick={onClose}>
              Đóng
            </Button>
            <Button
              onClick={() => {
                // Save logic here
                onSave(task);
                onClose();
              }}
            >
              Lưu thay đổi
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
