// types/index.ts
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  workshopCode?: string;
  workshopName?: string;
  avatar?: string;
}

export enum UserRole {
  TECHNICAL_ENGINEER = 'TECHNICAL_ENGINEER',
  PRODUCTION_PLANNER = 'PRODUCTION_PLANNER',
  WORKSHOP_LEAD = 'WORKSHOP_LEAD',
  MANAGEMENT = 'MANAGEMENT'
}

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.TECHNICAL_ENGINEER]: 'Phòng kỹ thuật',
  [UserRole.PRODUCTION_PLANNER]: 'Điều phối sản xuất',
  [UserRole.WORKSHOP_LEAD]: 'Kỹ sư trưởng xưởng',
  [UserRole.MANAGEMENT]: 'Quản lý'
};

export enum ComponentStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  QC_FAILED = 'QC_FAILED',
  APPROVED = 'APPROVED'
}

export enum MaterialType {
  STANDARD = 'STANDARD',
  NON_STANDARD = 'NON_STANDARD'
}

export enum ProcessStage {
  CUTTING = 'CUTTING',
  ASSEMBLY = 'ASSEMBLY', 
  WELDING = 'WELDING',
  PAINTING = 'PAINTING'
}

export interface Component {
  id: string;
  code: string; // Mã cấu kiện như CH1.1, CH1.2
  name: string;
  specifications: string; // H300×168×6×10
  length: number; // mm
  unitWeight: number; // kg
  quantity: number;
  totalWeight: number;
  status: ComponentStatus;
  currentStage: ProcessStage;
  createdAt: Date;
  updatedAt: Date;
}

export interface CuttingRecord {
  id: string;
  componentId: string;
  componentCode: string;
  assignDate: Date;
  actualCutDate?: Date;
  cutter?: User;
  equipment: string; // Tên máy
  cuttingMethod: 'CNC' | 'MANUAL';
  successQuantity: number;
  cutWeight: number; // kg
  warehouseSource: string;
  materialType: MaterialType;
  images: string[];
  notes?: string;
  status: ComponentStatus;
  createdBy: User;
  createdAt: Date;
}

export interface AssemblyRecord {
  id: string;
  componentId: string;
  componentCode: string;
  assignDate: Date;
  actualAssemblyDate?: Date;
  assembler?: User;
  fixtureCode: string; // Mã đồ gá hoặc số khuôn
  flatnessDeviation: number; // Độ lệch phẳng
  jointAccuracy: number; // Độ lệch khớp
  completedQuantity: number;
  notes?: string;
  status: ComponentStatus;
  createdBy: User;
  createdAt: Date;
}

export enum WeldType {
  CORNER = 'CORNER',
  DOUBLE = 'DOUBLE', 
  THICK = 'THICK',
  OVERHEAD = 'OVERHEAD'
}

export enum WeldingEquipment {
  MANUAL = 'MANUAL',
  ROBOT = 'ROBOT',
  CO2 = 'CO2'
}

export interface WeldingRecord {
  id: string;
  componentId: string;
  componentCode: string;
  assignDate: Date;
  actualWeldDate?: Date;
  welder?: User;
  weldType: WeldType;
  jointCount: number;
  weldLength: number; // mm
  current: number; // Dòng điện
  equipment: WeldingEquipment;
  initialInspection: boolean; // Đạt/Không đạt
  images: string[];
  notes?: string;
  status: ComponentStatus;
  createdBy: User;
  createdAt: Date;
}

export enum PaintType {
  TWO_K = '2K',
  PU = 'PU',
  EPOXY = 'EPOXY'
}

export enum ShippingStatus {
  WAITING_QC = 'WAITING_QC',
  PACKAGED = 'PACKAGED',
  WAITING_TRANSPORT = 'WAITING_TRANSPORT',
  SHIPPED = 'SHIPPED'
}

export interface PaintingRecord {
  id: string;
  componentId: string;
  componentCode: string;
  assignDate: Date;
  actualPaintDate?: Date;
  painter?: User;
  paintType: PaintType;
  coatLayers: number;
  thickness: number; // Độ dày
  adhesion: number; // Độ bám
  shippingDate?: Date;
  images: string[];
  shippingStatus: ShippingStatus;
  notes?: string;
  status: ComponentStatus;
  createdBy: User;
  createdAt: Date;
}

export interface ProductionSummary {
  totalComponents: number;
  completedComponents: number;
  inProgressComponents: number;
  totalWeight: number;
  completedWeight: number;
  stageProgress: {
    cutting: number;
    assembly: number;
    welding: number;
    painting: number;
  };
}

export enum WorkflowStageStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}

export enum WorkflowActionType {
  STARTED = 'STARTED',
  COMPLETED = 'COMPLETED'
}

export interface WorkflowStage {
  id: string;
  title: string;
  description: string;
  role: UserRole;
  assigneeId: string;
  status: WorkflowStageStatus;
  updatedAt?: string;
  dependsOn?: string[];
}

export interface WorkflowEvent {
  id: string;
  stageId: string;
  actorId: string;
  action: WorkflowActionType;
  timestamp: string;
  note?: string;
}

export interface ProjectWorkflow {
  id: string;
  name: string;
  bomCode: string;
  description?: string;
  stages: WorkflowStage[];
  history: WorkflowEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowNotification {
  id: string;
  stageId: string;
  stageTitle: string;
  recipientId: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export enum BomPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export interface BomTask {
  id: string;
  componentCode: string;
  name: string;
  stage: ProcessStage;
  quantity: number;
  totalWeight: number;
  plannedStart?: string;
  plannedEnd?: string;
  priority?: BomPriority;
  notes?: string;
}

export interface BomImportSummary {
  id: string;
  fileName: string;
  importedBy: string;
  importedAt: string;
  totalTasks: number;
  totalWeight: number;
  warnings: string[];
}

export interface FilterOptions {
  componentCode?: string;
  status?: ComponentStatus[];
  stage?: ProcessStage[];
  materialType?: MaterialType[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  assignedUser?: string[];
}

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export interface ResponsiveBreakpoint {
  mobile: boolean; // ≤ 767px
  tablet: boolean; // 768-1279px
  desktop: boolean; // ≥ 1280px
}

// ============================================
// PULL SYSTEM TYPES
// ============================================

export interface ProductPart {
  id: string;
  partName: string;
  profile: string;
  material: string;
  qtyPerProduct: number;
  totalQty: number;
  weight: number;
}

export type DeliveryProductOrigin = 'bom' | 'plan';

export interface DeliveryProduct {
  id: string;
  productName: string;
  quantity: number;
  deadline: string;
  bomRef: string;
  parts: ProductPart[];
  origin?: DeliveryProductOrigin;
}

export interface DeliveryPlan {
  id: string;
  name: string;
  products: DeliveryProduct[];
  createdBy: string;
  createdAt: string;
  status: 'draft' | 'active' | 'completed';
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
}

export interface WorkGroupTask {
  id: string;
  sourceType: 'delivery' | 'request';
  sourceId: string;
  taskName: string;
  profile: string;
  material: string;
  quantity: number;
  weight: number;
  assignedWorkers: string[];
  estimatedDays: number;
  actualStart?: string;
  actualEnd?: string;
  notes?: string;
  subtasks: SubTask[];
  status: 'todo' | 'in_progress' | 'done';
  claimId?: string;
  claimStatus?: 'pending' | 'accepted';
  claimedBy?: string;
  claimedAt?: string;
}

export interface WorkGroup {
  id: string;
  name: string;
  description: string;
  workshopId: string;
  workshopName: string;
  tasks: WorkGroupTask[];
  dueDate: string;
  progress: number;
  status: 'todo' | 'in_progress' | 'review' | 'completed';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkItemClaim {
  id: string;
  productId: string;
  productName: string;
  origin: DeliveryProductOrigin;
  workshopId: string;
  workshopName: string;
  groupId: string;
  groupName: string;
  quantity: number;
  reservedAt: string;
  status: 'pending' | 'accepted';
  acceptedAt?: string;
}

export interface RequestedPart {
  id: string;
  partName: string;
  profile: string;
  material: string;
  quantity: number;
  weight: number;
  neededBy: string;
}

export interface PartRequest {
  id: string;
  name: string;
  fromGroupId: string;
  fromWorkshopId: string;
  fromWorkshopName: string;
  parts: RequestedPart[];
  status: 'pending' | 'accepted' | 'in_progress' | 'completed';
  acceptedBy?: string;
  acceptedAt?: string;
  createdAt: string;
  updatedAt: string;
}
