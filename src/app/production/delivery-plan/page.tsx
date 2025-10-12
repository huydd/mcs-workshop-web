'use client';

import { useState, useMemo } from 'react';
import { Plus, Calendar, Package, Trash2, Edit2, Eye } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/auth-context';
import { usePullSystem } from '@/context/pull-system-context';
import { DeliveryProduct, ProductPart } from '@/types';
import { cn } from '@/lib/utils';

const DeliveryPlanPage = () => {
  const { user } = useAuth();
  const { plans, createPlan, updatePlan, deletePlan } = usePullSystem();
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<string | null>(null);

  // Form state
  const [planName, setPlanName] = useState('');
  const [products, setProducts] = useState<DeliveryProduct[]>([]);

  const activePlans = useMemo(
    () => plans.filter(p => p.status === 'active' || p.status === 'draft'),
    [plans]
  );

  const handleCreate = () => {
    if (!user || !planName || products.length === 0) return;

    createPlan({
      name: planName,
      products,
      createdBy: user.id,
      status: 'active',
    });

    setPlanName('');
    setProducts([]);
    setShowModal(false);
  };

  const handleAddProduct = () => {
    const newProduct: DeliveryProduct = {
      id: `prod-${Date.now()}`,
      productName: '',
      quantity: 1,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      bomRef: '',
      parts: [],
      origin: 'plan',
    };
    setProducts([...products, newProduct]);
  };

  const updateProduct = (index: number, updates: Partial<DeliveryProduct>) => {
    setProducts(prev =>
      prev.map((p, i) => (i === index ? { ...p, ...updates } : p))
    );
  };

  const removeProduct = (index: number) => {
    setProducts(prev => prev.filter((_, i) => i !== index));
  };

  // Mock BOM data - in production, fetch from BOM context
  const mockBOMParts: ProductPart[] = [
    {
      id: 'part-1',
      partName: 'Khung nhôm',
      profile: 'H250X200X8X8',
      material: 'Q355',
      qtyPerProduct: 2,
      totalQty: 0,
      weight: 45.5,
    },
    {
      id: 'part-2',
      partName: 'Kính cường lực',
      profile: '1200x800x8',
      material: 'Glass',
      qtyPerProduct: 1,
      totalQty: 0,
      weight: 12.3,
    },
  ];

  const loadBOMParts = (productIndex: number, quantity: number) => {
    const parts = mockBOMParts.map(p => ({
      ...p,
      totalQty: p.qtyPerProduct * quantity,
    }));
    updateProduct(productIndex, { parts });
  };

  if (!user || user.role !== 'PRODUCTION_PLANNER') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="text-center" padding="lg">
          <h2 className="text-xl font-semibold text-secondary mb-2">
            Không có quyền truy cập
          </h2>
          <p className="text-secondary/70">
            Chỉ điều phối sản xuất mới có thể tạo kế hoạch giao hàng
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary">Kế hoạch giao hàng</h1>
          <p className="text-sm text-secondary/70 mt-1">
            Tạo kế hoạch để xưởng chủ động kéo việc
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4" />
          <span className="ml-2">Tạo kế hoạch mới</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {activePlans.map(plan => (
          <Card key={plan.id} className="hover:shadow-md transition-shadow" padding="md">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-secondary">{plan.name}</h3>
                <p className="text-xs text-secondary/60 mt-1">
                  {plan.products.length} sản phẩm
                </p>
              </div>
              <Badge className={plan.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100'}>
                {plan.status}
              </Badge>
            </div>

            <div className="space-y-2 mb-3">
              {plan.products.slice(0, 2).map(prod => (
                <div key={prod.id} className="text-sm border-l-2 border-primary pl-2">
                  <div className="font-medium">{prod.productName || 'Chưa đặt tên'}</div>
                  <div className="text-xs text-secondary/60">
                    SL: {prod.quantity} · Deadline: {new Date(prod.deadline).toLocaleDateString('vi-VN')}
                  </div>
                </div>
              ))}
              {plan.products.length > 2 && (
                <div className="text-xs text-secondary/50">
                  +{plan.products.length - 2} sản phẩm khác
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="flex-1">
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1"
                onClick={() => deletePlan(plan.id)}
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          </Card>
        ))}

        {activePlans.length === 0 && (
          <div className="col-span-3 text-center py-12 text-secondary/60">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Chưa có kế hoạch nào. Tạo kế hoạch đầu tiên!</p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto" padding="lg">
            <h2 className="text-xl font-bold text-secondary mb-4">Tạo kế hoạch giao hàng</h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-secondary">Tên kế hoạch</label>
                <Input
                  value={planName}
                  onChange={e => setPlanName(e.target.value)}
                  placeholder="VD: Kế hoạch tuần 42"
                  className="mt-1"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-secondary">Danh sách sản phẩm</label>
                  <Button size="sm" variant="secondary" onClick={handleAddProduct}>
                    <Plus className="h-3 w-3" />
                    <span className="ml-1">Thêm sản phẩm</span>
                  </Button>
                </div>

                <div className="space-y-3">
                  {products.map((prod, idx) => (
                    <div key={prod.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Tên sản phẩm"
                          value={prod.productName}
                          onChange={e => updateProduct(idx, { productName: e.target.value })}
                          className="flex-1"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeProduct(idx)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-secondary/70">Số lượng</label>
                          <Input
                            type="number"
                            min="1"
                            value={prod.quantity}
                            onChange={e => {
                              const qty = parseInt(e.target.value) || 1;
                              updateProduct(idx, { quantity: qty });
                              if (prod.parts.length > 0) loadBOMParts(idx, qty);
                            }}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-secondary/70">Deadline</label>
                          <Input
                            type="date"
                            value={prod.deadline}
                            onChange={e => updateProduct(idx, { deadline: e.target.value })}
                          />
                        </div>
                      </div>

                      {prod.parts.length === 0 && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="w-full"
                          onClick={() => loadBOMParts(idx, prod.quantity)}
                        >
                          Load BOM parts
                        </Button>
                      )}

                      {prod.parts.length > 0 && (
                        <div className="bg-gray-50 rounded p-2 text-xs space-y-1">
                          <div className="font-medium text-secondary/70">Parts:</div>
                          {prod.parts.map(p => (
                            <div key={p.id} className="flex justify-between">
                              <span>{p.partName}</span>
                              <span className="text-secondary/60">{p.totalQty} cái</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button variant="secondary" onClick={() => setShowModal(false)} className="flex-1">
                  Hủy
                </Button>
                <Button onClick={handleCreate} className="flex-1" disabled={!planName || products.length === 0}>
                  Tạo kế hoạch
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DeliveryPlanPage;
