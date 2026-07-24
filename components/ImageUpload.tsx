"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";

interface ImageUploadProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export default function ImageUpload({ value, onChange, label = "Image" }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const result = await response.json();
      if (result.path) {
        onChange(result.path);
      }
    } catch (error) {
      console.error('Image upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="block text-[11px] sm:text-xs font-semibold text-gray-700 mb-1 sm:mb-2">
        {label}
      </label>
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
            id={`image-upload-${label}`}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById(`image-upload-${label}`)?.click()}
            disabled={uploading}
            className="min-h-[44px]"
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? "Uploading..." : "Upload Image"}
          </Button>
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onChange("")}
              className="min-h-[44px] w-12"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {value && (
          <p className="text-[10px] text-gray-500 truncate">{value}</p>
        )}
      </div>
    </div>
  );
}
