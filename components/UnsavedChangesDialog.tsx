"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";

interface UnsavedChangesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onKeepEditing: () => void;
  onDiscard: () => void;
  description?: string;
  showIcon?: boolean;
}

export function UnsavedChangesDialog({
  open,
  onOpenChange,
  onKeepEditing,
  onDiscard,
  description = "You have unsaved changes. These changes will be lost if you continue.",
  showIcon = true,
}: UnsavedChangesDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        {showIcon && (
          <div className="text-center space-y-3 mb-4">
            <div className="flex justify-center">
              <div className="h-14 w-14 rounded-full bg-amber-50 flex items-center justify-center">
                <AlertTriangle className="h-7 w-7 text-amber-600" />
              </div>
            </div>
          </div>
        )}
        <AlertDialogHeader>
          <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-col gap-2">
          {/* Keep Editing - always present */}
          <Button
            onClick={() => {
              onKeepEditing();
              onOpenChange(false);
            }}
            variant="default"
            className="w-full h-10 bg-[#E5262C] hover:bg-[#c91e24] text-white font-medium"
          >
            Keep Editing
          </Button>

          {/* Discard - always present */}
          <Button
            onClick={() => {
              onDiscard();
              onOpenChange(false);
            }}
            variant="ghost"
            className="w-full h-10 text-gray-500 hover:text-red-600 hover:bg-red-50 font-medium"
          >
            Discard and Continue
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
