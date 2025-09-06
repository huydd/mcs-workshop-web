// components/ui/Select.tsx
"use client";
import { SelectHTMLAttributes, forwardRef, ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helper?: string;
  children: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helper, children, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-[#212121]">
            {label}
            {props.required && <span className="text-[#D32F2F] ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            className={cn(
              "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-[#1B5E20] focus:border-[#1B5E20] transition-colors appearance-none bg-white",
              error &&
                "border-[#D32F2F] focus:ring-[#D32F2F] focus:border-[#D32F2F]",
              className
            )}
            ref={ref}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
        {error && <p className="text-sm text-[#D32F2F]">{error}</p>}
        {helper && !error && <p className="text-sm text-[#616161]">{helper}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
