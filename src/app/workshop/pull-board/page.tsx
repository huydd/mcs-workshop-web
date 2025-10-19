'use client';

import { useState, useMemo, useEffect, DragEvent } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Package,
  AlertCircle,
  GripVertical,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';

// BOM data structure from localStorage
interface BomTreeNode {
  index: number | null;
  project_id: string | null;
  assembly_id: string | null;
  ass_name: string | null;
  part_name: string | null;
  profile: string | null;
  material: string | null;
  thickness: number | number[] | string | null;
  width: number | string | null;
  length: number | null;
  qty_per_ass: number | null;
  qty_total: number | null;
  weight_per_part: number | null;
  weight_combination: number | null;
  weight_per_ass: number | null;
  weight_total: number | null;
  area_per_ass: number | null;
  area_total: number | null;
  welding_machine: number | null;
  hand_welding: number | null;
  note: string | null;
  children: BomTreeNode[];
}

interface BomData {
  data: BomTreeNode[];
  timestamp: string;
  fileName: string;
  totalGroups: number;
  totalChildren: number;
  published: boolean;
}

interface AvailableTask {
  id: string;
  index: number;
  ass_name: string | null;
  profile: string | null;
  material: string | null;
  qty_total: number;
  weight_total: number;
  children: BomTreeNode[];
}

interface WorkshopTask extends AvailableTask {
  assignedAt: string;
  workshopId: string;
  workshopName: string;
}

interface ClaimedTask {
  taskId: string;
  workshopId: string;
  workshopName: string;
  claimedAt: string;
  confirmed: boolean;
}

const STORAGE_KEY_DRAFT = 'pullBoardWorkshopTasks';
const STORAGE_KEY_CLAIMED = 'pullBoardClaimedTasks';

const PullBoardPage = () => {
  const { user } = useAuth();
  const [availableTasks, setAvailableTasks] = useState<AvailableTask[]>([]);
  const [workshopTasks, setWorkshopTasks] = useState<WorkshopTask[]>([]);
  const [claimedTasks, setClaimedTasks] = useState<ClaimedTask[]>([]);
  const [expandedAvailable, setExpandedAvailable] = useState<Set<string>>(
    new Set(),
  );
  const [expandedWorkshop, setExpandedWorkshop] = useState<Set<string>>(
    new Set(),
  );
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const isWorkshopLead = user?.role === 'WORKSHOP_LEAD';
  const workshopId = user?.workshopCode || 'W1';
  const workshopName = user?.workshopName || 'Xưởng 1';

  // Load claimed tasks from global storage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY_CLAIMED);
      if (stored) {
        const tasks: ClaimedTask[] = JSON.parse(stored);
        setClaimedTasks(tasks);
      }
    } catch (error) {
      console.error('Error loading claimed tasks:', error);
    }
  }, []);

  // Load my confirmed tasks into draft area for display
  useEffect(() => {
    if (!isWorkshopLead || typeof window === 'undefined') return;
    if (!availableTasks.length || !claimedTasks.length) return;

    // Get my confirmed tasks
    const myConfirmedTaskIds = claimedTasks
      .filter(c => c.workshopId === workshopId && c.confirmed)
      .map(c => c.taskId);

    if (myConfirmedTaskIds.length === 0) return;

    // Find these tasks in available tasks
    const myConfirmedTasks: WorkshopTask[] = availableTasks
      .filter(t => myConfirmedTaskIds.includes(t.id))
      .map(task => {
        const claim = claimedTasks.find(c => c.taskId === task.id);
        return {
          ...task,
          assignedAt: claim?.claimedAt || new Date().toISOString(),
          workshopId,
          workshopName,
        };
      });

    // Only set if draft is empty (to show confirmed tasks)
    if (workshopTasks.length === 0 && myConfirmedTasks.length > 0) {
      setWorkshopTasks(myConfirmedTasks);
    }
  }, [availableTasks, claimedTasks, workshopId, workshopName, isWorkshopLead]);

  // Load BOM data and convert to available tasks (no grouping!)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const bomDataStr = localStorage.getItem('bomListData');
      if (!bomDataStr) {
        setAvailableTasks([]);
        return;
      }

      const bomData: BomData = JSON.parse(bomDataStr);

      if (!bomData.published || !bomData.data) {
        setAvailableTasks([]);
        return;
      }

      // Group BOM data by (ass_name + profile) to create tasks
      // Each group = 1 task
      // Each parent node in group = 1 assembly
      // Children of parent = parts of that assembly

      type GroupKey = string;
      const grouped = new Map<GroupKey, {
        ass_name: string | null;
        profile: string | null;
        material: string | null;
        assemblies: BomTreeNode[]; // Parent nodes (assemblies)
        totalQty: number;
        totalWeight: number;
      }>();

      bomData.data.forEach(parent => {
        const key = `${parent.ass_name || 'UNKNOWN'}::${parent.profile || 'UNKNOWN'}`;

        const existing = grouped.get(key);
        if (existing) {
          existing.assemblies.push(parent);
          existing.totalQty += parent.qty_total || 0;
          existing.totalWeight += parent.weight_total || 0;
        } else {
          grouped.set(key, {
            ass_name: parent.ass_name,
            profile: parent.profile,
            material: parent.material,
            assemblies: [parent],
            totalQty: parent.qty_total || 0,
            totalWeight: parent.weight_total || 0,
          });
        }
      });

      // Convert groups to tasks
      // Each group's assemblies array contains the parent nodes (assemblies)
      // Each parent's children array contains the parts
      const tasks: AvailableTask[] = Array.from(grouped.entries()).map(([_, group], idx) => {
        // Flatten all children from all assemblies for backward compatibility
        const allChildren: BomTreeNode[] = [];
        group.assemblies.forEach(assembly => {
          assembly.children.forEach(child => {
            allChildren.push({
              ...child,
              assembly_id: assembly.assembly_id, // Tag each part with its assembly ID
            });
          });
        });

        return {
          id: `task-${idx + 1}`,
          index: idx + 1,
          ass_name: group.ass_name,
          profile: group.profile,
          material: group.material,
          qty_total: group.totalQty,
          weight_total: group.totalWeight,
          children: allChildren, // All parts from all assemblies
        };
      });

      setAvailableTasks(tasks);
    } catch (error) {
      console.error('Error loading BOM data:', error);
      setAvailableTasks([]);
    }
  }, []);

  // Load draft workshop tasks from localStorage
  useEffect(() => {
    if (!isWorkshopLead || typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_DRAFT}_${workshopId}`);
      if (stored) {
        const tasks: WorkshopTask[] = JSON.parse(stored);
        setWorkshopTasks(tasks);
      }
    } catch (error) {
      console.error('Error loading workshop tasks:', error);
    }
  }, [isWorkshopLead, workshopId]);

  // Save draft workshop tasks to localStorage
  useEffect(() => {
    if (!isWorkshopLead || typeof window === 'undefined') return;

    try {
      localStorage.setItem(
        `${STORAGE_KEY_DRAFT}_${workshopId}`,
        JSON.stringify(workshopTasks),
      );
    } catch (error) {
      console.error('Error saving workshop tasks:', error);
    }
  }, [workshopTasks, isWorkshopLead, workshopId]);

  const toggleExpand = (id: string, type: 'available' | 'workshop') => {
    const setter =
      type === 'available' ? setExpandedAvailable : setExpandedWorkshop;
    setter(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleDragStart = (e: DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (!draggedTaskId || !isWorkshopLead) return;

    // Find task in available tasks
    const task = availableTasks.find(t => t.id === draggedTaskId);
    if (!task) return;

    // Check if already in workshop tasks
    if (workshopTasks.some(t => t.id === task.id)) {
      setDraggedTaskId(null);
      return;
    }

    // Check if already claimed by anyone
    const existingClaim = claimedTasks.find(c => c.taskId === task.id);
    if (existingClaim && existingClaim.confirmed) {
      alert(`Công việc này đã được nhận bởi ${existingClaim.workshopName}`);
      setDraggedTaskId(null);
      return;
    }

    // Add to workshop tasks (draft)
    const workshopTask: WorkshopTask = {
      ...task,
      assignedAt: new Date().toISOString(),
      workshopId,
      workshopName,
    };

    setWorkshopTasks(prev => [...prev, workshopTask]);
    setDraggedTaskId(null);
  };

  const handleAcceptAll = () => {
    if (availableTasks.length === 0) {
      alert('Không có công việc nào để nhận!');
      return;
    }

    // Filter out already claimed tasks
    const confirmedClaimedIds = claimedTasks
      .filter(c => c.confirmed)
      .map(c => c.taskId);

    const availableToAccept = availableTasks.filter(
      t => !confirmedClaimedIds.includes(t.id),
    );

    if (availableToAccept.length === 0) {
      alert('Tất cả công việc đã được nhận!');
      return;
    }

    const confirmed = confirm(
      `Xác nhận nhận tất cả ${availableToAccept.length} công việc cho ${workshopName}?`,
    );

    if (!confirmed) return;

    // Add all to workshop tasks
    const newTasks: WorkshopTask[] = availableToAccept.map(task => ({
      ...task,
      assignedAt: new Date().toISOString(),
      workshopId,
      workshopName,
    }));

    setWorkshopTasks(newTasks);

    // Immediately confirm them
    confirmTasks(newTasks);
  };

  const handleSubmit = () => {
    if (workshopTasks.length === 0) {
      alert('Chưa có công việc nào để nhận!');
      return;
    }

    const confirmed = confirm(
      `Xác nhận nhận ${workshopTasks.length} công việc cho ${workshopName}?`,
    );

    if (confirmed) {
      confirmTasks(workshopTasks);
    }
  };

  const confirmTasks = (tasks: WorkshopTask[]) => {
    try {
      // 1. Update global claimed tasks
      const newClaims: ClaimedTask[] = tasks.map(task => ({
        taskId: task.id,
        workshopId,
        workshopName,
        claimedAt: new Date().toISOString(),
        confirmed: true,
      }));

      // Merge with existing claims, removing duplicates
      const allClaims = [
        ...claimedTasks.filter(c => !tasks.some(t => t.id === c.taskId)),
        ...newClaims,
      ];
      localStorage.setItem(STORAGE_KEY_CLAIMED, JSON.stringify(allClaims));
      setClaimedTasks(allClaims);

      // 2. Push to Kanban board "CHƯA LÀM"
      const workshopData = localStorage.getItem(`workshop_${workshopId}_tasks`);
      let existingTasks: any[] = [];

      if (workshopData) {
        const data = JSON.parse(workshopData);
        existingTasks = data.tasks || [];
      }

      // Convert to Kanban format
      const kanbanTasks = tasks.map(task => ({
        id: task.id,
        profile: task.profile || 'Không có tên', // Use profile, not ass_name
        material: task.material,
        subtasks: task.children.map((child, idx) => ({
          index: idx,
          part_name: child.part_name,
          ass_name: child.ass_name || task.ass_name, // Use child's ass_name or fallback to task's
          assembly_id: child.assembly_id, // Assembly ID to group parts
          qty_total: child.qty_total,
          qty_per_ass: child.qty_per_ass, // Quantity per assembly
          weight_total: child.weight_total,
          area_total: child.area_total,
          welding_machine: child.welding_machine,
          hand_welding: child.hand_welding,
          note: child.note,
          completedQty: 0, // Initialize completed quantity
        })),
        totalQty: task.qty_total,
        totalWeight: task.weight_total,
        totalArea: 0,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        assignedWorkers: [],
        assignedZone: undefined,
        workInstructions: `Nhận từ Pull Board - ${workshopName}`,
        checklist: [
          {
            id: `${task.id}-check-1`,
            title: 'Chuẩn bị nguyên vật liệu',
            completed: false,
          },
          {
            id: `${task.id}-check-2`,
            title: 'Kiểm tra thiết bị',
            completed: false,
          },
          {
            id: `${task.id}-check-3`,
            title: 'Thực hiện gia công',
            completed: false,
          },
          {
            id: `${task.id}-check-4`,
            title: 'Kiểm tra chất lượng',
            completed: false,
          },
          { id: `${task.id}-check-5`, title: 'Hoàn thiện', completed: false },
        ],
        status: 'todo',
        progress: 0,
        isDelayed: false,
        estimatedDays: 7,
        priority: 'medium' as const,
      }));

      // Merge with existing, avoiding duplicates
      const mergedTasks = [
        ...existingTasks.filter(
          (t: any) => !kanbanTasks.some(kt => kt.id === t.id),
        ),
        ...kanbanTasks,
      ];

      const kanbanData = {
        workshopId,
        workshopName,
        tasks: mergedTasks,
        lastUpdated: new Date().toISOString(),
      };

      localStorage.setItem(
        `workshop_${workshopId}_tasks`,
        JSON.stringify(kanbanData),
      );

      // 3. Keep draft but mark as confirmed (don't clear)
      // setWorkshopTasks([]);
      // localStorage.removeItem(`${STORAGE_KEY_DRAFT}_${workshopId}`);
      // Instead, tasks will show as "Đã nhận" with green badges

      alert(
        `Đã nhận ${tasks.length} công việc thành công!\n\nCông việc đã được đẩy vào Kanban Board (cột CHƯA LÀM).`,
      );
    } catch (error) {
      console.error('Error confirming tasks:', error);
      alert('Có lỗi xảy ra khi nhận việc!');
    }
  };

  const renderTask = (task: AvailableTask, type: 'available' | 'workshop') => {
    console.log('🚀 ~ renderTask ~ task:', task);
    const expanded =
      type === 'available'
        ? expandedAvailable.has(task.id)
        : expandedWorkshop.has(task.id);

    const hasChildren = task.children && task.children.length > 0;

    // Check if task is claimed
    const claim = claimedTasks.find(c => c.taskId === task.id);
    const isClaimedByMe =
      claim && claim.workshopId === workshopId && claim.confirmed;
    const isClaimedByOther =
      claim && claim.workshopId !== workshopId && claim.confirmed;
    const isDraft = workshopTasks.some(t => t.id === task.id);
    const isDragging = draggedTaskId === task.id;

    // Disable if claimed by anyone (confirmed)
    const isDisabled =
      type === 'available' && (isClaimedByOther || (claim && claim.confirmed));

    return (
      <div
        key={task.id}
        className={cn(
          'border rounded-lg transition-all',
          type === 'available' &&
            isDisabled &&
            'opacity-40 cursor-not-allowed bg-gray-100',
          type === 'available' &&
            isClaimedByMe &&
            'border-emerald-400 bg-emerald-50',
          type === 'available' &&
            !isDisabled &&
            !isClaimedByMe &&
            'cursor-move hover:border-primary hover:bg-primary/5',
          type === 'workshop' && 'bg-emerald-50 border-emerald-200',
          isDragging && 'opacity-50',
        )}
        draggable={type === 'available' && !isDisabled && isWorkshopLead}
        onDragStart={e =>
          type === 'available' && !isDisabled && handleDragStart(e, task.id)
        }
      >
        <div className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 flex-1">
              {type === 'available' && !isDisabled && !isClaimedByMe && (
                <GripVertical className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              )}
              {isClaimedByMe && (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-blue-100 text-blue-700 text-xs">
                    #{task.index}
                  </Badge>
                  <span className="font-medium text-sm text-secondary">
                    {task.ass_name || 'Không có tên cấu kiện'}
                  </span>
                  {isClaimedByMe && (
                    <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                      Đã nhận bởi {workshopName}
                    </Badge>
                  )}
                  {isClaimedByOther && (
                    <Badge className="bg-red-100 text-red-700 text-xs">
                      Đã nhận bởi {claim.workshopName}
                    </Badge>
                  )}
                  {isDraft && !claim?.confirmed && (
                    <Badge className="bg-amber-100 text-amber-700 text-xs">
                      Đang chọn
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-secondary/60 mt-1 space-y-0.5">
                  <div>Profile: {task.profile || '—'}</div>
                  <div>Vật liệu: {task.material || '—'}</div>
                  <div className="flex gap-3">
                    <span>SL: {task.qty_total}</span>
                    <span>KL: {task.weight_total.toFixed(2)} kg</span>
                  </div>
                </div>
              </div>
            </div>
            {hasChildren && (
              <button
                onClick={() => toggleExpand(task.id, type)}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
              >
                {expanded ? (
                  <ChevronDown className="h-4 w-4 text-secondary" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-secondary" />
                )}
              </button>
            )}
          </div>

          {/* Sub-items */}
          {hasChildren && expanded && (
            <div className="mt-3 pt-3 border-t space-y-2">
              <div className="text-xs font-medium text-secondary/70 mb-2">
                Chi tiết ({task.children.length} items):
              </div>
              {task.children.map((child, idx) => (
                <div
                  key={idx}
                  className="pl-6 py-2 bg-white/50 rounded border border-gray-200 text-xs"
                >
                  <div className="font-medium text-secondary">
                    {child.ass_name || child.part_name || 'Chi tiết'}
                  </div>
                  <div className="text-secondary/60 mt-1 space-y-0.5">
                    <div>Profile: {child.profile || '—'}</div>
                    {child.qty_total && <div>SL: {child.qty_total}</div>}
                    {child.weight_per_part && (
                      <div>KL/CT: {child.weight_per_part.toFixed(2)} kg</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="text-center" padding="lg">
          <h2 className="text-xl font-semibold text-secondary mb-2">
            Vui lòng đăng nhập
          </h2>
          <p className="text-secondary/70">Đăng nhập để sử dụng Pull Board.</p>
        </Card>
      </div>
    );
  }

  if (!isWorkshopLead) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="text-center" padding="lg">
          <h2 className="text-xl font-semibold text-secondary mb-2">
            Không có quyền truy cập
          </h2>
          <p className="text-secondary/70">
            Chỉ trưởng xưởng mới có thể kéo việc.
          </p>
        </Card>
      </div>
    );
  }

  const confirmedClaimedIds = claimedTasks
    .filter(c => c.confirmed)
    .map(c => c.taskId);
  const myClaimedIds = claimedTasks
    .filter(c => c.workshopId === workshopId && c.confirmed)
    .map(c => c.taskId);
  const unassignedCount = availableTasks.filter(
    t => !confirmedClaimedIds.includes(t.id),
  ).length;

  // Count only unconfirmed tasks in draft
  const draftCount = workshopTasks.filter(task => {
    const claim = claimedTasks.find(
      c => c.taskId === task.id && c.workshopId === workshopId,
    );
    return !claim || !claim.confirmed;
  }).length;

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-secondary">
          Pull Board - {workshopName}
        </h1>
        <p className="text-sm text-secondary/70 mt-1">
          Kéo việc từ danh sách khả dụng sang danh sách công việc của xưởng
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card padding="md" className="bg-blue-50 border-blue-200">
          <div className="text-xs text-blue-700 uppercase tracking-wide">
            Tổng số việc
          </div>
          <div className="text-2xl font-bold text-blue-900 mt-1">
            {availableTasks.length}
          </div>
        </Card>
        <Card padding="md" className="bg-emerald-50 border-emerald-200">
          <div className="text-xs text-emerald-700 uppercase tracking-wide">
            Đã nhận
          </div>
          <div className="text-2xl font-bold text-emerald-900 mt-1">
            {myClaimedIds.length}
          </div>
        </Card>
        <Card padding="md" className="bg-amber-50 border-amber-200">
          <div className="text-xs text-amber-700 uppercase tracking-wide">
            Đang chọn
          </div>
          <div className="text-2xl font-bold text-amber-900 mt-1">
            {draftCount}
          </div>
        </Card>
        <Card padding="md" className="bg-gray-50 border-gray-200">
          <div className="text-xs text-gray-700 uppercase tracking-wide">
            Còn lại
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {unassignedCount}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Available Tasks */}
        <div>
          <Card padding="lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-secondary text-lg">
                Danh sách việc khả dụng
              </h2>
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-100 text-blue-700">
                  {unassignedCount} việc
                </Badge>
                {unassignedCount > 0 && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleAcceptAll}
                    className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700"
                  >
                    Nhận tất cả
                  </Button>
                )}
              </div>
            </div>

            {availableTasks.length === 0 ? (
              <div className="text-center py-12 text-secondary/50">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Chưa có công việc khả dụng</p>
                <p className="text-xs mt-1">
                  BOM cần được publish từ trang Technical
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
                {availableTasks.map(task => renderTask(task, 'available'))}
              </div>
            )}
          </Card>
        </div>

        {/* RIGHT: Workshop Tasks */}
        <div>
          <Card
            padding="lg"
            className={cn(
              'border-2 border-dashed transition-all',
              isDraggingOver
                ? 'border-emerald-500 bg-emerald-100 shadow-lg ring-4 ring-emerald-200'
                : 'border-emerald-300 bg-emerald-50/30',
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-secondary text-lg">
                Công việc {workshopName}
              </h2>
              <Badge className="bg-emerald-100 text-emerald-700">
                {workshopTasks.length} việc
              </Badge>
            </div>

            {workshopTasks.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-emerald-200 rounded-lg bg-white">
                <AlertCircle className="h-12 w-12 mx-auto mb-3 text-emerald-300" />
                <p className="text-sm text-secondary/60">Chưa có công việc</p>
                <p className="text-xs text-secondary/50 mt-1">
                  Kéo việc từ bên trái vào đây
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
                {workshopTasks.map(task => renderTask(task, 'workshop'))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Fixed Submit Button */}
      {(() => {
        // Only show button if there are unconfirmed tasks in draft
        const unconfirmedTasks = workshopTasks.filter(task => {
          const claim = claimedTasks.find(
            c => c.taskId === task.id && c.workshopId === workshopId,
          );
          return !claim || !claim.confirmed;
        });

        if (unconfirmedTasks.length === 0) return null;

        return (
          <div className="fixed bottom-6 right-6 z-50">
            <Button
              onClick={handleSubmit}
              size="lg"
              className="shadow-2xl hover:shadow-emerald-500/50 transition-all bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-6 text-lg font-semibold"
            >
              <span className="flex items-center gap-3">
                <span>Nhận việc ({unconfirmedTasks.length})</span>
                <Badge className="bg-white text-emerald-700 text-sm px-2 py-1">
                  {unconfirmedTasks.reduce((sum, t) => sum + t.qty_total, 0)} SL
                </Badge>
              </span>
            </Button>
          </div>
        );
      })()}
    </div>
  );
};

export default PullBoardPage;
