// types/index.ts
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export enum UserRole {
  CHIEF_ENGINEER = 'CHIEF_ENGINEER',
  TECHNICAL_SECRETARY = 'TECHNICAL_SECRETARY',
  QA_INSPECTOR = 'QA_INSPECTOR',
  BOD = 'BOD'
}

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