"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { getImageUrl } from "@/lib/utils";

interface ImageUploadProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

interface FileInfo {
  name: string;
  size: string;
  dimensions: string;
  format: string;
}

export default function ImageUpload({ value, onChange, label = "Image" }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (!file.type.startsWith('image/')) {
      return { valid: false, error: 'Only image files are allowed' };
    }
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 5MB' };
    }
    return { valid: true };
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getImageDimensions = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(`${img.width} x ${img.height}px`);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve('Unknown');
      };
      img.src = url;
    });
  };

  const uploadFile = async (file: File) => {
    const validation = validateFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

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
        
        // Extract file info
        const dimensions = await getImageDimensions(file);
        const format = file.type.split('/')[1]?.toUpperCase() || 'Unknown';
        setFileInfo({
          name: file.name,
          size: formatFileSize(file.size),
          dimensions,
          format
        });
      }
    } catch (error) {
      console.error('Image upload failed:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    await uploadFile(file);
  }, []);

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-900 mb-2">
        {label}
      </label>
      
      {value ? (
        // Uploaded state - 16:9 thumbnail preview with buttons beside
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="w-full sm:w-[480px] h-[270px] rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 bg-gray-100">
            <img
              src={getImageUrl(value)}
              alt="Uploaded image"
              className="w-full h-full object-contain object-center"
            />
          </div>
          <div className="flex flex-row sm:flex-col gap-2 sm:gap-3 sm:self-center sm:w-[200px]">
            <Button
              type="button"
              size="sm"
              onClick={() => document.getElementById(`image-upload-${label}`)?.click()}
              disabled={uploading}
              className="h-8 gap-1.5 px-3 text-xs"
            >
              <Upload className="h-3.5 w-3.5" />
              {uploading ? "..." : "Replace"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={() => {
                onChange("");
                setFileInfo(null);
              }}
              className="h-8 gap-1.5 px-3 text-xs"
            >
              <X className="h-3.5 w-3.5" />
              Remove
            </Button>
            
            {fileInfo && (
              <div className="mt-2 sm:mt-0 space-y-2">
                <div className="text-sm space-y-1">
                  <div className="flex flex-col items-start gap-0.5">
                    <span className="text-gray-500 font-medium">Name:</span>
                    <span className="text-gray-700 break-words" title={fileInfo.name}>
                      {fileInfo.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-500 font-medium">Size:</span>
                    <span className="text-gray-700">{fileInfo.size}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-500 font-medium">Dim:</span>
                    <span className="text-gray-700">{fileInfo.dimensions}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-500 font-medium">Format:</span>
                    <span className="text-gray-700">{fileInfo.format}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 leading-tight break-words" title={value}>
                  {value}
                </p>
              </div>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
            id={`image-upload-${label}`}
          />
        </div>
      ) : (
        // Empty state - drag-drop zone
        <div
          className={`relative w-full sm:w-[240px] h-auto sm:h-[135px] border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors cursor-pointer flex-shrink-0 ${
            isDragging
              ? 'border-[#E5262C] bg-red-50'
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById(`image-upload-${label}`)?.click()}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
            id={`image-upload-${label}`}
          />
          <div className="flex flex-col items-center gap-1">
            <div className={`p-1.5 rounded-full ${isDragging ? 'bg-red-100' : 'bg-gray-100'}`}>
              <ImageIcon className={`h-3 w-3 ${isDragging ? 'text-[#E5262C]' : 'text-gray-400'}`} />
            </div>
            <p className="text-[9px] font-medium text-gray-700 text-center leading-tight">
              {uploading ? "..." : "Upload"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
