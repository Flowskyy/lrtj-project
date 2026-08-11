"use client";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AlertTriangle, Trash2 } from "lucide-react";

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
      <AlertDialogContent className="max-w-md bg-white/90 backdrop-blur-md border border-gray-200/80 shadow-sm rounded-lg p-0 overflow-hidden">
        {/* Modal Header with Warning Icon */}
        <div className="px-6 pt-6 pb-4 border-b border-white/30">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-50 flex items-center justify-center border border-red-100">
              <Trash2 className="h-6 w-6 text-[#E5262C]" />
            </div>
            <div className="flex-1 pt-1">
              <AlertDialogHeader className="p-0">
                <AlertDialogTitle className="text-xl font-semibold text-gray-900 mb-2">
                  {title || defaultTitle}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm text-gray-600 leading-relaxed">
                  {description || defaultDescription}
                </AlertDialogDescription>
              </AlertDialogHeader>
            </div>
          </div>
        </div>

        {/* Destructive Action Warning */}
        <div className="px-6 py-4 bg-red-50/50 border-y border-red-100">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-[#E5262C] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 font-medium">
              This action is permanent and cannot be undone.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <AlertDialogFooter className="px-6 py-4 flex gap-3">
          <AlertDialogCancel disabled={isDeleting} className="flex-1 h-11 bg-white/60 border-gray-200/50 hover:bg-white/80 text-gray-700">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 h-11 bg-[#E5262C] hover:bg-[#c41f24] text-white font-medium shadow-sm"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
