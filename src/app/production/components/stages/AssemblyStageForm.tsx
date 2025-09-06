// app/production/components/stages/AssemblyStageForm.tsx
"use client";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { AssemblyFormData } from "../../types";

interface AssemblyStageFormProps {
  data: AssemblyFormData;
  onChange: (data: AssemblyFormData) => void;
}

export const AssemblyStageForm = ({ data, onChange }: AssemblyStageFormProps) => {
  const handleChange = (field: keyof AssemblyFormData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Input
        label="Dụng cụ gá"
        placeholder="VD: Máy gá / dụng cụ thủ công"
        value={data.fixture}
        onChange={(e) => handleChange("fixture", e.target.value)}
        required
      />

      <Input
        type="number"
        label="Số lượng bulong gá"
        placeholder="0"
        value={data.boltCount}
        onChange={(e) => handleChange("boltCount", e.target.value)}
        required
      />

      <Input
        type="number"
        step="0.1"
        label="Thời gian gá (giờ)"
        placeholder="0.0"
        value={data.assemblyTime}
        onChange={(e) => handleChange("assemblyTime", e.target.value)}
        required
      />

      <Select
        label="Tình trạng vật tư"
        value={data.materialCondition}
        onChange={(e) => handleChange("materialCondition", e.target.value)}
        required
      >
        <option value="SUFFICIENT">Đầy đủ</option>
        <option value="INSUFFICIENT">Thiếu</option>
        <option value="DAMAGED">Hư hỏng</option>
      </Select>

      <Select
        label="Trạng thái chuẩn bị hàn"
        value={data.readyForWelding}
        onChange={(e) => handleChange("readyForWelding", e.target.value)}
        required
      >
        <option value="READY">Sẵn sàng</option>
        <option value="NOT_READY">Chưa sẵn sàng</option>
      </Select>
    </div>
  );
};