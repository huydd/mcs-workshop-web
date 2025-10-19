'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  X,
  Clock,
  User,
  Trash2,
  Edit2,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/auth-context';

interface Comment {
  id: string;
  text: string;
  author: string;
  authorId?: string;
  timestamp: string;
  taskId: string;
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
  onSubmit,
}: CommentModalProps) => {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  // Load comments from localStorage
  useEffect(() => {
    const storedComments = localStorage.getItem('task_comments');
    if (storedComments) {
      try {
        const allComments: Comment[] = JSON.parse(storedComments);
        const taskComments = allComments.filter(c => c.taskId === taskId);
        setComments(taskComments);
      } catch (error) {
        console.error('Error loading comments:', error);
      }
    }
  }, [taskId]);

  // Save comments to localStorage
  const saveComments = (updatedComments: Comment[]) => {
    const storedComments = localStorage.getItem('task_comments');
    let allComments: Comment[] = [];

    if (storedComments) {
      try {
        allComments = JSON.parse(storedComments);
      } catch (error) {
        console.error('Error parsing comments:', error);
      }
    }

    // Remove old comments for this task
    allComments = allComments.filter(c => c.taskId !== taskId);

    // Add updated comments
    allComments = [...allComments, ...updatedComments];

    localStorage.setItem('task_comments', JSON.stringify(allComments));
    setComments(updatedComments);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      text: newComment,
      author: user?.name || 'Unknown User',
      authorId: user?.id,
      timestamp: new Date().toISOString(),
      taskId,
    };

    const updatedComments = [...comments, comment];
    saveComments(updatedComments);
    onSubmit(newComment);
    setNewComment('');
  };

  const handleDelete = (commentId: string) => {
    if (confirm('Bạn có chắc muốn xóa bình luận này?')) {
      const updatedComments = comments.filter(c => c.id !== commentId);
      saveComments(updatedComments);
    }
  };

  const handleEditStart = (comment: Comment) => {
    setEditingId(comment.id);
    setEditText(comment.text);
  };

  const handleEditSave = () => {
    if (!editText.trim()) return;

    const updatedComments = comments.map(c =>
      c.id === editingId ? { ...c, text: editText } : c,
    );
    saveComments(updatedComments);
    setEditingId(null);
    setEditText('');
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditText('');
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60),
    );

    if (diffMinutes < 1) return 'Vừa xong';
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;
    if (diffMinutes < 1440)
      return `${Math.floor(diffMinutes / 60)} giờ trước`;
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col" padding="none">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Ghi chú & Thảo luận
                </h2>
                <p className="text-sm text-gray-600 truncate max-w-md">
                  {taskTitle}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto p-5 bg-gray-50">
            <div className="space-y-3">
              {comments.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-lg font-medium mb-1">Chưa có ghi chú nào</p>
                  <p className="text-sm">
                    Hãy là người đầu tiên ghi chú về công việc này
                  </p>
                </div>
              ) : (
                comments.map(comment => {
                  const isOwner = comment.authorId === user?.id;
                  const isEditing = editingId === comment.id;

                  return (
                    <div
                      key={comment.id}
                      className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300"
                    >
                      <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                        <User className="h-5 w-5 text-white" />
                      </div>

                      <div className="flex-1">
                        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-gray-900">
                                {comment.author}
                              </span>
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Clock className="h-3 w-3" />
                                {formatTime(comment.timestamp)}
                              </div>
                            </div>

                            {isOwner && !isEditing && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleEditStart(comment)}
                                  className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                                  title="Sửa"
                                >
                                  <Edit2 className="h-3.5 w-3.5 text-gray-600" />
                                </button>
                                <button
                                  onClick={() => handleDelete(comment.id)}
                                  className="p-1.5 hover:bg-red-50 rounded transition-colors"
                                  title="Xóa"
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-red-600" />
                                </button>
                              </div>
                            )}
                          </div>

                          {isEditing ? (
                            <div className="space-y-2">
                              <textarea
                                value={editText}
                                onChange={e => setEditText(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                rows={3}
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={handleEditSave}
                                  disabled={!editText.trim()}
                                >
                                  Lưu
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={handleEditCancel}
                                >
                                  Hủy
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                              {comment.text}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Comment Input */}
          <div className="border-t p-5 bg-white">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 text-white" />
              </div>

              <div className="flex-1 flex gap-2">
                <textarea
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Viết ghi chú về tiến độ, chất lượng, vấn đề cần giải quyết..."
                  className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                  rows={2}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      handleSubmit(e);
                    }
                  }}
                />
                <Button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="h-full px-4"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Gửi
                </Button>
              </div>
            </form>

            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
              <span>💡</span>
              <span>Nhấn <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-300">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-300">Enter</kbd> để gửi nhanh</span>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
};
