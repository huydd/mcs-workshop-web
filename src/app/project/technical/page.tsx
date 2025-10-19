'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  UploadCloud,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Copy,
  Download,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Eye,
  Search,
  Filter,
  X,
  Save,
  Edit3,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/auth-context';
import { useWorkflow } from '@/context/workflow-context';
import { UserRole } from '@/types';
import { cn } from '@/lib/utils';

interface BomTreeNode {
  index: number | null;
  project_id: string | null;
  assembly_id: string | null;
  ass_name: string | null;
  part_name: string | null;
  profile: string | null;
  material: string | null;
  thickness: number | number[] | string | null;
  width: number | string | null;  // Can be number (90) or string like "(Kg/m)"
  length: number | null;
  qty_per_ass: number | null;
  qty_total: number | null;
  weight_per_part: number | null;
  weight_combination: number | null;
  weight_per_ass: number | null;
  weight_total: number | null;
  area_per_ass: number | null;
  area_total: number | null;
  welding_machine: number | null;
  hand_welding: number | null;
  note: string | null;
  children: BomTreeNode[];
}


const CSV_HEADERS = [
  'component_code',
  'name',
  'stage',
  'quantity',
  'total_weight',
  'index',
  'ass_name',
  'part_name',
  'profile',
  'material',
  'thickness',
  'width',
  'length',
  'qty_per_ass',
  'qty_total',
  'weight_per_part',
  'weight_total',
  'area_per_ass',
  'area_total',
  'welding_machine',
  'hand_welding',
  'note',
] as const;

const RAW_HEADER_KEYS = [
  'index',
  'project_id',
  'assembly_id',
  'ass_name',
  'part_name',
  'profile',
  'material',
  'thickness',
  'width',
  'length',
  'qty_per_ass',
  'qty_total',
  'weight_per_part',
  'weight_combination',
  'weight_per_ass',
  'weight_total',
  'area_per_ass',
  'area_total',
  'welding_machine',
  'hand_welding',
  'note',
] as const;

type CsvHeaderKey = (typeof CSV_HEADERS)[number];
type RawHeaderKey = (typeof RAW_HEADER_KEYS)[number];
type HeaderLookup = (row: any[], key: RawHeaderKey) => any;

const fallbackColumnIndex: Record<RawHeaderKey, number> = {
  index: 0,                    // NO
  project_id: 1,               // Dự án_ID (Project_ID)
  assembly_id: 2,              // Cấu kiện (Assembly_ID)
  ass_name: 3,                 // Tên ck (Ass name)
  part_name: 4,                // Tên chi tiết (Part name)
  profile: 5,                  // Tiết diện (Profile)
  material: 6,                 // Vật liệu (Material)
  thickness: 7,                // Dày (Thick) (mm)
  width: 8,                    // Rộng (Width) (mm)
  length: 9,                   // Dài (Length) (mm)
  qty_per_ass: 10,             // SL/1CK (Qty/Ass)
  qty_total: 11,               // SL tổng (QtyTotal)
  weight_per_part: 12,         // KL CT (Weight 1 Part) (kg)
  weight_combination: 13,      // KL/1CK tổ hợp (Weight 1 combination Ass) (kg)
  weight_per_ass: 15,          // KL/1CK (Weight 1 Ass) (kg) - NOTE: Column 15, not 14!
  weight_total: 16,            // KL tổng (Weight Total) (kg)
  area_per_ass: 17,            // Area 1 Ass (m2)
  area_total: 18,              // Area Total (m2)
  welding_machine: 19,         // welding machine (mh)
  hand_welding: 20,            // hand welding (mh)
  note: 21,                    // Note
};

const normalizeHeaderKey = (value: unknown): RawHeaderKey | undefined => {
  if (typeof value !== 'string') return undefined;
  const simplified = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '');

  const map: Record<string, RawHeaderKey> = {
    no: 'index',
    index: 'index',
    stt: 'index',
    projectid: 'project_id',
    duanid: 'project_id',
    assemblyid: 'assembly_id',
    caukien: 'assembly_id',
    assname: 'ass_name',
    assembly: 'ass_name',
    assemblyname: 'ass_name',
    tenck: 'ass_name',
    partname: 'part_name',
    partcode: 'part_name',
    tenchitiet: 'part_name',
    profile: 'profile',
    tietdien: 'profile',
    material: 'material',
    vatlieu: 'material',
    thick: 'thickness',
    thickness: 'thickness',
    day: 'thickness',
    width: 'width',
    rong: 'width',
    length: 'length',
    dai: 'length',
    qtyass: 'qty_per_ass',
    quantityass: 'qty_per_ass',
    qtyperass: 'qty_per_ass',
    slck: 'qty_per_ass',
    qtytotal: 'qty_total',
    quantitytotal: 'qty_total',
    totaltqty: 'qty_total',
    sltong: 'qty_total',
    weightperpart: 'weight_per_part',
    weight1part: 'weight_per_part',
    weightpart: 'weight_per_part',
    klct: 'weight_per_part',
    weightcombination: 'weight_combination',
    klcktohop: 'weight_combination',
    weightperass: 'weight_per_ass',
    klck: 'weight_per_ass',
    weighttotal: 'weight_total',
    weightto: 'weight_total',
    kltong: 'weight_total',
    areaperass: 'area_per_ass',
    area1ass: 'area_per_ass',
    areatotal: 'area_total',
    areato: 'area_total',
    weldingmachine: 'welding_machine',
    weldingm: 'welding_machine',
    handwelding: 'hand_welding',
    handwelc: 'hand_welding',
    note: 'note',
  };

  return map[simplified];
};

const buildHeaderLookup = (headerRow?: any[]): HeaderLookup => {
  if (!Array.isArray(headerRow)) {
    return (row, key) => {
      const fallback = fallbackColumnIndex[key];
      return fallback !== undefined ? row[fallback] : null;
    };
  }

  const positions: Partial<Record<RawHeaderKey, number>> = {};

  headerRow.forEach((value, index) => {
    const mapped = normalizeHeaderKey(value);
    if (mapped && positions[mapped] === undefined) {
      positions[mapped] = index;
    }
  });

  return (row, key) => {
    const position = positions[key];
    if (position !== undefined) {
      return row[position];
    }
    const fallback = fallbackColumnIndex[key];
    return fallback !== undefined ? row[fallback] : null;
  };
};

type StatusType = 'info' | 'success' | 'error';

type Progress = { current: number; total: number } | null;

interface DragDropState {
  isDragging: boolean;
  isOver: boolean;
}

interface FilterState {
  searchTerm: string;
  materialFilter: string;
  profileFilter: string;
  assemblyFilter: string;
}

const TechnicalBomPage = () => {
  const { user, getRoleLabel } = useAuth();
  const { importBomFromCsv } = useWorkflow();

  const [structuredData, setStructuredData] = useState<BomTreeNode[]>([]);
  const [status, setStatus] = useState<{
    message: string;
    type: StatusType;
  } | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<Progress>(null);
  const [skipRows, setSkipRows] = useState(1);
  const [fileMeta, setFileMeta] = useState<{ name: string } | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<
    'idle' | 'success' | 'error'
  >('idle');
  const [dragState, setDragState] = useState<DragDropState>({
    isDragging: false,
    isOver: false,
  });
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    materialFilter: '',
    profileFilter: '',
    assemblyFilter: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveNotification, setSaveNotification] = useState<{
    show: boolean;
    message: string;
  }>({ show: false, message: '' });
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
  const [collapseBomTable, setCollapseBomTable] = useState(false);

  const canUpload = user?.role === UserRole.TECHNICAL_ENGINEER;
  const canReview = user?.role === UserRole.PRODUCTION_PLANNER;
  const BOM_STORAGE_KEY = 'bomListData';

  // Check for existing BOM data on page load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedData = localStorage.getItem(BOM_STORAGE_KEY);
        const savedApprovalStatus = localStorage.getItem('bomApprovalStatus');

        if (savedData) {
          const bomData = JSON.parse(savedData);
          if (bomData.data && Array.isArray(bomData.data)) {
            setStructuredData(bomData.data);
            setFileMeta({ name: bomData.fileName || 'Loaded from storage' });
            setIsSaved(true);
            setStatus({
              message: `Loaded ${bomData.totalGroups} groups from previous session.`,
              type: 'success'
            });

            // Load approval status for Mr. Gioi
            if (savedApprovalStatus) {
              setApprovalStatus(savedApprovalStatus as 'approved' | 'rejected');
            }
          }
        }
      } catch (error) {
        console.error('Error loading BOM data from localStorage:', error);
        // If data is corrupted, clear it
        localStorage.removeItem(BOM_STORAGE_KEY);
      }
    }
  }, []);

  const toNumber = (value: unknown): number | null => {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    const cleaned = value
      .toString()
      .replace(/[^0-9.,-]/g, '')
      .replace(/,(?=\d{3}(?:\D|$))/g, '');
    const normalized = cleaned.replace(/,/g, '.');
    const numeric = Number(normalized);
    return Number.isFinite(numeric) ? numeric : null;
  };

  const toStringValue = (value: unknown): string | null => {
    if (value === null || value === undefined) return null;
    const trimmed = value.toString().trim();
    return trimmed.length ? trimmed : null;
  };

  const parseThickness = (value: unknown): number | number[] | string | null => {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number') return value;
    const strValue = value.toString().trim();

    // Try to parse as number(s)
    const parts = strValue
      .split(/[^0-9.]+/)
      .map(p => p.trim())
      .filter(Boolean)
      .map(p => Number(p.replace(/,/g, '.')))
      .filter(num => Number.isFinite(num));

    if (parts.length === 0) {
      // If no numbers found, return as string (e.g., "D20", "L100*6")
      return strValue;
    }
    if (parts.length === 1) return parts[0];
    return parts;
  };

  const parseWidth = (value: unknown): number | string | null => {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number') return value;

    const strValue = value.toString().trim();

    // Check if it looks like a unit or special string like "(Kg/m)"
    if (strValue.startsWith('(') || strValue.includes('/')) {
      return strValue;
    }

    // Try to parse as number
    const numValue = toNumber(strValue);
    if (numValue !== null) return numValue;

    // Return as string if not a number
    return strValue;
  };

  const createParent = (
    row: any[],
    lookup: HeaderLookup,
  ): BomTreeNode | null => {
    const index = toNumber(lookup(row, 'index'));
    if (index === null) return null;

    return {
      index,
      project_id: toStringValue(lookup(row, 'project_id')),
      assembly_id: toStringValue(lookup(row, 'assembly_id')),
      ass_name: toStringValue(lookup(row, 'ass_name')),
      part_name: toStringValue(lookup(row, 'part_name')),
      profile: toStringValue(lookup(row, 'profile')),
      material: toStringValue(lookup(row, 'material')),
      thickness: parseThickness(lookup(row, 'thickness')),
      width: parseWidth(lookup(row, 'width')),
      length: toNumber(lookup(row, 'length')),
      qty_per_ass: toNumber(lookup(row, 'qty_per_ass')),
      qty_total: toNumber(lookup(row, 'qty_total')),
      weight_per_part: toNumber(lookup(row, 'weight_per_part')),
      weight_combination: toNumber(lookup(row, 'weight_combination')),
      weight_per_ass: toNumber(lookup(row, 'weight_per_ass')),
      weight_total: toNumber(lookup(row, 'weight_total')),
      area_per_ass: toNumber(lookup(row, 'area_per_ass')),
      area_total: toNumber(lookup(row, 'area_total')),
      welding_machine: toNumber(lookup(row, 'welding_machine')),
      hand_welding: toNumber(lookup(row, 'hand_welding')),
      note: toStringValue(lookup(row, 'note')),
      children: [],
    };
  };

  const createChild = (row: any[], lookup: HeaderLookup): BomTreeNode => {
    // Child rows have the EXACT SAME column structure as parent rows
    // The only difference is column 0 (index) is empty
    // All other columns should map exactly the same way
    return {
      index: null,
      project_id: toStringValue(lookup(row, 'project_id')),
      assembly_id: toStringValue(lookup(row, 'assembly_id')),
      ass_name: toStringValue(lookup(row, 'ass_name')),
      part_name: toStringValue(lookup(row, 'part_name')),
      profile: toStringValue(lookup(row, 'profile')),
      material: toStringValue(lookup(row, 'material')),
      thickness: parseThickness(lookup(row, 'thickness')),
      width: parseWidth(lookup(row, 'width')),
      length: toNumber(lookup(row, 'length')),
      qty_per_ass: toNumber(lookup(row, 'qty_per_ass')),
      qty_total: toNumber(lookup(row, 'qty_total')),
      weight_per_part: toNumber(lookup(row, 'weight_per_part')),
      weight_combination: toNumber(lookup(row, 'weight_combination')),
      weight_per_ass: toNumber(lookup(row, 'weight_per_ass')),
      weight_total: toNumber(lookup(row, 'weight_total')),
      area_per_ass: toNumber(lookup(row, 'area_per_ass')),
      area_total: toNumber(lookup(row, 'area_total')),
      welding_machine: toNumber(lookup(row, 'welding_machine')),
      hand_welding: toNumber(lookup(row, 'hand_welding')),
      note: toStringValue(lookup(row, 'note')),
      children: [],
    };
  };

  const processRowsIncrementally = useCallback(
    (rows: any[][], startRow: number, lookup: HeaderLookup) =>
      new Promise<BomTreeNode[]>(resolve => {
        const parents: BomTreeNode[] = [];
        let currentParent: BomTreeNode | null = null;
        let pointer = startRow;
        const totalRows = rows.length;
        const chunkSize = 500;

        const step = () => {
          const upper = Math.min(pointer + chunkSize, totalRows);

          for (let i = pointer; i < upper; i += 1) {
            const row = rows[i] || [];
            const indexCandidate = lookup(row, 'index');

            const hasIndex =
              indexCandidate !== null &&
              indexCandidate !== undefined &&
              `${indexCandidate}`.trim() !== '' &&
              !isNaN(Number(indexCandidate));

            if (hasIndex) {
              const parent = createParent(row, lookup);
              if (!parent) continue;
              parents.push(parent);
              currentParent = parent;
            } else if (currentParent) {
              const hasAnyData = row.some(
                cell =>
                  cell !== null &&
                  cell !== undefined &&
                  `${cell}`.trim() !== '',
              );

              if (hasAnyData) {
                const child = createChild(row, lookup);
                currentParent.children.push(child);
              }
            }
          }

          pointer = upper;
          setProgress({
            current: Math.min(pointer, totalRows),
            total: totalRows,
          });

          if (pointer < totalRows) {
            window.requestAnimationFrame(step);
          } else {
            resolve(parents);
          }
        };

        step();
      }),
    [],
  );

  const convertTreeToCsv = useCallback((tree: BomTreeNode[]): string => {
    const rows: string[][] = [];

    const normalize = (value: unknown) => {
      if (Array.isArray(value)) {
        return value.map(item => (item == null ? '' : item)).join('x');
      }
      if (value === null || value === undefined) return '';
      return `${value}`;
    };

    const getCsvValue = (
      node: BomTreeNode,
      isParent: boolean,
      key: CsvHeaderKey,
    ): string => {
      switch (key) {
        case 'component_code':
          return normalize(node.part_name ?? node.ass_name ?? node.profile);
        case 'name':
          return normalize(node.part_name ?? node.ass_name ?? node.profile);
        case 'stage':
          return normalize(node.ass_name);
        case 'quantity':
          return normalize(node.qty_total ?? node.qty_per_ass);
        case 'total_weight':
          return normalize(node.weight_total ?? node.weight_per_part);
        case 'index':
          return isParent && node.index !== null ? `${node.index}` : '';
        case 'thickness':
          return normalize(node.thickness);
        case 'ass_name':
          return normalize(node.ass_name);
        case 'part_name':
          return normalize(node.part_name);
        case 'profile':
          return normalize(node.profile);
        case 'material':
          return normalize(node.material);
        case 'width':
          return normalize(node.width);
        case 'length':
          return normalize(node.length);
        case 'qty_per_ass':
          return normalize(node.qty_per_ass);
        case 'qty_total':
          return normalize(node.qty_total);
        case 'weight_per_part':
          return normalize(node.weight_per_part);
        case 'weight_total':
          return normalize(node.weight_total);
        case 'area_per_ass':
          return normalize(node.area_per_ass);
        case 'area_total':
          return normalize(node.area_total);
        case 'welding_machine':
          return normalize(node.welding_machine);
        case 'hand_welding':
          return normalize(node.hand_welding);
        case 'note':
          return normalize(node.note);
        default:
          return '';
      }
    };

    const pushRow = (node: BomTreeNode, isParent: boolean) => {
      const row = CSV_HEADERS.map(header => {
        const raw = getCsvValue(node, isParent, header);
        if (raw === '') return '';
        if (/[",\n]/.test(raw)) {
          return `"${raw.replace(/"/g, '""')}"`;
        }
        return raw;
      });
      rows.push(row);
    };

    tree.forEach(parent => {
      pushRow(parent, true);
      parent.children.forEach(child => {
        pushRow(child, false);
      });
    });

    return [CSV_HEADERS.join(','), ...rows.map(row => row.join(','))].join(
      '\n',
    );
  }, []);

  const parseCsv = (csvText: string): string[][] => {
    const lines = csvText.split('\n');
    const result: string[][] = [];

    for (const line of lines) {
      if (line.trim() === '') continue;

      const row: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          row.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }

      row.push(current.trim());
      result.push(row);
    }

    return result;
  };

  const handleFileChange = async (file: File) => {
    setWarnings([]);
    setStatus({ message: `Đang đọc ${file.name}...`, type: 'info' });
    setIsProcessing(true);
    setProgress(null);

    try {
      const text = await file.text();
      const rows = parseCsv(text);
      const startIndex = Math.max(0, skipRows - 1);

      if (rows.length <= startIndex) {
        setStatus({
          message: 'Số dòng bỏ qua quá lớn, không còn dữ liệu để xử lý.',
          type: 'error',
        });
        setStructuredData([]);
        setIsProcessing(false);
        return;
      }

      const headerCandidateIndex = Math.max(0, startIndex - 1);
      const headerRow = rows[headerCandidateIndex];
      const headerLookup = buildHeaderLookup(headerRow);

      const tree = await processRowsIncrementally(
        rows,
        startIndex,
        headerLookup,
      );
      setStructuredData(tree);
      setFileMeta({ name: file.name });
      setStatus({
        message: `Đã xử lý ${tree.length} nhóm cấu kiện.`,
        type: 'success',
      });
    } catch (error: any) {
      console.error(error);
      setStructuredData([]);
      setStatus({
        message: `Không đọc được file: ${error.message ?? error}`,
        type: 'error',
      });
    } finally {
      setIsProcessing(false);
      setProgress(null);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setStatus({
        message: 'Chỉ chấp nhận file CSV (.csv).',
        type: 'error',
      });
      return;
    }

    setStructuredData([]);
    setCopyFeedback('idle');
    await handleFileChange(file);
  };

  const onFileInputChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      setStatus(null);
      return;
    }
    await handleFileUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragState(prev => ({ ...prev, isOver: true }));
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragState(prev => ({ ...prev, isOver: false }));
  };

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragState({ isDragging: false, isOver: false });

    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find(file =>
      file.name.toLowerCase().endsWith('.csv'),
    );

    if (!csvFile) {
      setStatus({
        message: 'Vui lòng chỉ thả file CSV (.csv).',
        type: 'error',
      });
      return;
    }

    await handleFileUpload(csvFile);
  };

  const jsonPreview = useMemo(() => {
    if (structuredData.length === 0) return '[]';
    return JSON.stringify(structuredData, null, 2);
  }, [structuredData]);

  const totalChildren = useMemo(
    () =>
      structuredData.reduce((acc, parent) => acc + parent.children.length, 0),
    [structuredData],
  );

  const filteredData = useMemo(() => {
    if (
      !filters.searchTerm &&
      !filters.materialFilter &&
      !filters.profileFilter &&
      !filters.assemblyFilter
    ) {
      return structuredData;
    }

    return structuredData.filter(parent => {
      const matchesSearch =
        !filters.searchTerm ||
        parent.part_name
          ?.toLowerCase()
          .includes(filters.searchTerm.toLowerCase()) ||
        parent.ass_name
          ?.toLowerCase()
          .includes(filters.searchTerm.toLowerCase()) ||
        parent.profile
          ?.toLowerCase()
          .includes(filters.searchTerm.toLowerCase()) ||
        parent.index?.toString().includes(filters.searchTerm);

      const matchesMaterial =
        !filters.materialFilter ||
        parent.material
          ?.toLowerCase()
          .includes(filters.materialFilter.toLowerCase());

      const matchesProfile =
        !filters.profileFilter ||
        parent.profile
          ?.toLowerCase()
          .includes(filters.profileFilter.toLowerCase());

      const matchesAssembly =
        !filters.assemblyFilter ||
        parent.ass_name
          ?.toLowerCase()
          .includes(filters.assemblyFilter.toLowerCase());

      return (
        matchesSearch && matchesMaterial && matchesProfile && matchesAssembly
      );
    });
  }, [structuredData, filters]);

  const uniqueMaterials = useMemo(() => {
    const materials = new Set<string>();
    structuredData.forEach(parent => {
      if (parent.material) materials.add(parent.material);
    });
    return Array.from(materials).sort();
  }, [structuredData]);

  const uniqueProfiles = useMemo(() => {
    const profiles = new Set<string>();
    structuredData.forEach(parent => {
      if (parent.profile) profiles.add(parent.profile);
    });
    return Array.from(profiles).sort();
  }, [structuredData]);

  const uniqueAssemblies = useMemo(() => {
    const assemblies = new Set<string>();
    structuredData.forEach(parent => {
      if (parent.ass_name) assemblies.add(parent.ass_name);
    });
    return Array.from(assemblies).sort();
  }, [structuredData]);

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      materialFilter: '',
      profileFilter: '',
      assemblyFilter: '',
    });
  };

  const saveBomData = () => {
    try {
      if (typeof window !== 'undefined') {
        const bomData = {
          data: structuredData,
          timestamp: new Date().toISOString(),
          fileName: fileMeta?.name || 'unknown',
          totalGroups: structuredData.length,
          totalChildren: structuredData.reduce((acc, parent) => acc + parent.children.length, 0),
          published: true,
        };

        localStorage.setItem(BOM_STORAGE_KEY, JSON.stringify(bomData));
        setIsSaved(true);

        setStatus({
          message: `BOM đã được lưu và publish! Xưởng trưởng có thể vào Pull Board để kéo việc.`,
          type: 'success'
        });
      }
    } catch (error) {
      setStatus({
        message: 'Failed to save BOM data.',
        type: 'error'
      });
    }
  };

  const handleAssignTasks = () => {
    // This will be wired to the assign tasks flow later
    console.log('Navigate to assign tasks flow');
    setSaveNotification({ show: false, message: '' });
  };

  const copyJsonToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(jsonPreview);
      setCopyFeedback('success');
      setTimeout(() => setCopyFeedback('idle'), 2000);
    } catch (error) {
      console.error(error);
      setCopyFeedback('error');
      setTimeout(() => setCopyFeedback('idle'), 2000);
    }
  };

  const applyToSystem = async () => {
    if (!structuredData.length) {
      setStatus({ message: 'Chưa có dữ liệu để áp dụng.', type: 'error' });
      return;
    }

    const csvContent = convertTreeToCsv(structuredData);
    const fileName =
      fileMeta?.name?.replace(/\.(xlsx|xlsm|xls)$/i, '') ?? 'BOM_Excel';
    setStatus({ message: 'Đang cập nhật BOM vào hệ thống...', type: 'info' });

    const result = importBomFromCsv({
      fileName: `${fileName}.csv`,
      content: csvContent,
      importedBy: user?.name ?? 'Kỹ thuật',
      importedById: user?.id ?? 'user-toan',
    });

    if (!result.success) {
      setStatus({ message: result.error, type: 'error' });
      setWarnings(result.warnings ?? []);
      return;
    }

    setWarnings(result.warnings);
    setStatus({
      message: `Đã cập nhật ${result.summary.totalTasks} hạng mục vào hệ thống. Kiểm tra thông báo cho điều phối.`,
      type: 'success',
    });
  };

  const handleApproveBom = () => {
    setApprovalStatus('approved');
    setStatus({
      message: `BOM đã được phê duyệt. Xưởng trưởng có thể vào Pull Board để kéo việc.`,
      type: 'success',
    });
    localStorage.setItem('bomApprovalStatus', 'approved');
  };

  const handleRejectBom = () => {
    setApprovalStatus('rejected');
    setStatus({
      message: 'BOM đã bị từ chối. Cần yêu cầu kỹ thuật điều chỉnh lại.',
      type: 'error',
    });
    localStorage.setItem('bomApprovalStatus', 'rejected');
  };

  return (
    <div className="space-y-6">
      <Card className="space-y-4" padding="lg">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-secondary">
            {canReview
              ? 'Kiểm tra và phê duyệt BOM List'
              : 'Đẩy BOM List lên thông tin chung'}
          </h1>
          <p className="text-sm text-secondary/70">
            {canReview
              ? 'Xem xét và phê duyệt BOM List từ phòng kỹ thuật trước khi triển khai sản xuất'
              : 'Đẩy file BOM list dạng CSV đã format theo hướng dẫn để các phòng ban trong công ty chủ động làm việc'}
          </p>
        </div>

        {!structuredData.length ? (
          canReview ? (
            <div className="border-2 border-dashed rounded-lg p-8 text-center border-secondary/30">
              <Eye className="h-12 w-12 mx-auto mb-4 text-secondary/60" />
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-secondary">
                  Chưa có BOM List cần phê duyệt
                </h3>
                <p className="text-sm text-secondary/60">
                  Hiện tại không có BOM List nào từ phòng kỹ thuật cần xem xét.
                </p>
                <p className="text-xs text-secondary/50 mt-4">
                  Hệ thống sẽ tự động hiển thị BOM List khi phòng kỹ thuật upload và lưu dữ liệu.
                </p>
              </div>
            </div>
          ) : (
            <div
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
                dragState.isOver
                  ? 'border-primary bg-primary/5'
                  : 'border-secondary/30 hover:border-secondary/50',
                !canUpload && 'opacity-50 cursor-not-allowed',
              )}
              onDragOver={canUpload ? handleDragOver : undefined}
              onDragLeave={canUpload ? handleDragLeave : undefined}
              onDrop={canUpload ? handleFileDrop : undefined}
            >
              <UploadCloud className="h-12 w-12 mx-auto mb-4 text-secondary/60" />
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-secondary">
                  Thả file CSV vào đây hoặc chọn file
                </h3>
                <p className="text-sm text-secondary/60">
                  Chỉ chấp nhận file .csv
                </p>
                <div className="pt-2">
                  <label className="cursor-pointer">
                    <Input
                      type="file"
                      accept=".csv"
                      onChange={onFileInputChange}
                      disabled={!canUpload}
                      className="hidden"
                    />
                    <Button
                      variant="secondary"
                      disabled={!canUpload}
                      className="pointer-events-none"
                    >
                      Chọn file CSV
                    </Button>
                  </label>
                </div>
              </div>
              {!canUpload && (
                <p className="text-xs text-secondary/60 mt-4">
                  Tài khoản "{user?.name}" ({user ? getRoleLabel(user.role) : '—'}
                  ) không có quyền chỉnh sửa BOM.
                </p>
              )}
            </div>
          )
        ) : (
          <div className="flex justify-between items-center">
            <div className="flex gap-2 items-center">
              <Badge className="bg-primary/10 text-primary">
                {structuredData.length} nhóm
              </Badge>
              <Badge className="bg-secondary/10 text-secondary">
                {totalChildren} chi tiết
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowJsonPreview(!showJsonPreview)}
              >
                <Eye className="h-4 w-4" />
                <span>Preview JSON</span>
              </Button>

              {canReview ? (
                // Mr. Gioi's approval buttons
                <>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setStructuredData([]);
                      setStatus(null);
                      setWarnings([]);
                      setApprovalStatus(null);
                      localStorage.removeItem('bomApprovalStatus');
                    }}
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Đặt lại</span>
                  </Button>
                  <Button
                    onClick={handleRejectBom}
                    variant="danger"
                    disabled={approvalStatus === 'rejected'}
                  >
                    <X className="h-4 w-4" />
                    <span>{approvalStatus === 'rejected' ? 'Đã từ chối' : 'Từ chối BOM'}</span>
                  </Button>
                  <Button
                    onClick={handleApproveBom}
                    disabled={approvalStatus === 'approved'}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{approvalStatus === 'approved' ? 'Đã phê duyệt' : 'Phê duyệt BOM'}</span>
                  </Button>
                </>
              ) : (
                // Mr. Toan's technical buttons
                <>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setStructuredData([]);
                      setStatus(null);
                      setWarnings([]);
                      setFileMeta(null);
                    }}
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Đặt lại</span>
                  </Button>
                  <Button onClick={applyToSystem} disabled={!structuredData.length}>
                    <UploadCloud className="h-4 w-4" />
                    <span>Áp dụng BOM</span>
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={saveBomData}
                    disabled={!structuredData.length || isSaved}
                  >
                    <Save className="h-4 w-4" />
                    <span>{isSaved ? 'Đã lưu' : 'Lưu BOM'}</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {status && (
          <div
            className={cn(
              'rounded-lg border px-4 py-3 text-sm flex items-center gap-2',
              status.type === 'success' &&
                'border-emerald-200 bg-emerald-50 text-emerald-700',
              status.type === 'error' &&
                'border-red-200 bg-red-50 text-red-700',
              status.type === 'info' &&
                'border-blue-200 bg-blue-50 text-blue-700',
            )}
          >
            {status.type === 'success' && <CheckCircle2 className="h-4 w-4" />}
            {status.type === 'error' && <AlertCircle className="h-4 w-4" />}
            {status.type === 'info' && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            <span>{status.message}</span>
          </div>
        )}

        {progress && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-700">
            Đang xử lý {progress.current}/{progress.total} dòng...
          </div>
        )}

        {/* Role-based Save Notification for Anh Giỏi */}
        {saveNotification.show && user?.name === 'Anh Giỏi' && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 text-blue-800 px-4 py-3 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>{saveNotification.message}</span>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleAssignTasks}
              className="bg-blue-100 hover:bg-blue-200 text-blue-800"
            >
              <Edit3 className="h-4 w-4" />
              <span className="ml-1">Assign Tasks</span>
            </Button>
          </div>
        )}
      </Card>

      {warnings.length > 0 && (
        <Card className="space-y-3" padding="md">
          <div className="flex items-center gap-2 text-amber-700">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-semibold">
              Cảnh báo trong quá trình phân tích
            </span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-sm text-amber-800">
            {warnings.map(warning => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </Card>
      )}

      {structuredData.length > 0 && (
        <Card className="space-y-4" padding="lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-secondary">Chi tiết BOM List</h3>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCollapseBomTable(!collapseBomTable)}
              className="flex items-center gap-2"
            >
              {collapseBomTable ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              {collapseBomTable ? 'Hiển thị' : 'Thu gọn'}
            </Button>
          </div>

          {!collapseBomTable && (
            <>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm theo tên, mã, profile..."
                  value={filters.searchTerm}
                  onChange={e =>
                    setFilters(prev => ({
                      ...prev,
                      searchTerm: e.target.value,
                    }))
                  }
                  className="pl-10 w-80"
                />
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Lọc nâng cao
              </Button>
              {(filters.materialFilter ||
                filters.profileFilter ||
                filters.assemblyFilter) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Xóa bộ lọc
                </Button>
              )}
            </div>
            <div className="text-sm text-gray-600">
              Hiển thị {filteredData.length} / {structuredData.length} nhóm
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vật liệu (nhóm chính)
                </label>
                <select
                  value={filters.materialFilter}
                  onChange={e =>
                    setFilters(prev => ({
                      ...prev,
                      materialFilter: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Tất cả vật liệu</option>
                  {uniqueMaterials.map(material => (
                    <option key={material} value={material}>
                      {material}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profile (nhóm chính)
                </label>
                <select
                  value={filters.profileFilter}
                  onChange={e =>
                    setFilters(prev => ({
                      ...prev,
                      profileFilter: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Tất cả quy cách</option>
                  {uniqueProfiles.map(profile => (
                    <option key={profile} value={profile}>
                      {profile}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cấu kiện (nhóm chính)
                </label>
                <select
                  value={filters.assemblyFilter}
                  onChange={e =>
                    setFilters(prev => ({
                      ...prev,
                      assemblyFilter: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Tất cả cấu kiện</option>
                  {uniqueAssemblies.map(assembly => (
                    <option key={assembly} value={assembly}>
                      {assembly}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

              <BomTable data={filteredData} />
            </>
          )}
        </Card>
      )}

      {showJsonPreview && structuredData.length > 0 && (
        <Card className="space-y-3" padding="lg">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-secondary">
              JSON Preview
            </h2>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={copyJsonToClipboard}
              >
                <Copy className="h-4 w-4" />
                <span>
                  {copyFeedback === 'success'
                    ? 'Đã copy'
                    : copyFeedback === 'error'
                    ? 'Lỗi copy'
                    : 'Copy JSON'}
                </span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const blob = new Blob([jsonPreview], {
                    type: 'application/json;charset=utf-8',
                  });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `${fileMeta?.name ?? 'bom-json'}.json`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                }}
              >
                <Download className="h-4 w-4" />
                <span>Tải JSON</span>
              </Button>
            </div>
          </div>
          <pre className="max-h-[420px] overflow-auto text-xs leading-6 bg-secondary text-white rounded-lg p-4">
            {jsonPreview}
          </pre>
        </Card>
      )}


    </div>
  );
};

const BomTable = ({ data }: { data: BomTreeNode[] }) => {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRowExpansion = (index: number) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return '—';
    if (value === '' || value === 0) return '—';
    if (Array.isArray(value)) {
      return value.join(' x ');
    }
    return String(value);
  };

  const tableHeaders = [
    'NO',
    'Dự án_ID',
    'Cấu kiện',
    'Tên ck',
    'Tên chi tiết',
    'Tiết diện',
    'Vật liệu',
    'Dày',
    'Rộng',
    'Dài',
    'SL/CK',
    'SL tổng',
    'KL_CT',
    'KL/CK tổ hợp',
    'KL/CK',
    'KL tổng',
    'Area 1 Ass',
    'Area Total',
    'welding machine',
    'hand welding',
    'Note',
  ];

  return (
    <div className="overflow-auto max-h-[60vh] border border-gray-300 rounded-lg shadow-sm">
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 z-10">
          <tr className="bg-gradient-to-r from-gray-100 to-gray-50 border-b-2 border-gray-300">
            <th className="w-10 border-r border-gray-300 p-3 bg-gray-100"></th>
            {tableHeaders.map((header, index) => (
              <th
                key={index}
                className="border-r border-gray-300 px-3 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap bg-gray-50 last:border-r-0"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map(parent => (
            <React.Fragment key={`parent-${parent.index}`}>
              <tr className="bg-white hover:bg-blue-50 transition-colors border-b border-gray-200">
                <td className="border-r border-gray-300 p-2 bg-gray-50">
                  {parent.children.length > 0 && (
                    <button
                      onClick={() => toggleRowExpansion(parent.index!)}
                      className="flex items-center justify-center w-6 h-6 rounded hover:bg-blue-100 transition-colors"
                    >
                      {expandedRows.has(parent.index!) ? (
                        <ChevronDown className="h-4 w-4 text-blue-600" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      )}
                    </button>
                  )}
                </td>
                <td className="border-r border-gray-200 px-3 py-2.5 font-semibold text-blue-700 bg-blue-50">
                  {formatValue(parent.index)}
                </td>
                <td className="border-r border-gray-200 px-3 py-2.5">
                  {formatValue(parent.project_id)}
                </td>
                <td className="border-r border-gray-200 px-3 py-2.5 font-medium">
                  {formatValue(parent.assembly_id)}
                </td>
                <td className="border-r border-gray-200 px-3 py-2.5">
                  {formatValue(parent.ass_name)}
                </td>
                <td className="border-r border-gray-200 px-3 py-2.5">
                  {formatValue(parent.part_name)}
                </td>
                <td className="border-r border-gray-200 px-3 py-2.5">
                  {formatValue(parent.profile)}
                </td>
                <td className="border-r border-gray-200 px-3 py-2.5">
                  {formatValue(parent.material)}
                </td>
                <td className="border-r border-gray-200 px-3 py-2.5 text-center">
                  {formatValue(parent.thickness)}
                </td>
                <td className="border-r border-gray-200 px-3 py-2.5 text-center">
                  {formatValue(parent.width)}
                </td>
                <td className="border-r border-gray-200 px-3 py-2.5 text-center">
                  {formatValue(parent.length)}
                </td>
                <td className="border-r border-gray-200 px-3 py-2.5 text-center">
                  {formatValue(parent.qty_per_ass)}
                </td>
                <td className="border-r border-gray-200 px-3 py-2.5 text-center font-medium">
                  {formatValue(parent.qty_total)}
                </td>
                <td className="border-r border-gray-200 px-3 py-2.5 text-right">
                  {formatValue(parent.weight_per_part)}
                </td>
                <td className="border-r border-gray-200 px-3 py-2.5 text-right">
                  {formatValue(parent.weight_combination)}
                </td>
                <td className="border-r border-gray-200 px-3 py-2.5 text-right">
                  {formatValue(parent.weight_per_ass)}
                </td>
                <td className="border-r border-gray-200 px-3 py-2.5 text-right font-medium">
                  {formatValue(parent.weight_total)}
                </td>
                <td className="border-r border-gray-200 px-3 py-2.5 text-right">
                  {formatValue(parent.area_per_ass)}
                </td>
                <td className="border-r border-gray-200 px-3 py-2.5 text-right font-medium">
                  {formatValue(parent.area_total)}
                </td>
                <td className="border-r border-gray-200 px-3 py-2.5 text-center">
                  {formatValue(parent.welding_machine)}
                </td>
                <td className="border-r border-gray-200 px-3 py-2.5 text-center">
                  {formatValue(parent.hand_welding)}
                </td>
                <td className="px-3 py-2.5 text-xs text-gray-600">
                  {formatValue(parent.note)}
                </td>
              </tr>
              {expandedRows.has(parent.index!) &&
                parent.children.map((child, childIndex) => (
                  <tr
                    key={`child-${parent.index}-${childIndex}`}
                    className="bg-gray-50/50 hover:bg-gray-100 transition-colors border-b border-gray-100"
                  >
                    <td className="border-r border-gray-300 p-2 bg-gray-100"></td>
                    <td className="border-r border-gray-200 px-3 py-2 text-gray-400 text-xs bg-gray-50">
                      —
                    </td>
                    <td className="border-r border-gray-200 px-3 py-2 text-gray-600">
                      {formatValue(child.project_id)}
                    </td>
                    <td className="border-r border-gray-200 px-3 py-2 text-gray-600">
                      {formatValue(child.assembly_id)}
                    </td>
                    <td className="border-r border-gray-200 px-3 py-2 text-gray-700">
                      {formatValue(child.ass_name)}
                    </td>
                    <td className="border-r border-gray-200 px-3 py-2 text-gray-700">
                      {formatValue(child.part_name)}
                    </td>
                    <td className="border-r border-gray-200 px-3 py-2 text-gray-600">
                      {formatValue(child.profile)}
                    </td>
                    <td className="border-r border-gray-200 px-3 py-2 text-gray-600">
                      {formatValue(child.material)}
                    </td>
                    <td className="border-r border-gray-200 px-3 py-2 text-center text-gray-600">
                      {formatValue(child.thickness)}
                    </td>
                    <td className="border-r border-gray-200 px-3 py-2 text-center text-gray-600">
                      {formatValue(child.width)}
                    </td>
                    <td className="border-r border-gray-200 px-3 py-2 text-center text-gray-600">
                      {formatValue(child.length)}
                    </td>
                    <td className="border-r border-gray-200 px-3 py-2 text-center text-gray-600">
                      {formatValue(child.qty_per_ass)}
                    </td>
                    <td className="border-r border-gray-200 px-3 py-2 text-center text-gray-700">
                      {formatValue(child.qty_total)}
                    </td>
                    <td className="border-r border-gray-200 px-3 py-2 text-right text-gray-600">
                      {formatValue(child.weight_per_part)}
                    </td>
                    <td className="border-r border-gray-200 px-3 py-2 text-right text-gray-600">
                      {formatValue(child.weight_combination)}
                    </td>
                    <td className="border-r border-gray-200 px-3 py-2 text-right text-gray-600">
                      {formatValue(child.weight_per_ass)}
                    </td>
                    <td className="border-r border-gray-200 px-3 py-2 text-right text-gray-700">
                      {formatValue(child.weight_total)}
                    </td>
                    <td className="border-r border-gray-200 px-3 py-2 text-right text-gray-600">
                      {formatValue(child.area_per_ass)}
                    </td>
                    <td className="border-r border-gray-200 px-3 py-2 text-right text-gray-700">
                      {formatValue(child.area_total)}
                    </td>
                    <td className="border-r border-gray-200 px-3 py-2 text-center text-gray-600">
                      {formatValue(child.welding_machine)}
                    </td>
                    <td className="border-r border-gray-200 px-3 py-2 text-center text-gray-600">
                      {formatValue(child.hand_welding)}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {formatValue(child.note)}
                    </td>
                  </tr>
                ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TechnicalBomPage;
