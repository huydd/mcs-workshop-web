'use client';

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  DeliveryPlan,
  WorkGroup,
  PartRequest,
  DeliveryProduct,
  WorkGroupTask,
  ProductPart,
  RequestedPart,
  WorkItemClaim,
  DeliveryProductOrigin,
} from '@/types';

const STORAGE_KEYS = {
  PLANS: 'delivery_plans',
  GROUPS: 'work_groups',
  REQUESTS: 'part_requests',
  CLAIMS: 'work_item_claims',
} as const;

interface PullSystemContextValue {
  // Loading state
  isLoading: boolean;

  // Delivery Plans
  plans: DeliveryPlan[];
  createPlan: (plan: Omit<DeliveryPlan, 'id' | 'createdAt'>) => DeliveryPlan;
  updatePlan: (id: string, updates: Partial<DeliveryPlan>) => void;
  deletePlan: (id: string) => void;

  // Work Groups
  groups: WorkGroup[];
  createGroup: (group: Omit<WorkGroup, 'id' | 'createdAt' | 'updatedAt' | 'progress'>) => WorkGroup;
  updateGroup: (id: string, updates: Partial<WorkGroup>) => void;
  deleteGroup: (id: string) => void;
  addTaskToGroup: (groupId: string, task: Omit<WorkGroupTask, 'id'>) => void;
  updateTaskInGroup: (groupId: string, taskId: string, updates: Partial<WorkGroupTask>) => void;
  removeTaskFromGroup: (groupId: string, taskId: string) => void;

  // Part Requests
  requests: PartRequest[];
  createRequest: (request: Omit<PartRequest, 'id' | 'createdAt' | 'updatedAt'>) => PartRequest;
  updateRequest: (id: string, updates: Partial<PartRequest>) => void;
  deleteRequest: (id: string) => void;

  // Utilities
  getGroupsByWorkshop: (workshopId: string) => WorkGroup[];
  getRequestsForWorkshop: (workshopId: string) => PartRequest[];
  getPlanById: (id: string) => DeliveryPlan | undefined;
  getGroupById: (id: string) => WorkGroup | undefined;

  // Claims
  claims: WorkItemClaim[];
  reserveWorkItem: (payload: ReserveWorkItemPayload) => WorkItemClaim | null;
  updateWorkItemClaim: (id: string, updates: Partial<WorkItemClaim>) => void;
  releaseWorkItemClaim: (id: string) => void;
}

interface ReserveWorkItemPayload {
  productId: string;
  productName: string;
  origin: DeliveryProductOrigin;
  workshopId: string;
  workshopName: string;
  groupId: string;
  groupName: string;
  quantity: number;
}

const PullSystemContext = createContext<PullSystemContextValue | undefined>(undefined);

const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveToStorage = <T,>(key: string, value: T): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to save ${key}:`, e);
  }
};

export const PullSystemProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [plans, setPlans] = useState<DeliveryPlan[]>([]);
  const [groups, setGroups] = useState<WorkGroup[]>([]);
  const [requests, setRequests] = useState<PartRequest[]>([]);
  const [claims, setClaims] = useState<WorkItemClaim[]>([]);

  // Load from localStorage
  useEffect(() => {
    const loadedPlans = loadFromStorage(STORAGE_KEYS.PLANS, []);
    const loadedGroups = loadFromStorage(STORAGE_KEYS.GROUPS, []);
    const loadedRequests = loadFromStorage(STORAGE_KEYS.REQUESTS, []);
    const loadedClaims = loadFromStorage(STORAGE_KEYS.CLAIMS, []);

    console.log('[PullSystem] Loading from localStorage:', {
      plans: loadedPlans.length,
      groups: loadedGroups.length,
      requests: loadedRequests.length,
      claims: loadedClaims.length,
    });

    setPlans(loadedPlans);
    setGroups(loadedGroups);
    setRequests(loadedRequests);
    setClaims(loadedClaims);
    setIsLoading(false);
  }, []);

  // Auto-save
  useEffect(() => {
    if (isLoading) return; // Don't save during initial load
    saveToStorage(STORAGE_KEYS.PLANS, plans);
  }, [plans, isLoading]);

  useEffect(() => {
    if (isLoading) return; // Don't save during initial load
    console.log('[PullSystem] Saving groups to localStorage:', groups);
    saveToStorage(STORAGE_KEYS.GROUPS, groups);
  }, [groups, isLoading]);

  useEffect(() => {
    if (isLoading) return; // Don't save during initial load
    saveToStorage(STORAGE_KEYS.REQUESTS, requests);
  }, [requests, isLoading]);

  useEffect(() => {
    if (isLoading) return; // Don't save during initial load
    console.log('[PullSystem] Saving claims to localStorage:', claims);
    saveToStorage(STORAGE_KEYS.CLAIMS, claims);
  }, [claims, isLoading]);

  // Delivery Plans
  const createPlan = useCallback((plan: Omit<DeliveryPlan, 'id' | 'createdAt'>) => {
    const newPlan: DeliveryPlan = {
      ...plan,
      id: `plan-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setPlans(prev => [...prev, newPlan]);
    return newPlan;
  }, []);

  const updatePlan = useCallback((id: string, updates: Partial<DeliveryPlan>) => {
    setPlans(prev =>
      prev.map(p => (p.id === id ? { ...p, ...updates } : p))
    );
  }, []);

  const deletePlan = useCallback((id: string) => {
    setPlans(prev => prev.filter(p => p.id !== id));
  }, []);

  // Work Groups
  const calcProgress = (tasks: WorkGroupTask[]): number => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.status === 'done').length;
    return Math.round((completed / tasks.length) * 100);
  };

  const createGroup = useCallback((group: Omit<WorkGroup, 'id' | 'createdAt' | 'updatedAt' | 'progress'>) => {
    const now = new Date().toISOString();
    const newGroup: WorkGroup = {
      ...group,
      id: `group-${Date.now()}`,
      progress: calcProgress(group.tasks),
      createdAt: now,
      updatedAt: now,
    };
    setGroups(prev => [...prev, newGroup]);
    return newGroup;
  }, []);

  const updateGroup = useCallback((id: string, updates: Partial<WorkGroup>) => {
    setGroups(prev =>
      prev.map(g => {
        if (g.id !== id) return g;
        const updated = { ...g, ...updates, updatedAt: new Date().toISOString() };
        if (updates.tasks) {
          updated.progress = calcProgress(updates.tasks);
        }
        return updated;
      })
    );
  }, []);

  const deleteGroup = useCallback((id: string) => {
    setGroups(prev => prev.filter(g => g.id !== id));
  }, []);

  const addTaskToGroup = useCallback((groupId: string, task: Omit<WorkGroupTask, 'id'>) => {
    setGroups(prev =>
      prev.map(g => {
        if (g.id !== groupId) return g;
        const newTask: WorkGroupTask = { ...task, id: `task-${Date.now()}` };
        const tasks = [...g.tasks, newTask];
        return {
          ...g,
          tasks,
          progress: calcProgress(tasks),
          updatedAt: new Date().toISOString(),
        };
      })
    );
  }, []);

  const updateTaskInGroup = useCallback((groupId: string, taskId: string, updates: Partial<WorkGroupTask>) => {
    setGroups(prev =>
      prev.map(g => {
        if (g.id !== groupId) return g;
        const tasks = g.tasks.map(t => (t.id === taskId ? { ...t, ...updates } : t));
        return {
          ...g,
          tasks,
          progress: calcProgress(tasks),
          updatedAt: new Date().toISOString(),
        };
      })
    );
  }, []);

  const removeTaskFromGroup = useCallback((groupId: string, taskId: string) => {
    setGroups(prev =>
      prev.map(g => {
        if (g.id !== groupId) return g;
        const tasks = g.tasks.filter(t => t.id !== taskId);
        return {
          ...g,
          tasks,
          progress: calcProgress(tasks),
          updatedAt: new Date().toISOString(),
        };
      })
    );
  }, []);

  const reserveWorkItem = useCallback(
    (payload: ReserveWorkItemPayload): WorkItemClaim | null => {
      const existing = claims.find(c => c.productId === payload.productId);
      if (existing) {
        if (existing.workshopId !== payload.workshopId) {
          return null;
        }

        if (
          existing.groupId !== payload.groupId ||
          existing.groupName !== payload.groupName
        ) {
          const updated: WorkItemClaim = {
            ...existing,
            groupId: payload.groupId,
            groupName: payload.groupName,
          };
          setClaims(prev =>
            prev.map(c => (c.id === existing.id ? updated : c)),
          );
          return updated;
        }

        return existing;
      }

      const claim: WorkItemClaim = {
        id: `claim-${Date.now()}`,
        productId: payload.productId,
        productName: payload.productName,
        origin: payload.origin,
        workshopId: payload.workshopId,
        workshopName: payload.workshopName,
        groupId: payload.groupId,
        groupName: payload.groupName,
        quantity: payload.quantity,
        reservedAt: new Date().toISOString(),
        status: 'pending',
      };
      setClaims(prev => [...prev, claim]);
      return claim;
    },
    [claims],
  );

  const updateWorkItemClaim = useCallback(
    (id: string, updates: Partial<WorkItemClaim>) => {
      setClaims(prev =>
        prev.map(claim =>
          claim.id === id ? { ...claim, ...updates } : claim,
        ),
      );
    },
    [],
  );

  const releaseWorkItemClaim = useCallback((id: string) => {
    setClaims(prev => prev.filter(claim => claim.id !== id));
  }, []);

  // Part Requests
  const createRequest = useCallback((request: Omit<PartRequest, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newRequest: PartRequest = {
      ...request,
      id: `req-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    setRequests(prev => [...prev, newRequest]);
    return newRequest;
  }, []);

  const updateRequest = useCallback((id: string, updates: Partial<PartRequest>) => {
    setRequests(prev =>
      prev.map(r =>
        r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
      )
    );
  }, []);

  const deleteRequest = useCallback((id: string) => {
    setRequests(prev => prev.filter(r => r.id !== id));
  }, []);

  // Utilities
  const getGroupsByWorkshop = useCallback(
    (workshopId: string) => groups.filter(g => g.workshopId === workshopId),
    [groups]
  );

  const getRequestsForWorkshop = useCallback(
    (workshopId: string) => requests.filter(r => r.status === 'pending' || r.acceptedBy === workshopId),
    [requests]
  );

  const getPlanById = useCallback(
    (id: string) => plans.find(p => p.id === id),
    [plans]
  );

  const getGroupById = useCallback(
    (id: string) => groups.find(g => g.id === id),
    [groups]
  );

  const value = useMemo(
    () => ({
      isLoading,
      plans,
      createPlan,
      updatePlan,
      deletePlan,
      groups,
      createGroup,
      updateGroup,
      deleteGroup,
      addTaskToGroup,
      updateTaskInGroup,
      removeTaskFromGroup,
      requests,
      createRequest,
      updateRequest,
      deleteRequest,
      getGroupsByWorkshop,
      getRequestsForWorkshop,
      getPlanById,
      getGroupById,
      claims,
      reserveWorkItem,
      updateWorkItemClaim,
      releaseWorkItemClaim,
    }),
    [
      isLoading,
      plans,
      createPlan,
      updatePlan,
      deletePlan,
      groups,
      createGroup,
      updateGroup,
      deleteGroup,
      addTaskToGroup,
      updateTaskInGroup,
      removeTaskFromGroup,
      requests,
      createRequest,
      updateRequest,
      deleteRequest,
      getGroupsByWorkshop,
      getRequestsForWorkshop,
      getPlanById,
      getGroupById,
      claims,
      reserveWorkItem,
      updateWorkItemClaim,
      releaseWorkItemClaim,
    ]
  );

  return (
    <PullSystemContext.Provider value={value}>
      {children}
    </PullSystemContext.Provider>
  );
};

export const usePullSystem = () => {
  const context = useContext(PullSystemContext);
  if (!context) {
    throw new Error('usePullSystem must be used within PullSystemProvider');
  }
  return context;
};
