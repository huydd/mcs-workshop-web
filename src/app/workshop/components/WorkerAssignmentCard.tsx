'use client';

import React from 'react';
import { Users, Calendar, CheckCircle2, X } from 'lucide-react';
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

interface WorkerAssignmentCardProps {
  assignment: FinalAssignment;
  onDelete?: (assignment: FinalAssignment) => void;
  showActions?: boolean;
  compact?: boolean;
}

export const WorkerAssignmentCard = ({
  assignment,
  onDelete,
  showActions = false,
  compact = false,
}: WorkerAssignmentCardProps) => {
  const startDate = new Date(assignment.startDate);
  const endDate = new Date(assignment.endDate);
  const daysCount =
    Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    ) + 1;

  const getStatusColor = () => {
    if (assignment.isApproved) return 'bg-emerald-50 border-emerald-200';
    if (assignment.isRejected) return 'bg-red-50 border-red-200';
    if (assignment.isDone) return 'bg-yellow-50 border-yellow-200';
    return 'bg-white border-gray-200';
  };

  const getStatusBadge = () => {
    if (assignment.isApproved) {
      return (
        <Badge className="bg-emerald-600 text-white text-xs">✓ Approved</Badge>
      );
    }
    if (assignment.isRejected) {
      return (
        <Badge className="bg-red-600 text-white text-xs">✗ Rejected</Badge>
      );
    }
    if (assignment.isDone) {
      return (
        <Badge className="bg-yellow-600 text-white text-xs">
          ⏳ Pending review
        </Badge>
      );
    }
    return (
      <Badge className="bg-blue-500 text-white text-xs">🔨 Đang làm</Badge>
    );
  };

  if (compact) {
    return (
      <div
        className={cn(
          'group relative border-2 rounded-xl p-3 transition-all',
          getStatusColor(),
        )}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Users className="w-4 h-4 text-primary" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-sm mb-1 truncate">
              {assignment.workerName}
            </p>
            <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {daysCount} ngày
              </span>
              <span className="flex items-center gap-1 font-semibold text-primary">
                <CheckCircle2 className="w-3 h-3" />
                {assignment.quantity}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>{startDate.toLocaleDateString('vi-VN')}</span>
              <span>→</span>
              <span>{endDate.toLocaleDateString('vi-VN')}</span>
            </div>
            {/* Status badge */}
            <div className="mt-2">{getStatusBadge()}</div>
          </div>

          {/* Delete button */}
          {showActions && onDelete && (
            <button
              onClick={() => onDelete(assignment)}
              className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
              title="Xóa phân công"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card
      padding="md"
      className={cn(
        'group relative border-2 transition-all hover:shadow-md',
        getStatusColor(),
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Users className="w-5 h-5 text-primary" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 mb-1">
            {assignment.workerName}
          </p>
          <p className="text-sm text-gray-600 mb-3 truncate">
            {assignment.subtaskName}
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <div>
                <span className="text-gray-600">Thời gian:</span>
                <br />
                <strong className="text-gray-900 text-xs">
                  {daysCount} ngày công
                </strong>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-gray-500" />
              <div>
                <span className="text-gray-600">Số lượng:</span>
                <br />
                <strong className="text-gray-900">{assignment.quantity}</strong>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Từ:</span>
              <strong className="text-gray-900 text-xs">
                {startDate.toLocaleDateString('vi-VN')}
              </strong>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Đến:</span>
              <strong className="text-gray-900 text-xs">
                {endDate.toLocaleDateString('vi-VN')}
              </strong>
            </div>
          </div>

          {/* Status badges */}
          <div className="flex gap-1 mt-3">
            {getStatusBadge()}
            {assignment.reviewComment && (
              <p
                className="text-xs text-gray-600 italic line-clamp-1"
                title={assignment.reviewComment}
              >
                "{assignment.reviewComment}"
              </p>
            )}
          </div>
        </div>

        {/* Delete button */}
        {showActions && onDelete && (
          <button
            onClick={() => onDelete(assignment)}
            className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
            title="Xóa phân công"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </Card>
  );
};
