'use client';

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import {
  BomImportSummary,
  BomPriority,
  BomTask,
  ProcessStage,
  ProjectWorkflow,
  WorkflowActionType,
  WorkflowEvent,
  WorkflowNotification,
  WorkflowStageStatus,
} from '@/types';
import { useAuth } from '@/context/auth-context';
import { workflowSeed } from '@/data/workflow-seed';

interface WorkflowContextValue {
  workflow: ProjectWorkflow;
  bomTasks: BomTask[];
  bomImportHistory: BomImportSummary[];
  notifications: WorkflowNotification[];
  canCompleteStage: (stageId: string) => boolean;
  completeStage: (stageId: string, note?: string) => ActionResult;
  resetWorkflow: () => void;
  getNotificationsForUser: (userId: string) => WorkflowNotification[];
  markNotificationsAsRead: (userId: string) => void;
  importBomFromCsv: (payload: BomImportPayload) => ImportBomResult;
}

interface BomImportPayload {
  fileName: string;
  content: string;
  importedBy: string;
  importedById: string;
}

interface ImportBomSuccess {
  success: true;
  summary: BomImportSummary;
  warnings: string[];
}

interface ImportBomFailure {
  success: false;
  error: string;
  warnings?: string[];
}

export type ImportBomResult = ImportBomSuccess | ImportBomFailure;

interface ActionSuccess {
  success: true;
}

interface ActionFailure {
  success: false;
  error: string;
}

export type ActionResult = ActionSuccess | ActionFailure;

const WorkflowContext = createContext<WorkflowContextValue | undefined>(
  undefined,
);

const cloneWorkflow = (data: ProjectWorkflow): ProjectWorkflow => ({
  ...data,
  stages: data.stages.map(stage => ({
    ...stage,
    dependsOn: stage.dependsOn ? [...stage.dependsOn] : undefined,
  })),
  history: data.history.map(event => ({ ...event })),
});

const cloneNotifications = (items: WorkflowNotification[]) =>
  items.map(notification => ({ ...notification }));

const cloneBomTasks = (items: BomTask[]) => items.map(item => ({ ...item }));

type RawBomField =
  | 'index'
  | 'ass_name'
  | 'part_name'
  | 'profile'
  | 'material'
  | 'thickness'
  | 'width'
  | 'length'
  | 'qty_per_ass'
  | 'qty_total'
  | 'weight_per_part'
  | 'weight_total'
  | 'area_per_ass'
  | 'area_total'
  | 'welding_machine'
  | 'hand_welding'
  | 'note';

const rawHeaderFallback: Record<RawBomField, number> = {
  index: 0,
  ass_name: 1,
  part_name: 2,
  profile: 3,
  material: 4,
  thickness: 5,
  width: 6,
  length: 7,
  qty_per_ass: 8,
  qty_total: 9,
  weight_per_part: 10,
  weight_total: 12,
  area_per_ass: 13,
  area_total: 14,
  welding_machine: 15,
  hand_welding: 16,
  note: 17,
};

const normalizeHeader = (value: string) =>
  value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');

const headerAlias: Record<string, RawBomField> = {
  no: 'index',
  index: 'index',
  stt: 'index',
  assname: 'ass_name',
  assembly: 'ass_name',
  assemblyname: 'ass_name',
  partname: 'part_name',
  partcode: 'part_name',
  profile: 'profile',
  material: 'material',
  thick: 'thickness',
  thickness: 'thickness',
  width: 'width',
  length: 'length',
  qtyass: 'qty_per_ass',
  qtyperass: 'qty_per_ass',
  quantityass: 'qty_per_ass',
  qtytotal: 'qty_total',
  quantitytotal: 'qty_total',
  weight1part: 'weight_per_part',
  weightperpart: 'weight_per_part',
  weightpart: 'weight_per_part',
  weighttotal: 'weight_total',
  weightto: 'weight_total',
  area1ass: 'area_per_ass',
  areaperass: 'area_per_ass',
  areatotal: 'area_total',
  areato: 'area_total',
  weldingmachine: 'welding_machine',
  weldingm: 'welding_machine',
  handwelding: 'hand_welding',
  handwelc: 'hand_welding',
  note: 'note',
};

const stageFromString = (value: string): ProcessStage => {
  const normalized = value.trim().toLowerCase();
  switch (normalized) {
    case 'cắt phôi':
    case 'cutting':
      return ProcessStage.CUTTING;
    case 'gá tổ hợp':
    case 'assembly':
      return ProcessStage.ASSEMBLY;
    case 'hàn hoàn thiện':
    case 'welding':
      return ProcessStage.WELDING;
    case 'sơn xuất xưởng':
    case 'painting':
      return ProcessStage.PAINTING;
    default:
      return ProcessStage.CUTTING;
  }
};

const priorityFromString = (
  value: string | undefined,
): BomPriority | undefined => {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  if (['cao', 'high'].includes(normalized)) return BomPriority.HIGH;
  if (['trung bình', 'medium'].includes(normalized)) return BomPriority.MEDIUM;
  if (['thấp', 'low'].includes(normalized)) return BomPriority.LOW;
  return undefined;
};

const toNumber = (value: string): number | null => {
  if (!value) return null;
  const cleaned = value.replace(/[^0-9.,-]/g, '').replace(/,(?=\d{3}(?:\D|$))/g, '');
  const normalized = cleaned.replace(/,/g, '.');
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : null;
};

const parseBomCsv = (content: string) => {
  const warnings: string[] = [];
  const rows = content
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (rows.length <= 1) {
    return {
      tasks: [] as BomTask[],
      warnings,
      error: 'File CSV không có dữ liệu.',
    };
  }

  const rawHeaders = rows[0].split(',');
  const positions: Partial<Record<RawBomField, number>> = {};

  rawHeaders.forEach((header, index) => {
    const alias = headerAlias[normalizeHeader(header)];
    if (alias && positions[alias] === undefined) {
      positions[alias] = index;
    }
  });

  const getValue = (cells: string[], key: RawBomField) => {
    const position = positions[key];
    if (position !== undefined) {
      return cells[position]?.trim() ?? '';
    }
    const fallback = rawHeaderFallback[key];
    return fallback !== undefined ? cells[fallback]?.trim() ?? '' : '';
  };

  // Group by (profile + ass_name) combination
  type GroupKey = string;
  const groups = new Map<GroupKey, {
    profile: string;
    ass_name: string;
    material: string;
    stage: ProcessStage;
    quantity: number;
    totalWeight: number;
    notes: string[];
  }>();

  for (let i = 1; i < rows.length; i += 1) {
    const line = rows[i];
    if (!line) continue;
    const cells = line.split(',');

    const profile = getValue(cells, 'profile');
    const ass_name = getValue(cells, 'ass_name');
    const material = getValue(cells, 'material');

    // Skip rows without profile (empty rows or invalid data)
    if (!profile) continue;

    const quantity =
      toNumber(getValue(cells, 'qty_total')) ??
      toNumber(getValue(cells, 'qty_per_ass')) ??
      0;
    const totalWeight =
      toNumber(getValue(cells, 'weight_total')) ??
      toNumber(getValue(cells, 'weight_per_part')) ??
      0;
    const note = getValue(cells, 'note');

    // Create unique key from profile + ass_name
    // Use "UNKNOWN" if ass_name is empty to group all items with same profile but no ass_name
    const groupKey = `${profile}::${ass_name || 'UNKNOWN'}`;

    const existing = groups.get(groupKey);
    if (existing) {
      // Accumulate quantity and weight
      existing.quantity += quantity;
      existing.totalWeight += totalWeight;
      if (note && !existing.notes.includes(note)) {
        existing.notes.push(note);
      }
    } else {
      // Create new group
      groups.set(groupKey, {
        profile,
        ass_name,
        material,
        stage: stageFromString(ass_name || ''),
        quantity,
        totalWeight,
        notes: note ? [note] : [],
      });
    }
  }

  // Convert groups to tasks
  const tasks: BomTask[] = Array.from(groups.entries()).map(([key, group], index) => {
    // Generate a descriptive name
    const nameParts = [];
    if (group.ass_name) nameParts.push(group.ass_name);
    nameParts.push(group.profile);
    if (group.material) nameParts.push(`(${group.material})`);

    return {
      id: `bom-${Date.now()}-${index}`,
      componentCode: group.profile,
      name: nameParts.join(' '),
      stage: group.stage,
      quantity: group.quantity,
      totalWeight: group.totalWeight,
      plannedStart: undefined,
      plannedEnd: undefined,
      priority: undefined,
      notes: group.notes.length > 0 ? group.notes.join('; ') : undefined,
    };
  });

  return { tasks, warnings };
};

export const WorkflowProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [workflow, setWorkflow] = useState<ProjectWorkflow>(() =>
    cloneWorkflow(workflowSeed.workflow),
  );
  const [notifications, setNotifications] = useState<WorkflowNotification[]>(
    () => cloneNotifications(workflowSeed.notifications),
  );
  const [bomTasks, setBomTasks] = useState<BomTask[]>(() =>
    cloneBomTasks(workflowSeed.bomTasks),
  );
  const [bomImportHistory, setBomImportHistory] = useState<BomImportSummary[]>(
    [],
  );

  const canCompleteStage = useCallback(
    (stageId: string) => {
      if (!user) return false;
      const stage = workflow.stages.find(item => item.id === stageId);
      if (!stage) return false;
      if (stage.status !== WorkflowStageStatus.IN_PROGRESS) return false;
      if (stage.assigneeId !== user.id) return false;

      if (stage.dependsOn && stage.dependsOn.length > 0) {
        const unresolved = workflow.stages.some(item => {
          if (!stage.dependsOn?.includes(item.id)) return false;
          return item.status !== WorkflowStageStatus.COMPLETED;
        });
        if (unresolved) return false;
      }

      return true;
    },
    [user, workflow.stages],
  );

  const completeStage = useCallback(
    (stageId: string, note?: string): ActionResult => {
      if (!user) {
        return { success: false, error: 'Vui lòng đăng nhập' };
      }

      if (!canCompleteStage(stageId)) {
        return { success: false, error: 'Bạn chưa thể hoàn thành bước này' };
      }

      const currentStage = workflow.stages.find(item => item.id === stageId);
      if (!currentStage) {
        return { success: false, error: 'Không tìm thấy công đoạn' };
      }

      const timestamp = new Date().toISOString();
      const notificationTargets: { stageTitle: string; assigneeId: string }[] =
        [];

      setWorkflow(prev => {
        const stages = prev.stages.map(stage => {
          if (stage.id === stageId) {
            return {
              ...stage,
              status: WorkflowStageStatus.COMPLETED,
              updatedAt: timestamp,
            };
          }

          if (
            stage.dependsOn?.includes(stageId) &&
            stage.status === WorkflowStageStatus.PENDING
          ) {
            const dependenciesCompleted = stage.dependsOn.every(depId => {
              if (depId === stageId) return true;
              const dependency = prev.stages.find(item => item.id === depId);
              return dependency?.status === WorkflowStageStatus.COMPLETED;
            });

            if (dependenciesCompleted) {
              notificationTargets.push({
                stageTitle: stage.title,
                assigneeId: stage.assigneeId,
              });
              return {
                ...stage,
                status: WorkflowStageStatus.IN_PROGRESS,
                updatedAt: timestamp,
              };
            }
          }

          return stage;
        });

        const history: WorkflowEvent[] = [
          ...prev.history,
          {
            id: `event-${prev.history.length + 1}`,
            stageId,
            actorId: user.id,
            action: WorkflowActionType.COMPLETED,
            timestamp,
            note,
          },
        ];

        return {
          ...prev,
          stages,
          history,
          updatedAt: timestamp,
        };
      });

      if (notificationTargets.length > 0) {
        setNotifications(prev => {
          const base = prev.length;
          const newNotifications = notificationTargets.map((target, index) => ({
            id: `notif-${base + index + 1}`,
            stageId,
            stageTitle: target.stageTitle,
            recipientId: target.assigneeId,
            message: `${currentStage.title} đã hoàn thành. ${target.stageTitle} có thể bắt đầu.`,
            createdAt: timestamp,
            read: false,
          }));
          return [...prev, ...newNotifications];
        });
      }

      return { success: true };
    },
    [user, canCompleteStage, workflow.stages],
  );

  const resetWorkflow = useCallback(() => {
    setWorkflow(cloneWorkflow(workflowSeed.workflow));
    setNotifications(cloneNotifications(workflowSeed.notifications));
    setBomTasks(cloneBomTasks(workflowSeed.bomTasks));
    setBomImportHistory([]);
  }, []);

  const getNotificationsForUser = useCallback(
    (userId: string) =>
      notifications
        .filter(notification => notification.recipientId === userId)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
    [notifications],
  );

  const markNotificationsAsRead = useCallback((userId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.recipientId === userId
          ? { ...notification, read: true }
          : notification,
      ),
    );
  }, []);

  const importBomFromCsv = useCallback(
    ({
      fileName,
      content,
      importedBy,
      importedById,
    }: BomImportPayload): ImportBomResult => {
      const parsed = parseBomCsv(content);
      if (parsed.error) {
        return {
          success: false,
          error: parsed.error,
          warnings: parsed.warnings,
        };
      }

      if (parsed.tasks.length === 0) {
        return {
          success: false,
          error: 'Không tìm thấy hạng mục hợp lệ trong file CSV.',
          warnings: parsed.warnings,
        };
      }

      const totalWeight = parsed.tasks.reduce(
        (acc, task) => acc + task.totalWeight,
        0,
      );
      const timestamp = new Date().toISOString();
      const summary: BomImportSummary = {
        id: `import-${Date.now()}`,
        fileName,
        importedBy,
        importedAt: timestamp,
        totalTasks: parsed.tasks.length,
        totalWeight,
        warnings: parsed.warnings,
      };

      setBomTasks(parsed.tasks);
      setBomImportHistory(prev => [summary, ...prev]);

      setWorkflow(prev => {
        const stages = prev.stages.map(stage => {
          if (stage.id === 'stage-bom') {
            return {
              ...stage,
              status: WorkflowStageStatus.COMPLETED,
              updatedAt: timestamp,
            };
          }
          if (
            stage.id === 'stage-plan' &&
            stage.status === WorkflowStageStatus.PENDING
          ) {
            return {
              ...stage,
              status: WorkflowStageStatus.IN_PROGRESS,
              updatedAt: timestamp,
            };
          }
          return stage;
        });

        const history: WorkflowEvent[] = [
          ...prev.history,
          {
            id: `event-${prev.history.length + 1}`,
            stageId: 'stage-bom',
            actorId: importedById,
            action: WorkflowActionType.COMPLETED,
            timestamp,
            note: `Đăng BOM ${fileName}`,
          },
        ];

        return {
          ...prev,
          bomCode: fileName.replace(/\.csv$/i, ''),
          stages,
          history,
          updatedAt: timestamp,
        };
      });

      setNotifications(prev => [
        ...prev,
        {
          id: `notif-${prev.length + 1}`,
          stageId: 'stage-bom',
          stageTitle: 'Phòng kỹ thuật đăng BOM',
          recipientId: 'user-gioi',
          message: `BOM ${fileName} đã được cập nhật với ${parsed.tasks.length} hạng mục. Vui lòng phân bổ cho các xưởng.`,
          createdAt: timestamp,
          read: false,
        },
      ]);

      return {
        success: true,
        summary,
        warnings: parsed.warnings,
      };
    },
    [],
  );

  const value = useMemo(
    () => ({
      workflow,
      bomTasks,
      bomImportHistory,
      notifications,
      canCompleteStage,
      completeStage,
      resetWorkflow,
      getNotificationsForUser,
      markNotificationsAsRead,
      importBomFromCsv,
    }),
    [
      workflow,
      bomTasks,
      bomImportHistory,
      notifications,
      canCompleteStage,
      completeStage,
      resetWorkflow,
      getNotificationsForUser,
      markNotificationsAsRead,
      importBomFromCsv,
    ],
  );

  return (
    <WorkflowContext.Provider value={value}>
      {children}
    </WorkflowContext.Provider>
  );
};

export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error('useWorkflow must be used within WorkflowProvider');
  }
  return context;
};
