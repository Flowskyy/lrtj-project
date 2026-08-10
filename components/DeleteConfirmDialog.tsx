"use client";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName?: string;
  title?: string;
  description?: React.ReactNode;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export default function DeleteConfirmDialog({
  open,
  onOpenChange,
  itemName,
  title,
  description,
  onConfirm,
  isDeleting = false,
}: DeleteConfirmDialogProps) {
  const defaultTitle = "Delete Item";
  const defaultDescription = itemName
    ? `Are you sure you want to delete "${itemName}"? This action cannot be undone.`
    : "Are you sure you want to delete this item? This action cannot be undone.";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md bg-white/75 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] rounded-2xl p-0 overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-white/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#E5262C]">{title || defaultTitle}</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-gray-600 mt-1">
              {description || defaultDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
        </div>
        <AlertDialogFooter className="px-6 py-4 flex gap-3">
          <AlertDialogCancel disabled={isDeleting} className="flex-1 bg-white/60 border-gray-200/50 hover:bg-white/80 text-gray-700">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 bg-[#E5262C] hover:bg-[#c41f24] text-white font-medium shadow-sm"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
