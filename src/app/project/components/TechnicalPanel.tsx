'use client';

import { ChangeEvent, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  Download,
  FileText,
  UploadCloud,
  Wand2,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useWorkflow } from '@/context/workflow-context';
import { useAuth } from '@/context/auth-context';
import { BomPriority, ProcessStage, UserRole } from '@/types';
import { cn } from '@/lib/utils';

const SAMPLE_CSV = `component_code,name,stage,quantity,total_weight,priority,planned_start,planned_end,notes
CH1.1,Dầm chính A1,Hàn hoàn thiện,2,538,HIGH,2024-12-02,2024-12-05,Ưu tiên giao trước
CH1.2,Dầm phụ B2,Gá tổ hợp,4,1180,MEDIUM,2024-12-02,2024-12-04,
CH2.1,Cột thép C1,Cắt phôi,6,2490,HIGH,2024-12-01,2024-12-03,Kiểm tra kích thước đầu vào
`;

const priorityLabel: Record<BomPriority, string> = {
  [BomPriority.LOW]: 'Thấp',
  [BomPriority.MEDIUM]: 'Trung bình',
  [BomPriority.HIGH]: 'Cao',
};

export const TechnicalPanel = () => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { user } = useAuth();
  const { bomTasks, bomImportHistory, importBomFromCsv } = useWorkflow();

  const [uploadState, setUploadState] = useState<
    | { status: 'idle' }
    | { status: 'success'; message: string }
    | { status: 'error'; message: string }
  >({ status: 'idle' });
  const [warnings, setWarnings] = useState<string[]>([]);

  const isTechnical = user?.role === UserRole.TECHNICAL_ENGINEER;

  const totalWeight = useMemo(
    () => bomTasks.reduce((acc, task) => acc + task.totalWeight, 0),
    [bomTasks],
  );

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      const result = importBomFromCsv({
        fileName: file.name,
        content: text,
        importedBy: user?.name ?? 'Kỹ thuật',
        importedById: user?.id ?? 'user-toan',
      });

      if (!result.success) {
        setUploadState({ status: 'error', message: result.error });
        setWarnings(result.warnings ?? []);
        return;
      }

      setUploadState({
        status: 'success',
        message: `${result.summary.totalTasks} hạng mục đã được nhập thành công từ ${result.summary.fileName}.`,
      });
      setWarnings(result.warnings);
    };
    reader.onerror = () => {
      setUploadState({
        status: 'error',
        message: 'Không đọc được file CSV. Vui lòng thử lại.',
      });
    };
    reader.readAsText(file, 'utf-8');
    event.target.value = '';
  };

  const triggerUpload = () => {
    if (!isTechnical) return;
    fileInputRef.current?.click();
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mcs-bom-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="space-y-4" padding="lg">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-secondary">BOM LIST</h2>
          <p className="text-sm text-secondary/70 mt-1">
            Tải lên file CSV để sinh danh sách cấu kiện và công việc chi tiết
            cho điều phối.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={() => router.push('/project/technical')}
            variant="secondary"
            size="sm"
          >
            <Wand2 className="h-4 w-4" />
            <span className="ml-2">Advanced BOM Tool</span>
          </Button>
          <Button
            onClick={triggerUpload}
            size="sm"
            disabled={!isTechnical}
            title={
              isTechnical
                ? 'Chọn file CSV'
                : 'Chỉ phòng kỹ thuật được phép cập nhật BOM'
            }
          >
            <UploadCloud className="h-4 w-4" />
            <span className="ml-2">Upload CSV</span>
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {uploadState.status !== 'idle' && (
        <div
          className={cn(
            'px-4 py-3 rounded-lg border text-sm',
            uploadState.status === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800',
          )}
        >
          {uploadState.message}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>Một số dòng cần lưu ý:</span>
          </div>
          <ul className="list-disc list-inside mt-2 space-y-1">
            {warnings.map(warning => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryTile
          title="Số hạng mục"
          value={bomTasks.length}
          helper="Tổng cấu kiện trong BOM"
        />
        <SummaryTile
          title="Tổng khối lượng"
          value={`${totalWeight.toLocaleString('vi-VN')}`}
          suffix="kg"
          helper="Tính theo dữ liệu mới nhất"
        />
        <SummaryTile
          title="Lần upload gần nhất"
          value={
            bomImportHistory[0]?.importedAt
              ? new Intl.DateTimeFormat('vi-VN', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                }).format(new Date(bomImportHistory[0].importedAt))
              : 'Chưa có'
          }
          helper={bomImportHistory[0]?.fileName ?? '—'}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-secondary">
            Danh sách cấu kiện (top 5)
          </h3>
        </div>
        <div className="overflow-hidden rounded-lg border border-gray-100">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-secondary/5 text-xs uppercase tracking-wide text-secondary/70">
              <tr>
                <th className="px-3 py-2 text-left">Mã</th>
                <th className="px-3 py-2 text-left">Tên</th>
                <th className="px-3 py-2 text-left">Công đoạn</th>
                <th className="px-3 py-2 text-left">Ưu tiên</th>
                <th className="px-3 py-2 text-right">Khối lượng (kg)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bomTasks.slice(0, 5).map(item => (
                <tr key={item.id} className="bg-white">
                  <td className="px-3 py-2 font-semibold text-secondary">
                    {item.componentCode}
                  </td>
                  <td className="px-3 py-2 text-secondary/80">{item.name}</td>
                  <td className="px-3 py-2 text-secondary/70">
                    {renderStage(item.stage)}
                  </td>
                  <td className="px-3 py-2">
                    {item.priority ? (
                      <Badge className="bg-primary/10 text-primary text-xs">
                        {priorityLabel[item.priority]}
                      </Badge>
                    ) : (
                      <span className="text-secondary/50 text-xs">
                        Chưa gán
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right text-secondary">
                    {item.totalWeight.toLocaleString('vi-VN')}
                  </td>
                </tr>
              ))}
              {bomTasks.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-4 text-center text-secondary/60 text-sm"
                  >
                    Chưa có dữ liệu. Vui lòng upload file CSV.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {bomImportHistory.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-secondary">
            Lịch sử upload
          </h3>
          <div className="space-y-2">
            {bomImportHistory.map(history => (
              <div
                key={history.id}
                className="flex flex-col md:flex-row md:items-center md:justify-between rounded-lg border border-gray-100 bg-white px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-secondary">
                    {history.fileName}
                  </p>
                  <p className="text-xs text-secondary/60">
                    {new Intl.DateTimeFormat('vi-VN', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    }).format(new Date(history.importedAt))}{' '}
                    · {history.importedBy}
                  </p>
                </div>
                <div className="text-xs text-secondary/60 mt-2 md:mt-0">
                  {history.totalTasks} hạng mục ·{' '}
                  {history.totalWeight.toLocaleString('vi-VN')} kg
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

const renderStage = (stage: ProcessStage) => {
  switch (stage) {
    case ProcessStage.CUTTING:
      return 'Cắt phôi';
    case ProcessStage.ASSEMBLY:
      return 'Gá tổ hợp';
    case ProcessStage.WELDING:
      return 'Hàn hoàn thiện';
    case ProcessStage.PAINTING:
      return 'Sơn xuất xưởng';
    default:
      return stage;
  }
};

interface SummaryTileProps {
  title: string;
  value: string | number;
  helper?: string;
  suffix?: string;
}

const SummaryTile = ({ title, value, helper, suffix }: SummaryTileProps) => (
  <div className="rounded-lg border border-gray-100 bg-white px-4 py-3">
    <p className="text-xs font-medium uppercase tracking-wide text-secondary/60">
      {title}
    </p>
    <div className="flex items-baseline gap-1 mt-1">
      <span className="text-2xl font-semibold text-secondary">{value}</span>
      {suffix && <span className="text-xs text-secondary/60">{suffix}</span>}
    </div>
    {helper && <p className="text-xs text-secondary/60 mt-1">{helper}</p>}
  </div>
);

export default TechnicalPanel;
