'use client';

import React, { useState } from 'react';
import { X, CheckCircle2, Users, Calendar, FileText } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface FinalAssignment {
  workerId: string;
  workerName: string;
  subtaskIndex: number;
  subtaskName: string;
  quantity: number;
  hoursPerDay: number;
  startDate: string;
  endDate: string;
  isDone?: boolean;
  doneAt?: string;
  doneBy?: string;
  isApproved?: boolean;
  isRejected?: boolean;
  reviewComment?: string;
  reviewImages?: string[];
  reviewedAt?: string;
  reviewedBy?: string;
}

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: FinalAssignment;
  action: 'approve' | 'reject';
  onSubmit: (comment: string, images: string[]) => void;
}

export const ReviewModal = ({
  isOpen,
  onClose,
  assignment,
  action,
  onSubmit,
}: ReviewModalProps) => {
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (action === 'reject' && !comment.trim()) {
      alert('Vui lòng nhập lý do khi yêu cầu sửa lại');
      return;
    }
    onSubmit(comment, images);
    setComment('');
    setImages([]);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        alert('Ảnh không được vượt quá 10MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
    // Reset input
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const startDate = new Date(assignment.startDate);
  const endDate = new Date(assignment.endDate);

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 z-[60]" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-[60] p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">
                {action === 'approve'
                  ? 'Xác nhận hoàn thành'
                  : 'Yêu cầu sửa lại'}
              </h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto px-6 py-4 space-y-4">
            {/* Assignment Info */}
            <Card
              padding="md"
              className={cn(
                'border-2',
                action === 'approve'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200',
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0',
                    action === 'approve' ? 'bg-green-100' : 'bg-red-100',
                  )}
                >
                  {action === 'approve' ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  ) : (
                    <X className="w-6 h-6 text-red-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">Công việc</p>
                  <p className="font-bold text-gray-900 text-lg mb-3">
                    {assignment.subtaskName}
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <div>
                        <span className="text-gray-600">Người làm:</span>
                        <br />
                        <strong className="text-gray-900">
                          {assignment.workerName}
                        </strong>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-gray-500" />
                      <div>
                        <span className="text-gray-600">Số lượng:</span>
                        <br />
                        <strong className="text-gray-900">
                          {assignment.quantity}
                        </strong>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <div>
                        <span className="text-gray-600">Thời gian:</span>
                        <br />
                        <strong className="text-gray-900 text-xs">
                          {startDate.toLocaleDateString('vi-VN')} →{' '}
                          {endDate.toLocaleDateString('vi-VN')}
                        </strong>
                      </div>
                    </div>
                    {assignment.isDone && assignment.doneAt && (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <div>
                          <span className="text-gray-600">Hoàn thành:</span>
                          <br />
                          <strong className="text-green-700 text-xs">
                            {new Date(assignment.doneAt).toLocaleString(
                              'vi-VN',
                            )}
                          </strong>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Comment */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nhận xét / Ghi chú
                {action === 'reject' && (
                  <span className="text-red-600 ml-1">*</span>
                )}
              </label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder={
                  action === 'approve'
                    ? 'Thêm nhận xét về công việc (tùy chọn)...'
                    : 'Ghi rõ những gì cần sửa lại...'
                }
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-none"
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Ảnh minh chứng
                <span className="text-gray-500 font-normal">(tùy chọn)</span>
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary/50 transition-colors bg-gray-50">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="review-image-upload"
                />
                <label
                  htmlFor="review-image-upload"
                  className="cursor-pointer inline-flex flex-col items-center gap-2"
                >
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <FileText className="w-8 h-8 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    Nhấn để chọn ảnh
                  </span>
                  <span className="text-xs text-gray-500">
                    PNG, JPG, GIF • Tối đa 10MB mỗi ảnh
                  </span>
                </label>
              </div>

              {/* Image Preview Grid */}
              {images.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-gray-600 mb-2 font-medium">
                    Đã chọn {images.length} ảnh
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={img}
                          alt={`Evidence ${idx + 1}`}
                          className="w-full h-24 object-cover rounded-lg border-2 border-gray-200 group-hover:border-primary transition-colors"
                        />
                        <button
                          onClick={() => removeImage(idx)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
            <Button variant="secondary" onClick={onClose}>
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={action === 'reject' && !comment.trim()}
              className={
                action === 'approve'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }
            >
              {action === 'approve' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Xác nhận hoàn thành
                </>
              ) : (
                <>
                  <X className="w-4 h-4 mr-1" />
                  Gửi yêu cầu sửa
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
