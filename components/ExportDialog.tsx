"use client";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (scope: "full" | "preview") => void;
  loading?: boolean;
  fullDataFields?: string[];
  previewDataFields?: string[];
  selectedCount?: number;
  totalFilteredCount?: number;
}

export default function ExportDialog({ open, onOpenChange, onExport, loading, fullDataFields, previewDataFields, selectedCount, totalFilteredCount }: ExportDialogProps) {
  const hasSelectedRows = selectedCount && selectedCount > 0;
  const scopeMessage = hasSelectedRows 
    ? `Exporting ${selectedCount} selected row${selectedCount > 1 ? 's' : ''}`
    : `Exporting all ${totalFilteredCount || 0} filtered result${totalFilteredCount !== 1 ? 's' : ''}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-md w-[calc(100%-2rem)] sm:w-auto">
        <DialogHeader>
          <DialogTitle>Export to Excel</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-4">
          <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
            <p className="text-xs font-medium text-blue-700">
              {scopeMessage}
            </p>
          </div>
          <p className="text-sm text-gray-600">
            Choose the data scope for export:
          </p>
          <div className="space-y-2">
            <Button
              onClick={() => onExport("full")}
              disabled={loading}
              className="w-full justify-start min-h-[44px] flex-col items-start h-auto py-3"
              variant="outline"
            >
              <div className="text-left w-full">
                <div className="font-medium">Full Data</div>
                <div className="text-xs text-gray-500 mb-2">All available fields for each record</div>
                {fullDataFields && fullDataFields.length > 0 && (
                  <div className="text-[10px] text-gray-400 bg-gray-50 rounded px-2 py-1 whitespace-normal break-words">
                    {fullDataFields.join(", ")}
                  </div>
                )}
              </div>
            </Button>
            <Button
              onClick={() => onExport("preview")}
              disabled={loading}
              className="w-full justify-start min-h-[44px] flex-col items-start h-auto py-3"
              variant="outline"
            >
              <div className="text-left w-full">
                <div className="font-medium">Preview Data</div>
                <div className="text-xs text-gray-500 mb-2">Only columns currently visible in table</div>
                {previewDataFields && previewDataFields.length > 0 && (
                  <div className="text-[10px] text-gray-400 bg-gray-50 rounded px-2 py-1 whitespace-normal break-words">
                    {previewDataFields.join(", ")}
                  </div>
                )}
              </div>
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            disabled={loading}
            className="min-h-[44px]"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
