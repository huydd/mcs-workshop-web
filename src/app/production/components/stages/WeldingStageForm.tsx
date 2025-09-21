// app/production/components/stages/WeldingStageForm.tsx
"use client";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { WeldingFormData } from "../../types";

interface WeldingStageFormProps {
  data: WeldingFormData;
  onChange: (data: WeldingFormData) => void;
}

export const WeldingStageForm = ({ data, onChange }: WeldingStageFormProps) => {
  const handleChange = (field: keyof WeldingFormData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Select
        label="Phương pháp hàn"
        value={data.weldingMethod}
        onChange={(e) => handleChange("weldingMethod", e.target.value)}
        required
      >
        <option value="CO2">CO2</option>
        <option value="ARC">Hồ quang</option>
        <option value="TIG">TIG</option>
      </Select>

      <Input
        label="Thiết bị hàn"
        placeholder="VD: Máy hàn CO2-001"
        value={data.equipment}
        onChange={(e) => handleChange("equipment", e.target.value)}
        required
      />

      <Select
        label="Loại que hàn"
        value={data.rodType}
        onChange={(e) => handleChange("rodType", e.target.value)}
        required
      >
        <option value="E6013">E6013</option>
        <option value="E7018">E7018</option>
      </Select>

      <Input
        type="number"
        step="0.1"
        label="Chiều dài mối hàn (m)"
        placeholder="0.0"
        value={data.weldLength}
        onChange={(e) => handleChange("weldLength", e.target.value)}
        required
      />

      <Input
        type="number"
        label="Số lượng điểm hàn"
        placeholder="0"
        value={data.spotCount}
        onChange={(e) => handleChange("spotCount", e.target.value)}
        required
      />

      <div className="flex items-center gap-2 pt-6">
        <input
          type="checkbox"
          id="qualityCheck"
          checked={data.qualityCheck}
          onChange={(e) => handleChange("qualityCheck", e.target.checked)}
        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
        />
        <label htmlFor="qualityCheck" className="text-sm font-medium text-[#212121]">
          Kiểm tra mối hàn đạt yêu cầu
        </label>
      </div>
    </div>
  );
};
