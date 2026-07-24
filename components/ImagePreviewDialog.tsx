"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { getImageUrl } from "@/lib/utils";

interface ImagePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string | null | undefined;
  alt?: string;
}

export default function ImagePreviewDialog({
  open,
  onOpenChange,
  imageUrl,
  alt = "Image preview"
}: ImagePreviewDialogProps) {
  if (!imageUrl) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-[95vw] max-h-[95vh] p-0 bg-transparent border-0 shadow-none"
        showCloseButton={false}
      >
        <DialogHeader className="absolute top-0 left-0 right-0 z-10 p-4">
          <DialogTitle className="text-white text-sm font-medium drop-shadow-md">{alt}</DialogTitle>
        </DialogHeader>
        <div className="relative w-full max-h-[85vh] flex items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full"
          >
            <X className="h-6 w-6" />
          </Button>
          <img
            src={getImageUrl(imageUrl)}
            alt={alt}
            className="max-w-full max-h-full object-contain rounded-lg"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/logo-lrtj.png";
              (e.target as HTMLImageElement).className = "h-16 w-auto object-contain brightness-95";
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
