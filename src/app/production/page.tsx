// app/production/page.tsx
"use client";

import { useMemo, useState, useEffect } from "react";
import { Plus, Search, Filter } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ResponsiveTable } from "@/components/ui/ResponsiveTable";
import { useResponsive } from "@/components/layout/ResponsiveContainer";
import { ProductionForm } from "./components/ProductionForm";
import { ApprovalSection } from "./components/ApprovalSection";
import { ProductionTableColumns } from "./components/ProductionTableColumns";
import { ProcessStage, ComponentStatus, mockProcessRecords } from "./types";
import { useAuth } from "@/context/auth-context";
import { UserRole } from "@/types";

export default function ProductionPage() {
  const { mobile } = useResponsive();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStage, setFilterStage] = useState<ProcessStage | "">("");
  const [filterStatus, setFilterStatus] = useState<ComponentStatus | "">("");

  const canCreateRecord = useMemo(() => {
    if (!user) return false;
    return [UserRole.PRODUCTION_PLANNER, UserRole.WORKSHOP_LEAD].includes(user.role);
  }, [user]);

  useEffect(() => {
    if (!canCreateRecord) {
      setShowForm(false);
    }
  }, [canCreateRecord]);

  const handleFormSubmit = (formData: any) => {
    console.log("Form submitted:", formData);
    setShowForm(false);
    // Handle form submission logic here
  };

  const handleApproval = (recordId: string, approved: boolean) => {
    console.log(`${approved ? 'Approved' : 'Rejected'} record:`, recordId);
    // Handle approval logic
  };

  // Filter data based on search and filters
  const filteredData = mockProcessRecords.filter(record => {
    const matchesSearch = record.componentCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = !filterStage || record.stage === filterStage;
    const matchesStatus = !filterStatus || record.status === filterStatus;
    
    return matchesSearch && matchesStage && matchesStatus;
  });

  const completedRecords = mockProcessRecords.filter(
    r => r.status === ComponentStatus.COMPLETED
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-[#212121]">
            Ghi nhận công đoạn sản xuất
          </h1>
          <p className="text-[#616161] mt-1">
            Quản lý và ghi nhận các công đoạn sản xuất kết cấu thép
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          size={mobile ? "sm" : "md"}
          disabled={!canCreateRecord}
          title={
            canCreateRecord
              ? undefined
              : "Chỉ điều phối sản xuất và kỹ sư trưởng xưởng mới được phép ghi nhận."
          }
        >
          <Plus className="h-4 w-4" />
          {!mobile && <span className="ml-2">Ghi nhận mới</span>}
        </Button>
      </div>

      {!canCreateRecord && (
        <div className="bg-blue-50 border border-blue-100 text-sm text-blue-800 rounded-lg px-4 py-3">
          Bạn đang đăng nhập bằng tài khoản không có quyền ghi nhận công đoạn. Vui lòng liên hệ điều phối sản xuất hoặc kỹ sư trưởng xưởng để cập nhật dữ liệu.
        </div>
      )}

      {/* Form */}
      {showForm && (
        <ProductionForm
          onSubmit={handleFormSubmit}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Tìm kiếm theo mã cấu kiện..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value as ProcessStage | "")}
              className="min-w-[150px]"
            >
              <option value="">Tất cả công đoạn</option>
              <option value={ProcessStage.CUTTING}>Cắt phôi</option>
              <option value={ProcessStage.ASSEMBLY}>Gá tổ hợp</option>
              <option value={ProcessStage.WELDING}>Hàn hoàn thiện</option>
              <option value={ProcessStage.PAINTING}>Sơn xuất xưởng</option>
            </Select>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as ComponentStatus | "")}
              className="min-w-[150px]"
            >
              <option value="">Tất cả trạng thái</option>
              <option value={ComponentStatus.PENDING}>Chờ xử lý</option>
              <option value={ComponentStatus.IN_PROGRESS}>Đang thực hiện</option>
              <option value={ComponentStatus.COMPLETED}>Hoàn thành</option>
              <option value={ComponentStatus.QC_FAILED}>QC không đạt</option>
              <option value={ComponentStatus.APPROVED}>Đã duyệt</option>
            </Select>
            <Button variant="secondary" size="sm">
              <Filter className="h-4 w-4" />
              {!mobile && <span className="ml-2">Bộ lọc</span>}
            </Button>
          </div>
        </div>
      </Card>

      {/* Data Table */}
      <ResponsiveTable
        data={filteredData}
        columns={ProductionTableColumns}
        keyField="id"
        onRowClick={(record) => console.log("Selected record:", record)}
      />

      {/* Approval Section */}
      {completedRecords.length > 0 && (
        <ApprovalSection
          records={completedRecords}
          onApproval={handleApproval}
        />
      )}
    </div>
  );
}
