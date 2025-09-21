'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Send,
  X,
  Activity
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface ProgressReportTask {
  id: string;
  profile: string;
  status: string;
  progress: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedWorkers: string[];
  isDelayed: boolean;
  aiGeneratedNote: string;
}

interface ProgressReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (report: ProgressReport) => void;
  tasks: ProgressReportTask[];
  workshopName: string;
  userName: string;
}

interface ProgressReport {
  timestamp: string;
  workshopName: string;
  reportedBy: string;
  tasksInProgress: ProgressReportTask[];
  generalNote: string;
  submitted: boolean;
}

export const ProgressReportModal = ({
  isOpen,
  onClose,
  onSubmit,
  tasks,
  workshopName,
  userName
}: ProgressReportModalProps) => {
  const [generalNote, setGeneralNote] = useState('');
  const [countdown, setCountdown] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter tasks in progress for today
  const tasksInProgress = tasks.filter(task =>
    task.status === 'in_progress' || (task.status === 'todo' && task.assignedWorkers.length > 0)
  );

  // Generate AI note based on current tasks
  const generateAINote = () => {
    const totalTasks = tasksInProgress.length;
    const completedTasks = tasksInProgress.filter(t => t.progress === 100).length;
    const delayedTasks = tasksInProgress.filter(t => t.isDelayed).length;
    const highPriorityTasks = tasksInProgress.filter(t => t.priority === 'high' || t.priority === 'urgent').length;

    let note = `Báo cáo tiến độ ${workshopName}:\n`;
    note += `• Tổng số nhiệm vụ đang thực hiện: ${totalTasks}\n`;

    if (completedTasks > 0) {
      note += `• Nhiệm vụ hoàn thành: ${completedTasks}\n`;
    }

    if (delayedTasks > 0) {
      note += `• ⚠️ Nhiệm vụ chậm tiến độ: ${delayedTasks}\n`;
    }

    if (highPriorityTasks > 0) {
      note += `• 🔥 Nhiệm vụ ưu tiên cao: ${highPriorityTasks}\n`;
    }

    // Add specific task notes
    if (tasksInProgress.length > 0) {
      note += `\nChi tiết:\n`;
      tasksInProgress.slice(0, 3).forEach(task => {
        note += `• ${task.profile}: ${task.progress}% - ${task.aiGeneratedNote}\n`;
      });

      if (tasksInProgress.length > 3) {
        note += `• ... và ${tasksInProgress.length - 3} nhiệm vụ khác\n`;
      }
    }

    return note;
  };

  // Auto-submit after countdown
  useEffect(() => {
    if (!isOpen) return;

    // Set initial AI note if user hasn't written anything
    if (!generalNote) {
      setGeneralNote(generateAINote());
    }

    // Start countdown
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  const handleAutoSubmit = () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    const report: ProgressReport = {
      timestamp: new Date().toISOString(),
      workshopName,
      reportedBy: userName,
      tasksInProgress,
      generalNote: generalNote || generateAINote(),
      submitted: true
    };

    onSubmit(report);
    setTimeout(() => {
      onClose();
      setIsSubmitting(false);
      setCountdown(5);
    }, 1000);
  };

  const handleManualSubmit = () => {
    handleAutoSubmit();
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      urgent: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const getPriorityIcon = (priority: string) => {
    const icons = { urgent: '🔴', high: '🟠', medium: '🟡', low: '🟢' };
    return icons[priority as keyof typeof icons] || '🟡';
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden" padding="sm">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-blue-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-blue-900">
                  Báo cáo tiến độ
                </h2>
                <p className="text-sm text-blue-700">
                  {workshopName} - {new Date().toLocaleString('vi-VN')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Countdown Timer */}
              <div className="flex items-center gap-2 px-3 py-2 bg-orange-100 rounded-lg">
                <Clock className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">
                  Tự động gửi sau {countdown}s
                </span>
              </div>

              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            <div className="space-y-6">
              {/* Tasks Summary */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Nhiệm vụ đang thực hiện ({tasksInProgress.length})
                </h3>

                {tasksInProgress.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Không có nhiệm vụ nào đang thực hiện</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tasksInProgress.map(task => (
                      <Card key={task.id} className="p-4" padding="sm">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-medium text-gray-900">{task.profile}</h4>
                              <Badge className={getPriorityColor(task.priority)}>
                                {getPriorityIcon(task.priority)} {task.priority}
                              </Badge>
                              {task.isDelayed && (
                                <Badge className="bg-red-100 text-red-800">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Chậm tiến độ
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>Tiến độ: {task.progress}%</span>
                              <span>Nhân sự: {task.assignedWorkers.length} người</span>
                              <span className={cn(
                                "px-2 py-1 rounded text-xs",
                                task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                              )}>
                                {task.status === 'in_progress' ? 'Đang thực hiện' : 'Chưa bắt đầu'}
                              </span>
                            </div>

                            <p className="text-sm text-gray-600 mt-2 italic">
                              "{task.aiGeneratedNote}"
                            </p>
                          </div>

                          {/* Progress Circle */}
                          <div className="relative w-12 h-12 ml-4">
                            <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                              <path
                                d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="#e5e7eb"
                                strokeWidth="2"
                              />
                              <path
                                d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke={task.progress > 75 ? "#10b981" : task.progress > 50 ? "#3b82f6" : task.progress > 25 ? "#f59e0b" : "#ef4444"}
                                strokeWidth="3"
                                strokeDasharray={`${task.progress}, 100`}
                                strokeLinecap="round"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-xs font-bold">{task.progress}%</span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* General Note */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Ghi chú tổng quan
                </h3>
                <textarea
                  value={generalNote}
                  onChange={(e) => setGeneralNote(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="AI đã tạo báo cáo tự động. Bạn có thể chỉnh sửa nếu cần..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 Báo cáo được AI tạo tự động dựa trên tiến độ hiện tại
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t bg-gray-50">
            <p className="text-sm text-gray-600">
              Báo cáo sẽ được gửi tự động sau {countdown} giây
            </p>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={onClose}>
                Hủy
              </Button>
              <Button
                onClick={handleManualSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                {isSubmitting ? 'Đang gửi...' : 'Gửi báo cáo'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
};