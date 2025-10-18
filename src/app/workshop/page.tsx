'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Users,
  MapPin,
  AlertTriangle,
  Search,
  Filter,
  MoreHorizontal,
  ChevronDown,
  Edit3,
  MessageSquare,
  Activity,
  Clock,
  Eye,
  CheckCircle2,
  List,
  LayoutGrid
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';
import { TaskManagementModal } from './components/TaskManagementModal';
import { WorkerAssignmentModal } from './components/WorkerAssignmentModal';
import { ProgressReportModal } from './components/ProgressReportModal';
import { CommentModal } from './components/CommentModal';

interface WorkshopWorker {
  id: string;
  name: string;
  role: string;
  specialties: string[];
  avatar?: string;
  experience: 'junior' | 'senior' | 'expert';
  currentTaskId?: string;
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
    completionPercent?: number; // 0, 25, 50, 75, 100
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
  subStage?: string; // Current stage within the column
  progress: number; // 0-100
  isDelayed: boolean;
  delayExplanation?: string;
  estimatedDays?: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface DelayExplanation {
  taskId: string;
  reason: string;
  explanation: string;
  reportedAt: string;
  reportedBy: string;
}

const WorkshopPage = () => {
  const { user } = useAuth();

  // Check if user has workshop access
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="text-center" padding="lg">
          <h2 className="text-xl font-semibold text-secondary mb-2">
            Vui lòng đăng nhập
          </h2>
          <p className="text-secondary/70">
            Bạn cần đăng nhập để truy cập trang quản lý xưởng
          </p>
        </Card>
      </div>
    );
  }

  if (user.role !== 'WORKSHOP_LEAD') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="text-center" padding="lg">
          <h2 className="text-xl font-semibold text-secondary mb-2">
            Không có quyền truy cập
          </h2>
          <p className="text-secondary/70 mb-4">
            Chỉ trưởng xưởng mới có thể truy cập trang này
          </p>
          <p className="text-sm text-gray-500">
            Tài khoản hiện tại: {user.name} ({user.department})
          </p>
        </Card>
      </div>
    );
  }

  if (!user.workshopCode) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="text-center" padding="lg">
          <h2 className="text-xl font-semibold text-secondary mb-2">
            Chưa được phân công xưởng
          </h2>
          <p className="text-secondary/70">
            Tài khoản của bạn chưa được gán vào xưởng cụ thể
          </p>
        </Card>
      </div>
    );
  }
  const [tasks, setTasks] = useState<WorkshopTask[]>([]);
  const [workers, setWorkers] = useState<WorkshopWorker[]>([]);
  const [zones, setZones] = useState<WorkshopZone[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterZone, setFilterZone] = useState<string>('all');
  const [filterWorker, setFilterWorker] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterSpeed, setFilterSpeed] = useState<string>('all'); // 'fast', 'slow', 'ontime'
  const [showFilters, setShowFilters] = useState(false);
  const [showDelayModal, setShowDelayModal] = useState(false);
  const [delayModalTaskId, setDelayModalTaskId] = useState<string | null>(null);
  const [kanbanView, setKanbanView] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskModalData, setTaskModalData] = useState<WorkshopTask | null>(null);
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [workerModalTaskId, setWorkerModalTaskId] = useState<string | null>(null);
  const [showProgressReport, setShowProgressReport] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentTaskId, setCommentTaskId] = useState<string | null>(null);

  const getWorkshopName = (workshopId: string) => {
    const workshopNames: Record<string, string> = {
      'W1': 'Xưởng kết cấu A',
      'W2': 'Xưởng gia công B',
      'W3': 'Xưởng hàn C',
      'W4': 'Xưởng hoàn thiện D',
      'W5': 'Xưởng đóng gói E'
    };
    return workshopNames[workshopId] || 'Xưởng không xác định';
  };

  // Get current workshop ID from user's workshopCode
  const currentWorkshopId = user?.workshopCode || 'W1'; // Default to W1 for demo
  const currentWorkshopName = user?.workshopName || getWorkshopName(currentWorkshopId);

  // Load workshop data on mount
  useEffect(() => {
    loadWorkshopData();
    loadWorkshopWorkers();
    loadWorkshopZones();
  }, [currentWorkshopId]);

  // Auto progress report timer
  useEffect(() => {
    const timer = setInterval(() => {
      setShowProgressReport(true);
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(timer);
  }, []);

  // Generate AI notes for tasks
  const generateAINote = (task: WorkshopTask): string => {
    const notes = [
      `Đang tiến hành ${task.profile.toLowerCase()} theo kế hoạch`,
      `Hoàn thành ${task.progress}% công đoạn chính`,
      `Nhân sự đang làm việc ổn định`,
      `Chất lượng đảm bảo theo yêu cầu kỹ thuật`,
      `Tiến độ ${task.isDelayed ? 'cần đẩy nhanh' : 'đúng kế hoạch'}`,
      `Thiết bị hoạt động bình thường`,
      `Nguyên vật liệu đầy đủ`,
      `An toàn lao động được đảm bảo`
    ];

    const selectedNotes = notes.sort(() => 0.5 - Math.random()).slice(0, 2);
    return selectedNotes.join(', ');
  };

  const loadWorkshopData = () => {
    try {
      const workshopData = localStorage.getItem(`workshop_${currentWorkshopId}_tasks`);
      if (workshopData) {
        const data = JSON.parse(workshopData);
        // Transform basic tasks to workshop tasks with additional fields
        const workshopTasks: WorkshopTask[] = data.tasks.map((task: any) => {
          // Generate sample checklist if not exists
          const sampleChecklist = task.checklist?.length > 0 ? task.checklist : generateSampleChecklist(task);

          // Calculate progress based on checklist
          const completedCount = sampleChecklist.filter((item: any) => item.completed).length;
          const progress = sampleChecklist.length > 0
            ? Math.round((completedCount / sampleChecklist.length) * 100)
            : 0;

          // Check if task is delayed
          const isDelayed = task.endDate ? calculateDaysRemaining(task.endDate) < 0 : false;

          return {
            ...task,
            startDate: task.startDate || generateSampleStartDate(0),
            endDate: task.endDate || generateSampleEndDate(0),
            assignedWorkers: task.assignedWorkers || [],
            assignedZone: task.assignedZone || undefined,
            workInstructions: task.workInstructions || generateSampleInstructions(task),
            checklist: sampleChecklist,
            status: task.status || 'todo',
            progress,
            isDelayed,
            delayExplanation: task.delayExplanation || undefined,
            estimatedDays: task.estimatedDays || (Math.floor(Math.random() * 7) + 3), // 3-10 days
            priority: task.priority || generateSamplePriority()
          };
        });
        setTasks(workshopTasks);

        // Save updated tasks with sample data
        if (workshopTasks.some(task => !task.checklist || task.checklist.length === 0)) {
          saveWorkshopData(workshopTasks);
        }
      } else {
        // No workshop data found
        setTasks([]);
      }
    } catch (error) {
      console.error('Error loading workshop data:', error);
      setTasks([]);
    }
  };

  const generateSampleChecklist = (task: any): TaskChecklistItem[] => {
    const baseChecklist = [
      'Chuẩn bị nguyên vật liệu',
      'Kiểm tra thiết bị',
      'Thiết lập khu vực làm việc',
      'Thực hiện gia công chính',
      'Kiểm tra chất lượng',
      'Hoàn thiện sản phẩm',
      'Dọn dẹp khu vực'
    ];

    // Add specific tasks based on task profile
    let specificTasks: string[] = [];
    if (task.profile?.toLowerCase().includes('hàn')) {
      specificTasks = ['Chuẩn bị que hàn', 'Kiểm tra mối hàn', 'Xử lý xỉ hàn'];
    } else if (task.profile?.toLowerCase().includes('cắt')) {
      specificTasks = ['Đo và đánh dấu', 'Cắt theo kích thước', 'Mài nhẵn mép cắt'];
    } else if (task.profile?.toLowerCase().includes('khoan')) {
      specificTasks = ['Đánh dấu vị trí khoan', 'Khoan lỗ', 'Doa lỗ đúng kích thước'];
    }

    const allTasks = [...baseChecklist, ...specificTasks];

    return allTasks.map((title, i) => {
      const isCompleted = Math.random() < 0.3; // 30% chance completed
      return {
        id: `checklist-${task.id}-${i}`,
        title,
        description: i < 3 ? `Chi tiết cho công việc: ${title}` : undefined,
        completed: isCompleted,
        completedAt: isCompleted ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : undefined,
        completedBy: isCompleted ? ['Nguyễn Văn A', 'Trần Văn B', 'Lê Văn C'][Math.floor(Math.random() * 3)] : undefined
      };
    });
  };

  const generateSampleStartDate = (index: number) => {
    const today = new Date();
    const startOffset = index * 2; // Stagger start dates
    const startDate = new Date(today.getTime() - startOffset * 24 * 60 * 60 * 1000);
    return startDate.toISOString();
  };

  const generateSampleEndDate = (index: number) => {
    const today = new Date();
    const duration = 7 + Math.floor(Math.random() * 7); // 7-14 days
    const startOffset = index * 2;
    const endDate = new Date(today.getTime() + (duration - startOffset) * 24 * 60 * 60 * 1000);
    return endDate.toISOString();
  };

  const generateSampleInstructions = (task: any) => {
    const instructions = [
      `Thực hiện gia công ${task.profile} theo bản vẽ kỹ thuật.`,
      `Đảm bảo chất lượng và độ chính xác theo yêu cầu.`,
      `Tuân thủ quy trình an toàn lao động.`,
      `Báo cáo tiến độ hàng ngày cho xưởng trưởng.`
    ];

    if (task.material) {
      instructions.unshift(`Sử dụng vật liệu: ${task.material}.`);
    }

    return instructions.join('\n');
  };

  const generateSamplePriority = (): WorkshopTask['priority'] => {
    // Weight distribution: 30% low, 40% medium, 25% high, 5% urgent
    const rand = Math.random();
    if (rand < 0.05) return 'urgent';
    if (rand < 0.3) return 'high';
    if (rand < 0.7) return 'medium';
    return 'low';
  };

  const loadWorkshopWorkers = () => {
    // Mock 20 workers data
    const mockWorkers: WorkshopWorker[] = [
      { id: 'w1', name: 'Nguyễn Văn An', role: 'Thợ hàn chính', specialties: ['Hàn TIG', 'Hàn MIG'], experience: 'expert' },
      { id: 'w2', name: 'Trần Thị Bình', role: 'Thợ cắt CNC', specialties: ['Cắt laser', 'Cắt plasma'], experience: 'senior' },
      { id: 'w3', name: 'Lê Minh Cường', role: 'Thợ gia công', specialties: ['Phay', 'Tiện'], experience: 'senior' },
      { id: 'w4', name: 'Phạm Thu Duyên', role: 'Thợ hoàn thiện', specialties: ['Sơn', 'Mạ'], experience: 'junior' },
      { id: 'w5', name: 'Vũ Đình Em', role: 'Thợ hàn', specialties: ['Hàn que', 'Hàn CO2'], experience: 'senior' },
      { id: 'w6', name: 'Hoàng Thị Phương', role: 'Thợ kiểm tra', specialties: ['QC', 'Đo lường'], experience: 'expert' },
      { id: 'w7', name: 'Đỗ Văn Giang', role: 'Thợ cắt', specialties: ['Cắt thủ công', 'Máy cưa'], experience: 'junior' },
      { id: 'w8', name: 'Ngô Thị Hương', role: 'Thợ lắp ráp', specialties: ['Lắp ráp', 'Điều chỉnh'], experience: 'senior' },
      { id: 'w9', name: 'Bùi Văn Inh', role: 'Thợ hàn', specialties: ['Hàn argon', 'Hàn điện'], experience: 'senior' },
      { id: 'w10', name: 'Lý Thị Kiều', role: 'Thợ gia công', specialties: ['Khoan', 'Taro'], experience: 'junior' },
      { id: 'w11', name: 'Trịnh Văn Long', role: 'Thợ cắt laser', specialties: ['Laser fiber', 'Programming'], experience: 'expert' },
      { id: 'w12', name: 'Phan Thị Mai', role: 'Thợ sơn', specialties: ['Sơn tĩnh điện', 'Sơn nước'], experience: 'senior' },
      { id: 'w13', name: 'Võ Văn Nam', role: 'Thợ phay', specialties: ['Phay CNC', 'Phay thủ công'], experience: 'expert' },
      { id: 'w14', name: 'Đặng Thị Oanh', role: 'Thợ tiện', specialties: ['Tiện CNC', 'Tiện thủ công'], experience: 'senior' },
      { id: 'w15', name: 'Lại Văn Phúc', role: 'Thợ hàn', specialties: ['Hàn tự động', 'Robot hàn'], experience: 'expert' },
      { id: 'w16', name: 'Chu Thị Quỳnh', role: 'Thợ kiểm tra', specialties: ['NDT', 'Siêu âm'], experience: 'expert' },
      { id: 'w17', name: 'Dương Văn Rùa', role: 'Thợ cắt', specialties: ['Cắt oxy', 'Cắt plasma'], experience: 'junior' },
      { id: 'w18', name: 'Mạc Thị Sơn', role: 'Thợ lắp ráp', specialties: ['Lắp kết cấu', 'Đo kiểm'], experience: 'senior' },
      { id: 'w19', name: 'Tạ Văn Tâm', role: 'Thợ hàn TIG', specialties: ['Hàn inox', 'Hàn nhôm'], experience: 'expert' },
      { id: 'w20', name: 'Ứng Thị Uyển', role: 'Thợ hoàn thiện', specialties: ['Đánh bóng', 'Kiểm tra cuối'], experience: 'junior' }
    ];
    setWorkers(mockWorkers);
  };

  const loadWorkshopZones = () => {
    // Mock data - in real app, this would come from API
    const mockZones: WorkshopZone[] = [
      { id: 'z1', name: 'Khu vực 1 - Cắt phôi', description: 'Máy cắt plasma, laser', color: 'bg-blue-100 text-blue-800' },
      { id: 'z2', name: 'Khu vực 2 - Hàn', description: 'Máy hàn tự động, hàn tay', color: 'bg-red-100 text-red-800' },
      { id: 'z3', name: 'Khu vực 3 - Gia công', description: 'Máy phay, tiện, khoan', color: 'bg-green-100 text-green-800' },
      { id: 'z4', name: 'Khu vực 4 - Hoàn thiện', description: 'Sơn, mạ, kiểm tra', color: 'bg-purple-100 text-purple-800' }
    ];
    setZones(mockZones);
  };

  const saveWorkshopData = (updatedTasks: WorkshopTask[]) => {
    try {
      const workshopData = {
        workshopId: currentWorkshopId,
        workshopName: getWorkshopName(currentWorkshopId),
        tasks: updatedTasks,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(`workshop_${currentWorkshopId}_tasks`, JSON.stringify(workshopData));
    } catch (error) {
      console.error('Error saving workshop data:', error);
    }
  };

  const calculateDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const updateTaskProgress = (taskId: string, checklistItemId: string, completed: boolean) => {
    setTasks(prevTasks => {
      const updatedTasks = prevTasks.map(task => {
        if (task.id === taskId) {
          const updatedChecklist = task.checklist.map(item =>
            item.id === checklistItemId
              ? {
                  ...item,
                  completed,
                  completedAt: completed ? new Date().toISOString() : undefined,
                  completedBy: completed ? user?.name : undefined
                }
              : item
          );

          const completedCount = updatedChecklist.filter(item => item.completed).length;
          const progress = updatedChecklist.length > 0
            ? Math.round((completedCount / updatedChecklist.length) * 100)
            : 0;

          const isDelayed = task.endDate ? calculateDaysRemaining(task.endDate) < 0 : false;

          return {
            ...task,
            checklist: updatedChecklist,
            progress,
            isDelayed
          };
        }
        return task;
      });

      saveWorkshopData(updatedTasks);
      return updatedTasks;
    });
  };

  const openDelayModal = (taskId: string) => {
    setDelayModalTaskId(taskId);
    setShowDelayModal(true);
  };

  const openTaskModal = (task: WorkshopTask) => {
    setTaskModalData(task);
    setShowTaskModal(true);
  };

  const updateTask = (updatedTask: WorkshopTask) => {
    setTasks(prevTasks => {
      const newTasks = prevTasks.map(task =>
        task.id === updatedTask.id ? updatedTask : task
      );
      saveWorkshopData(newTasks);
      return newTasks;
    });
  };

  const moveTaskToStatus = (taskId: string, newStatus: WorkshopTask['status']) => {
    setTasks(prevTasks => {
      const newTasks = prevTasks.map(task =>
        task.id === taskId ? { ...task, status: newStatus } : task
      );
      saveWorkshopData(newTasks);
      return newTasks;
    });
  };

  const openWorkerModal = (taskId: string) => {
    setWorkerModalTaskId(taskId);
    setShowWorkerModal(true);
  };

  const handleWorkerAssignment = (workerIds: string[]) => {
    if (!workerModalTaskId) return;

    setTasks(prevTasks => {
      // First, clear current assignments for these workers
      const clearedTasks = prevTasks.map(task => ({
        ...task,
        assignedWorkers: task.assignedWorkers.filter(wId => !workerIds.includes(wId))
      }));

      // Then assign to the target task
      const updatedTasks = clearedTasks.map(task =>
        task.id === workerModalTaskId
          ? { ...task, assignedWorkers: workerIds }
          : task
      );

      // Update worker currentTaskId
      setWorkers(prevWorkers =>
        prevWorkers.map(worker => ({
          ...worker,
          currentTaskId: workerIds.includes(worker.id) ? workerModalTaskId :
                        worker.currentTaskId === workerModalTaskId ? undefined : worker.currentTaskId
        }))
      );

      saveWorkshopData(updatedTasks);
      return updatedTasks;
    });
  };

  const filteredTasks = useMemo(() => {
    let filtered = tasks.filter(task => {
      const matchesSearch = !searchTerm ||
        task.profile.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.material?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
      const matchesZone = filterZone === 'all' || task.assignedZone === filterZone;
      const matchesWorker = filterWorker === 'all' ||
        task.assignedWorkers.includes(filterWorker);
      const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;

      // Speed filter logic
      let matchesSpeed = true;
      if (filterSpeed !== 'all' && task.endDate) {
        const daysRemaining = calculateDaysRemaining(task.endDate);
        if (filterSpeed === 'fast' && daysRemaining <= 1) matchesSpeed = true;
        else if (filterSpeed === 'slow' && daysRemaining < 0) matchesSpeed = true;
        else if (filterSpeed === 'ontime' && daysRemaining > 1) matchesSpeed = true;
        else if (filterSpeed !== 'all') matchesSpeed = false;
      }

      return matchesSearch && matchesStatus && matchesZone && matchesWorker && matchesPriority && matchesSpeed;
    });

    // Sort by priority (urgent > high > medium > low) then by days remaining
    filtered.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);

      if (priorityDiff !== 0) return priorityDiff;

      // If same priority, sort by deadline
      if (a.endDate && b.endDate) {
        const aDays = calculateDaysRemaining(a.endDate);
        const bDays = calculateDaysRemaining(b.endDate);
        return aDays - bDays;
      }

      return 0;
    });

    return filtered;
  }, [tasks, searchTerm, filterStatus, filterZone, filterWorker, filterPriority, filterSpeed]);

  const kanbanColumns = [
    {
      id: 'todo',
      title: 'CHƯA LÀM',
      color: 'bg-white border-gray-200',
      headerColor: 'bg-gradient-to-r from-slate-500 to-slate-600 text-white shadow-md',
      icon: <Clock className="h-4 w-4" />
    },
    {
      id: 'in_progress',
      title: 'ĐANG LÀM',
      color: 'bg-white border-gray-200',
      headerColor: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md',
      icon: <Activity className="h-4 w-4" />
    },
    {
      id: 'review',
      title: 'KIỂM TRA',
      color: 'bg-white border-gray-200',
      headerColor: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md',
      icon: <Eye className="h-4 w-4" />
    },
    {
      id: 'done',
      title: 'XONG',
      color: 'bg-white border-gray-200',
      headerColor: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md',
      icon: <CheckCircle2 className="h-4 w-4" />
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="space-y-4" padding="lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-secondary">
              {currentWorkshopName}
            </h1>
            <p className="text-sm text-secondary/70 mt-1">
              Quản lý nhiệm vụ sản xuất và tiến độ công việc
            </p>
            {user?.role === 'WORKSHOP_LEAD' && (
              <p className="text-xs text-primary mt-1">
                Đăng nhập như: {user.name} - {user.department}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Badge className="bg-primary/10 text-primary">
              {tasks.length} nhiệm vụ
            </Badge>
            <Badge className="bg-green-100 text-green-800">
              {tasks.filter(t => t.status === 'done').length} hoàn thành
            </Badge>
            <Badge className="bg-red-100 text-red-800">
              {tasks.filter(t => t.isDelayed).length} chậm tiến độ
            </Badge>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm công việc..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Inline Filters */}
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white min-w-32"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="todo">Chưa làm</option>
              <option value="in_progress">Đang làm</option>
              <option value="review">Kiểm tra</option>
              <option value="done">Xong</option>
            </select>

            <select
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white min-w-32"
            >
              <option value="all">Tất cả mức độ</option>
              <option value="urgent">Khẩn cấp</option>
              <option value="high">Ưu tiên cao</option>
              <option value="medium">Bình thường</option>
              <option value="low">Thấp</option>
            </select>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Thêm bộ lọc
            </Button>
          </div>

          <div className="flex items-center gap-3">
            {/* Speed Filter Buttons */}
            <div className="flex gap-1">
              <Button
                variant={filterSpeed === 'fast' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setFilterSpeed(filterSpeed === 'fast' ? 'all' : 'fast')}
                className="px-3"
              >
                Gấp
              </Button>
              <Button
                variant={filterSpeed === 'slow' ? 'danger' : 'secondary'}
                size="sm"
                onClick={() => setFilterSpeed(filterSpeed === 'slow' ? 'all' : 'slow')}
                className="px-3"
              >
                Trễ hạn
              </Button>
              <Button
                variant={filterSpeed === 'ontime' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setFilterSpeed(filterSpeed === 'ontime' ? 'all' : 'ontime')}
                className="px-3"
              >
                Đúng hạn
              </Button>
            </div>

            {/* View Toggle Select */}
            <select
              value={kanbanView ? 'kanban' : 'list'}
              onChange={e => setKanbanView(e.target.value === 'kanban')}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white flex items-center gap-2 min-w-32"
            >
              <option value="kanban">Bảng Kanban</option>
              <option value="list">Danh sách</option>
            </select>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trạng thái
              </label>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="todo">Chưa làm</option>
                <option value="in_progress">Đang làm</option>
                <option value="review">Kiểm tra</option>
                <option value="done">Xong</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mức độ ưu tiên
              </label>
              <select
                value={filterPriority}
                onChange={e => setFilterPriority(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">Tất cả mức độ</option>
                <option value="urgent">Khẩn cấp</option>
                <option value="high">Ưu tiên cao</option>
                <option value="medium">Bình thường</option>
                <option value="low">Thấp</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Khu vực làm việc
              </label>
              <select
                value={filterZone}
                onChange={e => setFilterZone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">Tất cả khu vực</option>
                {zones.map(zone => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Người thực hiện
              </label>
              <select
                value={filterWorker}
                onChange={e => setFilterWorker(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">Tất cả nhân viên</option>
                {workers.map(worker => (
                  <option key={worker.id} value={worker.id}>
                    {worker.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </Card>

      {/* Task Board */}
      {tasks.length === 0 ? (
        <Card className="text-center py-16" padding="lg">
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
              <Activity className="h-8 w-8 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-secondary mb-2">
                Chưa có nhiệm vụ nào được phân công
              </h3>
              <p className="text-secondary/70 mb-4">
                {currentWorkshopName} chưa được phân công nhiệm vụ sản xuất nào.
              </p>
              <p className="text-sm text-gray-500">
                Các nhiệm vụ sẽ được phân công từ phòng điều phối sản xuất thông qua hệ thống BOM.
              </p>
            </div>
          </div>
        </Card>
      ) : kanbanView ? (
        <KanbanBoard
          tasks={filteredTasks}
          columns={kanbanColumns}
          workers={workers}
          zones={zones}
          onTaskUpdate={updateTaskProgress}
          onDelayExplanation={openDelayModal}
          onTaskEdit={openTaskModal}
          onMoveTask={moveTaskToStatus}
          onWorkerAssign={openWorkerModal}
          onComment={(taskId) => {
            setCommentTaskId(taskId);
            setShowCommentModal(true);
          }}
        />
      ) : (
        <TaskList
          tasks={filteredTasks}
          workers={workers}
          zones={zones}
          onTaskUpdate={updateTaskProgress}
          onDelayExplanation={openDelayModal}
          onTaskEdit={openTaskModal}
          onWorkerAssign={openWorkerModal}
          onComment={(taskId) => {
            setCommentTaskId(taskId);
            setShowCommentModal(true);
          }}
        />
      )}

      {/* Task Management Modal */}
      {showTaskModal && taskModalData && (
        <TaskManagementModal
          task={taskModalData}
          workers={workers}
          zones={zones}
          isOpen={showTaskModal}
          onClose={() => {
            setShowTaskModal(false);
            setTaskModalData(null);
          }}
          onSave={updateTask}
        />
      )}

      {/* Worker Assignment Modal */}
      {showWorkerModal && workerModalTaskId && (
        <WorkerAssignmentModal
          isOpen={showWorkerModal}
          onClose={() => {
            setShowWorkerModal(false);
            setWorkerModalTaskId(null);
          }}
          onAssign={handleWorkerAssignment}
          currentAssignedWorkers={tasks.find(t => t.id === workerModalTaskId)?.assignedWorkers || []}
          allWorkers={workers}
          allTasks={tasks}
          taskTitle={tasks.find(t => t.id === workerModalTaskId)?.profile}
        />
      )}

      {/* Progress Report Modal */}
      {showProgressReport && (
        <ProgressReportModal
          isOpen={showProgressReport}
          onClose={() => setShowProgressReport(false)}
          onSubmit={(report) => {
            console.log('Progress report submitted:', report);
            // Save report to localStorage or send to API
            const reports = JSON.parse(localStorage.getItem('progressReports') || '[]');
            reports.push(report);
            localStorage.setItem('progressReports', JSON.stringify(reports));
          }}
          tasks={tasks.map(task => ({
            ...task,
            aiGeneratedNote: generateAINote(task)
          }))}
          workshopName={currentWorkshopName}
          userName={user?.name || 'Unknown'}
        />
      )}

      {/* Comment Modal */}
      {showCommentModal && commentTaskId && (
        <CommentModal
          taskId={commentTaskId}
          taskTitle={tasks.find(t => t.id === commentTaskId)?.profile || 'Task'}
          onClose={() => {
            setShowCommentModal(false);
            setCommentTaskId(null);
          }}
          onSubmit={(comment) => {
            console.log('Comment submitted:', comment);
            // Handle comment submission
            setShowCommentModal(false);
            setCommentTaskId(null);
          }}
        />
      )}

      {/* Delay Explanation Modal */}
      {showDelayModal && delayModalTaskId && (
        <DelayExplanationModal
          taskId={delayModalTaskId}
          onClose={() => {
            setShowDelayModal(false);
            setDelayModalTaskId(null);
          }}
          onSubmit={(explanation) => {
            // Handle delay explanation submission
            console.log('Delay explanation submitted:', explanation);
            setShowDelayModal(false);
            setDelayModalTaskId(null);
          }}
        />
      )}
    </div>
  );
};

// Kanban Board Component
interface KanbanBoardProps {
  tasks: WorkshopTask[];
  columns: { id: string; title: string; color: string; headerColor: string; icon: React.ReactNode }[];
  workers: WorkshopWorker[];
  zones: WorkshopZone[];
  onTaskUpdate: (taskId: string, checklistItemId: string, completed: boolean) => void;
  onDelayExplanation: (taskId: string) => void;
  onTaskEdit: (task: WorkshopTask) => void;
  onMoveTask: (taskId: string, newStatus: WorkshopTask['status']) => void;
  onWorkerAssign: (taskId: string) => void;
  onComment: (taskId: string) => void;
}

const KanbanBoard = ({ tasks, columns, workers, zones, onTaskUpdate, onDelayExplanation, onTaskEdit, onMoveTask, onWorkerAssign, onComment }: KanbanBoardProps) => {
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const handleDragStart = (taskId: string) => {
    setDraggedTask(taskId);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverColumn(null);
  };
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      {columns.map(column => {
        const columnTasks = tasks.filter(task => task.status === column.id);

        return (
          <div key={column.id} className="space-y-3">
            {/* Column Header */}
            <div className={cn("rounded-lg border px-4 py-3", column.headerColor)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {column.icon}
                  <h3 className="font-semibold">{column.title}</h3>
                </div>
                <Badge className="bg-white/80 text-gray-700 font-medium">
                  {columnTasks.length}
                </Badge>
              </div>
            </div>

            {/* Column Content */}
            <Card
              className={cn(
                "min-h-[500px] border-2 transition-all duration-200",
                column.color,
                dragOverColumn === column.id
                  ? "border-primary border-dashed bg-primary/5 shadow-lg"
                  : "border-dashed"
              )}
              padding="sm"
            >

              <div
                className="space-y-3 min-h-[450px] transition-all duration-200"
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverColumn(null);
                  if (draggedTask) {
                    onMoveTask(draggedTask, column.id as WorkshopTask['status']);
                    setDraggedTask(null);
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverColumn(column.id);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  // Only remove if we're actually leaving the drop zone
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX;
                  const y = e.clientY;
                  if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
                    setDragOverColumn(null);
                  }
                }}
              >
                {columnTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    workers={workers}
                    zones={zones}
                    onTaskUpdate={onTaskUpdate}
                    onDelayExplanation={onDelayExplanation}
                    onTaskEdit={onTaskEdit}
                    onWorkerAssign={onWorkerAssign}
                    onComment={onComment}
                    onDragStart={() => handleDragStart(task.id)}
                    onDragEnd={handleDragEnd}
                    isDragging={draggedTask === task.id}
                    view="kanban"
                  />
                ))}

                {/* Empty state */}
                {columnTasks.length === 0 && (
                  <div className="flex items-center justify-center h-32 text-gray-400">
                    <p className="text-sm">Kéo công việc vào đây</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        );
      })}
    </div>
  );
};

// Task List Component
interface TaskListProps {
  tasks: WorkshopTask[];
  workers: WorkshopWorker[];
  zones: WorkshopZone[];
  onTaskUpdate: (taskId: string, checklistItemId: string, completed: boolean) => void;
  onDelayExplanation: (taskId: string) => void;
  onTaskEdit: (task: WorkshopTask) => void;
  onWorkerAssign: (taskId: string) => void;
  onComment: (taskId: string) => void;
}

const TaskList = ({ tasks, workers, zones, onTaskUpdate, onDelayExplanation, onTaskEdit, onWorkerAssign, onComment }: TaskListProps) => {
  return (
    <div className="space-y-4">
      {tasks.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          workers={workers}
          zones={zones}
          onTaskUpdate={onTaskUpdate}
          onDelayExplanation={onDelayExplanation}
          onTaskEdit={onTaskEdit}
          onWorkerAssign={onWorkerAssign}
          onComment={onComment}
          view="list"
        />
      ))}
    </div>
  );
};

// Task Card Component
interface TaskCardProps {
  task: WorkshopTask;
  workers: WorkshopWorker[];
  zones: WorkshopZone[];
  onTaskUpdate: (taskId: string, checklistItemId: string, completed: boolean) => void;
  onDelayExplanation: (taskId: string) => void;
  onTaskEdit: (task: WorkshopTask) => void;
  onWorkerAssign?: (taskId: string) => void;
  onComment?: (taskId: string) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
  view: 'kanban' | 'list';
}

const TaskCard = ({ task, workers, zones, onTaskUpdate, onDelayExplanation, onTaskEdit, onWorkerAssign, onComment, onDragStart, onDragEnd, isDragging, view }: TaskCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [showSubtasks, setShowSubtasks] = useState(false);

  const assignedWorkerNames = task.assignedWorkers
    .map(workerId => workers.find(w => w.id === workerId)?.name)
    .filter(Boolean)
    .join(', ');

  const assignedZone = zones.find(z => z.id === task.assignedZone);
  const daysRemaining = task.endDate ? calculateDaysRemaining(task.endDate) : null;

  // Calculate real progress from subtasks
  const completedSubtasks = task.subtasks.filter(st => (st.completionPercent || 0) === 100).length;
  const totalSubtasks = task.subtasks.length;
  const realProgress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  // Get stage configuration for current column
  const getStagesByStatus = (status: WorkshopTask['status']): string[] => {
    const stageMap = {
      'todo': ['TODO', 'Đang kế hoạch', 'Đã kế hoạch'],
      'in_progress': ['Gá tổ hợp', 'Gá hoàn thiện', 'Hàn Hoàn thiện'],
      'review': ['Đang nhiệm thu', 'Pass kiểm tra'],
      'done': ['Đã nhập kho', 'Đã xuất kho']
    };
    return stageMap[status] || [];
  };

  const currentStages = getStagesByStatus(task.status);
  const currentSubStage = task.subStage || (currentStages[0] || '');

  const getPriorityConfig = (priority: WorkshopTask['priority']) => {
    const configs = {
      urgent: {
        label: 'Khẩn cấp',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: (
          <div className="flex flex-col gap-0">
            <svg className="w-2.5 h-2.5" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 2L12 6H4L8 2Z"/>
            </svg>
            <svg className="w-2.5 h-2.5 -mt-1" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 2L12 6H4L8 2Z"/>
            </svg>
          </div>
        )
      },
      high: {
        label: 'Ưu tiên cao',
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: (
          <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 2L12 6H4L8 2Z"/>
          </svg>
        )
      },
      medium: {
        label: 'Bình thường',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: (
          <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 8L12 8"/>
          </svg>
        )
      },
      low: {
        label: 'Thấp',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: (
          <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 10L4 6H12L8 10Z"/>
          </svg>
        )
      }
    };
    return configs[priority];
  };

  const priorityConfig = getPriorityConfig(task.priority);

  const updateSubtaskCompletion = (subtaskIndex: number, percent: number) => {
    // Update subtask completion and save to localStorage
    const updatedSubtasks = task.subtasks.map((st, idx) =>
      idx === subtaskIndex ? { ...st, completionPercent: percent } : st
    );

    const updatedTask = { ...task, subtasks: updatedSubtasks };
    onTaskEdit(updatedTask);
  };

  const updateSubStage = (newStage: string) => {
    const updatedTask = { ...task, subStage: newStage };
    onTaskEdit(updatedTask);
  };

  return (
    <div
      className={cn(
        "relative transition-all duration-200",
        view === 'kanban' && "cursor-move hover:shadow-lg hover:scale-[1.02]",
        isDragging && "opacity-50 scale-95 transform rotate-2 shadow-2xl border-primary"
      )}
      draggable={view === 'kanban'}
      onDragStart={(_e) => {
        if (onDragStart) {
          onDragStart();
        }
      }}
      onDragEnd={(_e) => {
        if (onDragEnd) {
          onDragEnd();
        }
      }}
    >
      <Card padding="md" className="hover:shadow-md transition-shadow">
        {/* Header Row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge className={cn("text-xs font-medium border flex items-center gap-1", priorityConfig.color)}>
              {priorityConfig.icon}
              {priorityConfig.label}
            </Badge>
            {task.isDelayed && (
              <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Trễ hạn
              </Badge>
            )}
          </div>
          <Badge className={cn(
            "text-xs font-medium",
            realProgress > 75 ? "bg-green-100 text-green-800" :
            realProgress > 50 ? "bg-blue-100 text-blue-800" :
            realProgress > 25 ? "bg-yellow-100 text-yellow-800" :
            "bg-gray-100 text-gray-800"
          )}>
            {completedSubtasks}/{totalSubtasks}
          </Badge>
        </div>

        {/* Task Title - Combined Name + Profile */}
        <div className="mb-3">
          <h4 className="font-semibold text-gray-900 text-sm leading-tight mb-1">
            {task.subtasks[0]?.ass_name || task.profile} - {task.profile}
          </h4>
          {task.material && (
            <p className="text-xs text-gray-600">{task.material}</p>
          )}
        </div>

        {/* Stage Selector */}
        {currentStages.length > 0 && (
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Giai đoạn
            </label>
            <select
              value={currentSubStage}
              onChange={(e) => updateSubStage(e.target.value)}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md bg-white"
            >
              {currentStages.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Task Metadata */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {task.endDate && daysRemaining !== null ? (
                daysRemaining >= 0 ? (
                  <span className="text-green-600">Còn {daysRemaining} ngày</span>
                ) : (
                  <span className="text-red-600">Trễ {Math.abs(daysRemaining)} ngày</span>
                )
              ) : (
                <span>Chưa có hạn</span>
              )}
            </div>
          </div>

          {assignedZone && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-gray-400" />
              <Badge className={`${assignedZone.color} text-xs`}>
                {assignedZone.name}
              </Badge>
            </div>
          )}
        </div>

        {/* Checklist Progress */}
        {task.checklist.length > 0 && (
          <div className="border-t pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-700">
                Tiến độ ({task.checklist.filter(item => item.completed).length}/{task.checklist.length})
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="h-6 w-6 p-0"
              >
                <ChevronDown className={cn("h-3 w-3 transition-transform", expanded && "rotate-180")} />
              </Button>
            </div>

            {expanded && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {task.checklist.map(item => (
                  <div key={item.id} className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={(e) => onTaskUpdate(task.id, item.id, e.target.checked)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className={cn("text-sm", item.completed && "line-through text-gray-500")}>
                        {item.title}
                      </p>
                      {item.description && (
                        <p className="text-xs text-gray-600">{item.description}</p>
                      )}
                      {item.completed && item.completedBy && (
                        <p className="text-xs text-green-600 mt-1">
                          ✓ {item.completedBy} - {new Date(item.completedAt!).toLocaleDateString('vi-VN')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Task Actions */}
        <div className="flex items-center justify-between pt-3 border-t">
          <Badge
            className={cn(
              "text-xs",
              task.status === 'todo' && 'bg-gray-100 text-gray-800',
              task.status === 'in_progress' && 'bg-blue-100 text-blue-800',
              task.status === 'review' && 'bg-yellow-100 text-yellow-800',
              task.status === 'done' && 'bg-green-100 text-green-800'
            )}
          >
            {task.status === 'todo' && 'CHƯA LÀM'}
            {task.status === 'in_progress' && 'ĐANG LÀM'}
            {task.status === 'review' && 'KIỂM TRA'}
            {task.status === 'done' && 'XONG'}
          </Badge>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => onTaskEdit(task)} className="h-7 w-7 p-0">
              <Edit3 className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onComment?.(task.id)} className="h-7 w-7 p-0">
              <MessageSquare className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

// Delay Explanation Modal
interface DelayExplanationModalProps {
  taskId: string;
  onClose: () => void;
  onSubmit: (explanation: DelayExplanation) => void;
}

const DelayExplanationModal = ({ taskId, onClose, onSubmit }: DelayExplanationModalProps) => {
  const { user } = useAuth();
  const [reason, setReason] = useState('');
  const [explanation, setExplanation] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const delayExplanation: DelayExplanation = {
      taskId,
      reason,
      explanation,
      reportedAt: new Date().toISOString(),
      reportedBy: user?.name || 'Unknown'
    };

    onSubmit(delayExplanation);
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md space-y-4" padding="lg">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-secondary">
              Giải trình chậm tiến độ
            </h3>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lý do chính
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Chọn lý do</option>
                <option value="material_shortage">Thiếu nguyên vật liệu</option>
                <option value="equipment_failure">Hỏng thiết bị</option>
                <option value="worker_shortage">Thiếu nhân lực</option>
                <option value="technical_issue">Vấn đề kỹ thuật</option>
                <option value="external_dependency">Phụ thuộc bên ngoài</option>
                <option value="other">Khác</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giải trình chi tiết
              </label>
              <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Mô tả chi tiết tình hình và biện pháp khắc phục..."
                required
              />
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                Hủy
              </Button>
              <Button type="submit" className="flex-1">
                Gửi giải trình
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
};

function calculateDaysRemaining(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export default WorkshopPage;