// components/ui/Textarea.tsx
"use client";
import { TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helper, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-[#212121]">
            {label}
            {props.required && <span className="text-[#D32F2F] ml-1">*</span>}
          </label>
        )}
        <textarea
          className={cn(
            "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition-colors resize-vertical min-h-[100px]",
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

Textarea.displayName = "Textarea";
