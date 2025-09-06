// app/production/types.ts

export enum ProcessStage {
  CUTTING = 'CUTTING',
  ASSEMBLY = 'ASSEMBLY',
  WELDING = 'WELDING',
  PAINTING = 'PAINTING'
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

export interface ProcessRecord {
  id: string;
  componentCode: string;
  stage: ProcessStage;
  assignDate: Date;
  actualDate?: Date;
  worker: string;
  status: ComponentStatus;
  notes?: string;
}

export interface CommonFormData {
  componentCode: string;
  assignDate: string;
  actualDate: string;
  worker: string;
  images: File[];
  notes: string;
  status: ComponentStatus;
}

export interface CuttingFormData {
  cuttingMethod: string;
  equipment: string;
  cutWeight: string;
  materialType: MaterialType;
  warehouseSource: string;
}

export interface AssemblyFormData {
  fixture: string;
  boltCount: string;
  assemblyTime: string;
  materialCondition: string;
  readyForWelding: string;
}

export interface WeldingFormData {
  weldingMethod: string;
  equipment: string;
  rodType: string;
  weldLength: string;
  spotCount: string;
  qualityCheck: boolean;
}

export interface PaintingFormData {
  paintCode: string;
  paintType: string;
  layers: string;
  color: string;
  area: string;
  thickness: string;
}

export const processStageLabels = {
  [ProcessStage.CUTTING]: "Cắt phôi",
  [ProcessStage.ASSEMBLY]: "Gá tổ hợp", 
  [ProcessStage.WELDING]: "Hàn hoàn thiện",
  [ProcessStage.PAINTING]: "Sơn xuất xưởng"
};

export const statusLabels = {
  [ComponentStatus.PENDING]: "Chờ xử lý",
  [ComponentStatus.IN_PROGRESS]: "Đang thực hiện",
  [ComponentStatus.COMPLETED]: "Hoàn thành",
  [ComponentStatus.QC_FAILED]: "QC không đạt",
  [ComponentStatus.APPROVED]: "Đã duyệt"
};

// Mock data
export const mockProcessRecords: ProcessRecord[] = [
  {
    id: "1",
    componentCode: "CH1.1",
    stage: ProcessStage.CUTTING,
    assignDate: new Date("2025-09-01"),
    actualDate: new Date("2025-09-02"),
    worker: "Nguyễn Văn A",
    status: ComponentStatus.COMPLETED,
    notes: "Cắt theo đúng bản vẽ"
  },
  {
    id: "2", 
    componentCode: "CH1.2",
    stage: ProcessStage.ASSEMBLY,
    assignDate: new Date("2025-09-02"),
    actualDate: new Date("2025-09-03"),
    worker: "Trần Văn B",
    status: ComponentStatus.IN_PROGRESS,
    notes: "Đang thực hiện gá"
  },
  {
    id: "3",
    componentCode: "CH2.1", 
    stage: ProcessStage.WELDING,
    assignDate: new Date("2025-09-01"),
    actualDate: new Date("2025-09-02"),
    worker: "Lê Văn C",
    status: ComponentStatus.COMPLETED,
    notes: "Hàn đạt tiêu chuẩn"
  }
];