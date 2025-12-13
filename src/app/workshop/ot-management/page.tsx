'use client';

import React, { useState, useMemo } from 'react';
import {
  Clock,
  Users,
  Plus,
  Check,
  X,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

// Mock workers data - should match your actual WorkshopWorker interface
const WORKERS = [
  { id: 'w1', name: 'Nguyễn Văn A', role: 'Thợ hàn' },
  { id: 'w2', name: 'Trần Văn B', role: 'Thợ cơ khí' },
  { id: 'w3', name: 'Lê Văn C', role: 'Thợ hàn' },
  { id: 'w4', name: 'Phạm Văn D', role: 'Thợ tiện' },
  { id: 'w5', name: 'Hoàng Văn E', role: 'Thợ hàn' },
];

interface OTRequest {
  id: string;
  workerId: string;
  workerName: string;
  date: string;
  hours: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  requestedBy: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewComment?: string;
}

export default function OTManagementPage() {
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [otHours, setOTHours] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Load OT requests from localStorage
  const [otRequests, setOTRequests] = useState<OTRequest[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('ot_requests');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Error loading OT requests:', e);
      return [];
    }
  });

  // Filter requests
  const filteredRequests = useMemo(() => {
    if (filterStatus === 'all') return otRequests;
    return otRequests.filter(req => req.status === filterStatus);
  }, [otRequests, filterStatus]);

  // Summary stats
  const stats = useMemo(() => {
    const pending = otRequests.filter(r => r.status === 'pending').length;
    const approved = otRequests.filter(r => r.status === 'approved').length;
    const rejected = otRequests.filter(r => r.status === 'rejected').length;
    const totalHours = otRequests
      .filter(r => r.status === 'approved')
      .reduce((sum, r) => sum + r.hours, 0);

    return { pending, approved, rejected, totalHours };
  }, [otRequests]);

  // Toggle worker selection
  const toggleWorker = (workerId: string) => {
    setSelectedWorkers(prev =>
      prev.includes(workerId)
        ? prev.filter(id => id !== workerId)
        : [...prev, workerId]
    );
  };

  // Submit OT request
  const handleSubmitRequest = () => {
    if (selectedWorkers.length === 0) {
      alert('Vui lòng chọn ít nhất 1 nhân viên');
      return;
    }
    if (otHours <= 0 || otHours > 4) {
      alert('Số giờ OT phải từ 0.5 đến 4 giờ');
      return;
    }
    if (!reason.trim()) {
      alert('Vui lòng nhập lý do');
      return;
    }

    const now = new Date().toISOString();
    const newRequests: OTRequest[] = selectedWorkers.map(workerId => {
      const worker = WORKERS.find(w => w.id === workerId);
      return {
        id: `ot-${Date.now()}-${workerId}`,
        workerId,
        workerName: worker?.name || 'Unknown',
        date: selectedDate,
        hours: otHours,
        reason,
        status: 'pending' as const,
        requestedAt: now,
        requestedBy: 'Kỹ sư trưởng', // TODO: get from auth context
      };
    });

    const updated = [...otRequests, ...newRequests];
    setOTRequests(updated);
    localStorage.setItem('ot_requests', JSON.stringify(updated));

    // Reset form
    setSelectedWorkers([]);
    setOTHours(0);
    setReason('');
    setShowRequestModal(false);

    alert(`Đã gửi ${newRequests.length} đề xuất OT thành công!`);
  };

  // Approve/Reject OT request
  const handleReview = (requestId: string, status: 'approved' | 'rejected', comment?: string) => {
    const updated = otRequests.map(req =>
      req.id === requestId
        ? {
            ...req,
            status,
            reviewedAt: new Date().toISOString(),
            reviewedBy: 'Quản lý', // TODO: get from auth context
            reviewComment: comment,
          }
        : req
    );

    setOTRequests(updated);
    localStorage.setItem('ot_requests', JSON.stringify(updated));
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const dayOfWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][date.getDay()];
    return `${dayOfWeek}, ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  const formatDateTime = (isoStr: string) => {
    const date = new Date(isoStr);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Clock className="w-8 h-8 text-orange-600" />
              Quản lý Làm Thêm Giờ (OT)
            </h1>
            <p className="text-gray-600 mt-1">Đăng ký và duyệt yêu cầu làm thêm giờ</p>
          </div>
          <Button
            onClick={() => setShowRequestModal(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Plus className="w-5 h-5 mr-2" />
            Đăng ký OT
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card padding="md" className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Chờ duyệt</p>
                <p className="text-3xl font-bold mt-1">{stats.pending}</p>
              </div>
              <AlertTriangle className="w-8 h-8 opacity-80" />
            </div>
          </Card>

          <Card padding="md" className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Đã duyệt</p>
                <p className="text-3xl font-bold mt-1">{stats.approved}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 opacity-80" />
            </div>
          </Card>

          <Card padding="md" className="bg-gradient-to-br from-red-500 to-red-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Từ chối</p>
                <p className="text-3xl font-bold mt-1">{stats.rejected}</p>
              </div>
              <XCircle className="w-8 h-8 opacity-80" />
            </div>
          </Card>

          <Card padding="md" className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Tổng giờ duyệt</p>
                <p className="text-3xl font-bold mt-1">{stats.totalHours}h</p>
              </div>
              <Clock className="w-8 h-8 opacity-80" />
            </div>
          </Card>
        </div>

        {/* Filter */}
        <Card padding="md">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">Lọc theo trạng thái:</span>
            {(['all', 'pending', 'approved', 'rejected'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  filterStatus === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                {status === 'all' && 'Tất cả'}
                {status === 'pending' && 'Chờ duyệt'}
                {status === 'approved' && 'Đã duyệt'}
                {status === 'rejected' && 'Từ chối'}
              </button>
            ))}
          </div>
        </Card>

        {/* OT Requests Table */}
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-orange-600 to-red-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Nhân viên</th>
                  <th className="px-6 py-4 text-center font-semibold">Ngày OT</th>
                  <th className="px-6 py-4 text-center font-semibold">Số giờ</th>
                  <th className="px-6 py-4 text-left font-semibold">Lý do</th>
                  <th className="px-6 py-4 text-center font-semibold">Trạng thái</th>
                  <th className="px-6 py-4 text-center font-semibold">Người đề xuất</th>
                  <th className="px-6 py-4 text-center font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-xl text-gray-500 font-medium">
                        {filterStatus === 'all'
                          ? 'Chưa có đề xuất OT nào'
                          : `Không có đề xuất ở trạng thái "${
                              filterStatus === 'pending'
                                ? 'Chờ duyệt'
                                : filterStatus === 'approved'
                                ? 'Đã duyệt'
                                : 'Từ chối'
                            }"`}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((request, idx) => (
                    <tr
                      key={request.id}
                      className={cn(
                        'hover:bg-gray-50 transition-colors',
                        idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      )}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{request.workerName}</p>
                            <p className="text-xs text-gray-500">
                              {WORKERS.find(w => w.id === request.workerId)?.role}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-medium text-gray-900">
                          {formatDate(request.date)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-lg font-bold text-orange-600">
                          {request.hours}h
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700 max-w-xs">{request.reason}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {request.status === 'pending' && (
                          <Badge className="bg-orange-100 text-orange-700">
                            Chờ duyệt
                          </Badge>
                        )}
                        {request.status === 'approved' && (
                          <Badge className="bg-green-100 text-green-700">
                            ✓ Đã duyệt
                          </Badge>
                        )}
                        {request.status === 'rejected' && (
                          <Badge className="bg-red-100 text-red-700">
                            ✗ Từ chối
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {request.requestedBy}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDateTime(request.requestedAt)}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {request.status === 'pending' ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                const comment = prompt('Ghi chú (tùy chọn):');
                                handleReview(request.id, 'approved', comment || undefined);
                              }}
                              className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                              title="Duyệt"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                const comment = prompt('Lý do từ chối:');
                                if (comment) {
                                  handleReview(request.id, 'rejected', comment);
                                }
                              }}
                              className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                              title="Từ chối"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div>
                            <p className="text-xs text-gray-500">
                              {request.reviewedBy}
                            </p>
                            {request.reviewComment && (
                              <p className="text-xs text-gray-400 italic">
                                "{request.reviewComment}"
                              </p>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* OT Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Plus className="w-6 h-6 text-orange-600" />
                Đăng ký làm thêm giờ (OT)
              </h3>
              <button
                onClick={() => {
                  setShowRequestModal(false);
                  setSelectedWorkers([]);
                  setOTHours(0);
                  setReason('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Date Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Chọn ngày làm OT <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium"
                />
              </div>

              {/* Worker Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Chọn nhân viên <span className="text-red-500">*</span>
                  <span className="text-gray-500 font-normal ml-2">
                    ({selectedWorkers.length} người đã chọn)
                  </span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto border-2 border-gray-200 rounded-lg p-4">
                  {WORKERS.map(worker => (
                    <div
                      key={worker.id}
                      onClick={() => toggleWorker(worker.id)}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border-2',
                        selectedWorkers.includes(worker.id)
                          ? 'bg-orange-50 border-orange-500'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <div
                        className={cn(
                          'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                          selectedWorkers.includes(worker.id)
                            ? 'bg-orange-600 border-orange-600'
                            : 'bg-white border-gray-300'
                        )}
                      >
                        {selectedWorkers.includes(worker.id) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{worker.name}</p>
                        <p className="text-xs text-gray-600">{worker.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hours Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Số giờ OT <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0.5"
                  max="4"
                  step="0.5"
                  value={otHours || ''}
                  onChange={e => setOTHours(parseFloat(e.target.value) || 0)}
                  placeholder="Ví dụ: 2"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tối đa 4 giờ/ngày
                </p>
              </div>

              {/* Reason Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Lý do <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Nhập lý do cần làm thêm giờ..."
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowRequestModal(false);
                  setSelectedWorkers([]);
                  setOTHours(0);
                  setReason('');
                }}
              >
                Hủy
              </Button>
              <Button
                onClick={handleSubmitRequest}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Check className="w-5 h-5 mr-2" />
                Gửi đề xuất ({selectedWorkers.length} người)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
