'use client';

import React, { useState } from 'react';
import {
  X,
  Calendar,
  Users,
  ChevronLeft,
  ChevronRight,
  Search,
  Check,
  CheckCircle2,
  ClipboardList,
  UserCheck,
  CalendarCheck,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { ReviewModal } from './ReviewModal';
import { WorkerAssignmentCard } from './WorkerAssignmentCard';
import { WorkerSummaryCards } from './WorkerSummaryCards';
import { ProgressVisualization } from './ProgressVisualization';
import { WorkerScheduleCalendar } from './WorkerScheduleCalendar';

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

interface WorkerAssignment {
  workerId: string;
  subtaskIndex: number;
  quantity: number;
  hoursPerDay: number; // Số giờ làm mỗi ngày cho assignment này
  startDate?: string;
  endDate?: string;
  isDone?: boolean;
  doneAt?: string;
  doneBy?: string;
}

interface FinalAssignment {
  workerId: string;
  workerName: string;
  subtaskIndex: number;
  subtaskName: string;
  quantity: number;
  hoursPerDay: number; // Số giờ làm mỗi ngày
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

interface OTRequest {
  workerId: string;
  workerName: string;
  date: string;
  currentHours: number;
  requestedHours: number;
  reason: string;
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
  // Mode selection: null = show options, 'assign' = assignment flow, 'review' = review flow
  const [modalMode, setModalMode] = useState<'assign' | 'review' | null>(null);

  // Force re-render trigger when localStorage changes
  const [refreshKey, setRefreshKey] = useState(0);

  // Stepper state - 4 steps (for assign mode)
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // Step 1: Select subtasks
  const [selectedSubtasks, setSelectedSubtasks] = useState<number[]>([]);
  const [searchSubtask, setSearchSubtask] = useState('');
  const [showAssignedSubtasks, setShowAssignedSubtasks] = useState(true);
  const [showPendingReview, setShowPendingReview] = useState(true);
  const [reassigningSubtask, setReassigningSubtask] = useState<number | null>(
    null,
  );
  const [subtaskFilter, setSubtaskFilter] = useState<
    'all' | 'unassigned' | 'partial' | 'complete'
  >('all');
  const [reviewingAssignment, setReviewingAssignment] = useState<{
    assignment: FinalAssignment;
    action: 'approve' | 'reject';
  } | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewImages, setReviewImages] = useState<string[]>([]);

  // Step 2: Assign workers with quantities
  const [workerAssignments, setWorkerAssignments] = useState<
    WorkerAssignment[]
  >([]);
  const [searchWorker, setSearchWorker] = useState('');

  // OT Request Modal
  const [showOTModal, setShowOTModal] = useState(false);
  const [otRequestData, setOTRequestData] = useState<{
    workerId: string;
    workerName: string;
    currentHours: number;
  } | null>(null);
  const [otHours, setOTHours] = useState<number>(0);
  const [otReason, setOTReason] = useState<string>('');
  const [hoveredWorker, setHoveredWorker] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Step 3: Select date range for each assignment (not used anymore, kept for compatibility)
  const [dateRange, setDateRange] = useState<{
    from: Date | null;
    to: Date | null;
  }>({
    from: task.startDate ? new Date(task.startDate) : null,
    to: task.endDate ? new Date(task.endDate) : null,
  });

  // Step 4: Final assignments view (auto-generated from previous steps)
  const [finalAssignments, setFinalAssignments] = useState<FinalAssignment[]>(
    [],
  );
  const [expandedSubtasks, setExpandedSubtasks] = useState<Set<number>>(
    new Set(),
  );

  // Auto-assign today's date to all assignments when entering step 3
  React.useEffect(() => {
    if (currentStep === 3) {
      const today = new Date().toISOString();
      const hasUnassignedDates = workerAssignments.some(
        a => !a.startDate || !a.endDate,
      );
      if (hasUnassignedDates) {
        setWorkerAssignments(prev =>
          prev.map(a => ({
            ...a,
            startDate: a.startDate || today,
            endDate: a.endDate || today,
          })),
        );
      }
    }
  }, [currentStep, workerAssignments]);

  if (!isOpen) return null;

  // Task name
  const firstSubtask = task.subtasks[0];
  const taskAssName = firstSubtask?.ass_name || 'Không có tên';
  const taskName = `${taskAssName} - ${task.profile}`;

  // Load existing assignments for progress calculation - refreshKey ensures this recalculates
  const existingAssignments = React.useMemo(() => {
    return JSON.parse(
      localStorage.getItem(`task_assignments_${task.id}`) || '[]',
    ) as FinalAssignment[];
  }, [task.id, refreshKey]);

  // Calculate progress - count subtasks that are FULLY APPROVED (not just assigned)
  const totalSubtasks = task.subtasks.length;
  const assignedSubtasks = task.subtasks.filter((subtask, idx) => {
    const assignments = existingAssignments.filter(a => a.subtaskIndex === idx);
    const totalQty = subtask.qty_total || 0;
    // Count only approved quantity
    const approvedQty = assignments
      .filter(a => a.isApproved)
      .reduce((sum, a) => sum + a.quantity, 0);
    return approvedQty >= totalQty; // Subtask is completed when approved qty meets total
  }).length;

  // Count pending reviews
  const pendingReviewCount = existingAssignments.filter(
    a => a.isDone && !a.isApproved && !a.isRejected,
  ).length;

  // Prepare subtask progress data for ProgressVisualization
  const subtaskProgress = task.subtasks.map((subtask, idx) => {
    const assignments = existingAssignments.filter(a => a.subtaskIndex === idx);
    const totalQty = subtask.qty_total || 0;
    const assignedQty = assignments.reduce((sum, a) => sum + a.quantity, 0);
    const completedQty = assignments
      .filter(a => a.isApproved)
      .reduce((sum, a) => sum + a.quantity, 0);
    const remainingQty = totalQty - assignedQty;

    return {
      subtaskIdx: idx,
      subtaskName: subtask.part_name || `Chi tiết ${idx + 1}`,
      totalQty,
      assignedQty,
      completedQty,
      remainingQty,
      assignments,
    };
  });

  // Handle subtask click for ProgressVisualization
  const handleSubtaskClick = (subtaskIndex: number) => {
    // Scroll to the subtask in step 1
    setCurrentStep(1);
    setSelectedSubtasks([subtaskIndex]);
    // Find and scroll to subtask element
    setTimeout(() => {
      const element = document.getElementById(`subtask-${subtaskIndex}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  // Navigation
  const goToNextStep = () => {
    if (currentStep === 1) {
      if (selectedSubtasks.length === 0) {
        alert('Vui lòng chọn ít nhất 1 công việc');
        return;
      }
    } else if (currentStep === 2) {
      if (workerAssignments.length === 0) {
        alert('Vui lòng phân công ít nhất 1 người');
        return;
      }
      // Validate all quantities assigned
      for (const subtaskIdx of selectedSubtasks) {
        const totalQty = task.subtasks[subtaskIdx].qty_total || 0;
        const assignedQty = workerAssignments
          .filter(a => a.subtaskIndex === subtaskIdx)
          .reduce((sum, a) => sum + a.quantity, 0);
        if (assignedQty !== totalQty) {
          alert(
            `Công việc "${task.subtasks[subtaskIdx].part_name}" chưa phân đủ số lượng (cần ${totalQty}, đã phân ${assignedQty})`,
          );
          return;
        }
      }
    } else if (currentStep === 3) {
      // Validate all assignments have dates
      const missingDates = workerAssignments.filter(
        a => !a.startDate || !a.endDate,
      );
      if (missingDates.length > 0) {
        alert('Vui lòng chọn thời gian cho tất cả các phân công');
        return;
      }
      // Generate final assignments
      const finals: FinalAssignment[] = workerAssignments.map(assignment => {
        const worker = workers.find(w => w.id === assignment.workerId);
        const subtask = task.subtasks[assignment.subtaskIndex];
        return {
          workerId: assignment.workerId,
          workerName: worker?.name || 'Unknown',
          subtaskIndex: assignment.subtaskIndex,
          subtaskName:
            subtask.part_name || `Chi tiết ${assignment.subtaskIndex + 1}`,
          quantity: assignment.quantity,
          hoursPerDay: assignment.hoursPerDay,
          startDate: assignment.startDate!,
          endDate: assignment.endDate!,
          isDone: assignment.isDone,
          doneAt: assignment.doneAt,
          doneBy: assignment.doneBy,
        };
      });
      setFinalAssignments(finals);
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = () => {
    // Save assignments to localStorage
    localStorage.setItem(
      `task_assignments_${task.id}`,
      JSON.stringify(finalAssignments),
    );

    // Calculate progress for each subtask
    const updatedSubtasks = task.subtasks.map(subtask => {
      const subtaskAssignments = finalAssignments.filter(
        a => a.subtaskIndex === subtask.index,
      );
      const totalAssigned = subtaskAssignments.reduce(
        (sum, a) => sum + a.quantity,
        0,
      );
      const completedQty = subtaskAssignments
        .filter(a => a.isDone)
        .reduce((sum, a) => sum + a.quantity, 0);

      const completionPercent =
        totalAssigned > 0 ? (completedQty / totalAssigned) * 100 : 0;

      return {
        ...subtask,
        completionPercent,
      };
    });

    // Calculate overall task progress
    const totalQty = updatedSubtasks.reduce(
      (sum, s) => sum + (s.qty_total || 0),
      0,
    );
    const completedTotalQty = updatedSubtasks.reduce((sum, s) => {
      const subtaskAssignments = finalAssignments.filter(
        a => a.subtaskIndex === s.index,
      );
      const completedQty = subtaskAssignments
        .filter(a => a.isDone)
        .reduce((sum, a) => sum + a.quantity, 0);
      return sum + completedQty;
    }, 0);

    const taskProgress =
      totalQty > 0 ? (completedTotalQty / totalQty) * 100 : 0;

    // Update task with new data
    const updatedTask = {
      ...task,
      subtasks: updatedSubtasks,
      progress: taskProgress,
      assignedWorkers: Array.from(
        new Set(workerAssignments.map(a => a.workerId)),
      ),
    };

    onSave(updatedTask);
    onClose();
  };

  // Mode Selection Screen
  const renderModeSelection = () => {
    return (
      <div className="p-8">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">
            Chọn chức năng
          </h3>
          <p className="text-gray-600">Bạn muốn làm gì với task này?</p>
        </div>

        <div className="grid grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Assign Mode */}
          <button
            onClick={() => setModalMode('assign')}
            className="group p-8 border-2 border-gray-300 rounded-xl hover:border-primary hover:shadow-lg transition-all bg-white"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center mb-4 transition-colors">
                <UserCheck className="w-10 h-10 text-primary" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">
                Phân công việc
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                Giao việc cho nhân viên, chọn thời gian và phân bổ công việc
              </p>
              <div className="text-sm space-y-1">
                <p className="text-gray-700">
                  Tiến độ:{' '}
                  <strong className="text-primary">
                    {assignedSubtasks}/{totalSubtasks}
                  </strong>{' '}
                  subtask
                </p>
              </div>
            </div>
          </button>

          {/* Review Mode */}
          <button
            onClick={() => setModalMode('review')}
            className="group p-8 border-2 border-gray-300 rounded-xl hover:border-yellow-500 hover:shadow-lg transition-all bg-white relative"
          >
            {pendingReviewCount > 0 && (
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                {pendingReviewCount}
              </div>
            )}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-yellow-500/10 group-hover:bg-yellow-500/20 flex items-center justify-center mb-4 transition-colors">
                <CheckCircle2 className="w-10 h-10 text-yellow-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">
                Xác nhận công việc
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                Kiểm tra và xác nhận công việc đã hoàn thành, hoặc yêu cầu sửa
                lại
              </p>
              <div className="text-sm">
                {pendingReviewCount > 0 ? (
                  <p className="text-yellow-700 font-semibold">
                    {pendingReviewCount} công việc chờ xác nhận
                  </p>
                ) : (
                  <p className="text-gray-500">Không có việc cần xác nhận</p>
                )}
              </div>
            </div>
          </button>
        </div>
      </div>
    );
  };

  // Stepper Component
  const Stepper = () => {
    const stepLabels = [
      'Chọn công việc',
      'Phân công người',
      'Chọn thời gian',
      'Xem tổng kết',
    ];
    const stepIcons = [
      <ClipboardList key="1" className="w-5 h-5" />,
      <UserCheck key="2" className="w-5 h-5" />,
      <CalendarCheck key="3" className="w-5 h-5" />,
      <FileText key="4" className="w-5 h-5" />,
    ];

    return (
      <div className="flex items-center justify-center mb-8">
        {[1, 2, 3, 4].map((step, idx) => {
          const isActive = step === currentStep;
          const isCompleted = step < currentStep;

          return (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all shadow-md',
                    isCompleted &&
                      'bg-green-500 text-white ring-4 ring-green-100',
                    isActive &&
                      'bg-primary text-white ring-4 ring-primary/20 scale-110',
                    !isActive && !isCompleted && 'bg-gray-200 text-gray-500',
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    stepIcons[idx]
                  )}
                </div>
                <span
                  className={cn(
                    'mt-2 text-xs font-medium text-center max-w-[80px]',
                    isActive && 'text-primary font-semibold',
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
                    'w-16 h-1 mx-2 rounded-full transition-all mt-[-20px]',
                    isCompleted ? 'bg-green-500' : 'bg-gray-200',
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  // Handle review actions (moved to component level)
  const handleReview = (
    assignment: FinalAssignment,
    action: 'approve' | 'reject',
  ) => {
    setReviewingAssignment({ assignment, action });
    setReviewComment('');
    setReviewImages([]);
  };

  const submitReview = () => {
    if (!reviewingAssignment) return;

    const { assignment, action } = reviewingAssignment;

    // Update assignment in localStorage
    const updatedAssignments = existingAssignments.map(a => {
      if (
        a.workerId === assignment.workerId &&
        a.subtaskIndex === assignment.subtaskIndex
      ) {
        return {
          ...a,
          isApproved: action === 'approve',
          isRejected: action === 'reject',
          reviewComment,
          reviewImages,
          reviewedAt: new Date().toISOString(),
          reviewedBy: 'Kỹ sư trưởng', // TODO: get from user context
        };
      }
      return a;
    });

    localStorage.setItem(
      `task_assignments_${task.id}`,
      JSON.stringify(updatedAssignments),
    );

    // Close review modal
    setReviewingAssignment(null);

    // Force re-render
    setReviewComment('');
    setReviewImages([]);
    setRefreshKey(prev => prev + 1);
  };

  // Step 1: Select Subtasks - Three Sections
  const renderStep1 = () => {
    const toggleSubtask = (idx: number) => {
      // Check if this subtask is fully approved - if so, don't allow selection
      const assignments = existingAssignments.filter(
        a => a.subtaskIndex === idx,
      );
      const totalQty = task.subtasks[idx].qty_total || 0;
      const approvedQty = assignments
        .filter(a => a.isApproved)
        .reduce((sum, a) => sum + a.quantity, 0);

      if (approvedQty >= totalQty) {
        alert(
          'Công việc này đã hoàn thành và được xác nhận. Không thể phân công thêm.',
        );
        return;
      }

      setSelectedSubtasks(prev =>
        prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx],
      );
    };

    // Load existing assignments from localStorage to determine status
    const existingAssignments = JSON.parse(
      localStorage.getItem(`task_assignments_${task.id}`) || '[]',
    ) as FinalAssignment[];

    // Get assignments pending review (done but not approved/rejected)
    const pendingReviewAssignments = existingAssignments.filter(
      a => a.isDone && !a.isApproved && !a.isRejected,
    );

    // Categorize subtasks
    const subtasksWithStatus = task.subtasks.map((subtask, idx) => {
      const assignments = existingAssignments.filter(
        a => a.subtaskIndex === idx,
      );
      const totalQty = subtask.qty_total || 0;
      const assignedQty = assignments.reduce((sum, a) => sum + a.quantity, 0);

      // Check if all assignments are approved (completed)
      const approvedQty = assignments
        .filter(a => a.isApproved)
        .reduce((sum, a) => sum + a.quantity, 0);
      const isFullyApproved = approvedQty >= totalQty;

      // Fully assigned = has enough quantity assigned (but may not be approved yet)
      const isFullyAssigned = assignedQty >= totalQty;

      return {
        ...subtask,
        index: idx,
        assignedQty,
        approvedQty,
        isFullyAssigned,
        isFullyApproved,
        assignments,
      };
    });

    const assignedSubtasks = subtasksWithStatus.filter(s => s.isFullyAssigned);
    const unassignedSubtasks = subtasksWithStatus.filter(
      s => !s.isFullyAssigned,
    );

    // Filter unassigned by search
    const filteredUnassigned = unassignedSubtasks.filter(s => {
      if (!searchSubtask) return true;
      const search = searchSubtask.toLowerCase();
      return (
        s.part_name?.toLowerCase().includes(search) ||
        false ||
        task.profile.toLowerCase().includes(search)
      );
    });

    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">
            Chọn các công việc cần phân công
          </h3>
          <p className="text-gray-600">
            Chọn những công việc bạn muốn phân công cho nhân viên
          </p>
        </div>

        {/* Section 0: Pending Review Assignments - Compact */}
        {pendingReviewAssignments.length > 0 && (
          <Card
            padding="md"
            className="border-2 border-yellow-300 bg-yellow-50/50"
          >
            <div
              className="flex items-center justify-between cursor-pointer mb-2"
              onClick={() => setShowPendingReview(!showPendingReview)}
            >
              <div className="flex items-center gap-2">
                <button className="text-yellow-700">
                  {showPendingReview ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                <h4 className="text-sm font-semibold text-yellow-900">
                  Chờ xác nhận
                </h4>
                <Badge className="bg-yellow-600 text-white text-xs">
                  {pendingReviewAssignments.length} việc
                </Badge>
              </div>
            </div>

            {showPendingReview && (
              <div className="mt-2 space-y-1 max-h-[30vh] overflow-y-auto">
                {pendingReviewAssignments.map((assignment, aIdx) => (
                  <div
                    key={aIdx}
                    className="p-2 border border-yellow-200 bg-white rounded flex items-center justify-between gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">
                        {assignment.subtaskName}
                      </p>
                      <p className="text-xs text-gray-600">
                        {assignment.workerName} • SL: {assignment.quantity}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 text-xs"
                        onClick={() => handleReview(assignment, 'approve')}
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Xác nhận
                      </Button>
                      <Button
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 text-xs"
                        onClick={() => handleReview(assignment, 'reject')}
                      >
                        <X className="w-3 h-3 mr-1" />
                        Sửa
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Section 2: All Subtasks with Search & Filter */}
        <Card padding="lg">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-gray-900">
                Danh sách công việc ({task.subtasks.length})
              </h4>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
              <button
                onClick={() => setSubtaskFilter('all')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
                  subtaskFilter === 'all'
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                )}
              >
                Tất cả ({subtasksWithStatus.length})
              </button>
              <button
                onClick={() => setSubtaskFilter('unassigned')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
                  subtaskFilter === 'unassigned'
                    ? 'bg-gray-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                )}
              >
                Chưa giao (
                {subtasksWithStatus.filter(s => s.assignedQty === 0).length})
              </button>
              <button
                onClick={() => setSubtaskFilter('partial')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
                  subtaskFilter === 'partial'
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                )}
              >
                Giao 1 phần (
                {
                  subtasksWithStatus.filter(
                    s => s.assignedQty > 0 && !s.isFullyAssigned,
                  ).length
                }
                )
              </button>
              <button
                onClick={() => setSubtaskFilter('complete')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
                  subtaskFilter === 'complete'
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                )}
              >
                Đã giao đủ (
                {subtasksWithStatus.filter(s => s.isFullyAssigned).length})
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm công việc..."
                value={searchSubtask}
                onChange={e => setSearchSubtask(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          <div className="space-y-1.5 max-h-[45vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
            {/* Show all subtasks filtered by search and filter */}
            {subtasksWithStatus
              .filter(s => {
                // Apply filter
                if (subtaskFilter === 'unassigned' && s.assignedQty > 0)
                  return false;
                if (
                  subtaskFilter === 'partial' &&
                  (s.assignedQty === 0 || s.isFullyAssigned)
                )
                  return false;
                if (subtaskFilter === 'complete' && !s.isFullyAssigned)
                  return false;

                // Apply search
                if (!searchSubtask) return true;
                const search = searchSubtask.toLowerCase();
                return (
                  s.part_name?.toLowerCase().includes(search) ||
                  false ||
                  task.profile.toLowerCase().includes(search)
                );
              })
              .map(subtask => {
                const isSelected = selectedSubtasks.includes(subtask.index);
                const totalQty = subtask.qty_total || 0;
                const remainingQty = totalQty - subtask.assignedQty;
                const isFullyAssigned = subtask.isFullyAssigned;
                const isFullyApproved = subtask.isFullyApproved;

                return (
                  <div
                    key={subtask.index}
                    id={`subtask-${subtask.index}`}
                    className={cn(
                      'p-2 border rounded-lg transition-all flex items-center gap-2',
                      isFullyApproved
                        ? 'border-emerald-400 bg-emerald-50 cursor-not-allowed opacity-75'
                        : isFullyAssigned
                        ? 'border-green-300 bg-green-50'
                        : isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-300 hover:border-gray-400 bg-white',
                    )}
                  >
                    {/* Checkbox or Approved Icon */}
                    {isFullyApproved ? (
                      <div className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </div>
                    ) : !isFullyAssigned ? (
                      <div
                        onClick={() => toggleSubtask(subtask.index)}
                        className={cn(
                          'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 cursor-pointer',
                          isSelected
                            ? 'bg-primary border-primary'
                            : 'border-gray-400',
                        )}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    ) : null}

                    {/* Name - flex-1 to take remaining space */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          'font-semibold text-sm truncate',
                          isFullyApproved
                            ? 'text-emerald-900'
                            : 'text-gray-900',
                        )}
                      >
                        {subtask.part_name || `Chi tiết ${subtask.index + 1}`}
                      </p>
                    </div>

                    {/* Status badge and actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isFullyApproved ? (
                        <Badge className="bg-emerald-600 text-white text-xs">
                          ✓ Hoàn thành {subtask.approvedQty}/{totalQty}
                        </Badge>
                      ) : isFullyAssigned ? (
                        <>
                          <Badge className="bg-yellow-600 text-white text-xs">
                            Đã giao {subtask.assignedQty}/{totalQty}
                          </Badge>
                          <Button
                            size="sm"
                            onClick={() => setReassigningSubtask(subtask.index)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1"
                          >
                            Phân công lại
                          </Button>
                        </>
                      ) : (
                        <Badge
                          className={cn(
                            'text-xs',
                            subtask.assignedQty > 0
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-gray-100 text-gray-700',
                          )}
                        >
                          Đã giao {subtask.assignedQty}/{totalQty}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}

            {subtasksWithStatus.filter(s => {
              if (!searchSubtask) return true;
              const search = searchSubtask.toLowerCase();
              return (
                s.part_name?.toLowerCase().includes(search) ||
                false ||
                task.profile.toLowerCase().includes(search)
              );
            }).length === 0 && (
              <div className="text-center py-8 text-gray-400">
                Không tìm thấy công việc phù hợp
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  };

  // Helper: Calculate total hours assigned for a worker on a specific date
  const getWorkerHoursOnDate = (workerId: string, date: string): number => {
    // Get all assignments from localStorage for ALL tasks on this date
    const allAssignments: FinalAssignment[] = [];

    if (typeof window !== 'undefined') {
      // Iterate through all localStorage keys to find all task assignments
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('task_assignments_')) {
          try {
            const assignments = JSON.parse(localStorage.getItem(key) || '[]');
            allAssignments.push(...assignments);
          } catch (e) {
            console.error(`Error loading ${key}:`, e);
          }
        }
      }
    }

    return allAssignments
      .filter(a => {
        if (a.workerId !== workerId) return false;
        const assignmentStart = new Date(a.startDate);
        const assignmentEnd = new Date(a.endDate);
        const checkDate = new Date(date);
        return checkDate >= assignmentStart && checkDate <= assignmentEnd;
      })
      .reduce((sum, a) => sum + (a.hoursPerDay || 0), 0);
  };

  // Step 2: Optimized Worker Assignment with Auto Hours Management
  const renderStep2 = () => {
    const filteredWorkers = workers.filter(w => {
      if (searchWorker === '') return true;
      const search = searchWorker.toLowerCase();
      return (
        w.name.toLowerCase().includes(search) ||
        w.role.toLowerCase().includes(search) ||
        w.specialties.some(s => s.toLowerCase().includes(search))
      );
    });

    // Calculate totals and remaining quantities
    const getAssignedQty = (subtaskIdx: number) => {
      return workerAssignments
        .filter(a => a.subtaskIndex === subtaskIdx)
        .reduce((sum, a) => sum + a.quantity, 0);
    };

    const getRemainingQty = (subtaskIdx: number) => {
      const total = task.subtasks[subtaskIdx].qty_total || 0;
      const assigned = getAssignedQty(subtaskIdx);
      return total - assigned;
    };

    // Smart assignment update with separate hours input
    const updateAssignment = (
      workerId: string,
      subtaskIdx: number,
      quantity: number,
      hoursPerDay: number = 0,
    ) => {
      setWorkerAssignments(prev => {
        const existing = prev.find(
          a => a.workerId === workerId && a.subtaskIndex === subtaskIdx,
        );

        if (existing) {
          if (quantity <= 0) {
            return prev.filter(a => a !== existing);
          }
          return prev.map(a =>
            a === existing ? { ...a, quantity, hoursPerDay } : a,
          );
        } else if (quantity > 0) {
          return [
            ...prev,
            { workerId, subtaskIndex: subtaskIdx, quantity, hoursPerDay },
          ];
        }
        return prev;
      });
    };

    // Calculate worker's total assigned hours for this week
    const getWorkerWeeklyHours = (workerId: string) => {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // End of week (Saturday)
      endOfWeek.setHours(23, 59, 59, 999);

      // Get all assignments from localStorage for ALL tasks in this week
      const allAssignments: FinalAssignment[] = [];

      if (typeof window !== 'undefined') {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('task_assignments_')) {
            try {
              const assignments = JSON.parse(localStorage.getItem(key) || '[]');
              allAssignments.push(...assignments);
            } catch (e) {
              console.error(`Error loading ${key}:`, e);
            }
          }
        }
      }

      return allAssignments
        .filter(a => {
          if (a.workerId !== workerId) return false;
          const assignmentStart = new Date(a.startDate);
          const assignmentEnd = new Date(a.endDate);
          // Check if assignment overlaps with this week
          return assignmentEnd >= startOfWeek && assignmentStart <= endOfWeek;
        })
        .reduce((sum, a) => sum + (a.hoursPerDay || 0), 0);
    };

    // Calculate worker's total assigned hours for today (for display)
    const getWorkerTodayHours = (workerId: string) => {
      const today = new Date().toISOString().split('T')[0];
      const savedHours = getWorkerHoursOnDate(workerId, today);
      const currentHours = workerAssignments
        .filter(a => a.workerId === workerId)
        .reduce((sum, a) => sum + (a.hoursPerDay || 0), 0);
      return savedHours + currentHours;
    };

    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">
            Phân công nhanh - Quản lý giờ làm việc
          </h3>
          <p className="text-gray-600">
            Nhập số lượng cấu kiện và số giờ làm việc. Quá 40 giờ/tuần sẽ hiện
            nút xin OT.
          </p>
        </div>

        {/* Search Worker */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm nhân viên..."
            value={searchWorker}
            onChange={e => setSearchWorker(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        {/* Compact Summary Cards */}
        <div className="grid grid-cols-4 gap-3">
          {selectedSubtasks.map(idx => {
            const subtask = task.subtasks[idx];
            const total = subtask.qty_total || 0;
            const assigned = getAssignedQty(idx);
            const remaining = total - assigned;

            return (
              <Card
                key={idx}
                padding="sm"
                className={cn(
                  'border-2',
                  remaining === 0
                    ? 'border-green-300 bg-green-50'
                    : 'border-orange-300 bg-orange-50',
                )}
              >
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-1 truncate">
                    {subtask.part_name || `CV ${idx + 1}`}
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {assigned}/{total}
                  </p>
                  <p
                    className={cn(
                      'text-xs font-semibold',
                      remaining === 0 ? 'text-green-700' : 'text-orange-700',
                    )}
                  >
                    {remaining === 0 ? '✓ Đủ' : `Còn ${remaining}`}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Optimized Assignment Table */}
        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">
              Phân công ({filteredWorkers.length} nhân viên)
            </h4>
            <div className="text-xs text-gray-500">
              💡 Nhập số lượng → tự tính giờ → quá 8h hiện nút OT
            </div>
          </div>

          <div className="overflow-x-auto max-h-[60vh] overflow-y-auto border-2 border-gray-200 rounded-lg">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-gray-100 z-10">
                <tr>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700 border-b-2 border-r-2 border-gray-300 sticky left-0 bg-gray-100 z-20 min-w-[250px]">
                    Nhân viên
                  </th>
                  {selectedSubtasks.map(idx => {
                    const subtask = task.subtasks[idx];
                    const remaining = getRemainingQty(idx);
                    const total = subtask.qty_total || 0;
                    return (
                      <th
                        key={idx}
                        className="p-3 text-center text-xs font-semibold text-gray-700 border-b-2 border-gray-300 min-w-[120px]"
                      >
                        <div>
                          <p className="font-semibold mb-1 truncate">
                            {subtask.part_name || `CV ${idx + 1}`}
                          </p>
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-[10px] text-gray-500">
                              {total}
                            </span>
                            <span
                              className={cn(
                                'text-[10px] font-bold',
                                remaining === 0
                                  ? 'text-green-600'
                                  : 'text-orange-600',
                              )}
                            >
                              ({remaining})
                            </span>
                          </div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {filteredWorkers.map((worker, workerIdx) => {
                  const workerTotalQty = workerAssignments
                    .filter(a => a.workerId === worker.id)
                    .reduce((sum, a) => sum + a.quantity, 0);

                  const workerWeeklyHours = getWorkerWeeklyHours(worker.id);
                  const workerTodayHours = getWorkerTodayHours(worker.id);
                  const isOverHours = workerWeeklyHours > 40;
                  const needsOT = workerWeeklyHours >= 40;

                  return (
                    <tr
                      key={worker.id}
                      className={cn(
                        'hover:bg-gray-50 transition-colors',
                        workerIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50',
                        isOverHours && 'bg-red-50/30',
                      )}
                    >
                      <td className="p-3 border-b border-r-2 border-gray-200 sticky left-0 bg-inherit z-10">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Users className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm">
                              {worker.name}
                            </p>
                            <p className="text-xs text-gray-600 mb-2">
                              {worker.role}
                            </p>

                            {/* Worker Stats */}
                            <div className="space-y-1">
                              {workerTotalQty > 0 && (
                                <Badge className="bg-blue-100 text-blue-700 text-xs w-fit">
                                  Tổng SL: {workerTotalQty}
                                </Badge>
                              )}

                              <div className="flex items-center gap-2">
                                <Badge
                                  className={cn(
                                    'text-xs',
                                    isOverHours
                                      ? 'bg-red-100 text-red-700'
                                      : needsOT
                                      ? 'bg-orange-100 text-orange-700'
                                      : 'bg-green-100 text-green-700',
                                  )}
                                >
                                  {workerWeeklyHours.toFixed(1)}/40h
                                </Badge>

                                {/* OT Button - Only show when >= 40 hours */}
                                {needsOT && (
                                  <button
                                    onClick={() => {
                                      setOTRequestData({
                                        workerId: worker.id,
                                        workerName: worker.name,
                                        currentHours: workerWeeklyHours,
                                      });
                                      setShowOTModal(true);
                                    }}
                                    className="text-[10px] px-2 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors font-medium"
                                  >
                                    Xin OT
                                  </button>
                                )}
                              </div>

                              {isOverHours && (
                                <p className="text-xs text-red-600 font-semibold">
                                  ⚠️ Vượt quá 40 giờ/tuần!
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {selectedSubtasks.map(subtaskIdx => {
                        const subtask = task.subtasks[subtaskIdx];
                        const remaining = getRemainingQty(subtaskIdx);
                        const currentAssignment = workerAssignments.find(
                          a =>
                            a.workerId === worker.id &&
                            a.subtaskIndex === subtaskIdx,
                        );
                        const currentQty = currentAssignment?.quantity || 0;
                        const currentHours =
                          currentAssignment?.hoursPerDay || 0;
                        const isColumnFull =
                          remaining === 0 && currentQty === 0;

                        return (
                          <td
                            key={subtaskIdx}
                            className="p-3 border-b border-gray-200 text-center"
                          >
                            <div className="space-y-2">
                              {/* Quantity Input */}
                              <div>
                                <input
                                  type="number"
                                  min="0"
                                  max={remaining + currentQty}
                                  value={currentQty || ''}
                                  onChange={e => {
                                    const qty = parseInt(e.target.value) || 0;
                                    updateAssignment(
                                      worker.id,
                                      subtaskIdx,
                                      qty,
                                      currentHours,
                                    );
                                  }}
                                  placeholder="SL"
                                  disabled={isColumnFull}
                                  className={cn(
                                    'w-full px-2 py-2 text-sm border-2 rounded-md text-center font-semibold',
                                    isColumnFull
                                      ? 'bg-gray-100 border-gray-200 cursor-not-allowed text-gray-400'
                                      : 'border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary',
                                  )}
                                />
                              </div>

                              {/* Hours Input */}
                              <div>
                                <input
                                  type="number"
                                  min="0"
                                  max="12"
                                  step="0.5"
                                  value={currentHours || ''}
                                  onChange={e => {
                                    const hours =
                                      parseFloat(e.target.value) || 0;
                                    updateAssignment(
                                      worker.id,
                                      subtaskIdx,
                                      currentQty,
                                      hours,
                                    );
                                  }}
                                  placeholder="Giờ"
                                  disabled={currentQty === 0}
                                  className={cn(
                                    'w-full px-2 py-2 text-sm border-2 rounded-md text-center font-semibold',
                                    currentQty === 0
                                      ? 'bg-gray-100 border-gray-200 cursor-not-allowed text-gray-400'
                                      : 'border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                                  )}
                                />
                              </div>

                              {/* Hours Display */}
                              {currentQty > 0 && (
                                <div className="space-y-1">
                                  <div className="bg-blue-50 border border-blue-200 rounded px-2 py-1">
                                    <p className="text-xs text-blue-700 font-semibold">
                                      {currentHours}h
                                    </p>
                                    <p className="text-[10px] text-blue-600">
                                      / {currentQty} SL
                                    </p>
                                  </div>

                                  {remaining > 0 && (
                                    <p className="text-xs text-orange-600">
                                      Cần {remaining} SL
                                    </p>
                                  )}
                                </div>
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

          {filteredWorkers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Không tìm thấy nhân viên phù hợp
            </div>
          )}
        </Card>

        {/* Quick Summary */}
        <div className="grid grid-cols-3 gap-4">
          <Card padding="md" className="bg-blue-50 border-blue-200 text-center">
            <p className="text-sm text-gray-700 mb-1">Tổng SL cần phân</p>
            <p className="text-2xl font-bold text-blue-700">
              {selectedSubtasks.reduce(
                (sum, idx) => sum + (task.subtasks[idx].qty_total || 0),
                0,
              )}
            </p>
          </Card>
          <Card
            padding="md"
            className="bg-green-50 border-green-200 text-center"
          >
            <p className="text-sm text-gray-700 mb-1">Đã phân</p>
            <p className="text-2xl font-bold text-green-700">
              {workerAssignments.reduce((sum, a) => sum + a.quantity, 0)}
            </p>
          </Card>
          <Card
            padding="md"
            className="bg-orange-50 border-orange-200 text-center"
          >
            <p className="text-sm text-gray-700 mb-1">Còn lại</p>
            <p className="text-2xl font-bold text-orange-700">
              {selectedSubtasks.reduce((sum, idx) => {
                const total = task.subtasks[idx].qty_total || 0;
                const assigned = getAssignedQty(idx);
                return sum + (total - assigned);
              }, 0)}
            </p>
          </Card>
        </div>
      </div>
    );
  };

  // Step 3: Select Date Range for Each Assignment - Compact Table
  const renderStep3 = () => {
    const updateAssignmentDates = (
      workerId: string,
      subtaskIdx: number,
      startDate: string,
      endDate: string,
    ) => {
      setWorkerAssignments(prev =>
        prev.map(a =>
          a.workerId === workerId && a.subtaskIndex === subtaskIdx
            ? { ...a, startDate, endDate }
            : a,
        ),
      );
    };

    const toggleDone = (workerId: string, subtaskIdx: number) => {
      setWorkerAssignments(prev =>
        prev.map(a => {
          if (a.workerId === workerId && a.subtaskIndex === subtaskIdx) {
            const newDone = !a.isDone;
            return {
              ...a,
              isDone: newDone,
              doneAt: newDone ? new Date().toISOString() : undefined,
              doneBy: newDone ? 'Kỹ sư trưởng' : undefined, // TODO: get from user context
            };
          }
          return a;
        }),
      );
    };

    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">
            Chọn thời gian cho từng phân công
          </h3>
          <p className="text-gray-600">
            Mặc định: hôm nay (8h - 18h = 1 công). Kỹ sư trưởng tick Done khi
            hoàn thành
          </p>
        </div>

        {/* Compact Table */}
        <Card padding="lg">
          <div className="overflow-x-auto max-h-[60vh] overflow-y-auto border-2 border-gray-200 rounded-lg">
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 bg-gray-100 z-10">
                <tr>
                  <th className="p-3 text-left text-xs font-semibold text-gray-700 border-b-2 border-gray-300 min-w-[150px]">
                    Nhân viên
                  </th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-700 border-b-2 border-gray-300 min-w-[180px]">
                    Công việc
                  </th>
                  <th className="p-3 text-center text-xs font-semibold text-gray-700 border-b-2 border-gray-300">
                    SL
                  </th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-700 border-b-2 border-gray-300 min-w-[130px]">
                    Từ ngày
                  </th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-700 border-b-2 border-gray-300 min-w-[130px]">
                    Đến ngày
                  </th>
                  <th className="p-3 text-center text-xs font-semibold text-gray-700 border-b-2 border-gray-300">
                    Số ngày
                  </th>
                  <th className="p-3 text-center text-xs font-semibold text-gray-700 border-b-2 border-gray-300">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody>
                {workerAssignments.map((assignment, idx) => {
                  const worker = workers.find(
                    w => w.id === assignment.workerId,
                  );
                  const subtask = task.subtasks[assignment.subtaskIndex];
                  const daysCount =
                    assignment.startDate && assignment.endDate
                      ? Math.ceil(
                          (new Date(assignment.endDate).getTime() -
                            new Date(assignment.startDate).getTime()) /
                            (1000 * 60 * 60 * 24),
                        ) + 1
                      : 1;

                  return (
                    <tr
                      key={idx}
                      className={cn(
                        'hover:bg-gray-50 transition-colors border-b border-gray-200',
                        assignment.isDone && 'bg-green-50/50',
                      )}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Users className="w-4 h-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 text-sm truncate">
                              {worker?.name}
                            </p>
                            <p className="text-xs text-gray-600 truncate">
                              {worker?.role}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <p className="font-medium text-gray-900 truncate">
                          {subtask.part_name ||
                            `Chi tiết ${assignment.subtaskIndex + 1}`}
                        </p>
                        <p className="text-xs text-gray-600">{task.profile}</p>
                      </td>
                      <td className="p-3 text-center">
                        <span className="font-bold text-gray-900">
                          {assignment.quantity}
                        </span>
                      </td>
                      <td className="p-3">
                        <input
                          type="date"
                          value={assignment.startDate?.split('T')[0] || ''}
                          onChange={e => {
                            if (e.target.value) {
                              updateAssignmentDates(
                                assignment.workerId,
                                assignment.subtaskIndex,
                                new Date(e.target.value).toISOString(),
                                assignment.endDate ||
                                  new Date(e.target.value).toISOString(),
                              );
                            }
                          }}
                          disabled={assignment.isDone}
                          className={cn(
                            'w-full px-2 py-1.5 text-xs border-2 rounded',
                            assignment.isDone
                              ? 'bg-gray-100 border-gray-200 cursor-not-allowed'
                              : 'border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary',
                          )}
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="date"
                          value={assignment.endDate?.split('T')[0] || ''}
                          min={assignment.startDate?.split('T')[0] || undefined}
                          onChange={e => {
                            if (e.target.value) {
                              updateAssignmentDates(
                                assignment.workerId,
                                assignment.subtaskIndex,
                                assignment.startDate ||
                                  new Date(e.target.value).toISOString(),
                                new Date(e.target.value).toISOString(),
                              );
                            }
                          }}
                          disabled={assignment.isDone}
                          className={cn(
                            'w-full px-2 py-1.5 text-xs border-2 rounded',
                            assignment.isDone
                              ? 'bg-gray-100 border-gray-200 cursor-not-allowed'
                              : 'border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary',
                          )}
                        />
                      </td>
                      <td className="p-3 text-center">
                        <Badge className="bg-blue-100 text-blue-700 text-xs">
                          {daysCount} ngày
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() =>
                            toggleDone(
                              assignment.workerId,
                              assignment.subtaskIndex,
                            )
                          }
                          className={cn(
                            'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                            assignment.isDone
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300',
                          )}
                        >
                          {assignment.isDone ? '✓ Done' : 'Chưa xong'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <Card padding="md" className="bg-blue-50 border-blue-200">
            <p className="text-xs text-gray-700 mb-1">Tổng phân công</p>
            <p className="text-2xl font-bold text-blue-700">
              {workerAssignments.length}
            </p>
          </Card>
          <Card padding="md" className="bg-green-50 border-green-200">
            <p className="text-xs text-gray-700 mb-1">Đã hoàn thành</p>
            <p className="text-2xl font-bold text-green-700">
              {workerAssignments.filter(a => a.isDone).length}
            </p>
          </Card>
          <Card padding="md" className="bg-orange-50 border-orange-200">
            <p className="text-xs text-gray-700 mb-1">Chưa hoàn thành</p>
            <p className="text-2xl font-bold text-orange-700">
              {workerAssignments.filter(a => !a.isDone).length}
            </p>
          </Card>
        </div>
      </div>
    );
  };

  // Step 4: Summary Table with Percentages - Compact & Clear
  const renderStep4 = () => {
    const toggleSubtask = (subtaskIdx: number) => {
      setExpandedSubtasks(prev => {
        const newSet = new Set(prev);
        if (newSet.has(subtaskIdx)) {
          newSet.delete(subtaskIdx);
        } else {
          newSet.add(subtaskIdx);
        }
        return newSet;
      });
    };

    // Calculate summary for each subtask
    const subtaskSummary = selectedSubtasks.map(subtaskIdx => {
      const subtask = task.subtasks[subtaskIdx];
      const totalQty = subtask.qty_total || 0;

      // Get all assignments for this subtask
      const assignments = finalAssignments.filter(
        a => a.subtaskIndex === subtaskIdx,
      );

      const assignedQty = assignments.reduce((sum, a) => sum + a.quantity, 0);
      const completedQty = assignments
        .filter(a => a.isDone)
        .reduce((sum, a) => sum + a.quantity, 0);
      const remainingQty = totalQty - assignedQty;

      return {
        subtaskIdx,
        subtaskName: subtask.part_name || `Chi tiết ${subtaskIdx + 1}`,
        totalQty,
        assignedQty,
        completedQty,
        remainingQty,
        assignments,
      };
    });

    // Count subtasks
    const totalSubtasks = selectedSubtasks.length;
    const assignedSubtasks = subtaskSummary.filter(
      s => s.assignedQty > 0,
    ).length;
    const completedSubtasks = subtaskSummary.filter(
      s => s.assignedQty > 0 && s.completedQty === s.assignedQty,
    ).length;

    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">
            Bảng tổng kết phân công
          </h3>
          <p className="text-gray-600">
            Tổng hợp số lượng đã giao và tiến độ hoàn thành
          </p>
        </div>

        {/* Progress Visualization */}
        <ProgressVisualization
          subtasks={subtaskProgress}
          totalSubtasks={subtaskProgress.length}
          assignedSubtasks={
            subtaskProgress.filter(s => s.assignedQty >= s.totalQty).length
          }
          completedSubtasks={
            subtaskProgress.filter(s => s.completedQty >= s.totalQty).length
          }
          onSubtaskClick={handleSubtaskClick}
          compact={true}
        />

        {/* Compact Stats */}
        <div className="grid grid-cols-4 gap-3">
          <Card padding="sm" className="bg-blue-50 border border-blue-200">
            <p className="text-[10px] text-gray-600 mb-0.5">Tổng subtask</p>
            <p className="text-2xl font-bold text-blue-700">{totalSubtasks}</p>
          </Card>
          <Card padding="sm" className="bg-purple-50 border border-purple-200">
            <p className="text-[10px] text-gray-600 mb-0.5">Đã giao</p>
            <p className="text-2xl font-bold text-purple-700">
              {assignedSubtasks} <span className="text-sm">subtask</span>
            </p>
          </Card>
          <Card padding="sm" className="bg-green-50 border border-green-200">
            <p className="text-[10px] text-gray-600 mb-0.5">Đã xong</p>
            <p className="text-2xl font-bold text-green-700">
              {completedSubtasks} <span className="text-sm">subtask</span>
            </p>
          </Card>
          <Card padding="sm" className="bg-orange-50 border border-orange-200">
            <p className="text-[10px] text-gray-600 mb-0.5">Tỉ lệ hoàn thành</p>
            <p className="text-2xl font-bold text-orange-700">
              {completedSubtasks}/{assignedSubtasks}
            </p>
          </Card>
        </div>

        {/* Subtask List with Collapse/Expand */}
        <Card padding="lg">
          <h4 className="font-semibold text-gray-900 mb-4">
            Chi tiết theo subtask
          </h4>

          <div className="space-y-2 max-h-[55vh] overflow-y-auto">
            {subtaskSummary.map((summary, idx) => {
              const isExpanded = expandedSubtasks.has(summary.subtaskIdx);
              const completionPercent =
                summary.assignedQty > 0
                  ? (summary.completedQty / summary.assignedQty) * 100
                  : 0;

              return (
                <div
                  key={idx}
                  className="border border-gray-300 rounded-lg overflow-hidden"
                >
                  {/* Header - Always Visible */}
                  <div
                    className="p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => toggleSubtask(summary.subtaskIdx)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <button className="text-gray-500">
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </button>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">
                            {summary.subtaskName}
                          </p>
                          <p className="text-xs text-gray-600">
                            {task.profile}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-center">
                          <p className="text-xs text-gray-600">Đã giao</p>
                          <p className="font-bold text-gray-900">
                            {summary.assignedQty}/{summary.totalQty}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-600">Đã xong</p>
                          <p className="font-bold text-green-700">
                            {summary.completedQty}/{summary.assignedQty}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-600">Còn lại</p>
                          <p
                            className={cn(
                              'font-bold',
                              summary.remainingQty === 0
                                ? 'text-green-600'
                                : 'text-orange-600',
                            )}
                          >
                            {summary.remainingQty}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-primary">
                            {completionPercent.toFixed(0)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content - Assignment Details */}
                  {isExpanded && summary.assignments.length > 0 && (
                    <div className="border-t border-gray-200 bg-white">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100 border-b border-gray-200">
                          <tr>
                            <th className="p-2 text-left text-xs font-semibold text-gray-700">
                              Nhân viên
                            </th>
                            <th className="p-2 text-center text-xs font-semibold text-gray-700">
                              Số lượng
                            </th>
                            <th className="p-2 text-left text-xs font-semibold text-gray-700">
                              Thời gian
                            </th>
                            <th className="p-2 text-left text-xs font-semibold text-gray-700">
                              Trạng thái
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {summary.assignments.map((assignment, aIdx) => {
                            const startDate = new Date(assignment.startDate);
                            const endDate = new Date(assignment.endDate);

                            return (
                              <tr
                                key={aIdx}
                                className={cn(
                                  'border-b border-gray-100',
                                  assignment.isDone && 'bg-green-50/50',
                                )}
                              >
                                <td className="p-2">
                                  <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-gray-500" />
                                    <span className="font-medium text-gray-900">
                                      {assignment.workerName}
                                    </span>
                                  </div>
                                </td>
                                <td className="p-2 text-center">
                                  <span className="font-bold text-gray-900">
                                    {assignment.quantity}
                                  </span>
                                </td>
                                <td className="p-2">
                                  <div className="text-xs text-gray-700">
                                    {startDate.toLocaleDateString('vi-VN')} -{' '}
                                    {endDate.toLocaleDateString('vi-VN')}
                                  </div>
                                </td>
                                <td className="p-2">
                                  {assignment.isDone ? (
                                    <div>
                                      <Badge className="bg-green-600 text-white text-xs mb-1">
                                        ✓ Done
                                      </Badge>
                                      <div className="text-[10px] text-gray-600">
                                        Bởi: {assignment.doneBy}
                                        <br />
                                        Lúc:{' '}
                                        {new Date(
                                          assignment.doneAt!,
                                        ).toLocaleString('vi-VN')}
                                      </div>
                                    </div>
                                  ) : (
                                    <Badge className="bg-gray-200 text-gray-700 text-xs">
                                      Chưa xong
                                    </Badge>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    );
  };

  // Handle reassignment
  const handleReassignmentDelete = (assignmentToDelete: FinalAssignment) => {
    if (!confirm(`Xóa phân công cho ${assignmentToDelete.workerName}?`)) {
      return;
    }

    const updatedAssignments = existingAssignments.filter(
      a =>
        !(
          a.workerId === assignmentToDelete.workerId &&
          a.subtaskIndex === assignmentToDelete.subtaskIndex
        ),
    );

    localStorage.setItem(
      `task_assignments_${task.id}`,
      JSON.stringify(updatedAssignments),
    );

    // Close reassignment modal and force re-render
    setReassigningSubtask(null);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <>
      {/* Reassignment Modal - Modern Design */}
      {reassigningSubtask !== null && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-[60]"
            onClick={() => setReassigningSubtask(null)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="px-6 py-4 border-b bg-gradient-to-br from-primary/5 via-blue-50 to-primary/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      Phân công lại
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {task.subtasks[reassigningSubtask]?.part_name ||
                        `Chi tiết ${reassigningSubtask + 1}`}
                    </p>
                  </div>
                  <button
                    onClick={() => setReassigningSubtask(null)}
                    className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-auto px-6 py-4">
                {(() => {
                  const subtask = task.subtasks[reassigningSubtask];
                  const currentAssignments = existingAssignments.filter(
                    a => a.subtaskIndex === reassigningSubtask,
                  );
                  const totalQty = subtask.qty_total || 0;
                  const assignedQty = currentAssignments.reduce(
                    (sum, a) => sum + a.quantity,
                    0,
                  );

                  return (
                    <div className="space-y-4">
                      {/* Summary Stats */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 text-center border border-blue-200">
                          <p className="text-xs text-blue-700 font-medium mb-1">
                            Tổng SL
                          </p>
                          <p className="text-2xl font-bold text-blue-900">
                            {totalQty}
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 text-center border border-green-200">
                          <p className="text-xs text-green-700 font-medium mb-1">
                            Đã giao
                          </p>
                          <p className="text-2xl font-bold text-green-900">
                            {assignedQty}
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-3 text-center border border-purple-200">
                          <p className="text-xs text-purple-700 font-medium mb-1">
                            Số người
                          </p>
                          <p className="text-2xl font-bold text-purple-900">
                            {currentAssignments.length}
                          </p>
                        </div>
                      </div>

                      {/* Current Assignments */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 text-sm">
                          Phân công hiện tại
                        </h4>
                        {currentAssignments.length === 0 ? (
                          <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                            <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">Chưa có phân công</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {currentAssignments.map((assignment, idx) => (
                              <WorkerAssignmentCard
                                key={idx}
                                assignment={assignment}
                                onDelete={handleReassignmentDelete}
                                showActions={true}
                                compact={true}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Instructions */}
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">
                            i
                          </div>
                          <p className="text-xs text-blue-900">
                            Xóa phân công cũ rồi đóng cửa sổ này và chọn lại
                            subtask để phân công mới
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-3 border-t bg-gray-50">
                <Button
                  variant="secondary"
                  onClick={() => setReassigningSubtask(null)}
                  className="px-4"
                >
                  Đóng
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Review Modal */}
      <ReviewModal
        isOpen={!!reviewingAssignment}
        onClose={() => setReviewingAssignment(null)}
        assignment={reviewingAssignment?.assignment!}
        action={reviewingAssignment?.action || 'approve'}
        onSubmit={(comment, images) => {
          if (!reviewingAssignment) return;

          const { assignment, action } = reviewingAssignment;

          // Update assignment in localStorage
          const updatedAssignments = existingAssignments.map(a => {
            if (
              a.workerId === assignment.workerId &&
              a.subtaskIndex === assignment.subtaskIndex
            ) {
              return {
                ...a,
                isApproved: action === 'approve',
                isRejected: action === 'reject',
                reviewComment: comment,
                reviewImages: images,
                reviewedAt: new Date().toISOString(),
                reviewedBy: 'Kỹ sư trưởng', // TODO: get from user context
              };
            }
            return a;
          });

          localStorage.setItem(
            `task_assignments_${task.id}`,
            JSON.stringify(updatedAssignments),
          );

          // Close review modal
          setReviewingAssignment(null);

          // Force re-render
          setReviewComment('');
          setReviewImages([]);
          setRefreshKey(prev => prev + 1);
        }}
      />

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

            {/* Quick mode switch buttons - show when in assign or review mode */}
            {modalMode && (
              <div className="flex items-center gap-2 mr-4">
                <button
                  onClick={() => setModalMode('assign')}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
                    modalMode === 'assign'
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300',
                  )}
                >
                  <UserCheck className="w-4 h-4" />
                  Phân công
                </button>
                <button
                  onClick={() => setModalMode('review')}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 relative',
                    modalMode === 'review'
                      ? 'bg-yellow-600 text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300',
                  )}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Xác nhận
                  {pendingReviewCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center">
                      {pendingReviewCount}
                    </span>
                  )}
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Content - Conditional based on mode */}
          {modalMode === null ? (
            <div className="flex-1 overflow-auto">{renderModeSelection()}</div>
          ) : modalMode === 'review' ? (
            <div className="flex-1 overflow-auto px-6 py-6">
              {/* Review Mode Content - Table View */}
              {(() => {
                // Show assignments that are done and pending review
                const pendingReviewAssignments = existingAssignments.filter(
                  a => a.isDone && !a.isApproved && !a.isRejected,
                );

                // Show ALL assigned work (including approved, rejected, in-progress)
                const allAssignments = existingAssignments;
                const approvedCount = allAssignments.filter(
                  a => a.isApproved,
                ).length;
                const rejectedCount = allAssignments.filter(
                  a => a.isRejected,
                ).length;
                const inProgressCount = allAssignments.filter(
                  a => !a.isDone && !a.isApproved && !a.isRejected,
                ).length;

                return (
                  <div className="space-y-4">
                    <div className="text-center mb-4">
                      <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                        Xác nhận công việc
                      </h3>
                      <div className="flex items-center justify-center gap-4 text-sm">
                        {pendingReviewAssignments.length > 0 && (
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full font-medium">
                            ⏳ {pendingReviewAssignments.length} chờ xác nhận
                          </span>
                        )}
                        {inProgressCount > 0 && (
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                            🔨 {inProgressCount} đang làm
                          </span>
                        )}
                        {approvedCount > 0 && (
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium">
                            ✓ {approvedCount} đã xác nhận
                          </span>
                        )}
                        {rejectedCount > 0 && (
                          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full font-medium">
                            ✗ {rejectedCount} cần sửa
                          </span>
                        )}
                      </div>
                    </div>

                    {allAssignments.length === 0 ? (
                      <Card padding="lg" className="text-center py-12">
                        <CheckCircle2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">
                          Không có công việc nào cần xác nhận
                        </p>
                      </Card>
                    ) : (
                      <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
                        {/* Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
                                  Công việc
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
                                  Người làm
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">
                                  Số lượng
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
                                  Thời gian
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">
                                  Trạng thái
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">
                                  Thao tác
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {allAssignments.map((assignment, aIdx) => {
                                const subtask =
                                  task.subtasks[assignment.subtaskIndex];
                                const startDate = new Date(
                                  assignment.startDate,
                                );
                                const endDate = new Date(assignment.endDate);
                                const isDone = assignment.isDone;

                                const isApproved = assignment.isApproved;
                                const isRejected = assignment.isRejected;

                                return (
                                  <tr
                                    key={aIdx}
                                    className={cn(
                                      'transition-colors',
                                      isApproved
                                        ? 'bg-emerald-50/50'
                                        : isRejected
                                        ? 'bg-red-50/50'
                                        : isDone
                                        ? 'bg-yellow-50/50 hover:bg-yellow-100/50'
                                        : 'hover:bg-gray-50',
                                    )}
                                  >
                                    {/* Công việc */}
                                    <td className="px-3 py-2">
                                      <p className="font-semibold text-gray-900 text-sm">
                                        {assignment.subtaskName}
                                      </p>
                                      <p className="text-xs text-gray-500 mt-0.5">
                                        {task.profile}
                                      </p>
                                    </td>

                                    {/* Người làm */}
                                    <td className="px-3 py-2">
                                      <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                          <Users className="w-3.5 h-3.5 text-primary" />
                                        </div>
                                        <span className="font-medium text-gray-900 text-sm">
                                          {assignment.workerName}
                                        </span>
                                      </div>
                                    </td>

                                    {/* Số lượng */}
                                    <td className="px-3 py-2 text-center">
                                      <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
                                        {assignment.quantity}
                                      </span>
                                    </td>

                                    {/* Thời gian */}
                                    <td className="px-3 py-2">
                                      <div className="text-xs text-gray-600">
                                        <div className="flex items-center gap-1 mb-0.5">
                                          <Calendar className="w-3 h-3" />
                                          <span>
                                            {startDate.toLocaleDateString(
                                              'vi-VN',
                                            )}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <span className="text-gray-400">
                                            →
                                          </span>
                                          <span>
                                            {endDate.toLocaleDateString(
                                              'vi-VN',
                                            )}
                                          </span>
                                        </div>
                                      </div>
                                    </td>

                                    {/* Trạng thái */}
                                    <td className="px-3 py-2 text-center">
                                      {isApproved ? (
                                        <Badge className="bg-emerald-600 text-white text-xs">
                                          ✓ Đã xác nhận
                                        </Badge>
                                      ) : isRejected ? (
                                        <div>
                                          <Badge className="bg-red-600 text-white text-xs mb-1">
                                            ✗ Cần sửa lại
                                          </Badge>
                                          {assignment.reviewComment && (
                                            <p
                                              className="text-xs text-red-700 mt-1 line-clamp-1"
                                              title={assignment.reviewComment}
                                            >
                                              "{assignment.reviewComment}"
                                            </p>
                                          )}
                                        </div>
                                      ) : isDone ? (
                                        <div>
                                          <Badge className="bg-yellow-600 text-white text-xs mb-1">
                                            ⏳ Chờ xác nhận
                                          </Badge>
                                          {assignment.doneAt && (
                                            <p className="text-xs text-gray-500 mt-1">
                                              {new Date(
                                                assignment.doneAt,
                                              ).toLocaleString('vi-VN')}
                                            </p>
                                          )}
                                        </div>
                                      ) : (
                                        <Badge className="bg-blue-500 text-white text-xs">
                                          🔨 Đang làm
                                        </Badge>
                                      )}
                                    </td>

                                    {/* Thao tác */}
                                    <td className="px-3 py-2">
                                      {isApproved || isRejected ? (
                                        <div className="text-center">
                                          <span className="text-xs text-gray-400">
                                            -
                                          </span>
                                        </div>
                                      ) : (
                                        <div className="flex gap-1 justify-center">
                                          <button
                                            onClick={() =>
                                              handleReview(
                                                assignment,
                                                'approve',
                                              )
                                            }
                                            className="p-1.5 rounded-lg bg-green-100 hover:bg-green-600 text-green-700 hover:text-white transition-colors"
                                            title="Xác nhận hoàn thành"
                                          >
                                            <CheckCircle2 className="w-4 h-4" />
                                          </button>
                                          <button
                                            onClick={() =>
                                              handleReview(assignment, 'reject')
                                            }
                                            className="p-1.5 rounded-lg bg-red-100 hover:bg-red-600 text-red-700 hover:text-white transition-colors"
                                            title="Yêu cầu làm lại"
                                          >
                                            <X className="w-4 h-4" />
                                          </button>
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          ) : (
            <>
              {/* Assign Mode - Stepper */}
              <div className="px-6 pt-6">
                <Stepper />
              </div>

              {/* Content */}
              <div className="flex-1 overflow-auto px-6 pb-6">
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}
                {currentStep === 4 && renderStep4()}
              </div>
            </>
          )}

          {/* Fixed Footer with Progress */}
          <div className="border-t bg-white sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
            {/* Progress Bar - Always visible */}
            <div className="px-6 py-3 bg-gradient-to-br from-gray-50 via-white to-primary/5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">
                    Tiến độ phân công
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500 mb-0.5">Hoàn thành</div>
                  <div className="font-bold text-primary text-xl leading-none">
                    {assignedSubtasks}
                    <span className="text-gray-400 text-sm">
                      /{totalSubtasks}
                    </span>
                  </div>
                </div>
              </div>
              <div className="relative w-full h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-primary via-blue-500 to-blue-600 transition-all duration-500 ease-out relative"
                  style={{
                    width: `${
                      totalSubtasks > 0
                        ? (assignedSubtasks / totalSubtasks) * 100
                        : 0
                    }%`,
                  }}
                >
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                </div>
                {/* Percentage label inside bar if > 15% */}
                {totalSubtasks > 0 &&
                  (assignedSubtasks / totalSubtasks) * 100 > 15 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-white drop-shadow-md">
                        {Math.round((assignedSubtasks / totalSubtasks) * 100)}%
                      </span>
                    </div>
                  )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-3 px-6 py-4">
              {modalMode === null ? (
                <Button
                  variant="secondary"
                  onClick={onClose}
                  className="ml-auto"
                >
                  Đóng
                </Button>
              ) : modalMode === 'review' ? (
                <Button
                  variant="secondary"
                  onClick={() => setModalMode(null)}
                  className="ml-auto"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Quay lại
                </Button>
              ) : (
                <>
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
                      Hủy
                    </Button>
                    {currentStep < totalSteps ? (
                      <Button onClick={goToNextStep}>
                        Tiếp theo
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    ) : (
                      <Button
                        onClick={handleSave}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Lưu phân công
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* OT Request Modal */}
      {showOTModal && otRequestData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">
                Đề xuất làm thêm giờ (OT)
              </h3>
              <button
                onClick={() => {
                  setShowOTModal(false);
                  setOTRequestData(null);
                  setOTHours(0);
                  setOTReason('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-4 space-y-4">
              {/* Worker Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-gray-700">
                  <strong>Nhân viên:</strong> {otRequestData.workerName}
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  <strong>Giờ đã assign:</strong>{' '}
                  <span className="text-red-600 font-semibold">
                    {otRequestData.currentHours}/8 giờ
                  </span>
                </p>
              </div>

              {/* OT Hours Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Số giờ OT cần xin <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0.5"
                  max="4"
                  step="0.5"
                  value={otHours || ''}
                  onChange={e => setOTHours(parseFloat(e.target.value) || 0)}
                  placeholder="Ví dụ: 2"
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tối đa 4 giờ/ngày. Tổng giờ làm việc:{' '}
                  <strong>{otRequestData.currentHours + otHours} giờ</strong>
                </p>
              </div>

              {/* Reason Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Lý do <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={otReason}
                  onChange={e => setOTReason(e.target.value)}
                  placeholder="Nhập lý do cần làm thêm giờ..."
                  rows={3}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowOTModal(false);
                  setOTRequestData(null);
                  setOTHours(0);
                  setOTReason('');
                }}
              >
                Hủy
              </Button>
              <Button
                onClick={() => {
                  if (otHours <= 0) {
                    alert('Vui lòng nhập số giờ OT');
                    return;
                  }
                  if (!otReason.trim()) {
                    alert('Vui lòng nhập lý do');
                    return;
                  }

                  // Save OT request to localStorage
                  const otRequest: OTRequest = {
                    workerId: otRequestData.workerId,
                    workerName: otRequestData.workerName,
                    date: new Date().toISOString().split('T')[0],
                    currentHours: otRequestData.currentHours,
                    requestedHours: otHours,
                    reason: otReason,
                  };

                  // Save to localStorage
                  const storageKey = 'ot_requests';
                  const existingRequests = JSON.parse(
                    localStorage.getItem(storageKey) || '[]',
                  );
                  existingRequests.push(otRequest);
                  localStorage.setItem(
                    storageKey,
                    JSON.stringify(existingRequests),
                  );

                  alert(
                    `Đã gửi đề xuất OT ${otHours} giờ cho ${otRequestData.workerName}`,
                  );

                  // Close modal
                  setShowOTModal(false);
                  setOTRequestData(null);
                  setOTHours(0);
                  setOTReason('');
                }}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Gửi đề xuất
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
