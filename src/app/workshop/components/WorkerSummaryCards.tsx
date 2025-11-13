'use client';

import React from 'react';
import { Users, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
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
  birthYear?: number;
  address?: string;
  yearsOfExperience?: number;
}

interface WorkerAssignment {
  workerId: string;
  subtaskIndex: number;
  quantity: number;
  hoursPerDay: number;
  startDate?: string;
  endDate?: string;
  isDone?: boolean;
  doneAt?: string;
  doneBy?: string;
}

interface WorkerSummaryCardsProps {
  workers: WorkshopWorker[];
  assignments: WorkerAssignment[];
  selectedSubtasks: number[];
  taskSubtasks: Array<{
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
  }>;
}

export const WorkerSummaryCards = ({
  workers,
  assignments,
  selectedSubtasks,
  taskSubtasks,
}: WorkerSummaryCardsProps) => {
  // Calculate worker statistics
  const getWorkerStats = (workerId: string) => {
    const workerAssignments = assignments.filter(a => a.workerId === workerId);
    const totalQuantity = workerAssignments.reduce(
      (sum, a) => sum + a.quantity,
      0,
    );
    const totalHours = workerAssignments.reduce(
      (sum, a) => sum + (a.hoursPerDay || 0),
      0,
    );
    const completedAssignments = workerAssignments.filter(a => a.isDone).length;
    const totalAssignments = workerAssignments.length;

    return {
      totalQuantity,
      totalHours,
      completedAssignments,
      totalAssignments,
      completionRate:
        totalAssignments > 0
          ? (completedAssignments / totalAssignments) * 100
          : 0,
    };
  };

  // Get worker's current workload from all tasks
  const getWorkerCurrentHours = (workerId: string): number => {
    if (typeof window === 'undefined') return 0;

    let totalHours = 0;

    // Iterate through all localStorage keys to find all task assignments
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('task_assignments_')) {
        try {
          const taskAssignments = JSON.parse(localStorage.getItem(key) || '[]');
          const today = new Date().toISOString().split('T')[0];

          taskAssignments.forEach((assignment: any) => {
            if (assignment.workerId === workerId) {
              const assignmentStart = new Date(assignment.startDate);
              const assignmentEnd = new Date(assignment.endDate);
              const checkDate = new Date(today);

              if (checkDate >= assignmentStart && checkDate <= assignmentEnd) {
                totalHours += assignment.hoursPerDay || 0;
              }
            }
          });
        } catch (e) {
          console.error(`Error loading ${key}:`, e);
        }
      }
    }

    return totalHours;
  };

  const getExperienceColor = (experience: string) => {
    switch (experience) {
      case 'expert':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'senior':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'junior':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getHoursStatus = (currentHours: number, additionalHours: number) => {
    const totalHours = currentHours + additionalHours;
    if (totalHours > 8) {
      return {
        color: 'text-red-600',
        bg: 'bg-red-50',
        icon: AlertTriangle,
        text: 'Quá giờ',
      };
    }
    if (totalHours >= 6) {
      return {
        color: 'text-orange-600',
        bg: 'bg-orange-50',
        icon: Clock,
        text: 'Gần đầy',
      };
    }
    return {
      color: 'text-green-600',
      bg: 'bg-green-50',
      icon: CheckCircle2,
      text: 'Bình thường',
    };
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {workers.map(worker => {
        const stats = getWorkerStats(worker.id);
        const currentHours = getWorkerCurrentHours(worker.id);
        const hoursStatus = getHoursStatus(currentHours, stats.totalHours);
        const StatusIcon = hoursStatus.icon;

        return (
          <Card
            key={worker.id}
            padding="md"
            className={cn(
              'border-2 transition-all hover:shadow-lg',
              stats.totalAssignments > 0
                ? 'border-primary/30 bg-primary/5'
                : 'border-gray-200 bg-white',
            )}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-gray-900 truncate">
                    {worker.name}
                  </h4>
                  <p className="text-sm text-gray-600">{worker.role}</p>
                </div>
              </div>
              <Badge
                className={cn('text-xs', getExperienceColor(worker.experience))}
              >
                {worker.experience}
              </Badge>
            </div>

            {/* Stats */}
            {stats.totalAssignments > 0 ? (
              <div className="space-y-3">
                {/* Quantity and Hours */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-2 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-600 font-medium">
                      Số lượng
                    </p>
                    <p className="text-lg font-bold text-blue-700">
                      {stats.totalQuantity}
                    </p>
                  </div>
                  <div className="text-center p-2 bg-purple-50 rounded-lg">
                    <p className="text-xs text-purple-600 font-medium">
                      Giờ/ngày
                    </p>
                    <p className="text-lg font-bold text-purple-700">
                      {stats.totalHours}h
                    </p>
                  </div>
                </div>

                {/* Progress */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-gray-600">Tiến độ</p>
                    <p className="text-xs font-semibold text-gray-700">
                      {stats.completedAssignments}/{stats.totalAssignments}
                    </p>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-300"
                      style={{ width: `${stats.completionRate}%` }}
                    />
                  </div>
                </div>

                {/* Hours Status */}
                <div
                  className={cn(
                    'flex items-center gap-2 p-2 rounded-lg',
                    hoursStatus.bg,
                  )}
                >
                  <StatusIcon className={cn('w-4 h-4', hoursStatus.color)} />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-700">
                      Tổng giờ hôm nay
                    </p>
                    <p className={cn('text-sm font-bold', hoursStatus.color)}>
                      {currentHours}h + {stats.totalHours}h ={' '}
                      {currentHours + stats.totalHours}h
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-400">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Chưa có phân công</p>
              </div>
            )}

            {/* Specialties */}
            {worker.specialties.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-600 mb-2 font-medium">
                  Kỹ năng:
                </p>
                <div className="flex flex-wrap gap-1">
                  {worker.specialties.slice(0, 3).map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                    >
                      {skill}
                    </span>
                  ))}
                  {worker.specialties.length > 3 && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                      +{worker.specialties.length - 3}
                    </span>
                  )}
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};
