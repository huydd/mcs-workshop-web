// components/ui/Card.tsx
"use client";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
}

export const Card = ({ children, className, padding = "md" }: CardProps) => {
  const paddingClasses = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div
      className={cn(
        "bg-white rounded-lg shadow-sm border border-gray-200",
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  );
};
