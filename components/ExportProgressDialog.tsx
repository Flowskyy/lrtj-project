"use client";

import { Progress, ProgressTrack, ProgressIndicator } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Download, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";

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
  isCancelling?: boolean;
}

export default function ExportProgressDialog({
  open,
  onOpenChange,
  status,
  onCancel,
  isCancelling = false,
}: ExportProgressDialogProps) {




  if (!status) return null;

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getStatusConfig = () => {
    switch (status.status) {
      case 'running':
        return {
          icon: <Loader2 className="h-7 w-7 animate-spin text-[#E5262C]" />,
          title: 'Exporting Data',
          description: 'Please wait while we prepare your export file...',
        };
      case 'completed':
        return {
          icon: <CheckCircle2 className="h-7 w-7 text-green-600" />,
          title: 'Export Complete',
          description: 'Your file is being downloaded automatically.',
        };
      case 'cancelled':
        return {
          icon: <XCircle className="h-7 w-7 text-yellow-600" />,
          title: 'Export Cancelled',
          description: 'The export was cancelled by the user.',
        };
      case 'error':
        return {
          icon: <AlertCircle className="h-7 w-7 text-red-600" />,
          title: 'Export Failed',
          description: 'An error occurred during export. Please try again.',
        };
    }
  };

  const config = getStatusConfig();

  const canClose = status.status !== 'running';

  return (
    <Dialog open={open} onOpenChange={canClose ? onOpenChange : undefined}>
      <DialogContent className="max-w-md w-[calc(100%-2rem)] p-0 rounded-xl shadow-lg border-0" showCloseButton={false}>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="h-14 w-14 rounded-full bg-gray-50 flex items-center justify-center">
                {config.icon}
              </div>
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-gray-900">
                {config.title}
              </h2>
              <p className="text-sm text-gray-500">
                {config.description}
              </p>
            </div>
          </div>

          {/* Progress Section */}
          {status.status === 'running' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Progress</span>
                <span className="text-lg font-bold text-[#E5262C]">{status.percentage}%</span>
              </div>
              <Progress value={status.percentage} className="h-3 bg-gray-100">
                <ProgressTrack className="h-3 bg-gray-100">
                  <ProgressIndicator className="bg-[#E5262C] transition-all duration-300 ease-out" />
                </ProgressTrack>
              </Progress>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{formatNumber(status.processed)}</p>
                    <p className="text-xs text-gray-500 mt-1">Processed</p>
                  </div>
                  <div className="text-gray-300">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{formatNumber(status.total)}</p>
                    <p className="text-xs text-gray-500 mt-1">Total</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Status Messages */}
          {status.status === 'completed' && (
            <div className="flex items-center gap-4 p-4 bg-green-50 rounded-xl border border-green-100">
              <Download className="h-6 w-6 text-green-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-900">
                  File download started
                </p>
                <p className="text-xs text-green-700 mt-1">
                  {formatNumber(status.total)} records exported successfully
                </p>
              </div>
            </div>
          )}

          {status.status === 'cancelled' && (
            <div className="flex items-center gap-4 p-4 bg-yellow-50 rounded-xl border border-yellow-100">
              <XCircle className="h-6 w-6 text-yellow-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-yellow-900">
                  Export cancelled
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  {formatNumber(status.processed)} of {formatNumber(status.total)} records processed
                </p>
              </div>
            </div>
          )}

          {status.status === 'error' && (
            <div className="flex items-center gap-4 p-4 bg-red-50 rounded-xl border border-red-100">
              <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-900">
                  Export failed
                </p>
                <p className="text-xs text-red-700 mt-1">
                  Please try again or contact support if the issue persists
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            {status.status === 'running' && (
              <Button
                onClick={onCancel}
                disabled={isCancelling}
                variant="outline"
                className="flex-1 h-10 border-gray-200 hover:bg-gray-50 font-medium"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  'Cancel Export'
                )}
              </Button>
            )}
            {(status.status === 'completed' || status.status === 'cancelled' || status.status === 'error') && (
              <Button
                onClick={() => onOpenChange(false)}
                className="flex-1 h-10 bg-[#E5262C] hover:bg-[#c91e24] text-white font-medium"
              >
                Close
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
