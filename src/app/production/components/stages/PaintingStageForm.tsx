// app/production/components/stages/PaintingStageForm.tsx
"use client";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { PaintingFormData } from "../../types";

interface PaintingStageFormProps {
  data: PaintingFormData;
  onChange: (data: PaintingFormData) => void;
}

export const PaintingStageForm = ({ data, onChange }: PaintingStageFormProps) => {
  const handleChange = (field: keyof PaintingFormData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Input
        label="Mã sơn"
        placeholder="Theo định danh kỹ thuật"
        value={data.paintCode}
        onChange={(e) => handleChange("paintCode", e.target.value)}
        required
      />

      <Select
        label="Loại sơn"
        value={data.paintType}
        onChange={(e) => handleChange("paintType", e.target.value)}
        required
      >
        <option value="EPOXY">Epoxy</option>
        <option value="PU">PU</option>
        <option value="ZINC_RICH">Kẽm giàu</option>
      </Select>

      <Select
        label="Số lớp sơn"
        value={data.layers}
        onChange={(e) => handleChange("layers", e.target.value)}
        required
      >
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
      </Select>

      <Select
        label="Màu sơn"
        value={data.color}
        onChange={(e) => handleChange("color", e.target.value)}
        required
      >
        <option value="WHITE">Trắng</option>
        <option value="BLACK">Đen</option>
        <option value="GRAY">Xám</option>
        <option value="BLUE">Xanh</option>
      </Select>

      <Input
        type="number"
        step="0.1"
        label="Diện tích sơn (m²)"
        placeholder="0.0"
        value={data.area}
        onChange={(e) => handleChange("area", e.target.value)}
        required
      />

      <Input
        type="number"
        step="0.1"
        label="Độ dày lớp sơn (micron)"
        placeholder="0.0"
        value={data.thickness}
        onChange={(e) => handleChange("thickness", e.target.value)}
        helper="Tùy chọn, nếu có đo"
      />
    </div>
  );
};