'use client';

import { useMemo } from 'react';
import { Activity, TrendingUp, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/auth-context';
import { usePullSystem } from '@/context/pull-system-context';
import { cn } from '@/lib/utils';

const WORKSHOPS = [
  { id: 'W1', name: 'Cắt', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { id: 'W2', name: 'Khoan', color: 'bg-green-100 text-green-700 border-green-300' },
  { id: 'W3', name: 'Hàn', color: 'bg-purple-100 text-purple-700 border-purple-300' },
  { id: 'W4', name: 'Gá', color: 'bg-orange-100 text-orange-700 border-orange-300' },
  { id: 'W5', name: 'Sơn', color: 'bg-pink-100 text-pink-700 border-pink-300' },
];

const OverviewPage = () => {
  const { user } = useAuth();
  const { plans, groups, requests } = usePullSystem();

  const stats = useMemo(() => {
    const activePlans = plans.filter(p => p.status === 'active');
    const totalProducts = activePlans.reduce((sum, p) => sum + p.products.length, 0);
    const totalGroups = groups.length;
    const completedGroups = groups.filter(g => g.status === 'completed').length;
    const inProgressGroups = groups.filter(g => g.status === 'in_progress').length;
    const pendingRequests = requests.filter(r => r.status === 'pending').length;

    return {
      activePlans: activePlans.length,
      totalProducts,
      totalGroups,
      completedGroups,
      inProgressGroups,
      pendingRequests,
      completionRate: totalGroups > 0 ? Math.round((completedGroups / totalGroups) * 100) : 0,
    };
  }, [plans, groups, requests]);

  // Group data by workshop
  const workshopData = useMemo(() => {
    return WORKSHOPS.map(workshop => {
      const workshopGroups = groups.filter(g => g.workshopId === workshop.id);
      const totalTasks = workshopGroups.reduce((sum, g) => sum + g.tasks.length, 0);
      const completedTasks = workshopGroups.reduce(
        (sum, g) => sum + g.tasks.filter(t => t.status === 'done').length,
        0
      );
      const avgProgress =
        workshopGroups.length > 0
          ? Math.round(workshopGroups.reduce((sum, g) => sum + g.progress, 0) / workshopGroups.length)
          : 0;

      const delayedGroups = workshopGroups.filter(g => {
        const dueDate = new Date(g.dueDate);
        const today = new Date();
        return dueDate < today && g.status !== 'completed';
      });

      return {
        ...workshop,
        groupCount: workshopGroups.length,
        totalTasks,
        completedTasks,
        avgProgress,
        delayedCount: delayedGroups.length,
        groups: workshopGroups,
      };
    });
  }, [groups]);

  // Product tracking by plan
  const productTracking = useMemo(() => {
    const activePlans = plans.filter(p => p.status === 'active');

    return activePlans.flatMap(plan =>
      plan.products.map(product => {
        // Find all groups that have tasks from this product
        const relatedGroups = groups.filter(g =>
          g.tasks.some(t => t.sourceType === 'delivery' && t.sourceId === product.id)
        );

        // Calculate progress per workshop
        const workshopProgress = WORKSHOPS.map(workshop => {
          const workshopGroup = relatedGroups.find(g => g.workshopId === workshop.id);
          if (!workshopGroup) return { workshopId: workshop.id, progress: 0, status: 'pending' };

          const productTasks = workshopGroup.tasks.filter(
            t => t.sourceType === 'delivery' && t.sourceId === product.id
          );

          if (productTasks.length === 0) return { workshopId: workshop.id, progress: 0, status: 'pending' };

          const completed = productTasks.filter(t => t.status === 'done').length;
          const progress = Math.round((completed / productTasks.length) * 100);

          return {
            workshopId: workshop.id,
            progress,
            status: progress === 100 ? 'done' : progress > 0 ? 'in_progress' : 'pending',
          };
        });

        const overallProgress = Math.round(
          workshopProgress.reduce((sum, wp) => sum + wp.progress, 0) / WORKSHOPS.length
        );

        const isDelayed = new Date(product.deadline) < new Date() && overallProgress < 100;

        return {
          planName: plan.name,
          product,
          workshopProgress,
          overallProgress,
          isDelayed,
        };
      })
    );
  }, [plans, groups]);

  if (!user || user.role !== 'PRODUCTION_PLANNER') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="text-center" padding="lg">
          <h2 className="text-xl font-semibold text-secondary mb-2">Không có quyền truy cập</h2>
          <p className="text-secondary/70">Chỉ điều phối sản xuất mới có thể xem board tổng quan</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary">Board tổng quan Pull System</h1>
        <p className="text-sm text-secondary/70 mt-1">
          Theo dõi tiến độ các xưởng theo thời gian thực
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-secondary">{stats.totalProducts}</div>
              <div className="text-xs text-secondary/60">Sản phẩm đang làm</div>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-secondary">{stats.completionRate}%</div>
              <div className="text-xs text-secondary/60">Tỷ lệ hoàn thành</div>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-secondary">{stats.inProgressGroups}</div>
              <div className="text-xs text-secondary/60">Nhóm đang làm</div>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-secondary">{stats.completedGroups}</div>
              <div className="text-xs text-secondary/60">Nhóm hoàn thành</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Workshop Overview */}
      <Card padding="lg">
        <h2 className="text-lg font-semibold text-secondary mb-4">Tình trạng các xưởng</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {workshopData.map(ws => (
            <div key={ws.id} className={cn('p-4 rounded-lg border-2', ws.color)}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold">{ws.name}</h3>
                {ws.delayedCount > 0 && (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-secondary/70">Nhóm việc:</span>
                  <span className="font-medium">{ws.groupCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary/70">Tasks:</span>
                  <span className="font-medium">
                    {ws.completedTasks}/{ws.totalTasks}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary/70">Tiến độ TB:</span>
                  <span className="font-medium">{ws.avgProgress}%</span>
                </div>
                {ws.delayedCount > 0 && (
                  <Badge className="w-full justify-center bg-red-100 text-red-700 mt-2">
                    {ws.delayedCount} nhóm trễ
                  </Badge>
                )}
              </div>

              <div className="mt-3">
                <div className="w-full bg-white/50 rounded-full h-2">
                  <div
                    className="bg-current h-2 rounded-full transition-all"
                    style={{ width: `${ws.avgProgress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Product Tracking */}
      <Card padding="lg">
        <h2 className="text-lg font-semibold text-secondary mb-4">Theo dõi sản phẩm</h2>
        <div className="space-y-4">
          {productTracking.length === 0 && (
            <p className="text-center text-secondary/60 py-8">Chưa có sản phẩm nào đang được làm</p>
          )}

          {productTracking.map((item, idx) => (
            <div key={idx} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-secondary">{item.product.productName}</h3>
                  <p className="text-xs text-secondary/60 mt-1">
                    {item.planName} · {item.product.quantity} cái · Deadline:{' '}
                    {new Date(item.product.deadline).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-secondary">{item.overallProgress}%</span>
                  {item.isDelayed && <AlertTriangle className="h-5 w-5 text-red-600" />}
                </div>
              </div>

              {/* Progress bar per workshop */}
              <div className="grid grid-cols-5 gap-2">
                {item.workshopProgress.map((wp, i) => {
                  const workshop = WORKSHOPS.find(w => w.id === wp.workshopId);
                  return (
                    <div key={wp.workshopId} className="text-center">
                      <div className="text-xs font-medium text-secondary/70 mb-1">
                        {workshop?.name}
                      </div>
                      <div className="relative h-16 bg-gray-100 rounded overflow-hidden">
                        <div
                          className={cn(
                            'absolute bottom-0 w-full transition-all',
                            wp.status === 'done' && 'bg-green-500',
                            wp.status === 'in_progress' && 'bg-blue-500',
                            wp.status === 'pending' && 'bg-gray-300'
                          )}
                          style={{ height: `${wp.progress}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-secondary">
                          {wp.progress}%
                        </div>
                      </div>
                      <div className="text-xs text-secondary/60 mt-1">
                        {wp.status === 'done' && '✓ Done'}
                        {wp.status === 'in_progress' && '🔄 Đang làm'}
                        {wp.status === 'pending' && '⏳ Chờ'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default OverviewPage;
