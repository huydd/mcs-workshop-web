'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  Users,
  CheckCircle2,
  UserCheck,
  Save,
  AlertCircle
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

export interface Worker {
  id: string;
  name: string;
  role: string;
  specialties: string[];
  avatar?: string;
  experience: 'junior' | 'senior' | 'expert';
  currentTaskId?: string; // Track current assignment
}

interface WorkerAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (workerIds: string[]) => void;
  currentAssignedWorkers: string[];
  allWorkers: Worker[];
  allTasks: any[]; // To check worker availability
  taskTitle?: string;
}

export const WorkerAssignmentModal = ({
  isOpen,
  onClose,
  onAssign,
  currentAssignedWorkers,
  allWorkers,
  allTasks,
  taskTitle = 'Nhiệm vụ'
}: WorkerAssignmentModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorkers, setSelectedWorkers] = useState<Set<string>>(
    new Set(currentAssignedWorkers)
  );

  if (!isOpen) return null;

  // Filter available workers
  const availableWorkers = useMemo(() => {
    return allWorkers.filter(worker => {
      const matchesSearch = !searchTerm ||
        worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worker.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worker.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())) ||
        worker.experience.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });
  }, [allWorkers, searchTerm]);

  // Categorize workers
  const { assignedToThis, assignedToOther, unassigned } = useMemo(() => {
    const assignedToThis: Worker[] = [];
    const assignedToOther: Worker[] = [];
    const unassigned: Worker[] = [];

    availableWorkers.forEach(worker => {
      if (currentAssignedWorkers.includes(worker.id)) {
        assignedToThis.push(worker);
      } else if (worker.currentTaskId) {
        assignedToOther.push(worker);
      } else {
        unassigned.push(worker);
      }
    });

    return { assignedToThis, assignedToOther, unassigned };
  }, [availableWorkers, currentAssignedWorkers]);

  const toggleWorker = (workerId: string) => {
    const worker = allWorkers.find(w => w.id === workerId);
    if (!worker) return;

    // Don't allow selecting workers assigned to other tasks
    if (worker.currentTaskId && !currentAssignedWorkers.includes(workerId)) {
      return;
    }

    setSelectedWorkers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(workerId)) {
        newSet.delete(workerId);
      } else {
        newSet.add(workerId);
      }
      return newSet;
    });
  };

  const handleSave = () => {
    onAssign(Array.from(selectedWorkers));
    onClose();
  };

  const getWorkerTaskInfo = (worker: Worker) => {
    if (!worker.currentTaskId) return null;
    const task = allTasks.find(t => t.id === worker.currentTaskId);
    return task ? task.profile : 'Nhiệm vụ khác';
  };

  const getExperienceBadge = (experience: Worker['experience']) => {
    const styles = {
      junior: 'bg-yellow-100 text-yellow-800',
      senior: 'bg-blue-100 text-blue-800',
      expert: 'bg-green-100 text-green-800'
    };

    const labels = {
      junior: 'Thực tập',
      senior: 'Lành nghề',
      expert: 'Chuyên gia'
    };

    return (
      <Badge className={styles[experience]}>
        {labels[experience]}
      </Badge>
    );
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden" padding="sm">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-gray-50">
            <div>
              <h2 className="text-xl font-semibold text-secondary">
                Phân công nhân sự
              </h2>
              <p className="text-sm text-secondary/70 mt-1">
                {taskTitle}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Search */}
          <div className="p-6 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm theo tên, chức vụ, chuyên môn hoặc kinh nghiệm..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Search hint */}
            <div className="mt-2 text-xs text-gray-500">
              💡 Tìm kiếm: "senior", "hàn", "TIG", "expert", tên nhân viên...
            </div>

            {selectedWorkers.size > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <UserCheck className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    Đã chọn {selectedWorkers.size} người:
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Array.from(selectedWorkers).map(workerId => {
                    const worker = allWorkers.find(w => w.id === workerId);
                    return worker ? (
                      <Badge key={worker.id} className="bg-blue-100 text-blue-800">
                        {worker.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <div className="space-y-6">
              {/* Currently Assigned */}
              {assignedToThis.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Đang được phân công ({assignedToThis.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {assignedToThis.map(worker => (
                      <WorkerCard
                        key={worker.id}
                        worker={worker}
                        isSelected={selectedWorkers.has(worker.id)}
                        onClick={() => toggleWorker(worker.id)}
                        status="assigned"
                        experienceBadge={getExperienceBadge(worker.experience)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Available Workers */}
              {unassigned.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Nhân sự khả dụng ({unassigned.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {unassigned.map(worker => (
                      <WorkerCard
                        key={worker.id}
                        worker={worker}
                        isSelected={selectedWorkers.has(worker.id)}
                        onClick={() => toggleWorker(worker.id)}
                        status="available"
                        experienceBadge={getExperienceBadge(worker.experience)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Assigned to Other Tasks */}
              {assignedToOther.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-orange-700 mb-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Đang làm việc khác ({assignedToOther.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {assignedToOther.map(worker => (
                      <WorkerCard
                        key={worker.id}
                        worker={worker}
                        isSelected={false}
                        onClick={() => {}} // Disabled
                        status="busy"
                        experienceBadge={getExperienceBadge(worker.experience)}
                        taskInfo={getWorkerTaskInfo(worker)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {availableWorkers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Không tìm thấy nhân sự phù hợp</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t bg-gray-50">
            <div className="text-sm text-gray-600">
              {selectedWorkers.size > 0 && (
                <span>Đã chọn {selectedWorkers.size} người thực hiện</span>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={onClose}>
                Hủy
              </Button>
              <Button
                onClick={handleSave}
                className="bg-primary hover:bg-primary/90 text-white font-medium px-6"
              >
                <Save className="h-4 w-4 mr-2" />
                Lưu phân công
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
};

// Worker Card Component
interface WorkerCardProps {
  worker: Worker;
  isSelected: boolean;
  onClick: () => void;
  status: 'available' | 'assigned' | 'busy';
  experienceBadge: React.ReactNode;
  taskInfo?: string | null;
}

const WorkerCard = ({
  worker,
  isSelected,
  onClick,
  status,
  experienceBadge,
  taskInfo
}: WorkerCardProps) => {
  const isDisabled = status === 'busy';

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        'p-3 rounded-lg border text-left transition-all duration-200',
        isSelected && !isDisabled && 'border-blue-500 bg-blue-50 ring-2 ring-blue-200',
        !isSelected && !isDisabled && 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
        isDisabled && 'border-gray-200 bg-gray-100 opacity-60 cursor-not-allowed',
        status === 'assigned' && !isSelected && 'border-green-200 bg-green-50'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
          <Users className="h-5 w-5 text-gray-600" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-gray-900 truncate">{worker.name}</h4>
            {isSelected && <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" />}
          </div>

          <p className="text-sm text-gray-600 mb-2">{worker.role}</p>

          {/* Quick stats */}
          <div className="text-xs text-gray-500 mb-2">
            {worker.specialties.length} chuyên môn
          </div>

          <div className="flex items-center gap-1 mb-2">
            {experienceBadge}
          </div>

          {worker.specialties.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {worker.specialties.slice(0, 3).map(specialty => (
                <span key={specialty} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200">
                  {specialty}
                </span>
              ))}
              {worker.specialties.length > 3 && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">+{worker.specialties.length - 3} khác</span>
              )}
            </div>
          )}

          {taskInfo && (
            <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
              Đang làm: {taskInfo}
            </div>
          )}
        </div>
      </div>
    </button>
  );
};