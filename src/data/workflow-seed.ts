import {
  BomPriority,
  BomTask,
  ProcessStage,
  ProjectWorkflow,
  UserRole,
  WorkflowActionType,
  WorkflowNotification,
  WorkflowStageStatus,
} from "@/types";

interface WorkflowSeedData {
  workflow: ProjectWorkflow;
  notifications: WorkflowNotification[];
  bomTasks: BomTask[];
}

const workflow: ProjectWorkflow = {
  id: "project-workflow-demo",
  name: "Dự án Nhà máy Minh Cường",
  bomCode: "MCS-2024-BOM-001",
  description: "Quy trình triển khai BOM kết cấu thép cho dự án nhà máy Minh Cường",
  stages: [
    {
      id: "stage-bom",
      title: "Phòng kỹ thuật đăng BOM",
      description: "Anh Toán (phòng kỹ thuật) tổng hợp và phát hành danh sách BOM.",
      role: UserRole.TECHNICAL_ENGINEER,
      assigneeId: "user-toan",
      status: WorkflowStageStatus.COMPLETED,
      updatedAt: "2024-12-01T08:30:00+07:00",
    },
    {
      id: "stage-plan",
      title: "Điều phối phân bổ BOM",
      description: "Anh Giỏi phân bổ từng cấu kiện cho 4 xưởng theo năng lực.",
      role: UserRole.PRODUCTION_PLANNER,
      assigneeId: "user-gioi",
      status: WorkflowStageStatus.IN_PROGRESS,
      updatedAt: "2024-12-01T09:15:00+07:00",
      dependsOn: ["stage-bom"],
    },
    {
      id: "stage-workshop-1",
      title: "Xưởng 1 nhận việc",
      description: "Kỹ sư trưởng xưởng 1 (chị Hà) kiểm tra phân công và xác nhận tiến hành.",
      role: UserRole.WORKSHOP_LEAD,
      assigneeId: "user-workshop-a",
      status: WorkflowStageStatus.PENDING,
      dependsOn: ["stage-plan"],
    },
    {
      id: "stage-workshop-2",
      title: "Xưởng 2 nhận việc",
      description: "Kỹ sư trưởng xưởng 2 (anh Tân) nhận BOM và phân việc cho tổ.",
      role: UserRole.WORKSHOP_LEAD,
      assigneeId: "user-workshop-b",
      status: WorkflowStageStatus.PENDING,
      dependsOn: ["stage-plan"],
    },
    {
      id: "stage-workshop-3",
      title: "Xưởng 3 nhận việc",
      description: "Kỹ sư trưởng xưởng 3 (chị Trang) kiểm tra và xác nhận triển khai.",
      role: UserRole.WORKSHOP_LEAD,
      assigneeId: "user-workshop-c",
      status: WorkflowStageStatus.PENDING,
      dependsOn: ["stage-plan"],
    },
    {
      id: "stage-workshop-4",
      title: "Xưởng 4 nhận việc",
      description: "Kỹ sư trưởng xưởng 4 (anh Huy) xác nhận kế hoạch và chuẩn bị nhân lực.",
      role: UserRole.WORKSHOP_LEAD,
      assigneeId: "user-workshop-d",
      status: WorkflowStageStatus.PENDING,
      dependsOn: ["stage-plan"],
    },
  ],
  history: [
    {
      id: "event-1",
      stageId: "stage-bom",
      actorId: "user-toan",
      action: WorkflowActionType.STARTED,
      timestamp: "2024-12-01T07:45:00+07:00",
      note: "Bắt đầu tập hợp dữ liệu BOM cho dự án.",
    },
    {
      id: "event-2",
      stageId: "stage-bom",
      actorId: "user-toan",
      action: WorkflowActionType.COMPLETED,
      timestamp: "2024-12-01T08:30:00+07:00",
      note: "Đã xuất danh sách BOM và gửi cho điều phối.",
    },
    {
      id: "event-3",
      stageId: "stage-plan",
      actorId: "user-gioi",
      action: WorkflowActionType.STARTED,
      timestamp: "2024-12-01T09:15:00+07:00",
      note: "Nhận BOM và tiến hành phân bổ cho các xưởng.",
    },
  ],
  createdAt: "2024-12-01T07:30:00+07:00",
  updatedAt: "2024-12-01T09:15:00+07:00",
};

const notifications: WorkflowNotification[] = [
  {
    id: "notif-1",
    stageId: "stage-bom",
    stageTitle: "Phòng kỹ thuật đăng BOM",
    recipientId: "user-gioi",
    message: "Anh Toán đã hoàn thành bước đăng BOM. Vui lòng phân bổ cho các xưởng.",
    createdAt: "2024-12-01T08:32:00+07:00",
    read: false,
  },
];

const bomTasks: BomTask[] = [
  {
    id: "bom-1",
    componentCode: "CH1.1",
    name: "Dầm chính A1",
    stage: ProcessStage.PAINTING,
    quantity: 2,
    totalWeight: 538,
    priority: BomPriority.HIGH,
    plannedStart: "2024-12-02",
    plannedEnd: "2024-12-05",
  },
  {
    id: "bom-2",
    componentCode: "CH1.2",
    name: "Dầm phụ B2",
    stage: ProcessStage.WELDING,
    quantity: 4,
    totalWeight: 1180,
    priority: BomPriority.MEDIUM,
    plannedStart: "2024-12-02",
    plannedEnd: "2024-12-04",
  },
  {
    id: "bom-3",
    componentCode: "CH2.1",
    name: "Cột thép C1",
    stage: ProcessStage.CUTTING,
    quantity: 6,
    totalWeight: 2490,
    priority: BomPriority.HIGH,
    plannedStart: "2024-12-01",
    plannedEnd: "2024-12-03",
  },
];

export const workflowSeed: WorkflowSeedData = {
  workflow,
  notifications,
  bomTasks,
};
