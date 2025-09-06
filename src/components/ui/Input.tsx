// components/ui/Input.tsx
"use client";
import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helper, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-[#212121]">
            {label}
            {props.required && <span className="text-[#D32F2F] ml-1">*</span>}
          </label>
        )}
        <input
          className={cn(
            "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-[#1B5E20] focus:border-[#1B5E20] transition-colors",
            error &&
              "border-[#D32F2F] focus:ring-[#D32F2F] focus:border-[#D32F2F]",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="text-sm text-[#D32F2F]">{error}</p>}
        {helper && !error && <p className="text-sm text-[#616161]">{helper}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
