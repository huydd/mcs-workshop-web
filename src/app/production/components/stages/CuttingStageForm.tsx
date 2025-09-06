// app/production/components/stages/CuttingStageForm.tsx
"use client";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { CuttingFormData, MaterialType } from "../../types";

interface CuttingStageFormProps {
  data: CuttingFormData;
  onChange: (data: CuttingFormData) => void;
}

export const CuttingStageForm = ({ data, onChange }: CuttingStageFormProps) => {
  const handleChange = (field: keyof CuttingFormData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Select
        label="Phương pháp cắt"
        value={data.cuttingMethod}
        onChange={(e) => handleChange("cuttingMethod", e.target.value)}
        required
      >
        <option value="CNC">CNC</option>
        <option value="PLASMA">Plasma</option>
        <option value="OXYGAS">OxyGas</option>
      </Select>

      <Input
        label="Thiết bị sử dụng"
        placeholder="VD: Máy cắt CNC-001"
        value={data.equipment}
        onChange={(e) => handleChange("equipment", e.target.value)}
        required
      />

      <Input
        type="number"
        step="0.1"
        label="Khối lượng cắt (kg)"
        placeholder="0.0"
        value={data.cutWeight}
        onChange={(e) => handleChange("cutWeight", e.target.value)}
        required
        helper="Tự động so sánh với kế hoạch"
      />

      <Select
        label="Loại vật tư"
        value={data.materialType}
        onChange={(e) => handleChange("materialType", e.target.value as MaterialType)}
        required
      >
        <option value={MaterialType.STANDARD}>Tiêu chuẩn</option>
        <option value={MaterialType.NON_STANDARD}>Phi tiêu chuẩn</option>
      </Select>

      <Input
        label="Kho vật tư xuất"
        placeholder="VD: Kho A-01, B-02..."
        value={data.warehouseSource}
        onChange={(e) => handleChange("warehouseSource", e.target.value)}
        required
      />
    </div>
  );
};