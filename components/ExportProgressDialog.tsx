"use client";

import { useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X, Download, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";

interface ExportProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: {
    status: 'running' | 'completed' | 'cancelled' | 'error';
    processed: number;
    total: number;
    percentage: number;
  } | null;
  onCancel: () => void;
}

export default function ExportProgressDialog({
  open,
  onOpenChange,
  status,
  onCancel,
}: ExportProgressDialogProps) {
  // Handle dialog close - cancel export if still running
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && status?.status === 'running') {
      onCancel();
    }
    onOpenChange(newOpen);
  };

  // Auto-close dialog when export is completed, cancelled, or error
  useEffect(() => {
    if (status && (status.status === 'completed' || status.status === 'cancelled' || status.status === 'error')) {
      const timer = setTimeout(() => {
        onOpenChange(false);
      }, 2000); // Close after 2 seconds
      return () => clearTimeout(timer);
    }
  }, [status, onOpenChange]);

  if (!status) return null;

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getStatusConfig = () => {
    switch (status.status) {
      case 'running':
        return {
          icon: <Loader2 className="h-5 w-5 animate-spin text-[#E5262C]" />,
          title: 'Exporting Data',
          description: 'Please wait while we prepare your export file...',
          progressColor: 'bg-[#E5262C]',
        };
      case 'completed':
        return {
          icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
          title: 'Export Complete',
          description: 'Your file is being downloaded automatically.',
          progressColor: 'bg-green-600',
        };
      case 'cancelled':
        return {
          icon: <XCircle className="h-5 w-5 text-yellow-600" />,
          title: 'Export Cancelled',
          description: 'The export was cancelled by the user.',
          progressColor: 'bg-yellow-600',
        };
      case 'error':
        return {
          icon: <AlertCircle className="h-5 w-5 text-red-600" />,
          title: 'Export Failed',
          description: 'An error occurred during export. Please try again.',
          progressColor: 'bg-red-600',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-md w-[calc(100%-2rem)] sm:w-auto p-0">
        <div className="p-6 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center">
                {config.icon}
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-gray-900 p-0 mb-1">
                  {config.title}
                </DialogTitle>
                <p className="text-sm text-gray-500">
                  {config.description}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleOpenChange(false)}
              className="h-8 w-8 flex-shrink-0 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress Section */}
          {status.status === 'running' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 font-medium">Progress</span>
                <span className="text-gray-900 font-semibold">{status.percentage}%</span>
              </div>
              <Progress 
                value={status.percentage} 
                className="h-2.5 bg-gray-100"
              />
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>{formatNumber(status.processed)} rows processed</span>
                <span>of {formatNumber(status.total)} total</span>
              </div>
            </div>
          )}

          {/* Status Messages */}
          {status.status === 'completed' && (
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-100">
              <Download className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">
                  File download started
                </p>
                <p className="text-xs text-green-700 mt-0.5">
                  {formatNumber(status.total)} records exported successfully
                </p>
              </div>
            </div>
          )}

          {status.status === 'cancelled' && (
            <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
              <XCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-900">
                  Export cancelled
                </p>
                <p className="text-xs text-yellow-700 mt-0.5">
                  {formatNumber(status.processed)} of {formatNumber(status.total)} records processed
                </p>
              </div>
            </div>
          )}

          {status.status === 'error' && (
            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border border-red-100">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">
                  Export failed
                </p>
                <p className="text-xs text-red-700 mt-0.5">
                  Please try again or contact support if the issue persists
                </p>
              </div>
            </div>
          )}

          {/* Cancel Button */}
          {status.status === 'running' && (
            <div className="flex justify-end pt-2">
              <Button
                onClick={onCancel}
                variant="outline"
                size="sm"
                className="min-h-[36px] border-gray-200 hover:bg-gray-50"
              >
                Cancel Export
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
