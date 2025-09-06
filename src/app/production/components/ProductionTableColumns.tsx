// app/production/components/ProductionTableColumns.tsx
import { Badge } from "@/components/ui/Badge";
import { ProcessRecord, ProcessStage, ComponentStatus, processStageLabels, statusLabels } from "../types";

export const ProductionTableColumns = [
  {
    key: "componentCode" as keyof ProcessRecord,
    label: "Mã cấu kiện",
    priority: "high" as const,
    render: (value: string) => (
      <div className="font-mono font-medium text-[#212121]">{value}</div>
    )
  },
  {
    key: "stage" as keyof ProcessRecord,
    label: "Công đoạn",
    priority: "high" as const,
    render: (stage: ProcessStage) => {
      const colorMap = {
        [ProcessStage.CUTTING]: "bg-blue-100 text-blue-800",
        [ProcessStage.ASSEMBLY]: "bg-purple-100 text-purple-800", 
        [ProcessStage.WELDING]: "bg-orange-100 text-orange-800",
        [ProcessStage.PAINTING]: "bg-green-100 text-green-800"
      };
      
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorMap[stage]}`}>
          {processStageLabels[stage]}
        </span>
      );
    }
  },
  {
    key: "worker" as keyof ProcessRecord,
    label: "Người thực hiện",
    priority: "medium" as const,
    render: (worker: string) => worker || "Chưa phân công"
  },
  {
    key: "assignDate" as keyof ProcessRecord,
    label: "Ngày giao việc",
    priority: "low" as const,
    render: (date: Date) => new Intl.DateTimeFormat("vi-VN").format(date)
  },
  {
    key: "actualDate" as keyof ProcessRecord,
    label: "Ngày thực hiện",
    priority: "medium" as const,
    render: (date: Date | undefined) =>
      date ? new Intl.DateTimeFormat("vi-VN").format(date) : "Chưa thực hiện"
  },
  {
    key: "status" as keyof ProcessRecord,
    label: "Trạng thái",
    priority: "high" as const,
    render: (status: ComponentStatus) => (
      <Badge variant={status}>{statusLabels[status]}</Badge>
    )
  },
  {
    key: "notes" as keyof ProcessRecord,
    label: "Ghi chú",
    priority: "low" as const,
    render: (notes: string | undefined) => (
      <div className="max-w-32 truncate" title={notes || ""}>
        {notes || "—"}
      </div>
    )
  }
];