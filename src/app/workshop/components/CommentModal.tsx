'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  X,
  Clock,
  User
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface Comment {
  id: string;
  text: string;
  author: string;
  timestamp: string;
}

interface CommentModalProps {
  taskId: string;
  taskTitle: string;
  onClose: () => void;
  onSubmit: (comment: string) => void;
}

export const CommentModal = ({
  taskId,
  taskTitle,
  onClose,
  onSubmit
}: CommentModalProps) => {
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([
    {
      id: '1',
      text: 'Nhiệm vụ đang tiến hành đúng kế hoạch. Thiết bị hoạt động ổn định.',
      author: 'Nguyễn Văn An',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '2',
      text: 'Cần kiểm tra lại chất lượng hàn ở phần đầu. Có một số điểm chưa đạt.',
      author: 'Hoàng Thị Phương',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString()
    }
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      text: newComment,
      author: 'Bạn',
      timestamp: new Date().toISOString()
    };

    setComments(prev => [...prev, comment]);
    onSubmit(newComment);
    setNewComment('');
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffMinutes < 1) return 'Vừa xong';
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} giờ trước`;
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden" padding="sm">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Bình luận công việc
                </h2>
                <p className="text-sm text-gray-600 truncate max-w-md">
                  {taskTitle}
                </p>
              </div>
            </div>

            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto max-h-[50vh] p-6">
            <div className="space-y-4">
              {comments.map(comment => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>

                  <div className="flex-1">
                    <div className="bg-gray-100 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-gray-900">
                          {comment.author}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          {formatTime(comment.timestamp)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700">{comment.text}</p>
                    </div>
                  </div>
                </div>
              ))}

              {comments.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Chưa có bình luận nào</p>
                  <p className="text-sm">Hãy là người đầu tiên bình luận về nhiệm vụ này</p>
                </div>
              )}
            </div>
          </div>

          {/* Comment Input */}
          <div className="border-t p-6 bg-white">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4 text-blue-600" />
              </div>

              <div className="flex-1 flex gap-2">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Viết bình luận về tiến độ, chất lượng, vấn đề..."
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={!newComment.trim()}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  Gửi
                </Button>
              </div>
            </form>

            <div className="mt-3 text-xs text-gray-500">
              💡 Mẹo: Ghi chú về tiến độ, chất lượng, vấn đề gặp phải hoặc cần hỗ trợ
            </div>
          </div>
        </Card>
      </div>
    </>
  );
};