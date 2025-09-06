// app/production/components/ApprovalSection.tsx
"use client";

import { Check, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProcessRecord, processStageLabels } from "../types";

interface ApprovalSectionProps {
  records: ProcessRecord[];
  onApproval: (recordId: string, approved: boolean) => void;
}

export const ApprovalSection = ({ records, onApproval }: ApprovalSectionProps) => {
  if (records.length === 0) return null;

  return (
    <Card className="p-4">
      <h3 className="font-semibold text-[#212121] mb-4">
        Chờ nghiệm thu ({records.length})
      </h3>
      <div className="space-y-3">
        {records.map(record => (
          <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono font-medium text-[#212121]">
                  {record.componentCode}
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-[#616161]">
                  {processStageLabels[record.stage]}
                </span>
              </div>
              <div className="text-sm text-[#616161] mt-1">
                Người thực hiện: {record.worker}
                {record.actualDate && (
                  <span className="ml-4">
                    Hoàn thành: {new Intl.DateTimeFormat("vi-VN").format(record.actualDate)}
                  </span>
                )}
              </div>
              {record.notes && (
                <div className="text-sm text-[#616161] mt-1 italic">
                  "{record.notes}"
                </div>
              )}
            </div>
            
            <div className="flex gap-2 ml-4">
              <Button 
                size="sm" 
                onClick={() => onApproval(record.id, true)}
                className="bg-[#388E3C] hover:bg-[#2E7D32] text-white"
              >
                <Check className="h-4 w-4 mr-1" />
                Đạt
              </Button>
              <Button 
                size="sm" 
                variant="danger"
                onClick={() => onApproval(record.id, false)}
              >
                <AlertTriangle className="h-4 w-4 mr-1" />
                Không đạt
              </Button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center text-sm text-[#616161]">
          <span>Tổng cần nghiệm thu: {records.length} công đoạn</span>
          <Button variant="secondary" size="sm">
            Xem chi tiết
          </Button>
        </div>
      </div>
    </Card>
  );
};