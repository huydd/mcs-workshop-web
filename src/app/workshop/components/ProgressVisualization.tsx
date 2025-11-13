'use client';

import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface SubtaskProgress {
  subtaskIdx: number;
  subtaskName: string;
  totalQty: number;
  assignedQty: number;
  completedQty: number;
  remainingQty: number;
  assignments: any[];
}

interface ProgressVisualizationProps {
  subtasks: SubtaskProgress[];
  totalSubtasks: number;
  assignedSubtasks: number;
  completedSubtasks: number;
  onSubtaskClick?: (subtaskIndex: number) => void;
  compact?: boolean;
}

export const ProgressVisualization = ({
  subtasks,
  totalSubtasks,
  assignedSubtasks,
  completedSubtasks,
  onSubtaskClick,
  compact = false,
}: ProgressVisualizationProps) => {
  // Calculate overall statistics
  const totalQuantity = subtasks.reduce((sum, s) => sum + s.totalQty, 0);
  const totalAssigned = subtasks.reduce((sum, s) => sum + s.assignedQty, 0);
  const totalCompleted = subtasks.reduce((sum, s) => sum + s.completedQty, 0);

  const assignmentRate =
    totalQuantity > 0 ? (totalAssigned / totalQuantity) * 100 : 0;
  const completionRate =
    totalQuantity > 0 ? (totalCompleted / totalQuantity) * 100 : 0;

  const getSubtaskStatus = (subtask: SubtaskProgress) => {
    const isFullyCompleted = subtask.completedQty >= subtask.totalQty;
    const isFullyAssigned = subtask.assignedQty >= subtask.totalQty;
    const completionPercent =
      subtask.totalQty > 0
        ? (subtask.completedQty / subtask.totalQty) * 100
        : 0;

    if (isFullyCompleted) {
      return {
        color: 'bg-emerald-500',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200',
        textColor: 'text-emerald-700',
        icon: CheckCircle2,
        label: 'Hoàn thành',
        progress: 100,
      };
    }
    if (isFullyAssigned) {
      return {
        color: 'bg-blue-500',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-700',
        icon: Clock,
        label: 'Đã giao',
        progress: completionPercent,
      };
    }
    if (subtask.assignedQty > 0) {
      return {
        color: 'bg-orange-500',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        textColor: 'text-orange-700',
        icon: TrendingUp,
        label: 'Giao 1 phần',
        progress: completionPercent,
      };
    }
    return {
      color: 'bg-gray-400',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      textColor: 'text-gray-700',
      icon: Clock,
      label: 'Chưa giao',
      progress: 0,
    };
  };

  if (compact) {
    return (
      <div className="space-y-4">
        {/* Overall Progress */}
        <Card
          padding="md"
          className="bg-gradient-to-br from-primary/5 to-blue-50 border-primary/20"
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900">Tiến độ tổng quan</h4>
            <Badge className="bg-primary text-white">
              {completionRate.toFixed(0)}%
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">
                {completedSubtasks}
              </p>
              <p className="text-xs text-gray-600">Hoàn thành</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {assignedSubtasks}
              </p>
              <p className="text-xs text-gray-600">Đã giao</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600">
                {totalSubtasks}
              </p>
              <p className="text-xs text-gray-600">Tổng số</p>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Tiến độ hoàn thành</span>
              <span className="font-semibold text-primary">
                {completionRate.toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary via-blue-500 to-blue-600 transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Subtask List */}
        <div className="space-y-2">
          {subtasks.map((subtask, idx) => {
            const status = getSubtaskStatus(subtask);
            const StatusIcon = status.icon;

            return (
              <div
                key={idx}
                onClick={() => onSubtaskClick?.(subtask.subtaskIdx)}
                className={cn(
                  'p-3 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md',
                  status.bgColor,
                  status.borderColor,
                  onSubtaskClick && 'hover:scale-[1.02]',
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                      status.color,
                    )}
                  >
                    <StatusIcon className="w-4 h-4 text-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-sm truncate">
                      {subtask.subtaskName}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        className={cn(
                          'text-xs',
                          status.bgColor,
                          status.textColor,
                          status.borderColor,
                        )}
                      >
                        {status.label}
                      </Badge>
                      <span className="text-xs text-gray-600">
                        {subtask.completedQty}/{subtask.totalQty}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">
                      {status.progress.toFixed(0)}%
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-2">
                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full transition-all duration-300',
                        status.color,
                      )}
                      style={{ width: `${status.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card
          padding="md"
          className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-blue-600 font-medium">
                Tổng công việc
              </p>
              <p className="text-2xl font-bold text-blue-900">
                {totalSubtasks}
              </p>
            </div>
          </div>
        </Card>

        <Card
          padding="md"
          className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-purple-600 font-medium">Đã giao</p>
              <p className="text-2xl font-bold text-purple-900">
                {assignedSubtasks}
              </p>
            </div>
          </div>
        </Card>

        <Card
          padding="md"
          className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-emerald-600 font-medium">Hoàn thành</p>
              <p className="text-2xl font-bold text-emerald-900">
                {completedSubtasks}
              </p>
            </div>
          </div>
        </Card>

        <Card
          padding="md"
          className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-primary font-medium">Tiến độ</p>
              <p className="text-2xl font-bold text-primary">
                {completionRate.toFixed(0)}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Overall Progress Bar */}
      <Card padding="lg">
        <h4 className="font-semibold text-gray-900 mb-4">Tiến độ tổng quan</h4>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Tiến độ phân công</span>
              <span className="font-semibold text-blue-600">
                {assignmentRate.toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                style={{ width: `${assignmentRate}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {totalAssigned}/{totalQuantity} đã phân công
            </p>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Tiến độ hoàn thành</span>
              <span className="font-semibold text-emerald-600">
                {completionRate.toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {totalCompleted}/{totalQuantity} đã hoàn thành
            </p>
          </div>
        </div>
      </Card>

      {/* Detailed Subtask Progress */}
      <Card padding="lg">
        <h4 className="font-semibold text-gray-900 mb-4">Chi tiết tiến độ</h4>

        <div className="space-y-3">
          {subtasks.map((subtask, idx) => {
            const status = getSubtaskStatus(subtask);
            const StatusIcon = status.icon;

            return (
              <div
                key={idx}
                onClick={() => onSubtaskClick?.(subtask.subtaskIdx)}
                className={cn(
                  'p-4 border-2 rounded-lg transition-all',
                  status.bgColor,
                  status.borderColor,
                  onSubtaskClick &&
                    'cursor-pointer hover:shadow-md hover:scale-[1.01]',
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                        status.color,
                      )}
                    >
                      <StatusIcon className="w-5 h-5 text-white" />
                    </div>

                    <div>
                      <p className="font-semibold text-gray-900">
                        {subtask.subtaskName}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <Badge
                      className={cn(
                        status.bgColor,
                        status.textColor,
                        status.borderColor,
                      )}
                    >
                      {status.label}
                    </Badge>
                    <p className="text-lg font-bold text-primary mt-1">
                      {status.progress.toFixed(0)}%
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Tổng số</p>
                    <p className="font-semibold text-gray-900">
                      {subtask.totalQty}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Đã giao</p>
                    <p className="font-semibold text-blue-600">
                      {subtask.assignedQty}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Hoàn thành</p>
                    <p className="font-semibold text-emerald-600">
                      {subtask.completedQty}
                    </p>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full transition-all duration-300',
                        status.color,
                      )}
                      style={{ width: `${status.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
