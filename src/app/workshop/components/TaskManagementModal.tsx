'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Users,
  MapPin,
  Plus,
  X,
  Save,
  Clock,
  CheckSquare,
  FileText
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

interface WorkshopWorker {
  id: string;
  name: string;
  role: string;
  avatar?: string;
}

interface WorkshopZone {
  id: string;
  name: string;
  description: string;
  color: string;
}

interface TaskChecklistItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
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
  }[];
  totalQty: number;
  totalWeight: number;
  totalArea: number;

  // Workshop-specific fields
  startDate?: string;
  endDate?: string;
  assignedWorkers: string[];
  assignedZone?: string;
  workInstructions?: string;
  checklist: TaskChecklistItem[];
  status: 'todo' | 'in_progress' | 'review' | 'done';
  progress: number; // 0-100
  isDelayed: boolean;
  delayExplanation?: string;
  estimatedDays?: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface TaskManagementModalProps {
  task: WorkshopTask;
  workers: WorkshopWorker[];
  zones: WorkshopZone[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedTask: WorkshopTask) => void;
}

export const TaskManagementModal = ({
  task,
  workers,
  zones,
  isOpen,
  onClose,
  onSave
}: TaskManagementModalProps) => {
  const [editedTask, setEditedTask] = useState<WorkshopTask>(task);
  const [newChecklistItem, setNewChecklistItem] = useState({ title: '', description: '' });
  const [activeTab, setActiveTab] = useState<'general' | 'timeline' | 'workers' | 'checklist'>('general');

  useEffect(() => {
    setEditedTask(task);
  }, [task]);

  if (!isOpen) return null;

  const handleSave = () => {
    // Calculate estimated days based on start and end date
    if (editedTask.startDate && editedTask.endDate) {
      const start = new Date(editedTask.startDate);
      const end = new Date(editedTask.endDate);
      const diffTime = end.getTime() - start.getTime();
      const estimatedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setEditedTask(prev => ({ ...prev, estimatedDays }));
    }

    onSave(editedTask);
    onClose();
  };

  const addChecklistItem = () => {
    if (newChecklistItem.title.trim()) {
      const item: TaskChecklistItem = {
        id: `checklist-${Date.now()}`,
        title: newChecklistItem.title,
        description: newChecklistItem.description || undefined,
        completed: false
      };

      setEditedTask(prev => ({
        ...prev,
        checklist: [...prev.checklist, item]
      }));

      setNewChecklistItem({ title: '', description: '' });
    }
  };

  const removeChecklistItem = (itemId: string) => {
    setEditedTask(prev => ({
      ...prev,
      checklist: prev.checklist.filter(item => item.id !== itemId)
    }));
  };

  const toggleWorkerAssignment = (workerId: string) => {
    setEditedTask(prev => ({
      ...prev,
      assignedWorkers: prev.assignedWorkers.includes(workerId)
        ? prev.assignedWorkers.filter(id => id !== workerId)
        : [...prev.assignedWorkers, workerId]
    }));
  };

  const tabs = [
    { id: 'general', label: 'Tổng quan', icon: FileText },
    { id: 'timeline', label: 'Thời gian', icon: Calendar },
    { id: 'workers', label: 'Nhân sự', icon: Users },
    { id: 'checklist', label: 'Checklist', icon: CheckSquare }
  ];

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden" padding="sm">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-xl font-semibold text-secondary">
                Quản lý nhiệm vụ: {task.profile}
              </h2>
              <p className="text-sm text-secondary/70 mt-1">
                {task.material && `Vật liệu: ${task.material}`}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex border-b">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Khu vực thực hiện
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {zones.map(zone => (
                      <button
                        key={zone.id}
                        onClick={() => setEditedTask(prev => ({
                          ...prev,
                          assignedZone: prev.assignedZone === zone.id ? undefined : zone.id
                        }))}
                        className={cn(
                          'p-3 rounded-lg border text-left transition-colors',
                          editedTask.assignedZone === zone.id
                            ? 'border-primary bg-primary/10'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className="h-4 w-4" />
                          <span className="font-medium">{zone.name}</span>
                        </div>
                        <p className="text-xs text-gray-600">{zone.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hướng dẫn thực hiện
                  </label>
                  <textarea
                    value={editedTask.workInstructions || ''}
                    onChange={(e) => setEditedTask(prev => ({
                      ...prev,
                      workInstructions: e.target.value
                    }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Mô tả chi tiết cách thực hiện nhiệm vụ, yêu cầu kỹ thuật, an toàn..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trạng thái
                  </label>
                  <select
                    value={editedTask.status}
                    onChange={(e) => setEditedTask(prev => ({
                      ...prev,
                      status: e.target.value as any
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="todo">Chưa bắt đầu</option>
                    <option value="in_progress">Đang thực hiện</option>
                    <option value="review">Chờ kiểm tra</option>
                    <option value="done">Hoàn thành</option>
                  </select>
                </div>

                {/* Task Details */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-blue-600">{task.totalQty}</div>
                    <div className="text-sm text-gray-600">Tổng số lượng</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-600">{task.totalWeight.toFixed(1)}</div>
                    <div className="text-sm text-gray-600">Tổng khối lượng (kg)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-purple-600">{task.subtasks.length}</div>
                    <div className="text-sm text-gray-600">Số công đoạn</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'timeline' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ngày bắt đầu
                    </label>
                    <Input
                      type="date"
                      value={editedTask.startDate?.split('T')[0] || ''}
                      onChange={(e) => setEditedTask(prev => ({
                        ...prev,
                        startDate: e.target.value ? `${e.target.value}T00:00:00` : undefined
                      }))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ngày kết thúc
                    </label>
                    <Input
                      type="date"
                      value={editedTask.endDate?.split('T')[0] || ''}
                      onChange={(e) => setEditedTask(prev => ({
                        ...prev,
                        endDate: e.target.value ? `${e.target.value}T23:59:59` : undefined
                      }))}
                    />
                  </div>
                </div>

                {editedTask.startDate && editedTask.endDate && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Thời gian thực hiện</span>
                    </div>
                    <p className="text-blue-700">
                      {(() => {
                        const start = new Date(editedTask.startDate);
                        const end = new Date(editedTask.endDate);
                        const diffTime = end.getTime() - start.getTime();
                        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        return `${days} ngày (từ ${start.toLocaleDateString('vi-VN')} đến ${end.toLocaleDateString('vi-VN')})`;
                      })()}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ước tính thời gian (ngày)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={editedTask.estimatedDays || ''}
                    onChange={(e) => setEditedTask(prev => ({
                      ...prev,
                      estimatedDays: parseInt(e.target.value) || undefined
                    }))}
                    placeholder="Nhập số ngày ước tính"
                  />
                </div>

                {/* Timeline Visualization */}
                {editedTask.startDate && editedTask.endDate && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Timeline trực quan</h4>
                    <div className="relative">
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300"></div>

                      <div className="relative space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center relative z-10">
                            <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                          </div>
                          <div>
                            <p className="font-medium">Bắt đầu</p>
                            <p className="text-sm text-gray-600">
                              {new Date(editedTask.startDate).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center relative z-10">
                            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                          </div>
                          <div>
                            <p className="font-medium">Hiện tại</p>
                            <p className="text-sm text-gray-600">
                              {new Date().toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center relative z-10">
                            <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                          </div>
                          <div>
                            <p className="font-medium">Kết thúc</p>
                            <p className="text-sm text-gray-600">
                              {new Date(editedTask.endDate).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'workers' && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Chọn người thực hiện</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {workers.map(worker => (
                      <button
                        key={worker.id}
                        onClick={() => toggleWorkerAssignment(worker.id)}
                        className={cn(
                          'p-3 rounded-lg border text-left transition-colors',
                          editedTask.assignedWorkers.includes(worker.id)
                            ? 'border-primary bg-primary/10'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <Users className="h-4 w-4 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium">{worker.name}</p>
                            <p className="text-sm text-gray-600">{worker.role}</p>
                          </div>
                          {editedTask.assignedWorkers.includes(worker.id) && (
                            <div className="ml-auto">
                              <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                <span className="text-white text-xs">✓</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {editedTask.assignedWorkers.length > 0 && (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h5 className="font-medium text-green-800 mb-2">Đã chọn {editedTask.assignedWorkers.length} người:</h5>
                    <div className="flex flex-wrap gap-2">
                      {editedTask.assignedWorkers.map(workerId => {
                        const worker = workers.find(w => w.id === workerId);
                        return worker ? (
                          <Badge key={worker.id} className="bg-green-100 text-green-800">
                            {worker.name}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'checklist' && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Danh sách công việc</h4>

                  {/* Add new checklist item */}
                  <div className="p-4 border border-dashed border-gray-300 rounded-lg mb-4">
                    <div className="space-y-3">
                      <Input
                        placeholder="Tên công việc..."
                        value={newChecklistItem.title}
                        onChange={(e) => setNewChecklistItem(prev => ({
                          ...prev,
                          title: e.target.value
                        }))}
                      />
                      <Input
                        placeholder="Mô tả chi tiết (tùy chọn)..."
                        value={newChecklistItem.description}
                        onChange={(e) => setNewChecklistItem(prev => ({
                          ...prev,
                          description: e.target.value
                        }))}
                      />
                      <Button
                        onClick={addChecklistItem}
                        disabled={!newChecklistItem.title.trim()}
                        size="sm"
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Thêm công việc
                      </Button>
                    </div>
                  </div>

                  {/* Existing checklist items */}
                  <div className="space-y-3">
                    {editedTask.checklist.map((item, index) => (
                      <div key={item.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        <span className="text-sm text-gray-500 mt-1">{index + 1}.</span>
                        <div className="flex-1">
                          <p className="font-medium">{item.title}</p>
                          {item.description && (
                            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeChecklistItem(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}

                    {editedTask.checklist.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Chưa có công việc nào trong checklist</p>
                        <p className="text-sm">Thêm công việc để theo dõi tiến độ</p>
                      </div>
                    )}
                  </div>

                  {editedTask.checklist.length > 0 && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        Tổng cộng: <span className="font-medium">{editedTask.checklist.length}</span> công việc
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t bg-gray-50">
            <div className="text-sm text-gray-500">
              {editedTask.assignedWorkers.length > 0 && editedTask.assignedZone && (
                <span>
                  ✓ Đã phân công {editedTask.assignedWorkers.length} người,
                  khu vực {zones.find(z => z.id === editedTask.assignedZone)?.name}
                </span>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={onClose}>
                Hủy
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Lưu thay đổi
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
};