// app/production/components/ProductionForm.tsx
"use client";

import { useState } from "react";
import { Save, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { ImageUpload } from "./ImageUpload";
import { CuttingStageForm } from "./stages/CuttingStageForm";
import { AssemblyStageForm } from "./stages/AssemblyStageForm";
import { WeldingStageForm } from "./stages/WeldingStageForm";
import { PaintingStageForm } from "./stages/PaintingStageForm";
import { 
  ProcessStage, 
  ComponentStatus, 
  MaterialType,
  processStageLabels,
  CommonFormData,
  CuttingFormData,
  AssemblyFormData,
  WeldingFormData,
  PaintingFormData
} from "../types";

interface ProductionFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export const ProductionForm = ({ onSubmit, onCancel }: ProductionFormProps) => {
  const [selectedStage, setSelectedStage] = useState<ProcessStage | "">("");

  // Common form data
  const [commonData, setCommonData] = useState<CommonFormData>({
    componentCode: "",
    assignDate: "",
    actualDate: "",
    worker: "",
    images: [],
    notes: "",
    status: ComponentStatus.IN_PROGRESS
  });

  // Stage-specific form data
  const [cuttingData, setCuttingData] = useState<CuttingFormData>({
    cuttingMethod: "CNC",
    equipment: "",
    cutWeight: "",
    materialType: MaterialType.STANDARD,
    warehouseSource: ""
  });

  const [assemblyData, setAssemblyData] = useState<AssemblyFormData>({
    fixture: "",
    boltCount: "",
    assemblyTime: "",
    materialCondition: "SUFFICIENT",
    readyForWelding: "READY"
  });

  const [weldingData, setWeldingData] = useState<WeldingFormData>({
    weldingMethod: "CO2",
    equipment: "",
    rodType: "E6013",
    weldLength: "",
    spotCount: "",
    qualityCheck: false
  });

  const [paintingData, setPaintingData] = useState<PaintingFormData>({
    paintCode: "",
    paintType: "EPOXY",
    layers: "2",
    color: "WHITE",
    area: "",
    thickness: ""
  });

  const handleCommonChange = (field: keyof CommonFormData, value: any) => {
    setCommonData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    const formData = {
      common: commonData,
      stage: selectedStage,
      stageData: getStageData()
    };
    onSubmit(formData);
  };

  const getStageData = () => {
    switch (selectedStage) {
      case ProcessStage.CUTTING:
        return cuttingData;
      case ProcessStage.ASSEMBLY:
        return assemblyData;
      case ProcessStage.WELDING:
        return weldingData;
      case ProcessStage.PAINTING:
        return paintingData;
      default:
        return {};
    }
  };

  const resetForm = () => {
    setCommonData({
      componentCode: "",
      assignDate: "",
      actualDate: "",
      worker: "",
      images: [],
      notes: "",
      status: ComponentStatus.IN_PROGRESS
    });
    setSelectedStage("");
  };

  const renderStageForm = () => {
    switch (selectedStage) {
      case ProcessStage.CUTTING:
        return <CuttingStageForm data={cuttingData} onChange={setCuttingData} />;
      case ProcessStage.ASSEMBLY:
        return <AssemblyStageForm data={assemblyData} onChange={setAssemblyData} />;
      case ProcessStage.WELDING:
        return <WeldingStageForm data={weldingData} onChange={setWeldingData} />;
      case ProcessStage.PAINTING:
        return <PaintingStageForm data={paintingData} onChange={setPaintingData} />;
      default:
        return null;
    }
  };

  return (
    <Card className="p-4 lg:p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-[#212121]">
          Ghi nhận công đoạn sản xuất
        </h2>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-6">
        {/* Common fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Công đoạn"
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value as ProcessStage)}
            required
          >
            <option value="">Chọn công đoạn</option>
            <option value={ProcessStage.CUTTING}>Cắt phôi</option>
            <option value={ProcessStage.ASSEMBLY}>Gá tổ hợp</option>
            <option value={ProcessStage.WELDING}>Hàn hoàn thiện</option>
            <option value={ProcessStage.PAINTING}>Sơn xuất xưởng</option>
          </Select>

          <Input
            label="Mã cấu kiện"
            placeholder="VD: CH1.1"
            value={commonData.componentCode}
            onChange={(e) => handleCommonChange("componentCode", e.target.value)}
            required
          />

          <Input
            type="date"
            label="Ngày giao việc"
            value={commonData.assignDate}
            onChange={(e) => handleCommonChange("assignDate", e.target.value)}
            required
          />

          <Input
            type="date"
            label="Ngày thực hiện"
            value={commonData.actualDate}
            onChange={(e) => handleCommonChange("actualDate", e.target.value)}
          />

          <Select
            label="Người thực hiện"
            value={commonData.worker}
            onChange={(e) => handleCommonChange("worker", e.target.value)}
            required
          >
            <option value="">Chọn người thực hiện</option>
            <option value="1">Nguyễn Văn A</option>
            <option value="2">Trần Văn B</option>
            <option value="3">Lê Thị C</option>
          </Select>
        </div>

        {/* Stage-specific fields */}
        {selectedStage && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-[#212121] mb-4">
              Chi tiết công đoạn: {processStageLabels[selectedStage]}
            </h3>
            {renderStageForm()}
          </div>
        )}

        {/* Image Upload */}
        <ImageUpload
          images={commonData.images}
          onChange={(images) => handleCommonChange("images", images)}
        />

        <Textarea
          label="Ghi chú"
          placeholder="Ghi chú thêm về công đoạn..."
          value={commonData.notes}
          onChange={(e) => handleCommonChange("notes", e.target.value)}
          rows={4}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
          >
            Hủy
          </Button>
          <Button onClick={handleSubmit}>
            <Save className="h-4 w-4 mr-2" />
            Lưu ghi nhận
          </Button>
        </div>
      </div>
    </Card>
  );
};