// components/ui/Badge.tsx
"use client";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ComponentStatus, WorkflowStageStatus } from "@/types";

interface BadgeProps {
  children: ReactNode;
  variant?: ComponentStatus | WorkflowStageStatus | "default";
  className?: string;
}

export const Badge = ({
  children,
  variant = "default",
  className,
}: BadgeProps) => {
  const variants = {
    default: "bg-gray-100 text-gray-800",
    PENDING: "bg-yellow-100 text-yellow-800",
    IN_PROGRESS: "bg-primary/10 text-primary",
    COMPLETED: "bg-[#388E3C] text-white",
    QC_FAILED: "bg-[#D32F2F] text-white",
    APPROVED: "bg-[#388E3C] text-white",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
};
