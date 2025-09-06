// components/ui/Pagination.tsx
"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";
import { Select } from "./Select";
import { PaginationProps } from "@/types";
import { useResponsive } from "@/components/layout/ResponsiveContainer";

export const Pagination = ({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) => {
  const { mobile } = useResponsive();
  const totalPages = Math.ceil(total / pageSize);
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  const getVisiblePages = () => {
    const delta = mobile ? 1 : 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, page - delta);
      i <= Math.min(totalPages - 1, page + delta);
      i++
    ) {
      range.push(i);
    }

    if (page - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (page + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
      <div className="flex items-center gap-4">
        {!mobile && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#616161]">Hiển thị:</span>
            <Select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="w-20"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </Select>
          </div>
        )}
        <div className="text-sm text-[#616161]">
          Hiển thị {startItem}-{endItem} trong tổng số {total}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
          {!mobile && <span className="ml-1">Trước</span>}
        </Button>

        <div className="flex items-center gap-1">
          {getVisiblePages().map((pageNum, index) => (
            <div key={`pagination-${pageNum}-${index}`}>
              {pageNum === "..." ? (
                <span className="px-2 py-1 text-sm text-[#616161]">...</span>
              ) : (
                <Button
                  variant={page === pageNum ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => onPageChange(Number(pageNum))}
                  className="w-8 h-8 p-0"
                >
                  {pageNum}
                </Button>
              )}
            </div>
          ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          {!mobile && <span className="mr-1">Sau</span>}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
