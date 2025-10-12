'use client';

import { useState, useMemo, useEffect, DragEvent } from 'react';
import { Plus, Package, ArrowRight, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/auth-context';
import { usePullSystem } from '@/context/pull-system-context';
import {
  DeliveryProduct,
  DeliveryProductOrigin,
  PartRequest,
  WorkGroup,
  WorkGroupTask,
  SubTask,
  WorkItemClaim,
} from '@/types';
import { cn } from '@/lib/utils';

// BOM data structure from localStorage
interface BomTreeNode {
  index: number | null;
  ass_name: string | null;
  part_name: string | null;
  profile: string | null;
  material: string | null;
  thickness: number | number[] | null;
  width: number | null;
  length: number | null;
  qty_per_ass: number | null;
  qty_total: number | null;
  weight_per_part: number | null;
  weight_total: number | null;
  area_per_ass: number | null;
  area_total: number | null;
  welding_machine: number | null;
  hand_welding: number | null;
  note: string | null;
  children: BomTreeNode[];
}

interface BomData {
  data: BomTreeNode[];
  timestamp: string;
  fileName: string;
  totalGroups: number;
  totalChildren: number;
  published: boolean;
}

const PullBoardPage = () => {
  const { user } = useAuth();
  const {
    plans,
    groups,
    requests,
    createGroup,
    addTaskToGroup,
    updateTaskInGroup,
    createRequest,
    updateRequest,
    getGroupsByWorkshop,
    getRequestsForWorkshop,
    claims,
    reserveWorkItem,
    updateWorkItemClaim,
    releaseWorkItemClaim,
  } = usePullSystem();

  const [draggedItem, setDraggedItem] = useState<{ type: 'delivery' | 'request'; data: any } | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDueDate, setNewGroupDueDate] = useState('');
  const [bomProducts, setBomProducts] = useState<DeliveryProduct[]>([]);

  // Load BOM data from localStorage and convert to available products
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const bomDataStr = localStorage.getItem('bomListData');
      if (!bomDataStr) {
        setBomProducts([]);
        return;
      }

      const bomData: BomData = JSON.parse(bomDataStr);

      // Check if BOM is published
      if (!bomData.published || !bomData.data) {
        setBomProducts([]);
        return;
      }

      // Group BOM nodes by profile
      const profileGroups = new Map<string, BomTreeNode[]>();

      bomData.data.forEach(parent => {
        if (parent.profile) {
          const profile = parent.profile;
          if (!profileGroups.has(profile)) {
            profileGroups.set(profile, []);
          }
          profileGroups.get(profile)!.push(parent);
        }
      });

      // Convert profile groups to DeliveryProduct format
      const products: DeliveryProduct[] = [];
      let productIndex = 0;

      profileGroups.forEach((nodes, profile) => {
        productIndex++;

        // Calculate totals
        const totalQty = nodes.reduce((sum, n) => sum + (n.qty_total || 0), 0);
        const totalWeight = nodes.reduce((sum, n) => sum + (n.weight_total || 0), 0);
        const totalArea = nodes.reduce((sum, n) => sum + (n.area_total || 0), 0);

        // Get material from first node (assuming same material for same profile)
        const material = nodes[0].material || 'N/A';

        // Convert nodes to ProductPart format
        const parts = nodes.map((node, idx) => ({
          id: `part-${profile}-${idx}`,
          partName: node.part_name || node.ass_name || `Chi tiết ${idx + 1}`,
          profile: profile,
          material: node.material || material,
          qtyPerProduct: node.qty_per_ass || 1,
          totalQty: node.qty_total || 0,
          weight: node.weight_per_part || 0,
        }));

        // Create delivery product
        const product: DeliveryProduct = {
          id: `bom-product-${profile.replace(/\s+/g, '-').toLowerCase()}`,
          productName: `${profile} (${nodes.length} nhóm)`,
          quantity: totalQty,
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Default: 7 days from now
          bomRef: bomData.fileName,
          parts,
          origin: 'bom',
        };

        products.push(product);
      });

      // Sort by profile name
      products.sort((a, b) => a.productName.localeCompare(b.productName));

      setBomProducts(products);
    } catch (error) {
      console.error('Error loading BOM data:', error);
      setBomProducts([]);
    }
  }, []);

  const allProducts = useMemo(() => {
    const bomList = bomProducts.map(product => ({
      ...product,
      origin: product.origin ?? 'bom',
    }));

    const planProducts = plans.flatMap(plan =>
      plan.status === 'active'
        ? plan.products.map(prod => ({
            ...prod,
            origin: prod.origin ?? 'plan',
          }))
        : []
    );

    return [...bomList, ...planProducts];
  }, [bomProducts, plans]);

  const isWorkshopLead = user?.role === 'WORKSHOP_LEAD';
  const isManager = user?.role === 'MANAGEMENT';
  const workshopId = user?.workshopCode || 'W1';
  const workshopName = user?.workshopName || 'Xưởng';

  const myGroups = useMemo(
    () => (isWorkshopLead ? getGroupsByWorkshop(workshopId) : []),
    [isWorkshopLead, getGroupsByWorkshop, workshopId],
  );

  const availableRequests = useMemo(
    () => (isWorkshopLead ? getRequestsForWorkshop(workshopId) : []),
    [isWorkshopLead, getRequestsForWorkshop, workshopId],
  );

  const availableProducts = useMemo(() => {
    if (!isWorkshopLead) return [] as DeliveryProduct[];
    return allProducts.filter(product => {
      const claim = claims.find(c => c.productId === product.id);
      if (!claim) return true;
      if (claim.status === 'accepted') return true;
      return claim.workshopId === workshopId;
    });
  }, [allProducts, claims, isWorkshopLead, workshopId]);

  const availableBomProducts = useMemo(
    () => availableProducts.filter(product => (product.origin ?? 'plan') === 'bom'),
    [availableProducts],
  );

  const availablePlanProducts = useMemo(
    () => availableProducts.filter(product => (product.origin ?? 'plan') === 'plan'),
    [availableProducts],
  );

  useEffect(() => {
    if (!isWorkshopLead) return;
    if (typeof window === 'undefined') return;

    const workshopGroups = groups.filter(group => group.workshopId === workshopId);
    const acceptedTasks = workshopGroups.flatMap(group =>
      group.tasks
        .filter(task => task.claimStatus === 'accepted')
        .map(task => ({ group, task })),
    );

    const dayMs = 24 * 60 * 60 * 1000;

    const tasksForDashboard = acceptedTasks.map(({ group, task }) => {
      const checklistSource = task.subtasks && task.subtasks.length > 0
        ? task.subtasks
        : [
            {
              id: `${task.id}-planning`,
              title: 'Lập kế hoạch triển khai',
              completed: false,
            },
          ];

      const checklist = checklistSource.map((subtask, index) => ({
        id: `${task.id}-${subtask.id ?? index}`,
        title: subtask.title ?? `Công việc ${index + 1}`,
        description: undefined,
        completed: subtask.completed ?? false,
        completedAt: subtask.completed ? new Date().toISOString() : undefined,
        completedBy: subtask.completed ? 'Pull Board' : undefined,
      }));

      const completedChecklist = checklist.filter(item => item.completed).length;
      const progress = checklist.length > 0
        ? Math.round((completedChecklist / checklist.length) * 100)
        : 0;

      const estimatedDays = task.estimatedDays ?? 5;
      const startDate = task.actualStart ?? new Date().toISOString();
      const endDate = task.actualEnd
        ?? new Date(new Date(startDate).getTime() + estimatedDays * dayMs).toISOString();

      return {
        id: task.id,
        profile: task.taskName,
        material: task.material,
        subtasks: checklistSource.map((subtask, index) => ({
          index,
          part_name: subtask.title ?? `Công việc ${index + 1}`,
          ass_name: null,
          qty_total: null,
          weight_total: null,
          area_total: null,
          welding_machine: null,
          hand_welding: null,
          note: undefined,
        })),
        totalQty: task.quantity ?? 0,
        totalWeight: task.weight ?? 0,
        totalArea: 0,
        startDate,
        endDate: endDate ?? group.dueDate,
        assignedWorkers: task.assignedWorkers ?? [],
        assignedZone: undefined,
        workInstructions: `Nhận từ nhóm ${group.name}`,
        checklist,
        status: task.status ?? 'todo',
        progress,
        isDelayed: false,
        delayExplanation: undefined,
        estimatedDays,
        priority: 'medium',
      };
    });

    const payload = {
      workshopId,
      workshopName,
      groups: workshopGroups.map(group => {
        const totalGroupTasks = group.tasks.length;
        const completedGroupTasks = group.tasks.filter(task => task.status === 'done').length;
        const groupProgress = totalGroupTasks
          ? Math.round((completedGroupTasks / totalGroupTasks) * 100)
          : 0;

        return {
          id: group.id,
          name: group.name,
          dueDate: group.dueDate,
          status: group.status,
          progress: groupProgress,
          tasks: group.tasks.map(task => ({
            id: task.id,
            taskName: task.taskName,
            status: task.status,
            claimStatus: task.claimStatus,
            claimId: task.claimId,
            claimedBy: task.claimedBy,
            quantity: task.quantity,
            weight: task.weight,
          })),
        };
      }),
      tasks: tasksForDashboard,
      lastUpdated: new Date().toISOString(),
    };

    try {
      localStorage.setItem(`workshop_${workshopId}_tasks`, JSON.stringify(payload));
    } catch (error) {
      console.error('Failed to persist workshop dashboard data', error);
    }
  }, [groups, workshopId, workshopName, isWorkshopLead, claims]);

  useEffect(() => {
    const productIds = new Set(allProducts.map(product => product.id));
    claims.forEach(claim => {
      if (!productIds.has(claim.productId)) {
        releaseWorkItemClaim(claim.id);
      }
    });
  }, [allProducts, claims, releaseWorkItemClaim]);

  const claimByProductId = useMemo(() => {
    const map = new Map<string, WorkItemClaim>();
    claims.forEach(claim => {
      map.set(claim.productId, claim);
    });
    return map;
  }, [claims]);

  const renderProductCard = (prod: DeliveryProduct) => {
    const isBom = (prod.origin ?? 'plan') === 'bom';
    const claim = claimByProductId.get(prod.id);
    const isPendingMine = claim?.status === 'pending' && claim.workshopId === workshopId;
    const isAccepted = claim?.status === 'accepted';
    const acceptedBy =
      claim?.workshopId ? claim.workshopId.toUpperCase() : claim?.workshopName;
    const isOwnedByOther = claim ? claim.workshopId !== workshopId : false;
    const isDisabled = Boolean(isAccepted) || isOwnedByOther;

    const classes = cn(
      isBom
        ? 'p-3 border border-green-200 rounded-lg cursor-move transition-colors'
        : 'p-3 border rounded-lg cursor-move transition-colors',
      isPendingMine && 'border-amber-300 bg-amber-50',
      isDisabled
        ? 'cursor-not-allowed opacity-60 bg-gray-100 border-gray-200 hover:border-gray-200 hover:bg-gray-100'
        : isBom
        ? 'hover:border-green-400 hover:bg-green-50'
        : 'hover:border-primary hover:bg-primary/5',
    );

    const totalPartsQty = prod.parts.reduce((sum, part) => sum + part.totalQty, 0);

    return (
      <div
        key={prod.id}
        draggable={!isDisabled}
        onDragStart={
          !isDisabled ? () => handleDragStart('delivery', prod) : undefined
        }
        className={classes}
        aria-disabled={isDisabled}
      >
        <div className="flex items-start justify-between mb-1">
          <div
            className={cn(
              'font-medium text-sm',
              isBom ? 'text-green-900' : 'text-secondary',
            )}
          >
            {prod.productName}
          </div>
          <div className="flex items-center gap-2">
            <Badge
              className={cn(
                'text-xs',
                isBom ? 'bg-green-100 text-green-700' : undefined,
              )}
            >
              SL: {prod.quantity}
            </Badge>
            {isPendingMine && (
              <Badge className="text-xs bg-amber-100 text-amber-700">
                Chờ nhận
              </Badge>
            )}
            {isAccepted && acceptedBy && (
              <Badge className="text-xs bg-gray-200 text-secondary">
                Nhận bởi {acceptedBy}
              </Badge>
            )}
          </div>
        </div>
        <div className="text-xs text-secondary/60">
          {isBom
            ? `BOM: ${prod.bomRef}`
            : `Deadline: ${new Date(prod.deadline).toLocaleDateString('vi-VN')}`}
        </div>
        {prod.parts.length > 0 && (
          <div className="text-xs text-secondary/50 mt-1">
            {prod.parts.length} {isBom ? 'chi tiết' : 'parts'} · {totalPartsQty} tổng SL
          </div>
        )}
      </div>
    );
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="text-center" padding="lg">
          <h2 className="text-xl font-semibold text-secondary mb-2">
            Vui lòng đăng nhập
          </h2>
          <p className="text-secondary/70">
            Đăng nhập để quản lý bảng kéo việc.
          </p>
        </Card>
      </div>
    );
  }

  if (isManager) {
    return (
      <ManagementPullBoard
        claims={claims}
        products={allProducts}
      />
    );
  }

  if (!isWorkshopLead) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="text-center" padding="lg">
          <h2 className="text-xl font-semibold text-secondary mb-2">
            Không có quyền truy cập
          </h2>
          <p className="text-secondary/70">
            Chỉ kỹ sư trưởng xưởng mới có thể kéo việc
          </p>
        </Card>
      </div>
    );
  }

  const handleCreateGroup = () => {
    if (!newGroupName || !newGroupDueDate) return;

    createGroup({
      name: newGroupName,
      description: '',
      workshopId,
      workshopName,
      tasks: [],
      dueDate: newGroupDueDate,
      status: 'todo',
      createdBy: user.id,
    });

    setNewGroupName('');
    setNewGroupDueDate('');
    setShowCreateGroup(false);
  };

  const handleDragStart = (type: 'delivery' | 'request', data: any) => {
    setDraggedItem({ type, data });
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: DragEvent, groupId: string) => {
    e.preventDefault();
    if (!draggedItem) return;

    const { type, data } = draggedItem;

    if (type === 'delivery') {
      // Convert DeliveryProduct to WorkGroupTask
      const product = data as DeliveryProduct;
      const group = myGroups.find(g => g.id === groupId);
      if (!group) {
        setDraggedItem(null);
        return;
      }

      const existingClaim = claimByProductId.get(product.id);
      if (existingClaim) {
        if (existingClaim.workshopId !== workshopId) {
          window.alert('Sản phẩm này đã được xưởng khác kéo.');
          setDraggedItem(null);
          return;
        }

        if (existingClaim.groupId !== groupId) {
          window.alert('Sản phẩm đang chờ nhận trong một nhóm khác của xưởng bạn.');
          setDraggedItem(null);
          return;
        }
      }

      const alreadyInGroup = group.tasks.some(task => task.sourceId === product.id);
      if (alreadyInGroup) {
        setDraggedItem(null);
        return;
      }

      const claim = reserveWorkItem({
        productId: product.id,
        productName: product.productName,
        origin: product.origin ?? 'plan',
        workshopId,
        workshopName,
        groupId: group.id,
        groupName: group.name,
        quantity: product.quantity,
      });

      if (!claim) {
        window.alert('Không thể nhận sản phẩm do đã được xưởng khác giữ.');
        setDraggedItem(null);
        return;
      }

      const subtasks: SubTask[] = [
        { id: `st-1`, title: 'Chuẩn bị nguyên vật liệu', completed: false },
        { id: `st-2`, title: 'Kiểm tra thiết bị', completed: false },
        { id: `st-3`, title: 'Thực hiện gia công', completed: false },
        { id: `st-4`, title: 'Kiểm tra chất lượng', completed: false },
        { id: `st-5`, title: 'Hoàn thiện', completed: false },
      ];

      const task: Omit<WorkGroupTask, 'id'> = {
        sourceType: 'delivery',
        sourceId: product.id,
        taskName: product.productName,
        profile: product.parts[0]?.profile || 'N/A',
        material: product.parts[0]?.material || 'N/A',
        quantity: product.quantity,
        weight: product.parts.reduce((sum, p) => sum + p.weight * p.totalQty, 0),
        assignedWorkers: [],
        estimatedDays: Math.ceil((new Date(product.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        subtasks,
        status: 'todo',
        claimId: claim.id,
        claimStatus: claim.status,
        claimedBy: claim.workshopId,
      };

      addTaskToGroup(groupId, task);

      // Auto-create PartRequest for backtracking
      if (product.parts.length > 0) {
        createRequest({
          name: `Part rời cho ${product.productName}`,
          fromGroupId: groupId,
          fromWorkshopId: workshopId,
          fromWorkshopName: workshopName,
          parts: product.parts.map(p => ({
            id: p.id,
            partName: p.partName,
            profile: p.profile,
            material: p.material,
            quantity: p.totalQty,
            weight: p.weight,
            neededBy: product.deadline,
          })),
          status: 'pending',
        });
      }
    } else if (type === 'request') {
      // Convert PartRequest to WorkGroupTask
      const request = data as PartRequest;

      const subtasks: SubTask[] = request.parts.map((p, i) => ({
        id: `st-${i}`,
        title: `Gia công ${p.partName}`,
        completed: false,
      }));

      const task: Omit<WorkGroupTask, 'id'> = {
        sourceType: 'request',
        sourceId: request.id,
        taskName: request.name,
        profile: request.parts[0]?.profile || 'N/A',
        material: request.parts[0]?.material || 'N/A',
        quantity: request.parts.reduce((sum, p) => sum + p.quantity, 0),
        weight: request.parts.reduce((sum, p) => sum + p.weight * p.quantity, 0),
        assignedWorkers: [],
        estimatedDays: Math.ceil((new Date(request.parts[0]?.neededBy || Date.now()).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        subtasks,
        status: 'todo',
      };

      addTaskToGroup(groupId, task);

      // Mark request as accepted
      updateRequest(request.id, {
        status: 'accepted',
        acceptedBy: workshopId,
        acceptedAt: new Date().toISOString(),
      });
    }

    setDraggedItem(null);
  };

  const handleAcceptGroup = (group: WorkGroup) => {
    if (group.tasks.length === 0) return;
    const now = new Date().toISOString();

    group.tasks.forEach(task => {
      if (task.claimStatus === 'accepted') return;

      if (task.claimId) {
        updateWorkItemClaim(task.claimId, {
          status: 'accepted',
          acceptedAt: now,
        });
      }

      updateTaskInGroup(group.id, task.id, {
        claimStatus: 'accepted',
        claimedAt: now,
        claimedBy: workshopId,
      });
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary">Kéo việc - {workshopName}</h1>
        <p className="text-sm text-secondary/70 mt-1">
          Kéo sản phẩm hoặc yêu cầu part vào nhóm công việc của bạn
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Available Tasks */}
        <div className="space-y-4">
          <Card padding="md">
            <h2 className="font-semibold text-secondary mb-3">Danh sách việc khả dụng</h2>

            {/* BOM Products - Grouped by Profile */}
            {availableBomProducts.length > 0 && (
              <div className="space-y-2 mb-4">
                <h3 className="text-sm font-medium text-secondary/70 flex items-center gap-2">
                  <Package className="h-3 w-3" />
                  Từ BOM - Nhóm theo quy cách
                  <Badge className="text-xs bg-green-100 text-green-700">{availableBomProducts.length} profiles</Badge>
                </h3>
                {availableBomProducts.map(renderProductCard)}
              </div>
            )}

            {/* Delivery Plan Products */}
            {availablePlanProducts.length > 0 && (
              <div className="space-y-2 mb-4">
                <h3 className="text-sm font-medium text-secondary/70">Từ kế hoạch giao hàng</h3>
                {availablePlanProducts.map(renderProductCard)}
              </div>
            )}

            {/* No products message */}
            {availableBomProducts.length + availablePlanProducts.length === 0 && (
              <div className="text-center py-6 text-secondary/50">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">Chưa có sản phẩm khả dụng</p>
                <p className="text-xs mt-1">BOM cần được publish từ trang Technical</p>
              </div>
            )}

            {/* Part Requests */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-secondary/70">Yêu cầu part rời</h3>
              {availableRequests.length === 0 && (
                <p className="text-xs text-secondary/50">Chưa có yêu cầu nào</p>
              )}
              {availableRequests.map(req => (
                <div
                  key={req.id}
                  draggable
                  onDragStart={() => handleDragStart('request', req)}
                  className="p-3 border border-dashed rounded-lg cursor-move hover:border-orange-400 hover:bg-orange-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="font-medium text-sm">{req.name}</div>
                    <Badge className="text-xs bg-orange-100 text-orange-700">
                      {req.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-secondary/60">
                    Từ: {req.fromWorkshopName}
                  </div>
                  <div className="text-xs text-secondary/50 mt-1">
                    {req.parts.length} parts · {req.parts.reduce((s, p) => s + p.quantity, 0)} tổng SL
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* RIGHT: My Work Groups */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-secondary">Nhóm công việc của tôi</h2>
            <Button size="sm" onClick={() => setShowCreateGroup(true)}>
              <Plus className="h-3 w-3" />
              <span className="ml-1">Tạo nhóm</span>
            </Button>
          </div>

          {myGroups.length === 0 && (
            <Card padding="lg" className="text-center">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-secondary/30" />
              <p className="text-sm text-secondary/60">
                Chưa có nhóm nào. Tạo nhóm để bắt đầu kéo việc!
              </p>
            </Card>
          )}

          {myGroups.map(group => {
            const pendingClaimTasks = group.tasks.filter(
              task => task.claimId && task.claimStatus !== 'accepted',
            );
            const hasPendingClaim = pendingClaimTasks.length > 0;
            const completedTasks = group.tasks.filter(task => task.status === 'done').length;
            const totalTasks = group.tasks.length;
            const completionPercent = totalTasks
              ? Math.round((completedTasks / totalTasks) * 100)
              : 0;

            return (
              <Card
                key={group.id}
                padding="md"
                className="border-2 border-dashed"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, group.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-secondary">{group.name}</h3>
                    <p className="text-xs text-secondary/60 mt-1">
                      Due: {new Date(group.dueDate).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasPendingClaim && (
                      <Button size="sm" onClick={() => handleAcceptGroup(group)}>
                        Nhận việc
                      </Button>
                    )}
                    <Badge
                      className={cn(
                        group.status === 'completed' && 'bg-green-100 text-green-700',
                        group.status === 'in_progress' && 'bg-blue-100 text-blue-700',
                        group.status === 'todo' && 'bg-gray-100',
                      )}
                    >
                      {group.status}
                    </Badge>
                  </div>
                </div>

                {group.tasks.length === 0 ? (
                  <div className="py-6 border-2 border-dashed rounded-lg text-center text-xs text-secondary/50">
                    Kéo thả việc vào đây
                  </div>
                ) : (
                  <div className="space-y-2">
                    {group.tasks.map(task => {
                      const isPendingClaim = task.claimStatus === 'pending' && task.claimedBy === workshopId;
                      const isAcceptedClaim = task.claimStatus === 'accepted';
                      return (
                        <div key={task.id} className="p-2 bg-gray-50 rounded text-sm">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-medium">{task.taskName}</div>
                              <div className="text-xs text-secondary/60 mt-1">
                                SL: {task.quantity} · {task.estimatedDays} ngày
                              </div>
                            </div>
                            {task.claimStatus && (
                              <Badge
                                className={cn(
                                  'text-xs',
                                  isPendingClaim && 'bg-amber-100 text-amber-700',
                                  isAcceptedClaim && 'bg-emerald-100 text-emerald-700',
                                )}
                              >
                                {isAcceptedClaim ? 'Đã nhận' : 'Chờ nhận'}
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-secondary/50 mt-1">
                            {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length} subtasks
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-secondary/70">
                      Tiến độ ({completedTasks}/{totalTasks || 0} task)
                    </span>
                    <span className="font-medium text-secondary">{completionPercent}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div
                      className="bg-primary h-1.5 rounded-full transition-all"
                      style={{ width: `${completionPercent}%` }}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full" padding="lg">
            <h2 className="text-lg font-bold text-secondary mb-4">Tạo nhóm công việc mới</h2>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-secondary">Tên nhóm</label>
                <Input
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  placeholder="VD: Gá cửa sổ A - Tuần 42"
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-secondary">Ngày hoàn thành dự kiến</label>
                <Input
                  type="date"
                  value={newGroupDueDate}
                  onChange={e => setNewGroupDueDate(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="secondary" onClick={() => setShowCreateGroup(false)} className="flex-1">
                  Hủy
                </Button>
                <Button onClick={handleCreateGroup} className="flex-1" disabled={!newGroupName || !newGroupDueDate}>
                  Tạo nhóm
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PullBoardPage;

interface ManagementPullBoardProps {
  claims: WorkItemClaim[];
  products: DeliveryProduct[];
}

const ManagementPullBoard = ({ claims, products }: ManagementPullBoardProps) => {
  const totalClaims = claims.length;
  const acceptedCount = claims.filter(claim => claim.status === 'accepted').length;
  const pendingCount = totalClaims - acceptedCount;

  const unclaimedProducts = useMemo(
    () =>
      products.filter(
        product => !claims.some(claim => claim.productId === product.id),
      ),
    [products, claims],
  );

  const formatDateTime = (value?: string) => {
    if (!value) return '—';
    return new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(value));
  };

  const originLabel = (origin: DeliveryProductOrigin) =>
    origin === 'bom' ? 'Từ BOM' : 'Kế hoạch giao';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary">
          Giám sát bảng kéo việc
        </h1>
        <p className="text-sm text-secondary/70 mt-1">
          Theo dõi sản phẩm đã được xưởng kéo và các hạng mục còn chờ xử lý.
        </p>
      </div>

      <Card padding="lg" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-secondary/10 bg-secondary/5 px-4 py-3">
            <p className="text-xs text-secondary/60 uppercase tracking-wide">
              Tổng số việc đã kéo
            </p>
            <p className="text-2xl font-semibold text-secondary mt-1">
              {totalClaims}
            </p>
          </div>
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3">
            <p className="text-xs text-emerald-700 uppercase tracking-wide">
              Đã nhận chính thức
            </p>
            <p className="text-2xl font-semibold text-emerald-800 mt-1">
              {acceptedCount}
            </p>
          </div>
          <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3">
            <p className="text-xs text-amber-700 uppercase tracking-wide">
              Chờ xác nhận
            </p>
            <p className="text-2xl font-semibold text-amber-800 mt-1">
              {pendingCount}
            </p>
          </div>
        </div>
      </Card>

      <Card padding="lg" className="space-y-3">
        <h2 className="text-lg font-semibold text-secondary">
          Danh sách sản phẩm đã được xưởng kéo
        </h2>
        {claims.length === 0 ? (
          <p className="text-sm text-secondary/60">
            Chưa có sản phẩm nào được xưởng nhận.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-secondary/5 text-xs uppercase tracking-wide text-secondary/70">
                <tr>
                  <th className="px-3 py-2 text-left">Sản phẩm</th>
                  <th className="px-3 py-2 text-left">Nguồn</th>
                  <th className="px-3 py-2 text-left">Xưởng</th>
                  <th className="px-3 py-2 text-left">Nhóm</th>
                  <th className="px-3 py-2 text-right">Số lượng</th>
                  <th className="px-3 py-2 text-left">Trạng thái</th>
                  <th className="px-3 py-2 text-left">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {claims.map(claim => (
                  <tr key={claim.id}>
                    <td className="px-3 py-2 font-medium text-secondary">
                      {claim.productName}
                    </td>
                    <td className="px-3 py-2 text-secondary/70">
                      {originLabel(claim.origin)}
                    </td>
                    <td className="px-3 py-2 text-secondary/70">
                      {claim.workshopName}
                    </td>
                    <td className="px-3 py-2 text-secondary/70">
                      {claim.groupName}
                    </td>
                    <td className="px-3 py-2 text-right text-secondary">
                      {claim.quantity.toLocaleString('vi-VN')}
                    </td>
                    <td className="px-3 py-2">
                      <Badge
                        className={cn(
                          'text-xs',
                          claim.status === 'accepted'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700',
                        )}
                      >
                        {claim.status === 'accepted' ? 'Đã nhận' : 'Chờ nhận'}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-secondary/60">
                      <div>
                        Kéo: {formatDateTime(claim.reservedAt)}
                      </div>
                      {claim.acceptedAt && (
                        <div>Nhận: {formatDateTime(claim.acceptedAt)}</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card padding="lg" className="space-y-3">
        <h2 className="text-lg font-semibold text-secondary">
          Sản phẩm chưa có xưởng nhận
        </h2>
        {unclaimedProducts.length === 0 ? (
          <p className="text-sm text-secondary/60">
            Tất cả sản phẩm đã được kéo vào nhóm xưởng.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {unclaimedProducts.map(product => (
              <div
                key={product.id}
                className="rounded-lg border border-gray-200 bg-white px-4 py-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-secondary">
                      {product.productName}
                    </p>
                    <p className="text-xs text-secondary/60 mt-1">
                      {originLabel(product.origin ?? 'plan')}
                    </p>
                  </div>
                  <Badge className="text-xs bg-gray-100 text-secondary">
                    SL: {product.quantity}
                  </Badge>
                </div>
                <div className="text-xs text-secondary/60 mt-2 flex items-center gap-2">
                  <ArrowRight className="h-3 w-3" />
                  Deadline: {new Date(product.deadline).toLocaleDateString('vi-VN')}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
