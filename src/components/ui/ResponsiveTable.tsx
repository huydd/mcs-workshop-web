"use client";

import { ReactNode, useState } from "react";
import { ChevronDown, ChevronRight, MoreVertical, Eye } from "lucide-react";
import { useResponsive } from "@/components/layout/ResponsiveContainer";
import { Button } from "./Button";
import { Card } from "./Card";
import { cn } from "@/lib/utils";

interface Column<T> {
  key: keyof T;
  label: string;
  width?: string;
  priority?: "high" | "medium" | "low"; // high: hiện trên mobile, medium: tablet+, low: desktop only
  render?: (value: any, row: T) => ReactNode;
  sortable?: boolean;
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyField: keyof T;
  loading?: boolean;
  onRowClick?: (row: T) => void;
  className?: string;
}

export function ResponsiveTable<T>({
  data,
  columns,
  keyField,
  loading = false,
  onRowClick,
  className,
}: ResponsiveTableProps<T>) {
  const { mobile, tablet, desktop } = useResponsive();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const getVisibleColumns = () => {
    if (mobile) {
      return columns.filter((col) => col.priority === "high");
    }
    if (tablet) {
      return columns.filter(
        (col) => col.priority === "high" || col.priority === "medium"
      );
    }
    return columns; // desktop shows all
  };

  const getHiddenColumns = () => {
    const visible = getVisibleColumns();
    return columns.filter((col) => !visible.includes(col));
  };

  const toggleRowExpansion = (rowKey: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowKey)) {
      newExpanded.delete(rowKey);
    } else {
      newExpanded.add(rowKey);
    }
    setExpandedRows(newExpanded);
  };

  const visibleColumns = getVisibleColumns();
  const hiddenColumns = getHiddenColumns();

  if (loading) {
    return (
      <Card className="animate-pulse">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </Card>
    );
  }

  // Mobile: Card List Layout
  if (mobile) {
    return (
      <div className={cn("space-y-4", className)}>
        {data.map((row) => {
          const rowKey = String(row[keyField]);
          const isExpanded = expandedRows.has(rowKey);

          return (
            <Card key={rowKey} className="p-4">
              <div className="space-y-3">
                {/* Primary info (high priority columns) */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    {visibleColumns.slice(0, 2).map((col) => (
                      <div key={String(col.key)} className="mb-2">
                        <span className="text-sm font-medium text-[#212121]">
                          {col.render
                            ? col.render(row[col.key], row)
                            : String(row[col.key])}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    {onRowClick && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRowClick(row)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    {hiddenColumns.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRowExpansion(rowKey)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Secondary info */}
                {visibleColumns.slice(2).map((col) => (
                  <div key={String(col.key)} className="text-sm text-[#616161]">
                    <span className="font-medium">{col.label}: </span>
                    {col.render
                      ? col.render(row[col.key], row)
                      : String(row[col.key])}
                  </div>
                ))}

                {/* Expanded details */}
                {isExpanded && hiddenColumns.length > 0 && (
                  <div className="pt-3 border-t border-gray-200 space-y-2">
                    {hiddenColumns.map((col) => (
                      <div key={String(col.key)} className="text-sm">
                        <span className="font-medium text-[#212121]">
                          {col.label}:{" "}
                        </span>
                        <span className="text-[#616161]">
                          {col.render
                            ? col.render(row[col.key], row)
                            : String(row[col.key])}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    );
  }

  // Tablet & Desktop: Table Layout
  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {visibleColumns.map((col) => (
                <th
                  key={String(col.key)}
                  className={cn(
                    "px-6 py-3 text-left text-xs font-medium text-[#616161] uppercase tracking-wider",
                    col.width && `w-[${col.width}]`
                  )}
                >
                  {col.label}
                </th>
              ))}
              {hiddenColumns.length > 0 && <th className="px-6 py-3 w-12"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((row) => {
              const rowKey = String(row[keyField]);
              const isExpanded = expandedRows.has(rowKey);

              return (
                <>
                  <tr
                    key={rowKey}
                    className={cn(
                      "hover:bg-gray-50 transition-colors",
                      onRowClick && "cursor-pointer"
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    {visibleColumns.map((col) => (
                      <td
                        key={String(col.key)}
                        className="px-6 py-4 whitespace-nowrap text-sm text-[#212121]"
                      >
                        {col.render
                          ? col.render(row[col.key], row)
                          : String(row[col.key])}
                      </td>
                    ))}
                    {hiddenColumns.length > 0 && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRowExpansion(rowKey);
                          }}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <MoreVertical className="h-4 w-4" />
                          )}
                        </Button>
                      </td>
                    )}
                  </tr>

                  {/* Expanded row for hidden columns */}
                  {isExpanded && hiddenColumns.length > 0 && (
                    <tr className="bg-gray-50">
                      <td
                        colSpan={visibleColumns.length + 1}
                        className="px-6 py-4"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {hiddenColumns.map((col) => (
                            <div key={String(col.key)}>
                              <span className="text-sm font-medium text-[#212121]">
                                {col.label}:
                              </span>
                              <span className="ml-2 text-sm text-[#616161]">
                                {col.render
                                  ? col.render(row[col.key], row)
                                  : String(row[col.key])}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
