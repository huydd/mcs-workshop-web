// app/production/components/ImageUpload.tsx
"use client";

import { Upload, X } from "lucide-react";

interface ImageUploadProps {
  images: File[];
  onChange: (images: File[]) => void;
  maxImages?: number;
}

export const ImageUpload = ({ images, onChange, maxImages = 3 }: ImageUploadProps) => {
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const totalImages = images.length + newFiles.length;
      
      if (totalImages <= maxImages) {
        onChange([...images, ...newFiles]);
      } else {
        // Take only the files that fit within the limit
        const availableSlots = maxImages - images.length;
        const filesToAdd = newFiles.slice(0, availableSlots);
        onChange([...images, ...filesToAdd]);
      }
    }
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-[#212121]">
        Hình ảnh minh chứng ({images.length}/{maxImages} ảnh)
      </label>

      {images.length < maxImages && (
        <div className="flex items-center justify-center w-full">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 mb-4 text-gray-500" />
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Nhấn để tải lên</span> hoặc kéo thả
              </p>
              <p className="text-xs text-gray-500">PNG, JPG, GIF (MAX. 10MB)</p>
            </div>
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </label>
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((file, index) => (
            <div key={index} className="relative">
              <img
                src={URL.createObjectURL(file)}
                alt={`Preview ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};